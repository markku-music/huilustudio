/*
 * PlayerSensitivityLearner 0.1.0
 *
 * Oppii mikrofonisession aikana soittajan käyttökelpoisen 4–10 dB:n
 * aktivointirajan vakaista, oikein tunnistetuista sävelistä. Taustakohinan
 * mittaus kuuluu ResonatorEngine-moottorille eikä sitä muuteta oppimisen aikana.
 */
(function (global) {
  'use strict';

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function percentile(values, fraction) {
    if (!values.length) return NaN;
    const sorted = values.slice().sort((a, b) => a - b);
    const position = clamp(fraction, 0, 1) * (sorted.length - 1);
    const lower = Math.floor(position);
    const upper = Math.ceil(position);
    if (lower === upper) return sorted[lower];
    const weight = position - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  class PlayerSensitivityLearner {
    constructor(options = {}) {
      this.minDb = Number.isFinite(+options.minDb) ? Math.round(+options.minDb) : 4;
      this.maxDb = Number.isFinite(+options.maxDb) ? Math.round(+options.maxDb) : 10;
      this.minNotes = Number.isFinite(+options.minNotes) ? Math.max(1, Math.round(+options.minNotes)) : 3;
      this.historySize = Number.isFinite(+options.historySize) ? Math.max(this.minNotes, Math.round(+options.historySize)) : 8;
      this.headroomDb = Number.isFinite(+options.headroomDb) ? Math.max(0, +options.headroomDb) : 2;
      this.minEpisodeFrames = Number.isFinite(+options.minEpisodeFrames) ? Math.max(1, Math.round(+options.minEpisodeFrames)) : 3;
      this.probeFrames = Number.isFinite(+options.probeFrames) ? Math.max(2, Math.round(+options.probeFrames)) : 8;
      this.probeHeadroomDb = Number.isFinite(+options.probeHeadroomDb) ? Math.max(0, +options.probeHeadroomDb) : 1;
      this.maxProbeGapMs = Number.isFinite(+options.maxProbeGapMs) ? Math.max(20, +options.maxProbeGapMs) : 100;
      if (this.minDb > this.maxDb) [this.minDb, this.maxDb] = [this.maxDb, this.minDb];
      this.reset();
    }

    reset() {
      this.currentDb = this.minDb;
      this.learned = false;
      this.noteCount = 0;
      this.history = [];
      this._activeAction = '';
      this._activeLevels = [];
      this.cancelProbe();
      return this._state(true, 'reset');
    }

    _state(updated = false, reason = '') {
      return {
        currentDb: this.currentDb,
        learning: !this.learned,
        learned: this.learned,
        noteCount: this.noteCount,
        minNotes: this.minNotes,
        updated,
        reason
      };
    }

    _level(detail) {
      const value = Number(detail?.levelAboveNoiseDb);
      return Number.isFinite(value) ? value : null;
    }

    _targetFromHistory() {
      const quietLevel = percentile(this.history, 0.25);
      return clamp(Math.floor(quietLevel - this.headroomDb), this.minDb, this.maxDb);
    }

    _finalizeEpisode() {
      const levels = this._activeLevels;
      this._activeAction = '';
      this._activeLevels = [];
      if (levels.length < this.minEpisodeFrames) return this._state(false, 'short-note');

      // Pitkän sävelen alku ja loppu jätetään pois. Näin jousen aluke ja
      // loppuhiipuminen eivät määrää soittajan varsinaista voimakkuustasoa.
      const body = levels.length >= 7 ? levels.slice(2, -2) : levels;
      const noteLevel = percentile(body, 0.30);
      if (!Number.isFinite(noteLevel)) return this._state(false, 'invalid-note');

      this.history.push(noteLevel);
      if (this.history.length > this.historySize) this.history.shift();
      this.noteCount++;

      if (!this.learned && this.noteCount < this.minNotes) {
        return this._state(true, 'progress');
      }

      const target = this._targetFromHistory();
      if (!this.learned) {
        this.learned = true;
        this.currentDb = target;
        return this._state(true, 'learned');
      }

      if (target !== this.currentDb) {
        this.currentDb += target > this.currentDb ? 1 : -1;
        this.currentDb = clamp(this.currentDb, this.minDb, this.maxDb);
        return this._state(true, 'adapted');
      }
      return this._state(false, 'steady');
    }

    observeAccepted(detail) {
      const action = typeof detail?.action === 'string' ? detail.action : '';
      const level = this._level(detail);
      if (!action || level === null) return this._state(false, 'invalid-frame');

      this.cancelProbe();
      let result = this._state(false, 'collecting');
      if (this._activeAction && this._activeAction !== action) result = this._finalizeEpisode();
      if (!this._activeAction) this._activeAction = action;
      this._activeLevels.push(level);
      return result;
    }

    finishNote() {
      this.cancelProbe();
      if (!this._activeAction) return this._state(false, 'no-note');
      return this._finalizeEpisode();
    }

    cancelProbe() {
      this._probeAction = '';
      this._probeLevels = [];
      this._lastProbeAt = null;
    }

    observeProbe(detail, atMs = 0) {
      if (!this.learned || this._activeAction) return this._state(false, 'probe-ignored');
      const action = typeof detail?.action === 'string' ? detail.action : '';
      const level = this._level(detail);
      const now = Number.isFinite(+atMs) ? +atMs : 0;
      if (!action || level === null) {
        this.cancelProbe();
        return this._state(false, 'invalid-probe');
      }

      const gapTooLong = this._lastProbeAt !== null && now - this._lastProbeAt > this.maxProbeGapMs;
      if (this._probeAction !== action || gapTooLong) {
        this._probeAction = action;
        this._probeLevels = [];
      }
      this._lastProbeAt = now;
      this._probeLevels.push(level);
      if (this._probeLevels.length < this.probeFrames) return this._state(false, 'probing');

      const half = Math.floor(this._probeLevels.length / 2);
      const early = percentile(this._probeLevels.slice(0, half), 0.5);
      const late = percentile(this._probeLevels.slice(half), 0.5);
      const stableOrRising = late >= early - 0.6;
      const target = clamp(
        Math.floor(percentile(this._probeLevels, 0.30) - this.probeHeadroomDb),
        this.minDb,
        this.maxDb
      );
      this.cancelProbe();
      if (!stableOrRising || target >= this.currentDb) return this._state(false, 'probe-rejected');

      // Uusi, aidosti hiljaisempi sävel saa laskea rajaa heti. Arvo jää
      // voimaan ja osallistuu seuraavien sävelten jatkuvaan oppimiseen.
      this.currentDb = target;
      return this._state(true, 'soft-note');
    }
  }

  global.PlayerSensitivityLearner = PlayerSensitivityLearner;
})(typeof window !== 'undefined' ? window : globalThis);
