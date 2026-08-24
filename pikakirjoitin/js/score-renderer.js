import { buildMusicXml } from './musicxml.js';
import { DEFAULT_PAGE_LAYOUT, marginsToOsmdUnits } from './page-layout.js';

export class ScoreRenderer {
  #container;
  #osmd;
  #rendering = false;
  #pending = null;
  #settings = {};
  #layout;
  #lastNotes = [];
  #resizeObserver = null;
  #resizeTimer = 0;
  #lastMarginWidth = 0;
  #portraitReferenceWidth = 0;
  #currentZoom = 1;
  #minimumSystemDistance = 9;
  #titleBottomDistance = 7;
  #titleTopDistance = 9;
  #tempoYSpacing = 0.5;
  #tempoVisualYOffset = 0;
  #composerVisualYOffset = 0;
  #systemComposerDistance = 2;
  #renderListeners = new Set();
  #viewport = null;
  #restoreViewportScrollTop = null;
  #restoreViewportSystemAnchor = null;

  constructor(container, { layout = DEFAULT_PAGE_LAYOUT } = {}) {
    this.#container = container;
    this.#viewport = container.closest?.('.score-viewport') || null;
    this.#layout = layout;

    const OSMD = window.opensheetmusicdisplay?.OpenSheetMusicDisplay;
    if (!OSMD) throw new Error('OSMD ei latautunut.');

    this.#osmd = new OSMD(container, {
      backend: 'svg',
      // Resize hoidetaan omalla ResizeObserverilla, jotta orientaation vaihto
      // ei aiheuta OSMD:n ja sovelluksen kahta päällekkäistä renderöintiä.
      autoResize: false,
      pageFormat: layout.format,
      drawingParameters: 'compacttight',
      drawTitle: true,
      drawSubtitle: false,
      drawComposer: true,
      drawCredits: false,
      drawPartNames: false,
      drawMeasureNumbers: false,
      newSystemFromXML: false,
      stretchLastSystemLine: false,
      // Multirestit muodostetaan itse vain käyttäjän nimenomaisista
      // kokotaukosyötöistä. Näin OSMD ei yhdistä muita tyhjiä tahteja
      // arvaamalla omalla automatiikallaan.
      autoGenerateMultipleRestMeasuresFromRestMeasures: false
    });
    this.#osmd.setPageFormat?.(layout.format);
    this.#applyPageMargins();
    this.#applySystemSpacing();
    this.#applyTitleBottomDistance();
    this.#applyTitleTopDistance();
    this.#applyTempoYSpacing();
    this.#applySystemComposerDistance();
    this.#watchWidth();
  }

  setSettings(settings) {
    this.#settings = { ...settings };
  }

  setMinimumSystemDistance(value, { render = true } = {}) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return this.#minimumSystemDistance;
    this.#minimumSystemDistance = Math.min(15, Math.max(5, numeric));
    this.#applySystemSpacing();
    if (render && (this.#lastNotes.length || this.#container.childElementCount)) {
      // Rivivälin muuttaminen rakentaa koko SVG:n uudelleen. Kun tempo ja
      // säveltäjä ovat mukana, OSMD voi samalla laskea ensimmäisen systeemin
      // Y-paikan hieman uudestaan. Ankkuroi siksi näkymä nuottijärjestelmään,
      // ei pelkkään scrollTop-lukuun.
      if (this.#viewport && !this.#restoreViewportSystemAnchor) {
        this.#restoreViewportSystemAnchor = this.#captureViewportSystemAnchor();
        // Fallback tilanteeseen, jossa OSMD:n graafista systeemirakennetta ei
        // jostain syystä löydy.
        this.#restoreViewportScrollTop = this.#viewport.scrollTop;
      }
      this.render(this.#lastNotes);
    }
    return this.#minimumSystemDistance;
  }

  #applySystemSpacing() {
    const rules = this.#osmd?.EngravingRules;
    if (!rules) return;
    rules.MinimumDistanceBetweenSystems = this.#minimumSystemDistance;
  }

  setTitleBottomDistance(value, { render = true } = {}) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return this.#titleBottomDistance;
    this.#titleBottomDistance = Math.min(8, Math.max(0, numeric));
    this.#applyTitleBottomDistance();
    if (render && (this.#lastNotes.length || this.#container.childElementCount)) {
      this.render(this.#lastNotes);
    }
    return this.#titleBottomDistance;
  }

  #applyTitleBottomDistance() {
    const rules = this.#osmd?.EngravingRules;
    if (!rules) return;
    rules.TitleBottomDistance = this.#titleBottomDistance;
  }

  setTitleTopDistance(value, { render = true } = {}) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return this.#titleTopDistance;
    this.#titleTopDistance = Math.min(12, Math.max(2, numeric));
    this.#applyTitleTopDistance();
    if (render && (this.#lastNotes.length || this.#container.childElementCount)) {
      this.render(this.#lastNotes);
    }
    return this.#titleTopDistance;
  }

  #applyTitleTopDistance() {
    const rules = this.#osmd?.EngravingRules;
    if (!rules) return;
    rules.TitleTopDistance = this.#titleTopDistance;
  }

  #applyTempoYSpacing() {
    const rules = this.#osmd?.EngravingRules;
    if (!rules) return;
    // Pidetään OSMD:n oma tilavaraus oletuksessa. TempoYSpacing ei ole
    // tempotekstin koordinaatti, vaan vaikuttaa koko systeemin geometriaan.
    rules.TempoYSpacing = this.#tempoYSpacing;
  }

  setTempoVisualYOffset(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return this.#tempoVisualYOffset;
    this.#tempoVisualYOffset = Math.min(8, Math.max(-6, numeric));
    this.#applyTempoVisualYOffset();
    return this.#tempoVisualYOffset;
  }

  #findExactTextElements(value) {
    const target = String(value || '').replace(/\s+/g, ' ').trim();
    if (!target) return [];

    // OSMD/VexFlow voi tuottaa samasta näkyvästä tekstistä useamman päällekkäisen
    // text/tspan-solmun. Palauta kaikki uniikit <text>-elementit, jotta niitä
    // siirretään yhtenä ryhmänä eikä yksi kopio jää alkuperäiseen paikkaan.
    const found = [];
    const seen = new Set();
    const nodes = this.#container.querySelectorAll('svg text, svg tspan');
    for (const node of nodes) {
      const content = String(node.textContent || '').replace(/\s+/g, ' ').trim();
      if (content !== target) continue;
      const text = node.closest?.('text') || node;
      if (seen.has(text)) continue;
      seen.add(text);
      found.push(text);
    }
    return found;
  }

  #applyVisualYOffset(elements, staffSpaces) {
    const dy = Number(staffSpaces || 0) * 10;
    for (const text of elements) {
      const original = text.dataset.pkBaseTransform ?? text.getAttribute('transform') ?? '';
      if (text.dataset.pkBaseTransform === undefined) {
        text.dataset.pkBaseTransform = original;
      }
      const base = text.dataset.pkBaseTransform || '';
      const translated = `${base}${base ? ' ' : ''}translate(0 ${dy})`;
      text.setAttribute('transform', translated);
    }
  }

  #applyTempoVisualYOffset() {
    this.#applyVisualYOffset(
      this.#findExactTextElements(this.#settings?.tempoText),
      this.#tempoVisualYOffset
    );
  }

  setComposerVisualYOffset(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return this.#composerVisualYOffset;
    this.#composerVisualYOffset = Math.min(8, Math.max(-6, numeric));
    this.#applyComposerVisualYOffset();
    return this.#composerVisualYOffset;
  }

  #applyComposerVisualYOffset() {
    this.#applyVisualYOffset(
      this.#findExactTextElements(this.#settings?.composer),
      this.#composerVisualYOffset
    );
  }

  setSystemComposerDistance(value, { render = true } = {}) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return this.#systemComposerDistance;
    this.#systemComposerDistance = Math.min(8, Math.max(0, numeric));
    this.#applySystemComposerDistance();
    if (render && (this.#lastNotes.length || this.#container.childElementCount)) {
      this.render(this.#lastNotes);
    }
    return this.#systemComposerDistance;
  }

  #applySystemComposerDistance() {
    const rules = this.#osmd?.EngravingRules;
    if (!rules) return;
    rules.SystemComposerDistance = this.#systemComposerDistance;
  }

  subscribeRendered(listener) {
    this.#renderListeners.add(listener);
    return () => this.#renderListeners.delete(listener);
  }

  render(notes) {
    this.#lastNotes = notes.map(note => ({ ...note }));
    this.#pending = this.#lastNotes.map(note => ({ ...note }));
    if (!this.#rendering) return this.#drain();
  }

  #isPortraitViewport() {
    const viewport = window.visualViewport;
    const width = Number(viewport?.width || window.innerWidth || 0);
    const height = Number(viewport?.height || window.innerHeight || 0);
    return !width || !height || height >= width;
  }

  #portraitWidthEstimate(currentContainerWidth) {
    if (this.#portraitReferenceWidth > 0) return this.#portraitReferenceWidth;

    // Jos sovellus avataan suoraan vaakatasoon, arvioi saman laitteen
    // portrait-sisältöleveys viewportin lyhyemmän sivun suhteesta.
    const viewport = window.visualViewport;
    const viewportWidth = Math.max(1, Number(viewport?.width || window.innerWidth || currentContainerWidth));
    const viewportHeight = Math.max(1, Number(viewport?.height || window.innerHeight || viewportWidth));
    const portraitViewportWidth = Math.min(viewportWidth, viewportHeight);
    return Math.max(1, currentContainerWidth * portraitViewportWidth / viewportWidth);
  }

  #applyOrientationZoom() {
    const width = this.#container.clientWidth || this.#container.offsetWidth || 1;

    if (this.#isPortraitViewport()) {
      // Portrait on nuottikoon referenssi. Päivitä leveys aina kun portraitissa
      // tapahtuu oikea layout-muutos (esim. split view), mutta pidä zoom 100 %.
      this.#portraitReferenceWidth = width;
      this.#currentZoom = 1;
    } else {
      const referenceWidth = this.#portraitWidthEstimate(width);
      // Landscape skaalataan samassa suhteessa kuin sivu leveni portraitiin
      // nähden. Näin nuottien suhteellinen koko säilyy portraitin kaltaisena.
      this.#currentZoom = Math.max(1, Math.min(1.6, width / Math.max(1, referenceWidth)));
    }

    this.#osmd.Zoom = this.#currentZoom;
  }

  #applyPageMargins() {
    const width = this.#container.clientWidth || this.#container.offsetWidth || 1;
    const zoom = Number(this.#currentZoom || this.#osmd.Zoom || this.#osmd.zoom || 1) || 1;
    const margins = marginsToOsmdUnits(width, this.#layout, zoom);
    const rules = this.#osmd.EngravingRules;
    if (!rules) return;

    rules.PageTopMargin = margins.top;
    rules.PageRightMargin = margins.right;
    rules.PageBottomMargin = margins.bottom;
    rules.PageLeftMargin = margins.left;
    this.#lastMarginWidth = width;
  }

  #pageSvg(pageIndex) {
    const pageWrappers = Array.from(this.#container.children).filter(element =>
      element?.id?.startsWith?.('osmdCanvasPage')
    );
    const wrapperSvg = pageWrappers[pageIndex]?.querySelector?.('svg');
    if (wrapperSvg) return wrapperSvg;
    return this.#container.querySelectorAll('svg')[pageIndex] || null;
  }

  #systemClientY(pageIndex, systemIndex) {
    const page = this.#osmd?.GraphicSheet?.MusicPages?.[pageIndex];
    const system = page?.MusicSystems?.[systemIndex];
    const staffLine = system?.StaffLines?.[0];
    const position = staffLine?.PositionAndShape?.AbsolutePosition
      || system?.PositionAndShape?.AbsolutePosition;
    const svg = this.#pageSvg(pageIndex);
    if (!position || !svg) return null;

    // OSMD:n graafinen yksikkö on staff-space ja VexFlow-piirtäjä käyttää
    // 10 SVG-yksikköä / staff-space. getScreenCTM huomioi samalla OSMD Zoomin,
    // viewBoxin sekä selaimen CSS-skaalauksen.
    const point = svg.createSVGPoint?.();
    const matrix = svg.getScreenCTM?.();
    if (!point || !matrix) return null;
    point.x = Number(position.x || 0) * 10;
    point.y = Number(position.y || 0) * 10;
    const screenPoint = point.matrixTransform(matrix);
    return Number.isFinite(screenPoint.y) ? screenPoint.y : null;
  }

  #captureViewportSystemAnchor() {
    if (!this.#viewport) return null;
    const pages = this.#osmd?.GraphicSheet?.MusicPages || [];
    const viewportRect = this.#viewport.getBoundingClientRect();
    const candidates = [];

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
      const systems = pages[pageIndex]?.MusicSystems || [];
      for (let systemIndex = 0; systemIndex < systems.length; systemIndex += 1) {
        const clientY = this.#systemClientY(pageIndex, systemIndex);
        if (!Number.isFinite(clientY)) continue;
        candidates.push({ pageIndex, systemIndex, clientY });
      }
    }
    if (!candidates.length) return null;

    // Suosi näkymässä olevaa ylintä järjestelmää. Jos yksikään viivasto ei
    // juuri leikkaa viewportia, käytä lähimpänä yläreunaa olevaa järjestelmää.
    const visible = candidates
      .filter(item => item.clientY >= viewportRect.top - 24 && item.clientY <= viewportRect.bottom)
      .sort((a, b) => a.clientY - b.clientY);
    if (visible.length) return visible[0];

    return candidates.reduce((best, item) => {
      if (!best) return item;
      return Math.abs(item.clientY - viewportRect.top) < Math.abs(best.clientY - viewportRect.top)
        ? item
        : best;
    }, null);
  }

  #restoreSystemAnchor(anchor) {
    if (!this.#viewport || !anchor) return false;
    const nextClientY = this.#systemClientY(anchor.pageIndex, anchor.systemIndex);
    if (!Number.isFinite(nextClientY)) return false;
    const delta = nextClientY - anchor.clientY;
    if (Math.abs(delta) > 0.05) {
      this.#viewport.scrollTop += delta;
    }
    return true;
  }

  #watchWidth() {
    if (!('ResizeObserver' in window)) return;
    this.#resizeObserver = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect?.width || this.#container.clientWidth || 0;
      if (!width || Math.abs(width - this.#lastMarginWidth) < 1) return;

      window.clearTimeout(this.#resizeTimer);
      this.#resizeTimer = window.setTimeout(() => {
        this.#applyPageMargins();
        if (this.#lastNotes.length || this.#container.childElementCount) {
          this.render(this.#lastNotes);
        }
      }, 80);
    });
    this.#resizeObserver.observe(this.#container);
  }

  async #drain() {
    this.#rendering = true;
    try {
      while (this.#pending) {
        const notes = this.#pending;
        this.#pending = null;
        this.#applyPageMargins();
        this.#applySystemSpacing();
        this.#applyTitleBottomDistance();
        this.#applyTitleTopDistance();
        this.#applyTempoYSpacing();
        this.#applySystemComposerDistance();
        await this.#osmd.load(buildMusicXml(notes, this.#settings));
        // load() palauttaa OSMD:n Zoom-arvon yhteen. Aseta orientaation
        // mukainen zoom vasta latauksen jälkeen ennen varsinaista renderiä.
        this.#applyOrientationZoom();
        this.#applyPageMargins();
        this.#applySystemSpacing();
        this.#applyTitleBottomDistance();
        this.#applyTitleTopDistance();
        this.#applyTempoYSpacing();
        this.#applySystemComposerDistance();
        await this.#osmd.render();
        this.#applyTempoVisualYOffset();
        this.#applyComposerVisualYOffset();

        // Pidä sama nuottijärjestelmä samassa ruudun Y-kohdassa. Tämä korjaa
        // juuri tilanteen, jossa tempo/säveltäjä muuttavat OSMD:n ensimmäisen
        // systeemin pystylaskentaa samalla kun riviväliä säädetään.
        if (this.#viewport && this.#restoreViewportSystemAnchor) {
          const restored = this.#restoreSystemAnchor(this.#restoreViewportSystemAnchor);
          if (!restored && this.#restoreViewportScrollTop !== null) {
            this.#viewport.scrollTop = this.#restoreViewportScrollTop;
          }

          // Slideri voi ehtiä pyytää uuden renderin edellisen ollessa käynnissä.
          // Säilytä sama visuaalinen ankkuri koko renderijonon ajan ja vapauta se
          // vasta, kun viimeinenkin pending-renderi on valmis.
          if (!this.#pending) {
            this.#restoreViewportSystemAnchor = null;
            this.#restoreViewportScrollTop = null;
          }
        }

        const snapshot = {
          notes: notes.map(note => ({ ...note })),
          settings: { ...this.#settings }
        };
        // render() on valmis: SVG on jo DOM:ssa. Ilmoitetaan juuri tämän
        // renderikierroksen data synkronisesti, jotta nopea seuraava renderi
        // ei ehdi vaihtaa nuottikuvaa ennen kartoitusta.
        for (const listener of this.#renderListeners) listener(snapshot);
      }
    } catch (error) {
      console.error('Nuottikuvan renderöinti epäonnistui:', error);
    } finally {
      this.#rendering = false;
      if (this.#pending) void this.#drain();
    }
  }
}
