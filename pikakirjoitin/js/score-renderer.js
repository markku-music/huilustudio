import { buildMusicXml } from './musicxml.js';
import { DEFAULT_PAGE_LAYOUT, marginsToOsmdUnits, standardEngravingRules } from './page-layout.js';

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
    this.#applyPageMargins();
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

    const standard = standardEngravingRules(this.#settings, width, this.#layout, zoom);

    // A4:n sivumarginaalit pysyvät 15 mm:ssä. Ylämarginaali elää vain
    // otsikkosisällön mukaan, jotta tyhjää otsikkoaluetta ei synny.
    rules.PageTopMargin = standard.pageTopMargin;
    rules.PageRightMargin = margins.right;
    rules.PageBottomMargin = margins.bottom;
    rules.PageLeftMargin = margins.left;

    // OSMD:n oma otsikko- ja säveltäjägrafiikka: yksi vakioasettelu,
    // ei erillisiä HTML-overlay-elementtejä.
    rules.RenderTitle = standard.hasTitle;
    rules.RenderComposer = standard.hasComposer;
    rules.TitleTopDistance = standard.titleTopDistance;
    rules.SheetTitleHeight = standard.sheetTitleHeight;
    rules.TitleBottomDistance = standard.titleBottomDistance;
    rules.SystemComposerDistance = standard.systemComposerDistance;
    rules.SheetComposerHeight = standard.sheetComposerHeight;

    // Järjestelmien väli mitataan nuottigrafiikan staff-space-yksiköissä.
    // Sky/bottom-laskenta saa kasvattaa väliä sisällön vaatiessa.
    rules.MinimumDistanceBetweenSystems = standard.minimumDistanceBetweenSystems;
    rules.MinSkyBottomDistBetweenSystems = standard.minSkyBottomDistBetweenSystems;

    // Tempoteksti pysyy ensimmäisen järjestelmän musiikin aloituskohdassa.
    rules.InstantaneousTempoTextHeight = standard.instantaneousTempoTextHeight;
    rules.TempoYSpacing = standard.tempoYSpacing;

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
