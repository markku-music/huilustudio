(function (global) {
  'use strict';

  // Kevyt runtime-adapteri PlaneEnginelle.
  // PlaneEngine itse pysyy muuttamattomana. Adapteri hoitaa vain
  // mikrofonin, kalibroinnin, analyysiloopin, 3 puhalluksen referenssiopetuksen
  // ja HYVÄKSYTTY/HYLÄTTY-eventin.
  // 1.1: Plane voidaan opettaa joko yhdelle tai kahdelle erilliselle sävelelle.

  function clamp(x, min, max) { return Math.max(min, Math.min(max, x)); }
  function mean(values) {
    const a = values.filter(Number.isFinite);
    return a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
  }

  class PlaneEngineAdapter extends EventTarget {
    constructor(options = {}) {
      super();
      this.config = {
        frameMs: 16,
        calibrationWarmupMs: 250,
        calibrationMeasureMs: 1500,
        calibrationMarginDb: 10,
        minThresholdDb: -70,
        maxThresholdDb: -20,
        fftSize: 8192,
        analyserSmoothing: 0.08,
        analyserMinDb: -110,
        analyserMaxDb: -10,
        trainingBlows: 3,
        trainingMinFramesPerBlow: 4,
        decisionStartGuardMs: 96,
        decisionConfirmFrames: 3,
        ...options
      };
      this.audioContext = null;
      this.stream = null;
      this.analyser = null;
      this.timeData = null;
      this.freqData = null;
      this.timer = null;
      this.running = false;
      this.calibrated = false;
      this.noiseFloorDb = null;
      this.thresholdDb = this.config.minThresholdDb;
      this.profile = null;
      this._silenceSent = false;

      // Yhteensopivuus: trainedControlRef viittaa aina A-referenssiin.
      // Varsinaiset referenssit ovat trainedControlRefs.A ja .B.
      this.trainingMode = Number(options.trainingMode) === 2 ? 2 : 1;
      this.trainedControlRefs = { A: null, B: null };
      this.trainedControlRef = null;
      this.training = false;
      this._trainingReference = 'A';
      this._trainingBlows = [];
      this._trainingCurrentFrames = [];
      this._trainingInSound = false;

      // Jokainen uusi puhallus alkaa neutraalista tilasta. Tämä estää edellisen
      // puhalluksen päätöksen vilahtamisen uuden äänen alussa.
      this._decisionInSound = false;
      this._decisionSoundStartedAt = 0;
      this._decisionCandidate = null;
      this._decisionCandidateFrames = 0;
    }

    _emit(type, detail = {}) {
      this.dispatchEvent(new CustomEvent(type, { detail }));
    }
    _setState(state, extra = {}) {
      this._emit('state', { state, ...extra });
    }
    _sleep(ms) {
      return new Promise(resolve => global.setTimeout(resolve, ms));
    }

    setProfile(profile = null) {
      // Yhteinen testipenkki-API. PlaneEngine ei käytä F0 Enginen allowedMidi-profiilia.
      this.profile = profile;
      this._emit('profilechange', { profile });
      return this;
    }

    _normalizeTrainingMode(mode) {
      const n = Number(mode);
      if (n === 1 || mode === 'one' || mode === 'one-note') return 1;
      if (n === 2 || mode === 'two' || mode === 'two-note') return 2;
      throw new Error('Plane-opetustilan pitää olla 1 tai 2 säveltä.');
    }

    _normalizeReference(reference = 'A') {
      const ref = String(reference || 'A').trim().toUpperCase();
      if (ref !== 'A' && ref !== 'B') throw new Error('Plane-referenssin pitää olla A tai B.');
      if (this.trainingMode === 1 && ref === 'B') {
        throw new Error('B-referenssi on käytettävissä vain kahden sävelen tilassa.');
      }
      return ref;
    }

    setTrainingMode(mode) {
      const next = this._normalizeTrainingMode(mode);
      if (next === this.trainingMode) return this;
      this.training = false;
      this._trainingBlows = [];
      this._trainingCurrentFrames = [];
      this._trainingInSound = false;
      this._trainingReference = 'A';
      this.trainingMode = next;
      this.trainedControlRefs = { A: null, B: null };
      this.trainedControlRef = null;
      this._resetDecisionGate();
      this._emit('trainingmodechange', { mode: next, requiredReferences: next });
      this._emit('trainingcleared', { mode: next, reference: null });
      return this;
    }

    getTrainingMode() {
      return this.trainingMode;
    }

    _cloneReference(ref) {
      if (!ref) return null;
      return { f0: ref.f0, fingerprint: [...ref.fingerprint] };
    }

    getTrainingReference(reference = 'A') {
      const ref = this._normalizeReference(reference);
      return this._cloneReference(this.trainedControlRefs[ref]);
    }

    getTrainingReferences() {
      return {
        mode: this.trainingMode,
        A: this._cloneReference(this.trainedControlRefs.A),
        B: this.trainingMode === 2 ? this._cloneReference(this.trainedControlRefs.B) : null,
        complete: this.trainingMode === 1
          ? !!this.trainedControlRefs.A
          : !!this.trainedControlRefs.A && !!this.trainedControlRefs.B
      };
    }

    clearTrainingReference(reference = null) {
      this.training = false;
      this._trainingBlows = [];
      this._trainingCurrentFrames = [];
      this._trainingInSound = false;

      if (reference === null || reference === undefined) {
        this.trainedControlRefs = { A: null, B: null };
        this.trainedControlRef = null;
        this._emit('trainingcleared', { mode: this.trainingMode, reference: null });
        return this;
      }

      const ref = this._normalizeReference(reference);
      this.trainedControlRefs[ref] = null;
      if (ref === 'A') this.trainedControlRef = null;
      this._emit('trainingcleared', { mode: this.trainingMode, reference: ref });
      return this;
    }

    startReferenceTraining(reference = 'A') {
      if (!this.running || !this.calibrated) {
        throw new Error('Avaa mikrofoni ensin.');
      }
      const ref = this._normalizeReference(reference);
      this.training = true;
      this._trainingReference = ref;
      this._trainingBlows = [];
      this._trainingCurrentFrames = [];
      this._trainingInSound = false;
      // Uudelleenopetus tyhjentää vain opetettavan referenssin.
      this.trainedControlRefs[ref] = null;
      if (ref === 'A') this.trainedControlRef = null;
      this._emit('trainingstart', {
        mode: this.trainingMode,
        reference: ref,
        referenceIndex: ref === 'A' ? 1 : 2,
        totalReferences: this.trainingMode,
        targetBlows: this.config.trainingBlows,
        completedBlows: 0,
        nextBlow: 1
      });
      return this;
    }

    async start() {
      try {
        await this._ensureMicrophone();
        await this.calibrate();
        return this;
      } catch (error) {
        this._emit('error', { error });
        throw error;
      }
    }

    async _ensureMicrophone() {
      if (this.stream && this.analyser) return;
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Selain ei tue mikrofonikäyttöä.');
      }
      if (!global.PlaneEngine?.yin ||
          !global.PlaneEngine?.rmsDb ||
          !global.PlaneEngine?.harmonicH1H8 ||
          !global.PlaneEngine?.averageFingerprint ||
          !global.PlaneEngine?.h2h8FromH1H8 ||
          !global.PlaneEngine?.analyzeHarmonicControl ||
          !global.PlaneEngine?.isAcceptedOpenHeadjoint) {
        throw new Error('PlaneEngine ei ole latautunut kokonaan.');
      }

      this._setState('requesting-microphone');
      const AudioCtx = global.AudioContext || global.webkitAudioContext;
      this.audioContext = new AudioCtx();
      if (this.audioContext.state !== 'running') await this.audioContext.resume();

      const supported = navigator.mediaDevices.getSupportedConstraints
        ? navigator.mediaDevices.getSupportedConstraints()
        : {};
      const constraints = {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      };
      if (supported.voiceIsolation) constraints.voiceIsolation = false;

      this.stream = await navigator.mediaDevices.getUserMedia({ audio: constraints, video: false });
      const source = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.config.fftSize;
      this.analyser.smoothingTimeConstant = this.config.analyserSmoothing;
      this.analyser.minDecibels = this.config.analyserMinDb;
      this.analyser.maxDecibels = this.config.analyserMaxDb;
      source.connect(this.analyser);
      this.timeData = new Float32Array(this.analyser.fftSize);
      this.freqData = new Float32Array(this.analyser.frequencyBinCount);
      this._setState('microphone-ready');
    }

    async calibrate() {
      if (!this.analyser || !this.timeData) {
        throw new Error('Mikrofoni ei ole käytössä. Kutsu ensin start().');
      }
      this._stopLoop();
      this.calibrated = false;
      this._setState('calibrating');

      const totalMs = this.config.calibrationWarmupMs + this.config.calibrationMeasureMs;
      const overallStart = performance.now();
      while (performance.now() - overallStart < this.config.calibrationWarmupMs) {
        this.analyser.getFloatTimeDomainData(this.timeData);
        const elapsed = performance.now() - overallStart;
        this._emit('calibrationprogress', {
          phase: 'warmup',
          progress: clamp(elapsed / totalMs, 0, 1)
        });
        await this._sleep(33);
      }

      const samples = [];
      const measureStart = performance.now();
      while (performance.now() - measureStart < this.config.calibrationMeasureMs) {
        this.analyser.getFloatTimeDomainData(this.timeData);
        const level = global.PlaneEngine.rmsDb(this.timeData);
        if (Number.isFinite(level.db)) samples.push(level.db);
        const elapsed = this.config.calibrationWarmupMs + (performance.now() - measureStart);
        this._emit('calibrationprogress', {
          phase: 'measure',
          progress: clamp(elapsed / totalMs, 0, 1),
          levelDb: level.db
        });
        await this._sleep(33);
      }

      if (samples.length) {
        const sorted = [...samples].sort((a,b) => a-b);
        const m = Math.floor(sorted.length / 2);
        this.noiseFloorDb = sorted.length % 2 ? sorted[m] : (sorted[m-1] + sorted[m]) / 2;
        this.thresholdDb = clamp(
          Math.round(this.noiseFloorDb + this.config.calibrationMarginDb),
          this.config.minThresholdDb,
          this.config.maxThresholdDb
        );
      } else {
        this.noiseFloorDb = -80;
        this.thresholdDb = this.config.minThresholdDb;
      }

      this.calibrated = true;
      this._emit('calibrated', {
        noiseFloorDb: this.noiseFloorDb,
        thresholdDb: this.thresholdDb
      });
      this._setState('running');
      this._startLoop();
    }

    _startLoop() {
      this._stopLoop();
      this.running = true;
      this.timer = global.setInterval(() => this._processFrame(), this.config.frameMs);
    }
    _stopLoop() {
      if (this.timer) {
        global.clearInterval(this.timer);
        this.timer = null;
      }
      this.running = false;
    }

    _resetDecisionGate() {
      this._decisionCandidate = null;
      this._decisionCandidateFrames = 0;
    }

    _finishTrainingBlow() {
      const frames = this._trainingCurrentFrames;
      this._trainingCurrentFrames = [];
      this._trainingInSound = false;

      if (frames.length < this.config.trainingMinFramesPerBlow) {
        this._emit('trainingretry', {
          mode: this.trainingMode,
          reference: this._trainingReference,
          referenceIndex: this._trainingReference === 'A' ? 1 : 2,
          completedBlows: this._trainingBlows.length,
          targetBlows: this.config.trainingBlows,
          reason: 'too-short'
        });
        return;
      }

      const f0 = mean(frames.map(x => x.f0));
      const fp8 = global.PlaneEngine.averageFingerprint(
        frames.map(x => x.fp8).filter(Boolean),
        8
      );
      if (!Number.isFinite(f0) || !fp8) {
        this._emit('trainingretry', {
          mode: this.trainingMode,
          reference: this._trainingReference,
          referenceIndex: this._trainingReference === 'A' ? 1 : 2,
          completedBlows: this._trainingBlows.length,
          targetBlows: this.config.trainingBlows,
          reason: 'invalid'
        });
        return;
      }

      this._trainingBlows.push({ f0, fp8 });
      const completed = this._trainingBlows.length;
      this._emit('trainingprogress', {
        mode: this.trainingMode,
        reference: this._trainingReference,
        referenceIndex: this._trainingReference === 'A' ? 1 : 2,
        totalReferences: this.trainingMode,
        completedBlows: completed,
        targetBlows: this.config.trainingBlows,
        nextBlow: Math.min(completed + 1, this.config.trainingBlows),
        blowF0: f0
      });

      if (completed < this.config.trainingBlows) return;

      // Kolmen erillisen puhalluksen yhteinen referenssi.
      // F0 = kolmen puhalluksen aritmeettinen keskiarvo.
      // Spektrisormenjälki = kolmen puhalluksen H1-H8-keskiarvo, josta PlaneEngine
      // muodostaa H2-H8-referenssin.
      const referenceF0 = mean(this._trainingBlows.map(x => x.f0));
      const referenceFp8 = global.PlaneEngine.averageFingerprint(
        this._trainingBlows.map(x => x.fp8),
        8
      );
      const fingerprint = global.PlaneEngine.h2h8FromH1H8(referenceFp8);

      if (!Number.isFinite(referenceF0) || !fingerprint) {
        this.training = false;
        this._emit('trainingerror', { reason: 'reference-failed' });
        return;
      }

      const refKey = this._trainingReference;
      this.trainedControlRefs[refKey] = { f0: referenceF0, fingerprint };
      if (refKey === 'A') this.trainedControlRef = this.trainedControlRefs.A;
      this.training = false;

      const references = this.getTrainingReferences();
      const detail = {
        mode: this.trainingMode,
        reference: refKey,
        referenceIndex: refKey === 'A' ? 1 : 2,
        totalReferences: this.trainingMode,
        trainedReference: this.getTrainingReference(refKey),
        references,
        complete: references.complete,
        nextReference: this.trainingMode === 2 && refKey === 'A' && !references.B ? 'B' : null,
        blows: this._trainingBlows.map(x => ({ f0: x.f0 }))
      };
      this._emit('referencetrained', detail);
      if (references.complete) this._emit('trained', detail);
    }

    _processFrame() {
      if (!this.analyser || !this.calibrated || this.audioContext?.state !== 'running') return;
      this.analyser.getFloatTimeDomainData(this.timeData);
      const level = global.PlaneEngine.rmsDb(this.timeData);

      if (level.db <= this.thresholdDb) {
        if (this.training && this._trainingInSound) this._finishTrainingBlow();
        this._decisionInSound = false;
        this._decisionSoundStartedAt = 0;
        this._resetDecisionGate();
        if (!this._silenceSent) {
          this._silenceSent = true;
          this._emit('silence', { levelDb: level.db, thresholdDb: this.thresholdDb });
        }
        return;
      }
      this._silenceSent = false;

      const now = performance.now();
      if (!this._decisionInSound) {
        this._decisionInSound = true;
        this._decisionSoundStartedAt = now;
        this._resetDecisionGate();
        if (!this.training) {
          this._emit('soundstart', { levelDb: level.db, thresholdDb: this.thresholdDb, timestamp: now });
        }
      }

      this.analyser.getFloatFrequencyData(this.freqData);
      const f0 = global.PlaneEngine.yin(this.timeData, this.audioContext.sampleRate);

      if (this.training) {
        this._trainingInSound = true;
        if (!Number.isFinite(f0)) return;
        const fp8 = global.PlaneEngine.harmonicH1H8(
          f0,
          this.audioContext.sampleRate,
          this.freqData
        );
        if (!fp8) return;
        this._trainingCurrentFrames.push({ f0, fp8 });
        this._emit('trainingframe', {
          mode: this.trainingMode,
          reference: this._trainingReference,
          referenceIndex: this._trainingReference === 'A' ? 1 : 2,
          blow: this._trainingBlows.length + 1,
          targetBlows: this.config.trainingBlows,
          frames: this._trainingCurrentFrames.length,
          levelDb: level.db
        });
        return;
      }

      const refs = this.getTrainingReferences();
      if (!refs.complete) {
        this._emit('decision', {
          ready: false,
          accepted: null,
          mode: this.trainingMode,
          missingReferences: this.trainingMode === 1
            ? (!refs.A ? ['A'] : [])
            : ['A', 'B'].filter(key => !refs[key]),
          levelDb: level.db,
          timestamp: performance.now()
        });
        return;
      }

      const analysis = global.PlaneEngine.analyzeHarmonicControl(
        this.audioContext.sampleRate,
        this.freqData
      );

      let matchedReference = null;
      if (analysis) {
        const candidates = ['A'];
        if (this.trainingMode === 2) candidates.push('B');
        const matches = candidates.filter(key =>
          global.PlaneEngine.isAcceptedOpenHeadjoint(analysis, this.trainedControlRefs[key])
        );
        if (matches.length === 1) {
          matchedReference = matches[0];
        } else if (matches.length > 1) {
          // Jos toleranssialueet osuvat päällekkäin, valitaan Hz-etäisyydeltään
          // lähin opetettu referenssi. Näin A/B ei vaihtele satunnaisesti.
          matchedReference = matches.sort((a, b) => {
            const da = Math.abs(1200 * Math.log2(analysis.hz / this.trainedControlRefs[a].f0));
            const db = Math.abs(1200 * Math.log2(analysis.hz / this.trainedControlRefs[b].f0));
            return da - db;
          })[0];
        }
      }
      const accepted = !!matchedReference;
      const candidateKey = accepted ? `accepted:${matchedReference}` : 'rejected';

      // Uuden puhalluksen alku suojataan lyhyesti, jotta analyserin/YINin
      // edellisen äänen jäännös ei ehdi näkyä uutena päätöksenä. Sen jälkeen
      // sama A/B/hylätty-päätös vaaditaan muutaman framen ajan ennen julkaisua.
      const startGuardMs = clamp(Number(this.config.decisionStartGuardMs) || 0, 0, 500);
      const confirmFrames = clamp(Math.round(Number(this.config.decisionConfirmFrames) || 1), 1, 12);
      const elapsed = now - this._decisionSoundStartedAt;

      if (elapsed < startGuardMs) {
        this._resetDecisionGate();
        this._emit('decision', {
          ready: true,
          accepted: null,
          analyzing: true,
          mode: this.trainingMode,
          reference: null,
          analysis,
          levelDb: level.db,
          elapsedMs: elapsed,
          timestamp: now
        });
        return;
      }

      if (this._decisionCandidate !== candidateKey) {
        this._decisionCandidate = candidateKey;
        this._decisionCandidateFrames = 1;
      } else {
        this._decisionCandidateFrames++;
      }

      if (this._decisionCandidateFrames < confirmFrames) {
        this._emit('decision', {
          ready: true,
          accepted: null,
          analyzing: true,
          mode: this.trainingMode,
          reference: matchedReference,
          analysis,
          levelDb: level.db,
          confirmFrames: this._decisionCandidateFrames,
          requiredFrames: confirmFrames,
          timestamp: now
        });
        return;
      }

      this._emit('decision', {
        ready: true,
        accepted,
        analyzing: false,
        mode: this.trainingMode,
        reference: accepted ? matchedReference : null,
        referenceIndex: matchedReference === 'A' ? 1 : matchedReference === 'B' ? 2 : null,
        referenceF0: matchedReference ? this.trainedControlRefs[matchedReference].f0 : null,
        analysis,
        levelDb: level.db,
        confirmFrames: this._decisionCandidateFrames,
        requiredFrames: confirmFrames,
        timestamp: now
      });
    }

    stop() {
      this._stopLoop();
      this.training = false;
      this._trainingCurrentFrames = [];
      this._trainingInSound = false;
      this._decisionInSound = false;
      this._decisionSoundStartedAt = 0;
      this._resetDecisionGate();
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
      if (this.audioContext) {
        try { this.audioContext.close(); } catch (_) {}
        this.audioContext = null;
      }
      this.analyser = null;
      this.timeData = null;
      this.freqData = null;
      this.calibrated = false;
      this._setState('stopped');
    }
  }

  global.PlaneEngineAdapter = PlaneEngineAdapter;
})(window);
