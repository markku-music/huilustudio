/*
 * ResonatorStringEngine 0.5
 * Jatkuva, ennalta määritellyille sävelille tarkoitettu periodiresonaattori.
 *
 * Idea:
 * - Varsinainen tunnistus ei etsi yleistä F0:aa.
 * - Jokaiselle kohdesävelelle verrataan jatkuvasti nykyistä aaltomuotoa
 *   saman signaalin yhden perusjakson takaiseen versioon.
 * - Oikealla sävelellä koko jaksollinen aaltomuoto (myös yläsävelet)
 *   toistuu lähes samanlaisena.
 * - Puolijakson vertailu toimii oktaavisuojana: se estää ylemmän oktaavin
 *   kelpaamisen vahingossa alemman sävelen periodiksi.
 * - Erillinen kevyt, kohdesäveleen ankkuroitu jaksoarvio antaa portaattoman
 *   taajuuden näyttöä varten muuttamatta sävelen hyväksymistä.
 *
 * Itsenäinen tunnistin. Ei muita moottoririippuvuuksia.
 */
function createJuoksuResonator(sampleRate, targets, onEvent) {
  'use strict';

  // -80 dBFS RMS floor: allow calibration and the margin to govern quiet rooms.
  const MIN_GATE_RMS = Math.pow(10, -80 / 20);

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  class ResonatorStringEngine {
    constructor(options = {}) {
      this.version = '0.5';
      this.targets = targets;
      this.blockSize = Math.max(256, Math.round(options.blockSize || 256));
      this.calibrationMs = Number.isFinite(+options.calibrationMs) ? Math.max(0, +options.calibrationMs) : 280;
      this.responseMs = Number.isFinite(+options.responseMs) ? clamp(+options.responseMs, 0.8, 8) : 1.8;
      this.rmsResponseMs = Number.isFinite(+options.rmsResponseMs) ? clamp(+options.rmsResponseMs, 0.5, 10) : 2.0;
      this.centerMatch = Number.isFinite(+options.centerMatch) ? clamp(+options.centerMatch, 0.5, 0.9999) : 0.955;
      this.edgeMatch = Number.isFinite(+options.edgeMatch) ? clamp(+options.edgeMatch, 0.5, 0.9999) : 0.995;
      this.toleranceCents = Number.isFinite(+options.toleranceCents) ? clamp(+options.toleranceCents, 10, 80) : 40;
      this.minHalfPeriodEnergy = Number.isFinite(+options.minHalfPeriodEnergy) ? Math.max(0, +options.minHalfPeriodEnergy) : 0.32;
      this.noiseMarginDb = Number.isFinite(+options.noiseMarginDb) ? clamp(+options.noiseMarginDb, 4, 10) : 10;
      this.pitchMeterIntervalMs = Number.isFinite(+options.pitchMeterIntervalMs) ? clamp(+options.pitchMeterIntervalMs, 12, 60) : 22;
      this.pitchMeterWindowMs = Number.isFinite(+options.pitchMeterWindowMs) ? clamp(+options.pitchMeterWindowMs, 10, 24) : 16;
      this.pitchMeterSearchCents = Number.isFinite(+options.pitchMeterSearchCents) ? clamp(+options.pitchMeterSearchCents, 110, 180) : 140;
      this.running = false;

      this.sampleRate = 48000;

      this._ring = null;
      this._ringSize = 0;
      this._writePos = 0;
      this._samplesSeen = 0;
      this._states = {};
      this._rms2 = 0;
      this._noiseRms = 0.001;
      this._calibrationSamples = 0;
      this._calibrationTargetSamples = 0;
      this._alpha = 0;
      this._alphaRms = 0;
      this._pitchWindowSamples = 0;
      this._pitchEverySamples = 0;
      this._lastPitchSample = -Infinity;
      this._candidate = '';
      this._candidateFrames = 0;
      this._accepted = '';
      this._silentFrames = 0;
      this._rejectedFrames = 0;
      this._lastSilenceSent = true;
      this._lastTrigger = '';
      this._resetDecisionTiming();
      this._voiced = false;
      this._gate = MIN_GATE_RMS;
    }

    _updateNoiseGate() {
      const noiseMultiplier = Math.pow(10, this.noiseMarginDb / 20);
      this._gate = Math.max(MIN_GATE_RMS, this._noiseRms * noiseMultiplier);
      return this._gate;
    }

    _resetDecisionTiming() {
      this._onsetSample = null;
      this._quietSamples = 0;
      this._decisionNote = '';
      this._decisionMs = null;
      this._decisionKind = null;
    }

    _trackDecisionOnset(rms, sampleIndex, gate) {
      if (rms >= gate) {
        this._quietSamples = 0;
        if (this._onsetSample === null) this._onsetSample = sampleIndex;
      } else if (rms < gate * 0.72) {
        // Short envelope dips do not create a new sound onset.
        if (++this._quietSamples >= 2 * this.blockSize) this._resetDecisionTiming();
      } else {
        this._quietSamples = 0;
      }
    }

    _captureDecision(id, processedSamples) {
      if (!this._decisionNote) {
        this._decisionMs = this._onsetSample === null ? null
          : (processedSamples - this._onsetSample) / this.sampleRate * 1000;
        this._decisionKind = this._onsetSample === null ? null : 'onset';
      } else if (this._decisionNote !== id) {
        // Legato has no separate amplitude onset. Do not report the phrase's
        // elapsed duration as the new note's detection latency.
        this._decisionMs = null;
        this._decisionKind = 'note-change';
      }
      this._decisionNote = id;
    }

    _prepare(sampleRate) {
      this.sampleRate = sampleRate;
      const periods = Object.values(this.targets).map(hz => sampleRate / hz);
      const maxPeriod = Math.max(...periods);
      this._ringSize = Math.ceil(maxPeriod * 2 + this.blockSize * 3 + 32);
      this._ring = new Float32Array(this._ringSize);
      this._writePos = 0;
      this._samplesSeen = 0;
      this._states = {};
      const T = this.toleranceCents;
      const offsets = [-T, -T / 2, 0, T / 2, T];
      for (const [id, hz] of Object.entries(this.targets)) {
        this._states[id] = {
          hz,
          variants: offsets.map(cents => ({
            cents,
            testHz: hz * Math.pow(2, cents / 1200),
            period: sampleRate / (hz * Math.pow(2, cents / 1200)),
            err: 0,
            sig: 1e-10,
            halfErr: 0,
            match: -1,
            halfEnergy: 0
          }))
        };
      }
      this._stateList = Object.values(this._states);
      this._alpha = Math.exp(-1 / (sampleRate * this.responseMs / 1000));
      this._alphaRms = Math.exp(-1 / (sampleRate * this.rmsResponseMs / 1000));
      const searchRatio = Math.pow(2, this.pitchMeterSearchCents / 1200);
      const lowestPitch = Math.min(...Object.values(this.targets)) / searchRatio;
      const maxPitchLag = Math.ceil(sampleRate / lowestPitch) + 2;
      const availablePitchWindow = Math.max(128, this._ringSize - maxPitchLag - 4);
      this._pitchWindowSamples = Math.min(Math.round(sampleRate * this.pitchMeterWindowMs / 1000), availablePitchWindow);
      this._pitchEverySamples = Math.max(this.blockSize, Math.round(sampleRate * this.pitchMeterIntervalMs / 1000));
      this._lastPitchSample = -Infinity;
      this._rms2 = 0;
      this._candidate = '';
      this._candidateFrames = 0;
      this._accepted = '';
      this._silentFrames = 0;
      this._rejectedFrames = 0;
      this._lastSilenceSent = true;
      this._lastTrigger = '';
      this._resetDecisionTiming();
      this._voiced = false;
    }

    _resetAnalysisStates() {
      if (this._ring) this._ring.fill(0);
      this._writePos = 0;
      this._samplesSeen = 0;
      this._rms2 = 0;
      for (const state of this._stateList) {
        for (const variant of state.variants) {
          variant.err = 0;
          variant.sig = 1e-10;
          variant.halfErr = 0;
          variant.match = -1;
          variant.halfEnergy = 0;
        }
      }
      this._candidate = '';
      this._candidateFrames = 0;
      this._accepted = '';
      this._silentFrames = 0;
      this._rejectedFrames = 0;
      this._lastSilenceSent = true;
      this._lastTrigger = '';
      this._lastPitchSample = -Infinity;
      this._resetDecisionTiming();
      this._voiced = false;
    }

    _delayed(delaySamples) {
      if (!this._ring || this._samplesSeen < Math.ceil(delaySamples) + 2) return 0;
      let pos = this._writePos - delaySamples;
      while (pos < 0) pos += this._ringSize;
      while (pos >= this._ringSize) pos -= this._ringSize;
      const i0 = Math.floor(pos);
      const frac = pos - i0;
      const i1 = (i0 + 1) % this._ringSize;
      return this._ring[i0] * (1 - frac) + this._ring[i1] * frac;
    }

    _periodMatch(lag) {
      let error = 0;
      let energy = 0;
      let currentPos = this._writePos - 1;
      if (currentPos < 0) currentPos += this._ringSize;
      let delayedPos = currentPos - lag;
      while (delayedPos < 0) delayedPos += this._ringSize;
      for (let i = 0; i < this._pitchWindowSamples; i++) {
        const a = this._ring[currentPos];
        const b = this._ring[delayedPos];
        const difference = a - b;
        error += difference * difference;
        energy += a * a + b * b;
        if (--currentPos < 0) currentPos = this._ringSize - 1;
        if (--delayedPos < 0) delayedPos = this._ringSize - 1;
      }
      return 1 - error / Math.max(1e-12, energy);
    }

    _estimateContinuousPitch(anchorId) {
      const anchorHz = this.targets[anchorId];
      if (!Number.isFinite(anchorHz) || !this._pitchWindowSamples) return null;

      const ratio = Math.pow(2, this.pitchMeterSearchCents / 1200);
      const minLag = Math.max(2, Math.floor(this.sampleRate / (anchorHz * ratio)));
      const maxLag = Math.ceil(this.sampleRate / (anchorHz / ratio));
      if (this._samplesSeen < this._pitchWindowSamples + maxLag + 2) return null;

      let bestLag = minLag;
      let bestMatch = -Infinity;
      for (let lag = minLag; lag <= maxLag; lag++) {
        const match = this._periodMatch(lag);
        if (match > bestMatch) {
          bestMatch = match;
          bestLag = lag;
        }
      }
      if (!Number.isFinite(bestMatch) || bestMatch < 0.55) return null;

      const left = this._periodMatch(bestLag - 1);
      const center = bestMatch;
      const right = this._periodMatch(bestLag + 1);
      const denominator = left - 2 * center + right;
      const correction = Math.abs(denominator) > 1e-12
        ? clamp(0.5 * (left - right) / denominator, -1, 1)
        : 0;
      const refinedLag = bestLag + correction;
      const frequency = this.sampleRate / refinedLag;
      const centsFromAnchor = 1200 * Math.log2(frequency / anchorHz);
      if (!Number.isFinite(frequency) || Math.abs(centsFromAnchor) > this.pitchMeterSearchCents + 12) return null;

      return { frequency, centsFromAnchor, match: center, anchor: anchorId };
    }

    _maybeEmitContinuousPitch(measurement, blockMs) {
      if (!this._voiced || measurement.rms < this._gate) return;
      if (this._samplesSeen - this._lastPitchSample < this._pitchEverySamples) return;
      this._lastPitchSample = this._samplesSeen;
      const estimate = this._estimateContinuousPitch(measurement.best);
      if (!estimate) return;
      onEvent('pitch', {
        ...estimate,
        rms: measurement.rms,
        gate: this._gate,
        blockMs,
        engine: 'string-resonator'
      });
    }

    _processSample(x) {
      this._rms2 = this._alphaRms * this._rms2 + (1 - this._alphaRms) * x * x;
      const rms = Math.sqrt(Math.max(0, this._rms2));
      this._trackDecisionOnset(rms, this._samplesSeen, this._gate);
      const sampleVoiced = rms >= this._gate;
      if (sampleVoiced) {
        this._voiced = true;
      } else if (rms < this._gate * 0.72) {
        this._voiced = false;
      }

      for (const state of this._stateList) {
        for (const variant of state.variants) {
          const delayed = this._delayed(variant.period);
          const halfDelayed = this._delayed(variant.period * 0.5);
          const err = x - delayed;
          const halfErr = x - halfDelayed;
          const sig = 0.5 * (x * x + delayed * delayed);
          variant.err = this._alpha * variant.err + (1 - this._alpha) * err * err;
          variant.sig = this._alpha * variant.sig + (1 - this._alpha) * sig;
          variant.halfErr = this._alpha * variant.halfErr + (1 - this._alpha) * halfErr * halfErr;
        }
      }

      this._ring[this._writePos] = x;
      this._writePos = (this._writePos + 1) % this._ringSize;
      this._samplesSeen++;
    }

    _measure() {
      const matches = {};
      const halfEnergies = {};
      const bestCents = {};
      for (const [id, state] of Object.entries(this._states)) {
        let bestVariant = null;
        for (const variant of state.variants) {
          const denom = Math.max(1e-10, 2 * variant.sig);
          variant.match = 1 - variant.err / denom;
          variant.halfEnergy = variant.halfErr / denom;
          if (!bestVariant || variant.match > bestVariant.match) bestVariant = variant;
        }
        matches[id] = bestVariant.match;
        halfEnergies[id] = bestVariant.halfEnergy;
        bestCents[id] = bestVariant.cents;
      }
      const ranked = Object.keys(matches).sort((a, b) => matches[b] - matches[a]);
      // Discard octave aliases before choosing the winner. An invalid lower
      // octave must not hide a valid upper note with a nearly equal match.
      const eligible = ranked.filter(id => halfEnergies[id] >= this.minHalfPeriodEnergy);
      const best = eligible[0] || ranked[0];
      const second = ranked.find(id => id !== best);
      return {
        rms: Math.sqrt(Math.max(0, this._rms2)),
        best,
        match: matches[best],
        secondMatch: matches[second],
        separation: matches[best] - matches[second],
        halfEnergy: halfEnergies[best],
        offsetCents: bestCents[best],
        matches,
        halfEnergies,
        bestCents
      };
    }

    _process(input) {
      if (!this.running) return;

      if (this._calibrationSamples < this._calibrationTargetSamples) {
        let e = 0;
        for (let i = 0; i < input.length; i++) e += input[i] * input[i];
        const blockRms = Math.sqrt(e / Math.max(1, input.length));
        this._noiseRms = this._calibrationSamples === 0 ? blockRms : (this._noiseRms * 0.86 + blockRms * 0.14);
        this._calibrationSamples += input.length;
        const progress = Math.min(1, this._calibrationSamples / Math.max(1, this._calibrationTargetSamples));
        onEvent('calibrationprogress', { progress, noiseRms: this._noiseRms });
        if (progress >= 1) {
          this._updateNoiseGate();
          this._resetAnalysisStates();
          onEvent('state', {
            state: 'running',
            noiseMarginDb: this.noiseMarginDb,
            noiseRms: this._noiseRms,
            gate: this._gate
          });
        }
        return;
      }

      for (let i = 0; i < input.length; i++) this._processSample(input[i]);

      const m = this._measure();
      const blockMs = input.length / this.sampleRate * 1000;
      this._maybeEmitContinuousPitch(m, blockMs);

      if (!this._voiced || m.rms < this._gate) {
        this._silentFrames++;
        this._rejectedFrames = 0;
        this._candidate = '';
        this._candidateFrames = 0;
        if (this._silentFrames >= 2) {
          this._accepted = '';
          this._lastTrigger = '';
          this._resetDecisionTiming();
          if (!this._lastSilenceSent) {
            this._lastSilenceSent = true;
            onEvent('silence', { rms: m.rms, gate: this._gate, blockMs, engine: 'string-resonator' });
          }
        }
        return;
      }

      this._lastSilenceSent = false;
      this._silentFrames = 0;

      // Periodisuuden pitää olla vahva ja puolijakson energian riittävä.
      // Jälkimmäinen torjuu tilanteen, jossa ylempi oktaavi toistuu myös alemman
      // sävelen kokonaisjakson välein.
      //
      // Keskialue (-20...+20 c) saa nopean hyväksynnän. Toleranssin reunoilla
      // (+/-40 c) vaaditaan paljon vahvempi periodiosuma, jotta viereinen
      // puolisävelaskel ei pääse livahtamaan sisään.
      const octaveSafe = m.halfEnergy >= this.minHalfPeriodEnergy;
      const centerBand = Math.abs(m.offsetCents) <= this.toleranceCents / 2 + 1e-9;
      const neededMatch = centerBand ? this.centerMatch : this.edgeMatch;
      const acceptedNow = octaveSafe && m.match >= neededMatch;

      if (acceptedNow) {
        this._candidate = m.best;
        this._candidateFrames = 1;
        this._rejectedFrames = 0;
        this._accepted = m.best;
        this._captureDecision(m.best, this._samplesSeen);
        const detail = {
          accepted: true,
          action: m.best,
          frequency: this.targets[m.best] * Math.pow(2, m.offsetCents / 1200),
          targetFrequency: this.targets[m.best],
          offsetCents: m.offsetCents,
          rms: m.rms,
          gate: this._gate,
          match: m.match,
          secondMatch: m.secondMatch,
          separation: m.separation,
          halfEnergy: m.halfEnergy,
          decisionFrames: 1,
          decisionMs: this._decisionMs,
          decisionKind: this._decisionKind,
          blockMs,
          engine: 'string-resonator'
        };
        onEvent('input', detail);
        if (this._lastTrigger !== m.best) {
          this._lastTrigger = m.best;
          onEvent('trigger', detail);
        }
        return;
      }

      this._candidate = '';
      this._candidateFrames = 0;

      this._rejectedFrames++;
      if (this._rejectedFrames >= 2) {
        this._accepted = '';
        this._lastTrigger = '';
        onEvent('input', {
          accepted: false,
          action: null,
          rms: m.rms,
          gate: this._gate,
          match: m.match,
          secondMatch: m.secondMatch,
          separation: m.separation,
          halfEnergy: m.halfEnergy,
          decisionMs: null,
          decisionKind: null,
          blockMs,
          engine: 'string-resonator'
        });
      }
    }

  }

  const engine = new ResonatorStringEngine({
    blockSize: 256, calibrationMs: 1500, responseMs: 1.8, toleranceCents: 40,
    centerMatch: 0.955, edgeMatch: 0.998, minHalfPeriodEnergy: 0.32, noiseMarginDb: 8
  });
  engine._prepare(sampleRate);
  engine._calibrationTargetSamples = Math.round(sampleRate * engine.calibrationMs / 1000);
  engine.running = true;
  return engine;
}
