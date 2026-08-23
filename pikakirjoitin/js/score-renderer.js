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
  #zoom = 1;
  #renderWaiters = [];

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
    this.#osmd.Zoom = this.#zoom;
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
    const promise = new Promise(resolve => this.#renderWaiters.push(resolve));
    if (!this.#rendering) void this.#drain();
    return promise;
  }

  getZoom() { return this.#zoom; }

  setZoom(value) {
    const next = Math.max(1, Math.min(1.5, Number(value) || 1));
    if (Math.abs(next - this.#zoom) < 0.0005) return Promise.resolve();
    this.#zoom = next;
    this.#osmd.Zoom = next;
    return this.render(this.#lastNotes);
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
        this.#osmd.Zoom = this.#zoom;
        await this.#osmd.load(buildMusicXml(notes, this.#settings));
        this.#applyPageMargins();
        this.#osmd.Zoom = this.#zoom;
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
      if (this.#pending) {
        void this.#drain();
      } else {
        const waiters = this.#renderWaiters.splice(0);
        for (const resolve of waiters) resolve();
      }
    }
  }
}
