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
  #textLayout = {
    TitleTopDistance: 5,
    TempoYSpacing: 0.5,
    SystemComposerDistance: 2,
    tempoOffsetDivisions: 0
  };

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

  setTextLayout(layout = {}, { render = true } = {}) {
    const next = { ...this.#textLayout };
    for (const key of ['TitleTopDistance', 'TempoYSpacing', 'SystemComposerDistance']) {
      const value = Number(layout[key]);
      if (Number.isFinite(value)) next[key] = value;
    }
    const offset = Number(layout.tempoOffsetDivisions);
    if (Number.isFinite(offset)) next.tempoOffsetDivisions = Math.max(0, Math.round(offset));
    this.#textLayout = next;
    this.#applyTextLayoutRules();
    if (render && (this.#lastNotes.length || this.#container.childElementCount)) this.render(this.#lastNotes);
  }

  getTextLayout() {
    return { ...this.#textLayout };
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
    this.#lastMarginWidth = width;
  }

  #applyTextLayoutRules() {
    const rules = this.#osmd.EngravingRules;
    if (!rules) return;
    rules.TitleTopDistance = this.#textLayout.TitleTopDistance;
    rules.TempoYSpacing = this.#textLayout.TempoYSpacing;
    rules.SystemComposerDistance = this.#textLayout.SystemComposerDistance;
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
        this.#applyTextLayoutRules();
        const xmlSettings = { ...this.#settings, tempoOffsetDivisions: this.#textLayout.tempoOffsetDivisions };
        await this.#osmd.load(buildMusicXml(notes, xmlSettings));
        this.#applyPageMargins();
        this.#applyTextLayoutRules();
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
