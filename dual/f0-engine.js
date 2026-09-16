/*
 * F0 ENGINE 36 · STANDALONE
 * Itsenäinen selaimen F0-/sävelkorkeusmoottori.
 *
 * Ei UI-, OSMD-, instrument-controller- tai audio-engine-riippuvuuksia.
 * Sisältää PROFILE 36:n tunnistusketjun sellaisenaan:
 * mikrofoni -> kalibroitu dB-portti -> YIN -> vakautus -> oktaavisuojat -> valmis F0/sävel.
 */
(function (global) {
  'use strict';

  const DEFAULTS = Object.freeze({
    frameMs: 16,
    calibrationWarmupMs: 250,
    calibrationMeasureMs: 1500,
    calibrationMarginDb: 10,
    minThresholdDb: -70,
    maxThresholdDb: -20,
    yinMinHz: 75,
    yinMaxHz: 1300,
    yinThreshold: 0.13,
    f0HistorySize: 6,
    fftSize: 8192,
    analyserSmoothing: 0.08,
    analyserMinDb: -110,
    analyserMaxDb: -10,

    // INITIAL CONFIRM 1
    // Ensimmäistä säveltä tauon jälkeen ei julkaista yhden YIN-framen perusteella.
    // Sama raakaa F0:aa vastaava MIDI-sävel pitää nähdä useita kertoja peräkkäin.
    // Tämä torjuu erityisesti äänen alun hetkellisen oktaavivirheen (esim. g¹ -> g²).
    initialConfirmEnabled: true,
    initialConfirmFrames: 3,
    // INITIAL LOOK-AHEAD 3 · ADAPTIVE
    // Selvä, vakaa aloitus pääsee nopeasti läpi. Vain oktaaviepäselvä
    // aloitus käyttää pitkää look-aheadia.
    initialFastLookaheadMs: 32,
    // INITIAL LOOK-AHEAD 2
    // Ensimmäisen raakakandidaatin jälkeen odotetaan hetki ennen julkaisua.
    // Tänä aikana YIN saa korjata äänen alun alioktaavin oikeaan oktaaviin.
    initialLookaheadMs: 180,

    // INITIAL OCTAVE RESCUE 1
    // Jos YIN valitsee äänen alussa alioktaavin, tarkistetaan onko puolen
    // jakson kohdalla lähes yhtä hyvä CMND-minimi. Tämä voi nostaa esim.
    // g¹ -> g² jo ennen pitkää look-aheadia.
    initialOctaveRescueEnabled: true,
    initialOctaveRescueMaxCmnd: 0.24,
    initialOctaveRescueMaxRatio: 3.2,
    initialOctaveSuspiciousMaxCmnd: 0.36,
    initialOctaveSuspiciousMaxRatio: 6.0,

    // RELEASE OCTAVE GUARD 1
    // Äänen lopussa YIN voi pudottaa oikean sävelen hetkeksi alioktaaviin
    // (esim. g² -> g¹). Täsmälleen oktaavin alaspudotus ei pääse heti
    // ulostuloon. Jos äänen taso samalla hiipuu, pidetään viimeinen vakaa
    // sävel hiljaisuuteen asti. Tämä ei hidasta muita sävelenvaihtoja.
    releaseOctaveGuardEnabled: true,
    releaseOctaveMinHoldMs: 96,
    releaseOctaveFadeDb: 3.0,
    releaseOctaveNearGateDb: 12,
    releaseOctaveMaxHoldMs: 360,

    // TRANSITION 1
    // Uusi sävel hyväksytään vasta kun legato-siirtymän jälkeen F0 on
    // asettunut uudelleen vakaaksi. Itse YINiin tai 6 arvon mediaaniin
    // ei kosketa.
    transitionGateEnabled: true,
    transitionStartVelocityCents: 22,
    transitionSettleFrames: 4,
    transitionSettleVelocityCents: 10,
    transitionSettleSpreadCents: 18,
    transitionMinMs: 48,
    transitionMaxMs: 320,

    // PROFILE FAST 1
    // null = täsmälleen normaali BASE 2.0 -käyttäytyminen.
    // Profiili saa nopeuttaa vain uuden SALLITUN sävelen hyväksyntää.
    profile: null
  });

  const NOTE_NAMES = ['c','cis','d','dis','e','f','fis','g','gis','a','ais','h'];
  const SUPER = {'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
  const SUB   = {'0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉'};

  function digitsTo(value, table) {
    return String(value).split('').map(ch => table[ch] || ch).join('');
  }

  function clamp(x, min, max) {
    return Math.max(min, Math.min(max, x));
  }

  function median(values) {
    if (!values.length) return null;
    const a = [...values].sort((x, y) => x - y);
    const m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
  }

  function rmsDb(buf) {
    let s = 0;
    for (let i = 0; i < buf.length; i++) {
      const v = buf[i];
      s += v * v;
    }
    const rms = Math.sqrt(s / buf.length) || 1e-12;
    return { rms, db: 20 * Math.log10(rms) };
  }

  function noteFromFrequency(freq) {
    const midi = Math.round(69 + 12 * Math.log2(freq / 440));
    return noteFromMidi(midi, freq);
  }

  function noteFromMidi(midi, freq) {
    const pc = ((midi % 12) + 12) % 12;
    const scientificOctave = Math.floor(midi / 12) - 1;
    const lower = NOTE_NAMES[pc];
    let display;

    // Suomalainen oktaavialamerkintä:
    // C0 = C₂, C1 = C₁, C2 = C, C3 = c, C4 = c¹, C5 = c² ...
    if (scientificOctave >= 4) {
      display = lower + digitsTo(scientificOctave - 3, SUPER);
    } else if (scientificOctave === 3) {
      display = lower;
    } else if (scientificOctave === 2) {
      display = lower.toUpperCase();
    } else {
      display = lower.toUpperCase() + digitsTo(2 - scientificOctave, SUB);
    }

    const targetHz = 440 * Math.pow(2, (midi - 69) / 12);
    const cents = 1200 * Math.log2(freq / targetHz);

    return {
      display,
      name: lower,
      midi,
      scientificOctave,
      targetHz,
      cents
    };
  }

  class F0Engine extends EventTarget {
    constructor(options = {}) {
      super();
      this.config = Object.freeze({ ...DEFAULTS, ...options });

      this.audioContext = null;
      this.stream = null;
      this.analyser = null;
      this.timeData = null;
      this.timer = null;

      this.thresholdDb = this.config.minThresholdDb;
      this.noiseFloorDb = null;
      this.calibrated = false;
      this.running = false;
      this.inputPaused = false;

      this.yinDiffBuffer = null;
      this.yinCmndBuffer = null;
      this.f0History = [];
      this.lastSnapshot = null;
      this._silenceSent = false;

      // TRANSITION 1: ulostulon tilakone.
      this._acceptedF0 = null;
      this._acceptedMidi = null;
      this._previousMedianF0 = null;
      this._transitionActive = false;
      this._transitionStartedAt = 0;
      this._transitionSettleValues = [];

      // INITIAL CONFIRM 1: ensimmäisen sävelen candidate -> confirmed.
      this._initialCandidateMidi = null;
      this._initialCandidateValues = [];
      this._initialStartedAt = 0;
      this._initialLastOctaveJumpAt = 0;
      this._initialNeedsLongLookahead = false;
      this._initialOctaveMeta = null;

      // RELEASE OCTAVE GUARD 1: äänen lopun alioktaavin suodatus.
      this._levelHistory = [];
      this._releaseOctaveStartedAt = 0;
      this._releaseOctaveActive = false;
      this._releaseOctaveBypass = false;

      // Viimeisimmän YIN-haun diagnostiikka alkuoktaavin tarkistusta varten.
      this._lastYinTau = null;
      this._lastYinBetterTau = null;
      this._lastYinCmndScore = null;

      // PROFILE FAST 1: vapaaehtoinen peliprofiili.
      this.profile = this._normalizeProfile(this.config.profile);
      this._profileFastCandidateMidi = null;
      this._profileFastCandidateValues = [];
    }

    _emit(type, detail = {}) {
      this.dispatchEvent(new CustomEvent(type, { detail }));
    }

    _setState(state, extra = {}) {
      this._emit('state', { state, ...extra });
    }

    setProfile(profile = null) {
      this.profile = this._normalizeProfile(profile);
      this._resetProfileFastCandidate();
      this._emit('profilechange', { profile: this.getProfile() });
      return this;
    }

    getProfile() {
      if (!this.profile) return null;
      return {
        ...this.profile,
        allowedMidi: [...this.profile.allowedMidi],
        fastAccept: { ...this.profile.fastAccept }
      };
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

    async recalibrate() {
      if (!this.stream) await this._ensureMicrophone();
      await this.calibrate();
      return this;
    }

    async calibrate() {
      if (!this.analyser || !this.timeData) {
        throw new Error('Mikrofoni ei ole käytössä. Kutsu ensin start().');
      }

      this._stopLoop();
      this.calibrated = false;
      this.inputPaused = false;
      this.f0History = [];
      this.lastSnapshot = null;
      this._resetTransitionGate();
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
        const level = rmsDb(this.timeData);
        if (Number.isFinite(level.db)) samples.push(level.db);

        const elapsed = this.config.calibrationWarmupMs + (performance.now() - measureStart);
        this._emit('calibrationprogress', {
          phase: 'measure',
          progress: clamp(elapsed / totalMs, 0, 1),
          levelDb: level.db
        });
        await this._sleep(33);
      }

      if (!samples.length) {
        this.noiseFloorDb = -80;
        this.thresholdDb = this.config.minThresholdDb;
      } else {
        this.noiseFloorDb = median(samples);
        this.thresholdDb = clamp(
          Math.round(this.noiseFloorDb + this.config.calibrationMarginDb),
          this.config.minThresholdDb,
          this.config.maxThresholdDb
        );
      }

      this.calibrated = true;
      this._emit('calibrated', {
        noiseFloorDb: this.noiseFloorDb,
        thresholdDb: this.thresholdDb
      });
      this._setState('running');
      this._startLoop();
      return {
        noiseFloorDb: this.noiseFloorDb,
        thresholdDb: this.thresholdDb
      };
    }

    pauseInput() {
      this.inputPaused = true;
      this.f0History = [];
      this.lastSnapshot = null;
      this._resetTransitionGate();
      return this;
    }

    async resumeInput() {
      this.inputPaused = false;
      this.f0History = [];
      this.lastSnapshot = null;
      this._silenceSent = false;
      this._resetTransitionGate();
      await this.ensureAudioRunning();
      return this;
    }

    async ensureAudioRunning() {
      if (!this.audioContext || this.audioContext.state === 'closed') return false;
      try {
        if (this.audioContext.state !== 'running') await this.audioContext.resume();
      } catch (_) {}
      return this.audioContext.state === 'running';
    }

    stop() {
      this._stopLoop();
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
      this.calibrated = false;
      this.inputPaused = false;
      this.f0History = [];
      this.lastSnapshot = null;
      this._resetTransitionGate();
      this._setState('stopped');
    }

    getSnapshot() {
      return this.lastSnapshot ? {
        ...this.lastSnapshot,
        buffer: [...this.lastSnapshot.buffer],
        note: { ...this.lastSnapshot.note }
      } : null;
    }

    async _ensureMicrophone() {
      if (this.stream && this.analyser) return;
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Selain ei tue mikrofonikäyttöä.');
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
      this._setState('microphone-ready');
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

    _processFrame() {
      if (!this.analyser || !this.calibrated || this.inputPaused) return;
      if (this.audioContext?.state !== 'running') return;

      this.analyser.getFloatTimeDomainData(this.timeData);
      const level = rmsDb(this.timeData);

      if (level.db <= this.thresholdDb) {
        this.f0History = [];
        this.lastSnapshot = null;
        this._resetTransitionGate();
        if (!this._silenceSent) {
          this._silenceSent = true;
          this._emit('silence', {
            levelDb: level.db,
            thresholdDb: this.thresholdDb
          });
        }
        return;
      }
      this._silenceSent = false;

      this._levelHistory.push(level.db);
      if (this._levelHistory.length > 10) this._levelHistory.shift();

      const rawF0 = this._yin(this.timeData, this.audioContext.sampleRate);
      if (!rawF0) return;

      this.f0History.push(rawF0);
      if (this.f0History.length > this.config.f0HistorySize) this.f0History.shift();

      const stableF0 = median(this.f0History);
      if (!stableF0) return;

      const now = performance.now();
      const detectedNote = noteFromFrequency(stableF0);

      let velocityCents = 0;
      if (this._previousMedianF0) {
        velocityCents = 1200 * Math.log2(stableF0 / this._previousMedianF0);
      }

      // RELEASE OCTAVE GUARD 1:
      // Kun sävel on jo hyväksytty, tarkistetaan ennen transition-porttia
      // onko uusi havainto täsmälleen yksi oktaavi alempana ja samalla
      // äänen loppuun viittaava. Tällöin pidetään nykyinen hyväksytty sävel
      // eikä väärä alioktaavi pääse edes transition-/profile-fast -ketjuun.
      if (this._acceptedF0 !== null &&
          this._shouldGuardReleaseOctave(rawF0, stableF0, level.db, now)) {
        this._transitionActive = false;
        this._transitionStartedAt = 0;
        this._transitionSettleValues = [];
        this._resetProfileFastCandidate();
        this._previousMedianF0 = stableF0;

        const outputF0 = this._acceptedF0;
        const note = noteFromMidi(this._acceptedMidi, outputF0);
        const snapshot = {
          rawF0,
          f0: stableF0,
          outputF0,
          buffer: [...this.f0History],
          levelDb: level.db,
          noiseFloorDb: this.noiseFloorDb,
          thresholdDb: this.thresholdDb,
          note,
          detectedNote,
          transitionActive: false,
          transitionVelocityCents: velocityCents,
          transitionElapsedMs: 0,
          initialOctaveMeta: this._initialOctaveMeta,
          releaseOctaveGuardActive: true,
          profileName: this.profile?.name ?? null,
          profileFastCandidateMidi: this._profileFastCandidateMidi,
          profileFastCandidateFrames: this._profileFastCandidateValues.length,
          timestamp: now
        };

        this.lastSnapshot = snapshot;
        this._emit('pitch', snapshot);
        return;
      }

      if (this._acceptedF0 === null) {
        // INITIAL CONFIRM 1:
        // Tauon jälkeinen ensimmäinen sävel kulkee candidate -> confirmed -vaiheen
        // kautta. Raakaa YIN-F0:aa käytetään, jotta yksittäinen äänen alun
        // alioktaavi ei ehdi näkyä ulostulossa eikä 6 arvon mediaani hidasta
        // oikean oktaavin vahvistumista.
        if (this.config.initialConfirmEnabled) {
          const octaveMeta = this._refineInitialOctave(rawF0);
          const confirmed = this._tryInitialConfirm(octaveMeta.f0, now, octaveMeta);
          if (!confirmed) {
            this._previousMedianF0 = stableF0;
            return;
          }
        } else {
          this._acceptedF0 = stableF0;
          this._acceptedMidi = detectedNote.midi;
        }
      } else if (this.config.transitionGateEnabled) {
        if (!this._transitionActive) {
          // Siirtymä alkaa, jos F0 liikkuu nopeasti TAI mediaanin lähin
          // sävel on jo eri kuin viimeksi hyväksytty sävel.
          const fastMotion =
            Math.abs(velocityCents) >= this.config.transitionStartVelocityCents;
          const crossedNoteBoundary = detectedNote.midi !== this._acceptedMidi;

          // PROFILE FAST 1 voi avata siirtymän jo raakaa YIN-F0:aa käyttäen,
          // mutta vain jos arvo osuu lähelle profiilissa sallittua UUTTA säveltä.
          const profileCue = this._profileRawCue(rawF0);

          if (fastMotion || crossedNoteBoundary || profileCue) {
            this._transitionActive = true;
            this._transitionStartedAt = now;
            this._transitionSettleValues = [];
          } else {
            // Vakaa tila: ulostulo saa seurata pientä normaalia intonaatio-
            // liikettä, mutta sävelen MIDI-identiteetti pysyy hyväksyttynä.
            this._acceptedF0 = stableF0;
          }
        }

        if (this._transitionActive) {
          // Ensin kokeillaan profiilin nopeaa VIP-kaistaa. Kaksi (oletus)
          // peräkkäistä raakaa F0-framea samassa sallitussa sävelessä riittää.
          // Jos ehto ei täyty, alkuperäinen TRANSITION 1 jatkaa normaalisti.
          this._tryProfileFastAccept(rawF0, now);
        }

        if (this._transitionActive) {
          const slowEnough =
            Math.abs(velocityCents) <= this.config.transitionSettleVelocityCents;

          if (slowEnough) {
            this._transitionSettleValues.push(stableF0);
            if (this._transitionSettleValues.length > this.config.transitionSettleFrames) {
              this._transitionSettleValues.shift();
            }
          } else {
            this._transitionSettleValues = [];
          }

          const elapsed = now - this._transitionStartedAt;
          let settled = false;
          let settledF0 = null;

          if (this._transitionSettleValues.length >= this.config.transitionSettleFrames) {
            const values = this._transitionSettleValues;
            const minF = Math.min(...values);
            const maxF = Math.max(...values);
            const spreadCents = 1200 * Math.log2(maxF / minF);

            if (spreadCents <= this.config.transitionSettleSpreadCents &&
                elapsed >= this.config.transitionMinMs) {
              settledF0 = median(values);
              settled = true;
            }
          }

          // Turvaraja estää porttia jäämästä päälle esimerkiksi hyvin
          // hitaassa glissandossa. Tällöin hyväksytään senhetkinen mediaani.
          if (!settled && elapsed >= this.config.transitionMaxMs) {
            settledF0 = stableF0;
            settled = true;
          }

          if (settled) {
            this._acceptedF0 = settledF0;
            this._acceptedMidi = noteFromFrequency(settledF0).midi;
            this._transitionActive = false;
            this._transitionStartedAt = 0;
            this._transitionSettleValues = [];
          }
        }
      } else {
        this._acceptedF0 = stableF0;
        this._acceptedMidi = detectedNote.midi;
      }

      this._previousMedianF0 = stableF0;

      const outputF0 = this._acceptedF0 ?? stableF0;
      const note = noteFromMidi(
        this._acceptedMidi ?? detectedNote.midi,
        outputF0
      );

      const snapshot = {
        rawF0,
        f0: stableF0,
        outputF0,
        buffer: [...this.f0History],
        levelDb: level.db,
        noiseFloorDb: this.noiseFloorDb,
        thresholdDb: this.thresholdDb,
        note,
        detectedNote,
        transitionActive: this._transitionActive,
        transitionVelocityCents: velocityCents,
        transitionElapsedMs: this._transitionActive ? now - this._transitionStartedAt : 0,
        initialOctaveMeta: this._initialOctaveMeta,
        releaseOctaveGuardActive: this._releaseOctaveActive,
        profileName: this.profile?.name ?? null,
        profileFastCandidateMidi: this._profileFastCandidateMidi,
        profileFastCandidateFrames: this._profileFastCandidateValues.length,
        timestamp: now
      };

      this.lastSnapshot = snapshot;
      this._emit('pitch', snapshot);
    }

    _resetTransitionGate() {
      this._acceptedF0 = null;
      this._acceptedMidi = null;
      this._previousMedianF0 = null;
      this._transitionActive = false;
      this._transitionStartedAt = 0;
      this._transitionSettleValues = [];
      this._levelHistory = [];
      this._releaseOctaveStartedAt = 0;
      this._releaseOctaveActive = false;
      this._releaseOctaveBypass = false;
      this._resetInitialCandidate();
      this._resetProfileFastCandidate();
    }

    _shouldGuardReleaseOctave(rawF0, stableF0, levelDb, now) {
      if (!this.config.releaseOctaveGuardEnabled ||
          !Number.isFinite(rawF0) ||
          !Number.isFinite(stableF0) ||
          !Number.isFinite(levelDb) ||
          this._acceptedMidi === null) {
        this._releaseOctaveStartedAt = 0;
        this._releaseOctaveActive = false;
        return false;
      }

      const rawMidi = noteFromFrequency(rawF0).midi;
      const stableMidi = noteFromFrequency(stableF0).midi;
      const octaveDown = rawMidi === this._acceptedMidi - 12 ||
                         stableMidi === this._acceptedMidi - 12;

      if (!octaveDown) {
        this._releaseOctaveStartedAt = 0;
        this._releaseOctaveActive = false;
        this._releaseOctaveBypass = false;
        return false;
      }

      // Kun oktaavialaspudotus on osoittautunut aidoksi ja vahvaksi
      // sävelenvaihdoksi, se päästetään tämän saman kandidaatin ajan läpi.
      // Bypass poistuu heti kun havainto lakkaa olemasta täsmälleen oktaavi alempana.
      if (this._releaseOctaveBypass) {
        this._releaseOctaveActive = false;
        return false;
      }

      if (!this._releaseOctaveStartedAt) this._releaseOctaveStartedAt = now;

      const minHoldMs = clamp(
        Number.isFinite(this.config.releaseOctaveMinHoldMs)
          ? Math.round(this.config.releaseOctaveMinHoldMs) : 96,
        0, 500
      );
      const maxHoldMs = clamp(
        Number.isFinite(this.config.releaseOctaveMaxHoldMs)
          ? Math.round(this.config.releaseOctaveMaxHoldMs) : 360,
        minHoldMs, 1000
      );
      const fadeDb = clamp(
        Number.isFinite(this.config.releaseOctaveFadeDb)
          ? this.config.releaseOctaveFadeDb : 3.0,
        0.5, 20
      );
      const nearGateDb = clamp(
        Number.isFinite(this.config.releaseOctaveNearGateDb)
          ? this.config.releaseOctaveNearGateDb : 12,
        1, 30
      );

      const elapsed = now - this._releaseOctaveStartedAt;
      const previousLevels = this._levelHistory.slice(0, -1);
      const recentPeak = previousLevels.length ? Math.max(...previousLevels) : levelDb;
      const dropDb = recentPeak - levelDb;
      const fading = dropDb >= fadeDb;
      const nearGate = levelDb <= this.thresholdDb + nearGateDb;

      // Ensimmäiset millisekunnit suojataan aina, jotta kahden framen
      // alioktaavi ei pääse PROFILE FAST -kaistaa pitkin ulos. Sen jälkeen
      // suoja jatkuu vain jos ääni aidosti hiipuu / on lähellä kohinaporttia.
      const guard = elapsed < minHoldMs ||
        ((fading || nearGate) && elapsed < maxHoldMs);

      this._releaseOctaveActive = guard;
      this._emit('releaseoctaveguard', {
        active: guard,
        fromMidi: this._acceptedMidi,
        rawMidi,
        stableMidi,
        levelDb,
        thresholdDb: this.thresholdDb,
        dropDb,
        fading,
        nearGate,
        elapsedMs: elapsed,
        timestamp: now
      });

      if (!guard) {
        // Sävel pysyi tarpeeksi pitkään vahvana / vakaana tai ylitti
        // turvarajan: käsitellään sitä tästä eteenpäin aitona oktaavisiirtymänä.
        this._releaseOctaveBypass = true;
      }
      return guard;
    }

    _resetInitialCandidate() {
      this._initialCandidateMidi = null;
      this._initialCandidateValues = [];
      this._initialStartedAt = 0;
      this._initialLastOctaveJumpAt = 0;
      this._initialNeedsLongLookahead = false;
      this._initialOctaveMeta = null;
    }

    _refineInitialOctave(rawF0) {
      const result = {
        f0: rawF0,
        corrected: false,
        suspicious: false,
        rawF0,
        rawMidi: Number.isFinite(rawF0) ? noteFromFrequency(rawF0).midi : null,
        refinedMidi: null,
        fullCmnd: null,
        halfCmnd: null,
        halfTau: null
      };

      if (!this.config.initialOctaveRescueEnabled || !Number.isFinite(rawF0)) {
        result.refinedMidi = result.rawMidi;
        return result;
      }

      const cmnd = this.yinCmndBuffer;
      const tau = this._lastYinTau;
      const sampleRate = this.audioContext?.sampleRate;
      if (!cmnd || !Number.isFinite(tau) || !Number.isFinite(sampleRate)) {
        result.refinedMidi = result.rawMidi;
        return result;
      }

      const center = tau / 2;
      const lo = Math.max(2, Math.floor(center) - 3);
      const hi = Math.min(cmnd.length - 2, Math.ceil(center) + 3);
      if (hi <= lo) {
        result.refinedMidi = result.rawMidi;
        return result;
      }

      let halfTau = lo;
      let halfScore = cmnd[lo];
      for (let t = lo + 1; t <= hi; t++) {
        if (cmnd[t] < halfScore) {
          halfScore = cmnd[t];
          halfTau = t;
        }
      }

      const fullScore = Number.isFinite(this._lastYinCmndScore)
        ? this._lastYinCmndScore
        : cmnd[Math.max(1, Math.min(cmnd.length - 1, Math.round(tau)))];
      result.fullCmnd = fullScore;
      result.halfCmnd = halfScore;
      result.halfTau = halfTau;

      if (!Number.isFinite(fullScore) || !Number.isFinite(halfScore) || fullScore <= 0) {
        result.refinedMidi = result.rawMidi;
        return result;
      }

      const rescueMax = Number.isFinite(this.config.initialOctaveRescueMaxCmnd)
        ? this.config.initialOctaveRescueMaxCmnd : 0.24;
      const rescueRatio = Number.isFinite(this.config.initialOctaveRescueMaxRatio)
        ? this.config.initialOctaveRescueMaxRatio : 3.2;
      const suspiciousMax = Number.isFinite(this.config.initialOctaveSuspiciousMaxCmnd)
        ? this.config.initialOctaveSuspiciousMaxCmnd : 0.36;
      const suspiciousRatio = Number.isFinite(this.config.initialOctaveSuspiciousMaxRatio)
        ? this.config.initialOctaveSuspiciousMaxRatio : 6.0;

      const halfRatio = halfScore / Math.max(fullScore, 1e-9);
      result.suspicious = halfScore <= suspiciousMax && halfRatio <= suspiciousRatio;

      if (halfScore <= rescueMax && halfRatio <= rescueRatio) {
        const x0 = Math.max(1, halfTau - 1);
        const x2 = Math.min(cmnd.length - 1, halfTau + 1);
        const s0 = cmnd[x0];
        const s1 = cmnd[halfTau];
        const s2 = cmnd[x2];
        const den = 2 * s1 - s2 - s0;
        const betterHalf = den ? halfTau + (s2 - s0) / (2 * den) : halfTau;
        const refinedF0 = sampleRate / betterHalf;

        if (refinedF0 >= this.config.yinMinHz && refinedF0 <= this.config.yinMaxHz) {
          const refinedNote = noteFromFrequency(refinedF0);
          if (result.rawMidi !== null && refinedNote.midi === result.rawMidi + 12) {
            result.f0 = refinedF0;
            result.corrected = true;
            result.suspicious = false;
            result.refinedMidi = refinedNote.midi;
            return result;
          }
        }
      }

      result.refinedMidi = result.rawMidi;
      return result;
    }

    _tryInitialConfirm(rawF0, now, octaveMeta = null) {
      if (!Number.isFinite(rawF0)) {
        this._resetInitialCandidate();
        return false;
      }

      const requiredFrames = clamp(
        Number.isFinite(this.config.initialConfirmFrames)
          ? Math.round(this.config.initialConfirmFrames)
          : 4,
        2,
        12
      );
      const longLookaheadMs = clamp(
        Number.isFinite(this.config.initialLookaheadMs)
          ? Math.round(this.config.initialLookaheadMs)
          : 180,
        0,
        500
      );
      const fastLookaheadMs = clamp(
        Number.isFinite(this.config.initialFastLookaheadMs)
          ? Math.round(this.config.initialFastLookaheadMs)
          : 32,
        0,
        longLookaheadMs
      );
      const rawNote = noteFromFrequency(rawF0);

      if (!this._initialStartedAt) this._initialStartedAt = now;

      if (this._initialCandidateMidi !== rawNote.midi) {
        // Jos YIN ensin arvaa esimerkiksi g¹:n ja vaihtaa sitten g²:een,
        // kandidaatti korvautuu eikä kumpaakaan julkaista look-ahead-ikkunan aikana.
        // Täsmällinen oktaavihyppy kirjataan myös diagnostiikkaa varten.
        if (this._initialCandidateMidi !== null &&
            Math.abs(rawNote.midi - this._initialCandidateMidi) === 12) {
          this._initialLastOctaveJumpAt = now;
        }
        this._initialCandidateMidi = rawNote.midi;
        this._initialCandidateValues = [rawF0];
        this._initialNeedsLongLookahead = !!(octaveMeta?.suspicious && !octaveMeta?.corrected);
        this._initialOctaveMeta = octaveMeta || null;
      } else {
        this._initialCandidateValues.push(rawF0);
        if (octaveMeta?.suspicious && !octaveMeta?.corrected) {
          this._initialNeedsLongLookahead = true;
        }
        if (octaveMeta) this._initialOctaveMeta = octaveMeta;
        if (this._initialCandidateValues.length > requiredFrames) {
          this._initialCandidateValues.shift();
        }
      }

      const elapsedMs = now - this._initialStartedAt;
      const lookaheadMs = this._initialNeedsLongLookahead ? longLookaheadMs : fastLookaheadMs;
      this._emit('initialcandidate', {
        midi: this._initialCandidateMidi,
        frames: this._initialCandidateValues.length,
        requiredFrames,
        lookaheadMs,
        fastLookaheadMs,
        longLookaheadMs,
        octaveCorrected: !!octaveMeta?.corrected,
        octaveSuspicious: !!octaveMeta?.suspicious,
        octaveMeta: octaveMeta || null,
        elapsedMs,
        rawF0,
        cents: rawNote.cents,
        octaveJumpAt: this._initialLastOctaveJumpAt || null,
        timestamp: now
      });

      // PROFILE 35: selvä aloitus käyttää vain lyhyttä 32 ms look-aheadia.
      // Jos YINin puolen jakson kohdalla näkyy oktaaviepäselvyyttä, pidetään
      // PROFILE 34:n 180 ms suoja. Jos alioktaavi voidaan varmistetusti
      // korjata heti, hyväksyntä palaa nopealle kaistalle.
      if (elapsedMs < lookaheadMs) return false;
      if (this._initialCandidateValues.length < requiredFrames) return false;

      const acceptedF0 = median(this._initialCandidateValues);
      const acceptedNote = noteFromFrequency(acceptedF0);
      if (acceptedNote.midi !== this._initialCandidateMidi) {
        this._resetInitialCandidate();
        return false;
      }

      this._acceptedF0 = acceptedF0;
      this._acceptedMidi = acceptedNote.midi;

      this._emit('initialaccept', {
        midi: acceptedNote.midi,
        outputF0: acceptedF0,
        frames: requiredFrames,
        timestamp: now
      });

      this._resetInitialCandidate();
      return true;
    }

    _normalizeProfile(profile) {
      if (!profile || typeof profile !== 'object') return null;

      const allowedMidi = [...new Set(
        (Array.isArray(profile.allowedMidi) ? profile.allowedMidi : [])
          .filter(Number.isFinite)
          .map(v => Math.round(v))
      )];

      const fast = profile.fastAccept || {};
      const frames = clamp(
        Number.isFinite(fast.frames) ? Math.round(fast.frames) : 2,
        2,
        8
      );
      const toleranceCents = clamp(
        Number.isFinite(fast.toleranceCents) ? fast.toleranceCents : 30,
        1,
        100
      );

      return {
        name: String(profile.name || 'Profiili'),
        minHz: Number.isFinite(profile.minHz) ? profile.minHz : null,
        maxHz: Number.isFinite(profile.maxHz) ? profile.maxHz : null,
        allowedMidi,
        fastAccept: {
          enabled: fast.enabled !== false && allowedMidi.length > 0,
          frames,
          toleranceCents
        }
      };
    }

    _resetProfileFastCandidate() {
      this._profileFastCandidateMidi = null;
      this._profileFastCandidateValues = [];
    }

    _profileRawCue(rawF0) {
      const p = this.profile;
      if (!p?.fastAccept?.enabled || !Number.isFinite(rawF0)) return false;
      if (p.minHz !== null && rawF0 < p.minHz) return false;
      if (p.maxHz !== null && rawF0 > p.maxHz) return false;

      const n = noteFromFrequency(rawF0);
      return n.midi !== this._acceptedMidi &&
        p.allowedMidi.includes(n.midi) &&
        Math.abs(n.cents) <= p.fastAccept.toleranceCents;
    }

    _tryProfileFastAccept(rawF0, now) {
      const p = this.profile;
      if (!p?.fastAccept?.enabled || !this._profileRawCue(rawF0)) {
        this._resetProfileFastCandidate();
        return false;
      }

      const rawNote = noteFromFrequency(rawF0);
      if (this._profileFastCandidateMidi !== rawNote.midi) {
        this._profileFastCandidateMidi = rawNote.midi;
        this._profileFastCandidateValues = [rawF0];
      } else {
        this._profileFastCandidateValues.push(rawF0);
        if (this._profileFastCandidateValues.length > p.fastAccept.frames) {
          this._profileFastCandidateValues.shift();
        }
      }

      this._emit('profilecandidate', {
        profileName: p.name,
        midi: this._profileFastCandidateMidi,
        frames: this._profileFastCandidateValues.length,
        requiredFrames: p.fastAccept.frames,
        rawF0,
        cents: rawNote.cents,
        timestamp: now
      });

      if (this._profileFastCandidateValues.length < p.fastAccept.frames) return false;

      const acceptedF0 = median(this._profileFastCandidateValues);
      const acceptedNote = noteFromFrequency(acceptedF0);
      if (acceptedNote.midi !== this._profileFastCandidateMidi ||
          Math.abs(acceptedNote.cents) > p.fastAccept.toleranceCents) {
        this._resetProfileFastCandidate();
        return false;
      }

      const fromMidi = this._acceptedMidi;
      this._acceptedF0 = acceptedF0;
      this._acceptedMidi = acceptedNote.midi;
      this._transitionActive = false;
      this._transitionStartedAt = 0;
      this._transitionSettleValues = [];

      this._emit('profilefastaccept', {
        profileName: p.name,
        fromMidi,
        toMidi: acceptedNote.midi,
        outputF0: acceptedF0,
        frames: p.fastAccept.frames,
        toleranceCents: p.fastAccept.toleranceCents,
        timestamp: now
      });

      this._resetProfileFastCandidate();
      return true;
    }

    _yin(buf, sampleRate) {
      const n = Math.min(buf.length, 4096);
      const minTau = Math.max(2, Math.floor(sampleRate / this.config.yinMaxHz));
      const maxTau = Math.min(
        Math.floor(sampleRate / this.config.yinMinHz),
        Math.floor(n / 2)
      );
      const needed = maxTau + 1;

      if (!this.yinDiffBuffer || this.yinDiffBuffer.length < needed) {
        this.yinDiffBuffer = new Float32Array(needed);
        this.yinCmndBuffer = new Float32Array(needed);
      }

      const d = this.yinDiffBuffer;
      const cmnd = this.yinCmndBuffer;

      for (let tau = 1; tau <= maxTau; tau++) {
        let sum = 0;
        for (let i = 0; i < n - tau; i++) {
          const x = buf[i] - buf[i + tau];
          sum += x * x;
        }
        d[tau] = sum;
      }

      cmnd[0] = 1;
      let run = 0;
      for (let tau = 1; tau <= maxTau; tau++) {
        run += d[tau];
        cmnd[tau] = d[tau] * tau / (run || 1);
      }

      let tau = -1;
      for (let t = minTau; t <= maxTau; t++) {
        if (cmnd[t] < this.config.yinThreshold) {
          while (t + 1 <= maxTau && cmnd[t + 1] < cmnd[t]) t++;
          tau = t;
          break;
        }
      }
      if (tau < 0) return null;

      const x0 = Math.max(minTau, tau - 1);
      const x2 = Math.min(maxTau, tau + 1);
      const s0 = cmnd[x0];
      const s1 = cmnd[tau];
      const s2 = cmnd[x2];
      const den = 2 * s1 - s2 - s0;
      const better = den ? tau + (s2 - s0) / (2 * den) : tau;
      const f = sampleRate / better;

      this._lastYinTau = tau;
      this._lastYinBetterTau = better;
      this._lastYinCmndScore = s1;

      return (f >= this.config.yinMinHz && f <= this.config.yinMaxHz) ? f : null;
    }

    _sleep(ms) {
      return new Promise(resolve => global.setTimeout(resolve, ms));
    }
  }

  F0Engine.DEFAULTS = DEFAULTS;
  F0Engine.noteFromFrequency = noteFromFrequency;
  F0Engine.median = median;

  global.F0Engine = F0Engine;
})(window);
