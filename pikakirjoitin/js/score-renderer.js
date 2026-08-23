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
  #renderListeners = new Set();

  constructor(container, { layout = DEFAULT_PAGE_LAYOUT } = {}) {
    this.#container = container;
    this.#layout = layout;

    const OSMD = window.opensheetmusicdisplay?.OpenSheetMusicDisplay;
    if (!OSMD) throw new Error('OSMD ei latautunut.');

    this.#osmd = new OSMD(container, {
      backend: 'svg',
      autoResize: true,
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
    this.#watchWidth();
  }

  setSettings(settings) {
    this.#settings = { ...settings };
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

  #applyPageMargins() {
    const width = this.#container.clientWidth || this.#container.offsetWidth || 1;
    const zoom = Number(this.#osmd.Zoom ?? this.#osmd.zoom ?? 1) || 1;
    const margins = marginsToOsmdUnits(width, this.#layout, zoom);
    const rules = this.#osmd.EngravingRules;
    if (!rules) return;

    rules.PageTopMargin = margins.top;
    rules.PageRightMargin = margins.right;
    rules.PageBottomMargin = margins.bottom;
    rules.PageLeftMargin = margins.left;

    // Pikakirjoittimen vakioyläosa:
    // otsikko nostetaan hieman OSMD:n oletusta ylemmäs. Tempo ja säveltäjä
    // kohdistetaan renderöinnin jälkeen samalle visuaaliselle riville.
    rules.TitleTopDistance = 3.6;
    rules.TitleBottomDistance = 1.2;
    rules.SystemComposerDistance = 2.0;
    rules.TempoYSpacing = 0.5;

    this.#lastMarginWidth = width;
  }

  #findRenderedText(value) {
    const wanted = String(value || '').trim().replace(/\s+/g, ' ');
    if (!wanted) return null;

    const texts = this.#container.querySelectorAll('svg text');
    for (const text of texts) {
      const actual = String(text.textContent || '').trim().replace(/\s+/g, ' ');
      if (actual === wanted) return text;
    }
    return null;
  }

  #translateSvgElementY(element, deltaScreenPx) {
    if (!element || !Number.isFinite(deltaScreenPx) || Math.abs(deltaScreenPx) < 0.25) return;
    const svg = element.ownerSVGElement;
    const parent = element.parentNode;
    const parentCtm = parent?.getScreenCTM?.();
    if (!svg || !parentCtm) return;

    try {
      const inverse = parentCtm.inverse();
      const a = new DOMPoint(0, 0).matrixTransform(inverse);
      const b = new DOMPoint(0, deltaScreenPx).matrixTransform(inverse);
      const deltaY = b.y - a.y;
      const oldTransform = element.getAttribute('transform') || '';
      element.setAttribute('transform', `translate(0 ${deltaY}) ${oldTransform}`.trim());
    } catch (error) {
      console.warn('Yläosan tekstin kohdistus epäonnistui:', error);
    }
  }

  #alignHeaderTexts() {
    const composer = this.#findRenderedText(this.#settings.composer);
    const tempo = this.#findRenderedText(this.#settings.tempoText);
    if (!composer || !tempo) return;

    // Tempo ja säveltäjä ovat saman kokoisia tekstielementtejä. Kohdistetaan
    // niiden visuaaliset pystykeskipisteet, jolloin ne näyttävät yhdeltä
    // yhteiseltä vaakariviltä myös eri selaimissa ja eri paperiskaaloilla.
    const composerRect = composer.getBoundingClientRect();
    const tempoRect = tempo.getBoundingClientRect();
    const composerCenterY = (composerRect.top + composerRect.bottom) / 2;
    const tempoCenterY = (tempoRect.top + tempoRect.bottom) / 2;
    this.#translateSvgElementY(tempo, composerCenterY - tempoCenterY);
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
        await this.#osmd.load(buildMusicXml(notes, this.#settings));
        this.#applyPageMargins();
        await this.#osmd.render();
        this.#alignHeaderTexts();
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
