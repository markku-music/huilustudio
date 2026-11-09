/* ResonatorEngine 0.7.2 — kahden tiedoston paketti.
 * UI: index.html. Toiminta: tämä tiedosto. Ei ulkoisia kirjastoja.
 * Lataa tavallisena scriptinä. ResonatorSession tarjoaa valmiit mittaustiedot.
 * Alkuperäisen engine-tiedoston SHA-256: b0c6e6ca876d197bc3c2b88413ef36506f3976752445ec67c4eb9e361366141d
 * Alkuperäisen vaihtosuojan SHA-256: d18db0e1db235cb1421807cc02c1a2219a3893b1351b59588834e0889a37b2b8
 */
/*
 * ResonatorStringEngine 0.7.2
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
(function (global) {
  'use strict';

  // -80 dBFS RMS floor: allow calibration and the margin to govern quiet rooms.
  const MIN_GATE_RMS = Math.pow(10, -80 / 20);

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
      this.version = '0.7.2';
      this.targets = { ...(options.targets || DEFAULT_TARGETS) };
      // Nominal targets always use A=440. Never scale an already tuned map.
      this._nominalTargets = { ...this.targets };
      this._referenceA = 440;
      this._tuningCalibration = null;
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
      this._gate = MIN_GATE_RMS;
    }

    _updateNoiseGate() {
      const noiseMultiplier = Math.pow(10, this.noiseMarginDb / 20);
      this._gate = Math.max(MIN_GATE_RMS, this._noiseRms * noiseMultiplier);
      return this._gate;
    }

    setNoiseMarginDb(value) {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return this.noiseMarginDb;
      this.noiseMarginDb = clamp(parsed, 4, 10);
      const calibrationComplete = this.running
        && this.calibrationMs > 0
        && this._calibrationSamples >= this._calibrationTargetSamples;
      if (calibrationComplete) this._updateNoiseGate();
      this._emit('thresholdchange', {
        noiseMarginDb: this.noiseMarginDb,
        noiseRms: this._noiseRms,
        gate: this._gate
      });
      return this.noiseMarginDb;
    }

    // Reuse the startup noise measurement without reopening the microphone.
    // Tuning reference, targets and user settings stay unchanged.
    calibrateNoise() {
      if (!this.running || this.tuningCalibrating || this.calibrationMs <= 0 ||
          this._calibrationSamples < this._calibrationTargetSamples) return false;
      this._noiseRms = 0.001;
      this._calibrationSamples = 0;
      this._calibrationTargetSamples = Math.max(1, Math.round(this.sampleRate * this.calibrationMs / 1000));
      this._gate = MIN_GATE_RMS;
      this._resetAnalysisStates();
      this._emit('state', { state: 'calibrating' });
      return true;
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

      this.cancelTuningCalibration();
      this._nominalTargets = next;
      this._applyTuningTargets();
      const detail = {
        targets: { ...this.targets },
        running: this.running,
        calibrationComplete: this._calibrationSamples >= this._calibrationTargetSamples
      };
      this._emit('targetschange', detail);
      return { ...this.targets };
    }

    _applyTuningTargets() {
      const ratio = this._referenceA / 440;
      this.targets = Object.fromEntries(Object.entries(this._nominalTargets).map(
        ([id, hz]) => [id, hz * ratio]
      ));
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
    }

    get referenceA() { return this._referenceA; }
    get nominalTargets() { return { ...this._nominalTargets }; }
    get tuningCalibrating() { return this._tuningCalibration !== null; }

    setTuningReference(referenceA) {
      const hz = Number(referenceA);
      if (!Number.isFinite(hz) || hz < 400 || hz > 480) {
        throw new RangeError('A-viritystason pitää olla 400–480 Hz.');
      }
      this.cancelTuningCalibration();
      const previousReferenceA = this._referenceA;
      this._referenceA = hz;
      this._applyTuningTargets();
      this._emit('tuningchange', {
        referenceA: hz,
        previousReferenceA,
        centsFrom440: 1200 * Math.log2(hz / 440),
        targets: { ...this.targets },
        nominalTargets: this.nominalTargets
      });
      return hz;
    }

    resetTuning() { return this.setTuningReference(440); }

    calibrateA({ stableMs = 500, timeoutMs = 12000 } = {}) {
      if (this._tuningCalibration) return this._tuningCalibration.promise;
      if (!this.running || this._calibrationSamples < this._calibrationTargetSamples) {
        return Promise.reject(new Error('Avaa mikrofoni ja odota pohjakohinamittauksen valmistumista.'));
      }
      if (!Number.isFinite(stableMs) || stableMs < 250 || stableMs > 3000 ||
          !Number.isFinite(timeoutMs) || timeoutMs < stableMs + 1000 || timeoutMs > 60000) {
        return Promise.reject(new RangeError('Tarkista kalibroinnin kesto ja aikaraja.'));
      }
      // This temporary A-only analyser exists only during explicit calibration.
      // No additional pitch analysis runs during ordinary note recognition.
      const probe = new ResonatorStringEngine({
        targets: { A: 440 }, blockSize: this.blockSize,
        rmsResponseMs: this.rmsResponseMs,
        pitchMeterIntervalMs: 22, pitchMeterWindowMs: 16,
        pitchMeterSearchCents: 180
      });
      probe._prepare(this.sampleRate);
      probe._gate = this._gate;
      let resolve, reject;
      const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
      const session = { probe, stableMs, readings: [], promise, resolve, reject, timer: null };
      this._tuningCalibration = session;
      session.timer = setTimeout(() => {
        if (this._tuningCalibration !== session) return;
        const error = new Error('Vakaata A¹-säveltä ei löytynyt. Soita tasaisesti ja yritä uudelleen.');
        error.name = 'TimeoutError';
        this._finishTuning(null, error);
      }, timeoutMs);
      this._emit('tuningstate', { state: 'calibrating', referenceA: this._referenceA });
      return promise;
    }

    cancelTuningCalibration() {
      if (this._tuningCalibration) {
        const error = new Error('A-kalibrointi peruttiin.');
        error.name = 'AbortError';
        this._finishTuning(null, error);
      }
      return this;
    }

    _finishTuning(referenceA, error = null) {
      const session = this._tuningCalibration;
      if (!session) return;
      this._tuningCalibration = null;
      clearTimeout(session.timer);
      if (error) {
        // Keep the last successful tuning; discard stale sound from before the calibration.
        if (this.running) this._resetAnalysisStates();
        this._emit('tuningstate', {
          state: error.name === 'AbortError' ? 'cancelled' : 'failed',
          referenceA: this._referenceA, message: error.message
        });
        session.reject(error);
        return;
      }
      this.setTuningReference(referenceA);
      this._emit('tuningstate', { state: 'completed', referenceA });
      session.resolve(referenceA);
    }

    _processTuning(input) {
      const session = this._tuningCalibration;
      const probe = session.probe;
      for (let i = 0; i < input.length; i++) probe._processSample(input[i]);
      if (probe._samplesSeen - probe._lastPitchSample < probe._pitchEverySamples) return;
      probe._lastPitchSample = probe._samplesSeen;
      const rms = Math.sqrt(Math.max(0, probe._rms2));
      const estimate = rms >= this._gate ? probe._estimateContinuousPitch('A') : null;
      let valid = estimate && estimate.frequency >= 399.9 && estimate.frequency <= 480.1 && estimate.match >= 0.98;
      if (valid) {
        // Reject upper-octave aliases: a true A¹ must differ at half its period.
        const halfLag = Math.round(this.sampleRate / (2 * estimate.frequency));
        valid = 2 * (1 - probe._periodMatch(halfLag)) >= this.minHalfPeriodEnergy;
      }
      if (!valid) {
        session.readings = [];
        this._emit('tuningprogress', {
          progress: 0, frequency: null, spreadCents: null,
          stableMs: 0, requiredStableMs: session.stableMs, status: 'waiting'
        });
        return;
      }
      const reading = { frequency: estimate.frequency, sample: probe._samplesSeen };
      session.readings.push(reading);
      const frequencies = session.readings.map(r => r.frequency);
      const spread = 1200 * Math.log2(Math.max(...frequencies) / Math.min(...frequencies));
      if (spread > 12) session.readings = [reading];
      const elapsed = (reading.sample - session.readings[0].sample) / this.sampleRate * 1000;
      const progress = Math.min(1, elapsed / session.stableMs);
      this._emit('tuningprogress', {
        progress, frequency: estimate.frequency, spreadCents: spread,
        stableMs: elapsed, requiredStableMs: session.stableMs,
        status: spread > 12 ? 'unstable' : 'collecting'
      });
      // A listener may cancel or replace the session synchronously.
      if (this._tuningCalibration !== session || progress < 1) return;
      const sorted = session.readings.map(r => r.frequency).sort((a, b) => a - b);
      const middle = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
      // Allow sub-Hz estimator rounding at the inclusive range endpoints.
      this._finishTuning(clamp(median, 400, 480));
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
      if (!this._voiced || measurement.rms < this._gate) return;
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
      if (this._tuningCalibration) {
        this._processTuning(input);
        return;
      }

      if (this._calibrationSamples < this._calibrationTargetSamples) {
        let e = 0;
        for (let i = 0; i < input.length; i++) e += input[i] * input[i];
        const blockRms = Math.sqrt(e / Math.max(1, input.length));
        this._noiseRms = this._calibrationSamples === 0 ? blockRms : (this._noiseRms * 0.86 + blockRms * 0.14);
        this._calibrationSamples += input.length;
        const progress = Math.min(1, this._calibrationSamples / Math.max(1, this._calibrationTargetSamples));
        this._emit('calibrationprogress', { progress, noiseRms: this._noiseRms });
        if (progress >= 1) {
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
        const resumed = context.state === 'running' ? Promise.resolve() : context.resume();
        // Request permission in the same user gesture; do not wait for resume.
        const captured = global.navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            channelCount: 1
          }
        }).then(stream => {
          if (lifecycleId !== this._lifecycleId) {
            stream.getTracks().forEach(track => track.stop());
            throw this._abortError();
          }
          this.stream = stream;
          return stream;
        });
        const [, stream] = await Promise.all([resumed, captured]);
        if (lifecycleId !== this._lifecycleId) {
          stream.getTracks().forEach(track => track.stop());
          throw this._abortError();
        }
        this.stream = stream;
        this._prepare(this.context.sampleRate);
        this._noiseRms = 0.001;
        this._calibrationSamples = 0;
        this._calibrationTargetSamples = Math.round(this.sampleRate * this.calibrationMs / 1000);
        this._gate = MIN_GATE_RMS;

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
        this.running = true;
        this._starting = false;
        if (this.calibrationMs > 0) this._emit('state', { state: 'calibrating' });
        else {
          this._gate = MIN_GATE_RMS;
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
      this.cancelTuningCalibration();
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

/*
 * Display-only protection against short/decaying changes at a note's end.
 * The original ResonatorEngine is not modified. Durations use audio blocks,
 * so UI scheduling or the display refresh rate cannot lengthen the evidence.
 */
(() => {
  'use strict';

  class ResonatorNoteStability {
    constructor({targets, stableMs=120, changeMs=48, octaveMs=90, quietChangeMs=160, dynamicsCompression=false}={}) {
      this.targets=targets||{};
      this.stableMs=stableMs;
      this.changeMs=changeMs;
      this.octaveMs=octaveMs;
      this.quietChangeMs=quietChangeMs;
      this.dynamicsCompression=Boolean(dynamicsCompression);
      this.reset();
    }

    setDynamicsCompression(enabled) {
      this.dynamicsCompression=Boolean(enabled);
      // Never combine evidence collected under two different settings.
      this.pending=null;
    }

    reset() {
      this.current='';
      this.sameMs=0;
      this.locked=false;
      this.referenceRms=0;
      this.pending=null;
    }

    silence() { this.reset(); }

    reject() {
      // An unrecognized interval is not a fresh sound onset. Keep the anchor,
      // but require a new, continuous run of evidence for another pitch.
      this.pending=null;
      if(!this.locked)this.sameMs=0;
    }

    _commit(id, ms, rms) {
      this.current=id;
      this.sameMs=ms;
      this.locked=ms>=this.stableMs;
      this.referenceRms=rms;
      this.pending=null;
    }

    _envelope(pending) {
      // Compare equal halves of the recent evidence, with audio-time weights.
      const half=pending.windowMs/2;
      let at=0,early=0,late=0;
      for(const frame of pending.frames) {
        const first=Math.max(0,Math.min(frame.ms,half-at));
        early+=frame.rms*first;
        late+=frame.rms*(frame.ms-first);
        at+=frame.ms;
      }
      return {early:early/half,late:late/half};
    }

    accept(detail) {
      const id=detail.action;
      if(detail.accepted!==true || !(id in this.targets))return null;
      const ms=Number.isFinite(detail.blockMs)&&detail.blockMs>0?detail.blockMs:0;
      const rms=Number.isFinite(detail.rms)?Math.max(0,detail.rms):0;

      if(!this.current) {
        this._commit(id,ms,rms);
        return detail; // No added delay at a new sound's onset.
      }
      if(id===this.current) {
        this.sameMs+=ms;
        this.locked=this.locked||this.sameMs>=this.stableMs;
        // A slowly decaying reference remembers the body of a held note.
        this.referenceRms=Math.max(rms,this.referenceRms*Math.exp(-ms/1600));
        this.pending=null;
        return detail;
      }
      if(!this.locked) {
        this._commit(id,ms,rms);
        return detail;
      }
      if(ms<=0)return null;

      if(this.pending?.id!==id)this.pending={id,ms:0,windowMs:0,frames:[]};
      const pending=this.pending;
      pending.ms+=ms;
      pending.windowMs+=ms;
      pending.frames.push({ms,rms});
      // Keep a rolling window so a genuinely quieter legato note can settle.
      while(pending.frames.length>1 && pending.windowMs-pending.frames[0].ms>=this.quietChangeMs) {
        pending.windowMs-=pending.frames.shift().ms;
      }
      const cents=Math.abs(1200*Math.log2(this.targets[id]/this.targets[this.current]));
      const octave=Math.abs(cents-1200)<40;
      // Compress only the relative-level comparison at 4:1 in the dB domain.
      // Actual audio, the engine's RMS, and the decay envelope stay untouched.
      // Disabled uses the exact original comparison (including boundaries).
      const relativeRms=this.referenceRms>0?rms/this.referenceRms:1;
      const quiet=this.dynamicsCompression
        ? Math.pow(Math.max(0,relativeRms),0.25)<0.65
        : rms<this.referenceRms*0.65;
      const required=quiet?this.quietChangeMs:octave?this.octaveMs:this.changeMs;
      if(pending.ms<required)return null;

      const envelope=this._envelope(pending);
      // A continuing decay is weak evidence for a deliberate new pitch.
      // A sustained or rising new note is allowed, including a soft legato.
      if(envelope.late<envelope.early*0.92)return null;
      this._commit(id,pending.ms,rms);
      this.locked=true; // A confirmed legato change remains protected too.
      return detail;
    }
  }

  window.ResonatorNoteStability=ResonatorNoteStability;
})();

/*
 * ResonatorSession — testipenkki 1.3, kahden tiedoston paketti.
 * Ei DOM-riippuvuuksia. UI käyttää getState()-tilannekuvaa ja change-tapahtumaa.
 * API: start(), stop(), calibrateNoise(), calibrateA(), cancelTuningCalibration(), resetTuning(),
 * setNoiseMarginDb(value), setStabilityEnabled(bool),
 * setDynamicsCompression(bool), clearLog().
 * Moottori 0.7.0 ja alkuperäinen vaihtosuoja on yhdistetty tähän tiedostoon
 * muuttamatta niiden tunnistus- tai suojausalgoritmeja.
 */
(function (global) {
  'use strict';
  const NAMES = ['F¹', 'G¹', 'A¹', 'B¹', 'C²', 'D²', 'E²', 'F²'];
  const TARGETS = Object.fromEntries([65, 67, 69, 70, 72, 74, 76, 77].map(
    (midi, i) => [String(i), 440 * 2 ** ((midi - 69) / 12)]));
  const db = rms => Number.isFinite(rms) && rms > 0 ? 20 * Math.log10(rms) : -Infinity;
  const now = () => performance.now();

  class ResonatorSession extends EventTarget {
    constructor() {
      super();
      this.engine = new global.ResonatorStringEngine({
        targets: TARGETS, blockSize: 256, calibrationMs: 1500,
        responseMs: 1.8, toleranceCents: 40, centerMatch: .955, edgeMatch: .998,
        minHalfPeriodEnergy: .32, noiseMarginDb: 8,
        pitchMeterIntervalMs: 22, pitchMeterWindowMs: 16, pitchMeterSearchCents: 140
      });
      this.stability = new global.ResonatorNoteStability({ targets: TARGETS, dynamicsCompression: true });
      this.stabilityEnabled = true;
      this.phase = 'stopped';
      this.ready = this.opening = false;
      this.requestId = this.tuningRequest = 0;
      this.openTimer = null;
      this.analyser = this.analyserSource = this.meterBuffer = null;
      this.noiseRms = this.gate = this.fallbackRms = null;
      this.fallbackAt = -Infinity;
      this.noiseProgress = this.tuningProgress = 0;
      this.status = { code: 'idle' };
      this.tuningStatus = { code: 'closed' };
      this.logs = [];
      this.logRevision = this.targetsRevision = 0;
      this._clearSound();
      this._listen();
    }

    _notify() { this.dispatchEvent(new CustomEvent('change')); }
    _log(code, data = {}) {
      this.logs.unshift({ code, ...data, at: Date.now() });
      this.logs.length = Math.min(this.logs.length, 100);
      ++this.logRevision;
    }
    _clearSound(keepNote = false) {
      this.pitch = this.accepted = this.lastInput = null;
      this.pitchAt = this.acceptedAt = -Infinity;
      this._pitchCandidate = null; this._pitchCandidateAt = -Infinity;
      if (!keepNote) this.displayed = null;
      this.stability.reset();
      this.decisionMs = this.decisionKind = null;
    }
    _detachMeter() {
      if (this.analyserSource && this.analyser) {
        try { this.analyserSource.disconnect(this.analyser); } catch (_) {}
      }
      if (this.analyser) { try { this.analyser.disconnect(); } catch (_) {} }
      this.analyser = this.analyserSource = this.meterBuffer = null;
      this.fallbackRms = null;
      this.fallbackAt = -Infinity;
    }
    _attachMeter() {
      this._detachMeter();
      try {
        // Parallel meter branch; does not change the detector's audio path.
        this.analyser = this.engine.context.createAnalyser();
        this.analyser.fftSize = 256;
        this.meterBuffer = new Float32Array(this.analyser.fftSize);
        this.analyserSource = this.engine.source;
        this.analyserSource.connect(this.analyser);
      } catch (_) {
        this._detachMeter();
        this._log('meter-fallback');
      }
    }
    _receiveLevel(detail) {
      if (Number.isFinite(detail.rms)) {
        this.fallbackRms = detail.rms;
        this.fallbackAt = now();
      }
      if (Number.isFinite(detail.gate)) this.gate = detail.gate;
    }
    _receivePitch(detail) {
      this._receiveLevel(detail);
      const time = now();
      // This confirmation applies only to the displayed Hz value. The detector's
      // input/trigger events and the note-stability filter are not delayed.
      const valid = this.ready && !this.engine.tuningCalibrating &&
        Number.isFinite(detail.frequency) && detail.frequency > 0 &&
        Number.isFinite(detail.match) && detail.match >= 0.9 &&
        Number.isFinite(detail.rms) && this.gate !== null && detail.rms >= this.gate;
      const previous = this._pitchCandidate;
      const confirmed = valid && previous && time - this._pitchCandidateAt <= 100 &&
        Math.abs(1200 * Math.log2(detail.frequency / previous.frequency)) <= 70;
      this._pitchCandidate = valid ? detail : null;
      this._pitchCandidateAt = valid ? time : -Infinity;
      this.pitch = confirmed ? detail : null;
      this.pitchAt = confirmed ? time : -Infinity;
    }
    _readLevel(time) {
      if (this.analyser && this.engine.running) {
        try {
          this.analyser.getFloatTimeDomainData(this.meterBuffer);
          let energy = 0;
          for (const sample of this.meterBuffer) energy += sample * sample;
          return Math.sqrt(energy / this.meterBuffer.length);
        } catch (_) { this._detachMeter(); }
      }
      return this.engine.running && time - this.fallbackAt < 200 ? this.fallbackRms : null;
    }

    // Snapshot exposes measurements in physical units, never DOM elements or pixels.
    getState(time = now()) {
      const engine = this.engine, tuning = engine.tuningCalibrating;
      const level = this._readLevel(time);
      const aboveGate = level !== null && this.gate !== null && level >= this.gate;
      const hasPitch = !!(this.ready && !tuning && aboveGate && this.pitch && time - this.pitchAt < 100);
      const hasAccepted = this.ready && !tuning && this.accepted !== null && time - this.acceptedAt < 200;
      const hasNote = this.ready && !tuning && this.displayed !== null;
      const waiting = hasNote && hasAccepted && this.displayed !== this.accepted;
      const rejected = this.ready && !tuning && !hasAccepted && (hasPitch || aboveGate);
      const targets = Object.entries(engine.nominalTargets).map(([id, nominal]) => ({
        id, name: NAMES[id] || id, nominal, frequency: engine.targets[id]
      }));
      const note = hasNote ? targets.find(target => target.id === this.displayed) || null : null;
      return {
        version: engine.version, phase: this.phase, ready: this.ready,
        opening: this.opening, running: engine.running, tuning,
        status: { ...this.status }, tuningStatus: { ...this.tuningStatus },
        noiseProgress: this.noiseProgress, tuningProgress: this.tuningProgress,
        referenceA: engine.referenceA, referenceCents: 1200 * Math.log2(engine.referenceA / 440),
        noiseMarginDb: engine.noiseMarginDb,
        stabilityEnabled: this.stabilityEnabled, dynamicsCompression: this.stability.dynamicsCompression,
        levelDb: level === null ? null : db(level),
        noiseDb: this.noiseRms === null ? null : db(this.noiseRms),
        gateDb: this.gate === null ? null : db(this.gate), aboveGate: this.ready && aboveGate,
        pitch: hasPitch ? { ...this.pitch, anchorName: NAMES[this.pitch.anchor] || this.pitch.anchor,
          normalizedFrequency: this.pitch.frequency * 440 / engine.referenceA } : null,
        note, accepted: hasAccepted ? { id: this.accepted, name: NAMES[this.accepted] || this.accepted } : null,
        decisionMs: hasAccepted ? this.decisionMs : null,
        decisionKind: hasAccepted ? this.decisionKind : null,
        waiting, rejected, targets, targetsRevision: this.targetsRevision,
        logs: this.logs.slice(), logRevision: this.logRevision
      };
    }

    async start() {
      if (this.opening || this.engine.running) return;
      const request = ++this.requestId;
      this.opening = true; this.ready = false; this.phase = 'requesting-microphone';
      this.noiseRms = this.gate = null;
      this._clearSound(); this.noiseProgress = 0;
      this.status = { code: 'requesting' };
      this.openTimer = setTimeout(() => {
        if (request !== this.requestId) return;
        this.stop();
        this.status = { code: 'open-timeout', error: true };
        this._notify();
      }, 20000);
      this._notify();
      try {
        // Called synchronously from the UI gesture, before the first await.
        await this.engine.start();
        if (request !== this.requestId) return;
        clearTimeout(this.openTimer); this.openTimer = null;
        this.opening = false; this._attachMeter(); this._notify();
      } catch (error) {
        if (request !== this.requestId) return;
        clearTimeout(this.openTimer); this.openTimer = null;
        this.opening = this.ready = false; this.phase = 'stopped';
        this._detachMeter(); this._clearSound();
        this.status = { code: 'mic-error', error: true, name: error.name, message: error.message || String(error) };
        this._log('mic-error', this.status); this._notify();
      }
    }
    stop() {
      ++this.requestId; ++this.tuningRequest;
      clearTimeout(this.openTimer); this.openTimer = null;
      this._detachMeter(); this.engine.stop();
      this.opening = this.ready = false; this.phase = 'stopped';
      this.noiseRms = this.gate = null;
      this._clearSound();
      this.status = { code: 'stopped' };
      this.tuningStatus = { code: 'closed-retained' };
      this._notify();
    }
    setNoiseMarginDb(value) {
      const result = this.engine.setNoiseMarginDb(value);
      this._notify(); return result;
    }
    calibrateNoise() {
      if (!this.ready || this.opening || this.engine.tuningCalibrating) return false;
      return this.engine.calibrateNoise();
    }
    async calibrateA() {
      const request = ++this.tuningRequest;
      this._clearSound(); this.tuningProgress = 0;
      try { await this.engine.calibrateA(); }
      catch (error) {
        if (request !== this.tuningRequest || error.name === 'AbortError') return;
        this.tuningStatus = { code: 'error', message: error.message || String(error) };
      }
      if (request === this.tuningRequest) this._notify();
    }
    cancelTuningCalibration() { this.engine.cancelTuningCalibration(); }
    resetTuning() {
      ++this.tuningRequest; this.engine.resetTuning(); this._clearSound();
      this.tuningStatus = { code: 'reset' }; this._notify();
    }
    setStabilityEnabled(enabled) {
      this.stabilityEnabled = Boolean(enabled);
      this.stability.reset();
      if (this.ready && !this.engine.tuningCalibrating && this.accepted !== null && now() - this.acceptedAt < 200) {
        this.displayed = this.accepted;
        if (this.stabilityEnabled && this.lastInput) this.stability.accept(this.lastInput);
      }
      this._log('stability', { enabled: this.stabilityEnabled }); this._notify();
    }
    setDynamicsCompression(enabled) {
      this.stability.setDynamicsCompression(enabled);
      this._log('dynamics', { enabled: this.stability.dynamicsCompression }); this._notify();
    }
    clearLog() { this.logs.length = 0; ++this.logRevision; this._notify(); }

    _listen() {
      const on = (name, listener) => this.engine.addEventListener(name, event => listener(event.detail));
      on('state', d => {
        this.phase = d.state; this.ready = this.phase === 'running';
        if (Number.isFinite(d.noiseRms)) this.noiseRms = d.noiseRms;
        if (Number.isFinite(d.gate)) this.gate = d.gate;
        if (this.phase === 'running') {
          this.status = { code: 'running' }; this.tuningStatus = { code: 'ready' };
          this._log('running', { gateDb: db(this.gate) });
        } else if (this.phase === 'calibrating') {
          this._clearSound();
          this.noiseRms = this.gate = null; this.noiseProgress = 0;
          this.status = { code: 'noise-start' }; this.tuningStatus = { code: 'noise-wait' };
          this._log('noise-start');
        } else if (this.phase === 'stopped') {
          this.ready = this.opening = false;
          this._detachMeter(); this._clearSound(); this._log('stopped');
        }
        this._notify();
      });
      on('calibrationprogress', d => {
        this.noiseRms = d.noiseRms; this.noiseProgress = d.progress;
        this.status = { code: 'noise-progress', progress: d.progress };
      });
      on('thresholdchange', d => { this.gate = d.gate; this.noiseRms = d.noiseRms; });
      on('tuningstate', d => {
        this._clearSound(); this.tuningStatus = { code: d.state, message: d.message };
        if (d.state === 'calibrating') this._log('tuning-start');
        else if (d.state === 'cancelled') this._log('tuning-cancelled');
        else if (d.state !== 'completed') this._log('tuning-message', { message: d.message });
        this._notify();
      });
      on('tuningprogress', d => {
        this.tuningProgress = d.progress;
        this.tuningStatus = { code: 'progress', frequency: d.frequency, progress: d.progress, status: d.status };
      });
      on('tuningchange', d => {
        this._clearSound(); ++this.targetsRevision;
        this._log('tuning-change', { referenceA: d.referenceA }); this._notify();
      });
      on('targetschange', () => {
        this._clearSound(); this.stability.targets = this.engine.nominalTargets;
        ++this.targetsRevision; this._notify();
      });
      on('pitch', d => this._receivePitch(d));
      on('input', d => {
        this._receiveLevel(d);
        const oldNote = this.displayed, oldAccepted = this.accepted;
        const oldDecision = this.decisionMs, oldKind = this.decisionKind;
        this.lastInput = d;
        if (d.accepted === true) {
          this.accepted = d.action; this.acceptedAt = now();
          this.decisionMs = d.decisionMs; this.decisionKind = d.decisionKind;
        } else { this.accepted = this.decisionMs = this.decisionKind = null; }
        if (this.stabilityEnabled) {
          if (d.accepted === true) {
            const stable = this.stability.accept(d);
            if (stable) this.displayed = stable.action;
          } else this.stability.reject();
        } else if (this.accepted !== null) this.displayed = this.accepted;
        if (this.displayed !== oldNote && this.displayed !== null && this.stabilityEnabled) {
          this._log('display-note', { name: NAMES[this.displayed] || this.displayed });
        }
        // Note decisions do not wait for a UI animation frame.
        if (this.displayed !== oldNote || this.accepted !== oldAccepted || this.decisionMs !== oldDecision || this.decisionKind !== oldKind) this._notify();
      });
      on('trigger', d => this._log('trigger', {
        name: NAMES[d.action] || d.action, decisionMs: d.decisionMs
      }));
      on('silence', d => { this._receiveLevel(d); this._clearSound(true); this._notify(); });
      on('error', d => {
        this.status = { code: 'error', error: true, message: d.message };
        this._log('error', { message: d.message }); this._notify();
      });
    }
  }
  global.ResonatorSession = ResonatorSession;
})(typeof window !== 'undefined' ? window : globalThis);
