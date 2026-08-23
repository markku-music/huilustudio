import { buildMusicXml } from './musicxml.js';

export class ScoreRenderer {
  #container;
  #osmd;
  #rendering = false;
  #pendingNotes = null;

  constructor(container) {
    this.#container = container;
    const OSMD = window.opensheetmusicdisplay?.OpenSheetMusicDisplay;
    if (!OSMD) throw new Error('OSMD ei latautunut.');

    this.#osmd = new OSMD(container, {
      backend: 'svg',
      autoResize: true,
      pageFormat: 'A4_P',
      drawingParameters: 'compacttight',
      drawTitle: false,
      drawSubtitle: false,
      drawComposer: false,
      drawCredits: false,
      drawPartNames: false,
      drawMeasureNumbers: false,
      newSystemFromXML: false,
      stretchLastSystemLine: false
    });
    this.#osmd.setPageFormat?.('A4_P');
  }

  render(notes) {
    this.#pendingNotes = notes.map(note => ({ ...note }));
    if (!this.#rendering) void this.#drain();
  }

  async #drain() {
    this.#rendering = true;
    try {
      while (this.#pendingNotes) {
        const notes = this.#pendingNotes;
        this.#pendingNotes = null;
        await this.#osmd.load(buildMusicXml(notes));
        await this.#osmd.render();
      }
    } catch (error) {
      console.error('Nuottikuvan renderöinti epäonnistui:', error);
    } finally {
      this.#rendering = false;
      if (this.#pendingNotes) void this.#drain();
    }
  }
}
