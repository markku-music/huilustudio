(function (global) {
  'use strict';

  // Kevyt runtime-adapteri PlaneEnginelle.
  // PlaneEngine itse pysyy muuttamattomana. Adapteri hoitaa vain
  // mikrofonin, kalibroinnin, analyysiloopin, 3 puhalluksen referenssiopetuksen
  // ja HYVÄKSYTTY/HYLÄTTY-eventin.

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

      this.trainedControlRef = null;
      this.training = false;
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

    getTrainingReference() {
      if (!this.trainedControlRef) return null;
      return {
        f0: this.trainedControlRef.f0,
        fingerprint: [...this.trainedControlRef.fingerprint]
      };
    }

    clearTrainingReference() {
      this.training = false;
      this._trainingBlows = [];
      this._trainingCurrentFrames = [];
      this._trainingInSound = false;
      this.trainedControlRef = null;
      this._emit('trainingcleared');
      return this;
    }

    startReferenceTraining() {
      if (!this.running || !this.calibrated) {
        throw new Error('Avaa mikrofoni ensin.');
      }
      this.training = true;
      this._trainingBlows = [];
      this._trainingCurrentFrames = [];
      this._trainingInSound = false;
      this.trainedControlRef = null;
      this._emit('trainingstart', {
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
          completedBlows: this._trainingBlows.length,
          targetBlows: this.config.trainingBlows,
          reason: 'invalid'
        });
        return;
      }

      this._trainingBlows.push({ f0, fp8 });
      const completed = this._trainingBlows.length;
      this._emit('trainingprogress', {
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

      this.trainedControlRef = { f0: referenceF0, fingerprint };
      this.training = false;
      this._emit('trained', {
        reference: this.getTrainingReference(),
        blows: this._trainingBlows.map(x => ({ f0: x.f0 }))
      });
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
          blow: this._trainingBlows.length + 1,
          targetBlows: this.config.trainingBlows,
          frames: this._trainingCurrentFrames.length,
          levelDb: level.db
        });
        return;
      }

      if (!this.trainedControlRef) {
        this._emit('decision', {
          ready: false,
          accepted: null,
          levelDb: level.db,
          timestamp: performance.now()
        });
        return;
      }

      const analysis = global.PlaneEngine.analyzeHarmonicControl(
        this.audioContext.sampleRate,
        this.freqData
      );
      const accepted = !!analysis && global.PlaneEngine.isAcceptedOpenHeadjoint(
        analysis,
        this.trainedControlRef
      );

      // Uuden puhalluksen alku suojataan lyhyesti, jotta analyserin/YINin
      // edellisen äänen jäännös ei ehdi näkyä uutena päätöksenä. Sen jälkeen
      // sama päätös vaaditaan muutaman framen ajan ennen julkaisua.
      const startGuardMs = clamp(Number(this.config.decisionStartGuardMs) || 0, 0, 500);
      const confirmFrames = clamp(Math.round(Number(this.config.decisionConfirmFrames) || 1), 1, 12);
      const elapsed = now - this._decisionSoundStartedAt;

      if (elapsed < startGuardMs) {
        this._resetDecisionGate();
        this._emit('decision', {
          ready: true,
          accepted: null,
          analyzing: true,
          analysis,
          levelDb: level.db,
          elapsedMs: elapsed,
          timestamp: now
        });
        return;
      }

      if (this._decisionCandidate !== accepted) {
        this._decisionCandidate = accepted;
        this._decisionCandidateFrames = 1;
      } else {
        this._decisionCandidateFrames++;
      }

      if (this._decisionCandidateFrames < confirmFrames) {
        this._emit('decision', {
          ready: true,
          accepted: null,
          analyzing: true,
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
