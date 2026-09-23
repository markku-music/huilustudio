/*
 * ResonatorStringEngine 0.5.1 (Puhallinstartti v23.1)
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
 *   taajuuden näyttöä varten. v23.1 varmistaa hyväksynnän erikseen samasta
 *   näytepuskurista: todellinen vire sekä lyhyemmän jakson rekisterisuoja.
 *
 * Itsenäinen tunnistin. Ei muita moottoririippuvuuksia.
 */
(function (global) {
  'use strict';

  const DEFAULT_TARGETS = {
    G: 196.0000,
    D: 293.6648,
    A: 440.0000,
    E: 659.2551
  };

  function makeEvent(type, detail) {
    return new CustomEvent(type, { detail });
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  class ResonatorStringEngine extends EventTarget {
    constructor(options = {}) {
      super();
      this.version = '0.5.1';
      this.targets = { ...(options.targets || DEFAULT_TARGETS) };
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
      // Acceptance guards use the existing sample buffer, not an extra hold timer.
      this.verifyPitch = options.verifyPitch !== false;
      this.emitPitch = options.emitPitch !== false;
      this._calibrationRmsBlocks = [];
      this.running = false;

      this.context = null;
      this.stream = null;
      this.source = null;
      this.processor = null;
      this.silentGain = null;
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
      this._starting = false;
      this._startPromise = null;
      this._lifecycleId = 0;
      this._resetDecisionTiming();
      this._voiced = false;
      this._gate = 0.0022;
    }

    _updateNoiseGate() {
      const noiseMultiplier = Math.pow(10, this.noiseMarginDb / 20);
      this._gate = Math.max(0.0022, this._noiseRms * noiseMultiplier);
      return this._gate;
    }

    setNoiseMarginDb(value) {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return this.noiseMarginDb;
      this.noiseMarginDb = clamp(parsed, 4, 10);
      const calibrationComplete = this.running
        && this._calibrationSamples >= this._calibrationTargetSamples;
      if (calibrationComplete) this._updateNoiseGate();
      this._emit('thresholdchange', {
        noiseMarginDb: this.noiseMarginDb,
        noiseRms: this._noiseRms,
        gate: this._gate
      });
      return this.noiseMarginDb;
    }

    get ready() {
      return this.running && this._calibrationSamples >= this._calibrationTargetSamples;
    }

    recalibrate() {
      if (!this.running) throw new Error('Avaa mikrofoni ennen kalibrointia.');
      this._calibrationSamples = 0;
      this._calibrationTargetSamples = Math.round(this.sampleRate * this.calibrationMs / 1000);
      this._calibrationRmsBlocks = [];
      this._resetAnalysisStates();
      if (this._calibrationTargetSamples > 0) this._emit('state', { state: 'calibrating' });
      else this._emit('state', { state: 'running', gate: this._gate });
      return this;
    }

    setTargets(targets) {
      if (!targets || typeof targets !== 'object') {
        throw new TypeError('Kohdesävelten pitää olla sävel–taajuus-pareja.');
      }
      const next = {};
      for (const [rawId, rawHz] of Object.entries(targets)) {
        const id = String(rawId).trim();
        const hz = Number(rawHz);
        if (!id || !Number.isFinite(hz) || hz <= 0) {
          throw new TypeError('Jokaisella kohdesävelellä pitää olla nimi ja positiivinen taajuus.');
        }
        next[id] = hz;
      }
      if (Object.keys(next).length === 0) {
        throw new TypeError('Kohdesäveliä pitää olla vähintään yksi.');
      }

      this.targets = next;
      if (this.running) {
        // Vaihda resonaattoripankki, mutta säilytä mikrofoni, AudioContext,
        // pohjakohinamittaus ja nykyinen kohinakynnys.
        const noiseRms = this._noiseRms;
        const calibrationSamples = this._calibrationSamples;
        const calibrationTargetSamples = this._calibrationTargetSamples;
        const gate = this._gate;
        this._prepare(this.sampleRate);
        this._noiseRms = noiseRms;
        this._calibrationSamples = calibrationSamples;
        this._calibrationTargetSamples = calibrationTargetSamples;
        this._gate = gate;
      }
      const detail = {
        targets: { ...this.targets },
        running: this.running,
        calibrationComplete: this._calibrationSamples >= this._calibrationTargetSamples
      };
      this._emit('targetschange', detail);
      return { ...this.targets };
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

    _abortError() {
      const error = new Error('Mikrofonin avaus peruttiin.');
      error.name = 'AbortError';
      return error;
    }

    _checkLifecycle(lifecycleId) {
      if (lifecycleId !== this._lifecycleId) throw this._abortError();
    }

    _emit(type, detail = {}) {
      this.dispatchEvent(makeEvent(type, detail));
    }

    _prepare(sampleRate) {
      if (!Object.keys(this.targets).length) throw new Error('Valitse ensin soitin.');
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
      for (const state of Object.values(this._states)) {
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
      if (!this.emitPitch || !this._voiced || measurement.rms < this._gate) return;
      if (this._samplesSeen - this._lastPitchSample < this._pitchEverySamples) return;
      this._lastPitchSample = this._samplesSeen;
      const estimate = this._estimateContinuousPitch(measurement.best);
      if (!estimate) return;
      this._emit('pitch', {
        ...estimate,
        rms: measurement.rms,
        gate: this._gate,
        blockMs,
        engine: 'string-resonator'
      });
    }

    // Fractional-delay comparison over already collected samples. A shorter
    // startup window avoids waiting for the independent 16 ms display meter.
    _windowMatch(lag, count) {
      const delay = Math.floor(lag), fraction = lag - delay;
      let current = (this._writePos - 1 + this._ringSize) % this._ringSize;
      let delayed = (current - delay + this._ringSize) % this._ringSize;
      let error = 0, energy = 0;
      for (let i = 0; i < count; i++) {
        const previous = delayed === 0 ? this._ringSize - 1 : delayed - 1;
        const a = this._ring[current];
        const b = this._ring[delayed] * (1 - fraction) + this._ring[previous] * fraction;
        error += (a - b) * (a - b);
        energy += a * a + b * b;
        if (--current < 0) current = this._ringSize - 1;
        if (--delayed < 0) delayed = this._ringSize - 1;
      }
      return 1 - error / Math.max(1e-12, energy);
    }

    _verifyCandidate(id) {
      const hz = this.targets[id];
      if (!Number.isFinite(hz)) return null;
      const nominalPeriod = this.sampleRate / hz;
      const ratio = Math.pow(2, (this.toleranceCents + 18) / 1200);
      const first = Math.max(3, Math.floor(nominalPeriod / ratio));
      const last = Math.ceil(nominalPeriod * ratio);
      // Do not compare a settled cycle against the first few milliseconds
      // of its amplitude attack: that can bias a low note's first estimate.
      // This is a sample-window limit, not a UI timer or an extra audio buffer.
      const onset = this._onsetSample === null ? 0 : this._onsetSample;
      const attackSamples = Math.ceil(this.sampleRate * 0.004);
      const available = this._samplesSeen - onset - last - attackSamples - 3;
      const minimum = Math.min(128, Math.max(48, Math.ceil(nominalPeriod * 0.65)));
      if (available < minimum) return null;
      const count = Math.min(available, Math.max(128, Math.ceil(nominalPeriod * 1.25)));
      let bestLag = first, bestMatch = -Infinity;
      for (let lag = first; lag <= last; lag++) {
        const match = this._windowMatch(lag, count);
        if (match > bestMatch) { bestMatch = match; bestLag = lag; }
      }
      if (bestMatch < 0.90) return null;
      const left = this._windowMatch(bestLag - 1, count);
      const right = this._windowMatch(bestLag + 1, count);
      const denominator = left - 2 * bestMatch + right;
      const correction = Math.abs(denominator) > 1e-12
        ? clamp(0.5 * (left - right) / denominator, -1, 1) : 0;
      const period = bestLag + correction;
      const frequency = this.sampleRate / period;
      const cents = 1200 * Math.log2(frequency / hz);
      // A quarter cent accounts for numerical interpolation, not a wider
      // pedagogical tolerance. The nominal v23 tolerance stays at 40 cents.
      if (!Number.isFinite(cents) || Math.abs(cents) > this.toleranceCents + 0.25) return null;
      const fullMatch = this._windowMatch(period, count);
      // Pure octave / third / fifth (and other small-integer) aliases also
      // repeat after the shorter period. Require near-identical repetition
      // before rejecting, so ordinary strong overtones remain allowed.
      for (let divisor = 2; divisor <= 8; divisor++) {
        if (period / divisor < 3) continue;
        const shorterMatch = this._windowMatch(period / divisor, count);
        if (shorterMatch >= 0.995 && shorterMatch >= fullMatch - 0.002) return null;
      }
      return { frequency, cents, periodMatch: fullMatch };
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

      for (const state of Object.values(this._states)) {
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
        this._calibrationRmsBlocks.push(blockRms);
        this._calibrationSamples += input.length;
        const progress = Math.min(1, this._calibrationSamples / Math.max(1, this._calibrationTargetSamples));
        this._emit('calibrationprogress', { progress, noiseRms: this._noiseRms });
        if (progress >= 1) {
          // Median of the WHOLE calibration: a short bang at either end must
          // not turn a quiet player into an inaudible one. Sustained room
          // noise is still represented, unlike an absolute-minimum estimate.
          const sorted = this._calibrationRmsBlocks.slice().sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          this._noiseRms = sorted.length % 2 ? sorted[mid]
            : (sorted[mid - 1] + sorted[mid]) / 2;
          if (!Number.isFinite(this._noiseRms)) this._noiseRms = 0.001;
          this._calibrationRmsBlocks = [];
          this._updateNoiseGate();
          this._resetAnalysisStates();
          this._emit('state', {
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
            this._emit('silence', { rms: m.rms, gate: this._gate, blockMs, engine: 'string-resonator' });
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
      const preliminary = octaveSafe && m.match >= neededMatch;
      const verified = preliminary && this.verifyPitch ? this._verifyCandidate(m.best) : null;
      const acceptedNow = preliminary && (!this.verifyPitch || !!verified);

      if (acceptedNow) {
        this._candidate = m.best;
        this._candidateFrames = 1;
        this._rejectedFrames = 0;
        this._accepted = m.best;
        this._captureDecision(m.best, this._samplesSeen);
        const detail = {
          accepted: true,
          action: m.best,
          frequency: verified ? verified.frequency : this.targets[m.best] * Math.pow(2, m.offsetCents / 1200),
          targetFrequency: this.targets[m.best],
          offsetCents: verified ? verified.cents : m.offsetCents,
          variantCents: m.offsetCents,
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
        this._emit('input', detail);
        if (this._lastTrigger !== m.best) {
          this._lastTrigger = m.best;
          this._emit('trigger', detail);
        }
        return;
      }

      this._candidate = '';
      this._candidateFrames = 0;

      this._rejectedFrames++;
      if (this._rejectedFrames >= 2) {
        this._accepted = '';
        this._lastTrigger = '';
        this._emit('input', {
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

    start() {
      if (this._startPromise) return this._startPromise;
      if (this.running) return Promise.resolve(this);
      const lifecycleId = ++this._lifecycleId;
      let resolveStart, rejectStart;
      const pending = new Promise((resolve, reject) => {
        resolveStart = resolve;
        rejectStart = reject;
      });
      this._startPromise = pending;
      this._starting = true;
      this._start(lifecycleId).then(resolveStart, rejectStart);
      return pending;
    }

    async _start(lifecycleId) {
      try {
        this._emit('state', { state: 'requesting-microphone' });
        this._checkLifecycle(lifecycleId);
        if (!global.navigator?.mediaDevices?.getUserMedia) {
          throw new Error('Mikrofonikäyttö vaatii HTTPS-osoitteen tai paikallisen palvelimen.');
        }
        const AC = global.AudioContext || global.webkitAudioContext;
        if (!AC) throw new Error('AudioContext ei ole tuettu tässä selaimessa.');
        // Create/resume from the button gesture, before awaiting microphone permission.
        const context = new AC({ latencyHint: 'interactive' });
        this.context = context;
        if (context.state !== 'running') await context.resume();
        this._checkLifecycle(lifecycleId);
        const stream = await global.navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            channelCount: 1
          }
        });
        if (lifecycleId !== this._lifecycleId) {
          stream.getTracks().forEach(track => track.stop());
          throw this._abortError();
        }
        this.stream = stream;
        this._prepare(this.context.sampleRate);
        this._noiseRms = 0.001;
        this._calibrationRmsBlocks = [];
        this._calibrationSamples = 0;
        this._calibrationTargetSamples = Math.round(this.sampleRate * this.calibrationMs / 1000);
        this._gate = 0.0022;

        this.source = this.context.createMediaStreamSource(this.stream);
        this.processor = this.context.createScriptProcessor(this.blockSize, 1, 1);
        this.silentGain = this.context.createGain();
        this.silentGain.gain.value = 0;
        this.processor.onaudioprocess = (event) => {
          event.outputBuffer.getChannelData(0).fill(0);
          if (lifecycleId !== this._lifecycleId || !this.running) return;
          const input = event.inputBuffer.getChannelData(0);
          this._process(input);
        };
        this.source.connect(this.processor);
        this.processor.connect(this.silentGain);
        this.silentGain.connect(this.context.destination);
        // Keep interruption detection separate from recognition and calibration.
        context.addEventListener?.('statechange', () => {
          if (lifecycleId !== this._lifecycleId || !this.running) return;
          if (context.state === 'interrupted' || context.state === 'suspended' || context.state === 'closed') {
            this._emit('state', { state: 'interrupted', contextState: context.state });
          }
        });
        for (const track of (stream.getAudioTracks?.() || stream.getTracks())) {
          track.addEventListener?.('ended', () => {
            if (lifecycleId === this._lifecycleId && this.running)
              this._emit('state', { state: 'interrupted', reason: 'track-ended' });
          });
          track.addEventListener?.('mute', () => {
            if (lifecycleId === this._lifecycleId && this.running)
              this._emit('state', { state: 'interrupted', reason: 'track-muted' });
          });
        }
        this.running = true;
        this._starting = false;
        if (this.calibrationMs > 0) this._emit('state', { state: 'calibrating' });
        else {
          this._gate = 0.0022;
          this._emit('state', { state: 'running' });
        }
        return this;
      } catch (error) {
        // A cancelled start must never stop or modify a newer session.
        if (lifecycleId !== this._lifecycleId) throw this._abortError();
        this.stop();
        if (error?.name !== 'AbortError') {
          this._emit('error', { error, message: error?.message || String(error) });
        }
        throw error;
      } finally {
        if (lifecycleId === this._lifecycleId) this._startPromise = null;
      }
    }

    stop() {
      const wasRunning = this.running || this._starting;
      ++this._lifecycleId;
      this._startPromise = null;
      this.running = false;
      this._starting = false;
      try { if (this.processor) this.processor.onaudioprocess = null; } catch (_) {}
      try { this.source?.disconnect(); } catch (_) {}
      try { this.processor?.disconnect(); } catch (_) {}
      try { this.silentGain?.disconnect(); } catch (_) {}
      try { this.stream?.getTracks().forEach(track => track.stop()); } catch (_) {}
      try { this.context?.close().catch(() => {}); } catch (_) {}
      this.source = null;
      this.processor = null;
      this.silentGain = null;
      this.stream = null;
      this.context = null;
      this._accepted = '';
      this._candidate = '';
      this._candidateFrames = 0;
      this._lastTrigger = '';
      this._resetDecisionTiming();
      if (wasRunning) this._emit('state', { state: 'stopped' });
      return this;
    }
  }

  global.ResonatorStringEngine = ResonatorStringEngine;
})(typeof window !== 'undefined' ? window : globalThis);
