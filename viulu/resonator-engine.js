/*
 * ResonatorStringEngine 0.2
 * Jatkuva, ennalta määritellyille sävelille tarkoitettu periodiresonaattori.
 *
 * Idea:
 * - Ei etsi yleistä F0:aa.
 * - Jokaiselle kohdesävelelle verrataan jatkuvasti nykyistä aaltomuotoa
 *   saman signaalin yhden perusjakson takaiseen versioon.
 * - Oikealla sävelellä koko jaksollinen aaltomuoto (myös yläsävelet)
 *   toistuu lähes samanlaisena.
 * - Puolijakson vertailu toimii oktaavisuojana: se estää ylemmän oktaavin
 *   kelpaamisen vahingossa alemman sävelen periodiksi.
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
      this.version = '0.2';
      this.targets = { ...(options.targets || DEFAULT_TARGETS) };
      this.blockSize = Math.max(256, Math.round(options.blockSize || 256));
      this.calibrationMs = Number.isFinite(+options.calibrationMs) ? Math.max(0, +options.calibrationMs) : 280;
      this.responseMs = Number.isFinite(+options.responseMs) ? clamp(+options.responseMs, 0.8, 8) : 1.8;
      this.rmsResponseMs = Number.isFinite(+options.rmsResponseMs) ? clamp(+options.rmsResponseMs, 0.5, 10) : 2.0;
      this.centerMatch = Number.isFinite(+options.centerMatch) ? clamp(+options.centerMatch, 0.5, 0.9999) : 0.955;
      this.edgeMatch = Number.isFinite(+options.edgeMatch) ? clamp(+options.edgeMatch, 0.5, 0.9999) : 0.995;
      this.toleranceCents = Number.isFinite(+options.toleranceCents) ? clamp(+options.toleranceCents, 10, 80) : 40;
      this.minHalfPeriodEnergy = Number.isFinite(+options.minHalfPeriodEnergy) ? Math.max(0, +options.minHalfPeriodEnergy) : 0.32;
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
        this._noiseRms = this._calibrationSamples === 0 ? blockRms : (this._noiseRms * 0.86 + blockRms * 0.14);
        this._calibrationSamples += input.length;
        const progress = Math.min(1, this._calibrationSamples / Math.max(1, this._calibrationTargetSamples));
        this._emit('calibrationprogress', { progress, noiseRms: this._noiseRms });
        if (progress >= 1) {
          this._gate = Math.max(0.0022, this._noiseRms * 3.2);
          this._resetAnalysisStates();
          this._emit('state', { state: 'running' });
        }
        return;
      }

      for (let i = 0; i < input.length; i++) this._processSample(input[i]);

      const m = this._measure();
      const blockMs = input.length / this.sampleRate * 1000;

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
