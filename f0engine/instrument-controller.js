/*
 * InstrumentController
 * UI-riippumaton ohjauskerros F0-enginen ja käyttöliittymän väliin.
 *
 * Vastuut:
 * - C / Bb / Eb / F -soitinvire
 * - kirjoitettu <-> soiva MIDI
 * - valittujen kirjoitettujen sävelten hallinta
 * - allowedMidi-profiilin rakentaminen
 * - profiilin syöttäminen F0-enginelle
 *
 * Ei sisällä F0-, YIN-, kalibrointi- tai transition-logiikkaa.
 */
(function (global) {
  'use strict';

  const DEFAULT_INSTRUMENTS = Object.freeze({
    C:  Object.freeze({ id: 'C',  label: 'C-soitin',  transposeSemitones: 0 }),
    Bb: Object.freeze({ id: 'Bb', label: 'B♭-soitin', transposeSemitones: 2 }),
    Eb: Object.freeze({ id: 'Eb', label: 'E♭-soitin', transposeSemitones: 9 }),
    F:  Object.freeze({ id: 'F',  label: 'F-soitin',  transposeSemitones: 7 })
  });

  class InstrumentController extends EventTarget {
    constructor(engine, options = {}) {
      super();

      if (!engine || typeof engine.setProfile !== 'function') {
        throw new Error('InstrumentController tarvitsee F0-enginen, jossa on setProfile().');
      }

      this.engine = engine;
      this.instruments = options.instruments || DEFAULT_INSTRUMENTS;
      this.instrumentId = options.instrumentId || 'C';

      this.fastAcceptFrames = Number.isFinite(options.fastAcceptFrames)
        ? Math.max(1, Math.round(options.fastAcceptFrames))
        : 1;

      this.fastAcceptToleranceCents = Number.isFinite(options.fastAcceptToleranceCents)
        ? Math.max(1, Math.min(100, options.fastAcceptToleranceCents))
        : 49;

      this.selectedWrittenMidi = new Set();
      this.applyProfile();
    }

    getInstrument() {
      return this.instruments[this.instrumentId] || this.instruments.C;
    }

    setInstrument(id) {
      if (!this.instruments[id]) return false;
      this.instrumentId = id;
      this.applyProfile();
      this._emitChange();
      return true;
    }

    toggleWrittenMidi(midi) {
      midi = Math.round(midi);
      if (this.selectedWrittenMidi.has(midi)) {
        this.selectedWrittenMidi.delete(midi);
      } else {
        this.selectedWrittenMidi.add(midi);
      }
      this.applyProfile();
      this._emitChange();
    }

    setSelection(midis = []) {
      this.selectedWrittenMidi.clear();
      for (const midi of midis) {
        if (Number.isFinite(midi)) this.selectedWrittenMidi.add(Math.round(midi));
      }
      this.applyProfile();
      this._emitChange();
    }

    clearSelection() {
      this.selectedWrittenMidi.clear();
      this.applyProfile();
      this._emitChange();
    }

    getSelectedWrittenMidi() {
      return [...this.selectedWrittenMidi].sort((a, b) => a - b);
    }

    isWrittenSelected(midi) {
      return this.selectedWrittenMidi.has(Math.round(midi));
    }

    writtenToConcert(midi) {
      return Math.round(midi) - this.getInstrument().transposeSemitones;
    }

    concertToWritten(midi) {
      return Math.round(midi) + this.getInstrument().transposeSemitones;
    }

    getSelectedConcertMidi() {
      return this.getSelectedWrittenMidi().map(midi => this.writtenToConcert(midi));
    }

    isConcertSelected(midi) {
      return this.isWrittenSelected(this.concertToWritten(midi));
    }

    buildProfile() {
      const instrument = this.getInstrument();
      const allowedMidi = this.getSelectedConcertMidi();

      return {
        name: `${instrument.label} · manuaalinen`,
        allowedMidi,
        fastAccept: {
          enabled: allowedMidi.length > 0,
          frames: this.fastAcceptFrames,
          toleranceCents: this.fastAcceptToleranceCents
        }
      };
    }

    applyProfile() {
      this.engine.setProfile(this.buildProfile());
      return this;
    }

    getState() {
      const instrument = this.getInstrument();
      return {
        instrument: { ...instrument },
        selectedWrittenMidi: this.getSelectedWrittenMidi(),
        selectedConcertMidi: this.getSelectedConcertMidi(),
        fastAcceptFrames: this.fastAcceptFrames,
        fastAcceptToleranceCents: this.fastAcceptToleranceCents
      };
    }

    _emitChange() {
      this.dispatchEvent(new CustomEvent('change', { detail: this.getState() }));
    }
  }

  InstrumentController.DEFAULT_INSTRUMENTS = DEFAULT_INSTRUMENTS;
  global.InstrumentController = InstrumentController;
})(window);
