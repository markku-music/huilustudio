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
  #renderListeners = new Set();

  constructor(container, { layout = DEFAULT_PAGE_LAYOUT } = {}) {
    this.#container = container;
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
        // load() palauttaa OSMD:n Zoom-arvon yhteen. Aseta orientaation
        // mukainen zoom vasta latauksen jälkeen ennen varsinaista renderiä.
        this.#applyOrientationZoom();
        this.#applyPageMargins();
        await this.#osmd.render();
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
