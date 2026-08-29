/*
PitchEngine 1.0.0
Irrotettu Hertsimittari_LED_Pysty_B -version toimivasta tunnistuslogiikasta.

Ei DOM-riippuvuuksia.
Ei nuottinimiä.
Ei viritysmittaria.
Ei käyttöliittymää.

Selainkäyttö:
  <script src="pitch-engine.js"></script>

Moduulikäyttö:
  import { PitchEngine } from "./pitch-engine.module.js";
*/
(function (global) {
  "use strict";

  const VERSION = "1.0.0";

  const DEFAULTS = Object.freeze({
    minHz: 45,
    maxHz: 3000,
    rmsGate: 0.008,
    yinThreshold: 0.12,

    acquireWindow: 5,
    acquireRequired: 4,
    acquireToleranceHz: 2,

    lockToleranceHz: 4,
    displaySize: 5,

    switchWindow: 5,
    switchRequired: 4,
    switchToleranceHz: 2,

    silenceReleaseMs: 260,

    fftSize: 4096,
    analyserSmoothing: 0,

    // Sama visuaalisen tason normalisointi kuin alkuperäisessä:
    // levelPercent = clamp((rms / 0.12) * 100)
    levelReferenceRms: 0.12
  });

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function rmsOf(buffer) {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      const v = buffer[i];
      sum += v * v;
    }
    return Math.sqrt(sum / buffer.length);
  }

  function median(values) {
    if (!values.length) return null;
    const a = [...values].sort((x, y) => x - y);
    const mid = Math.floor(a.length / 2);
    return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
  }

  function bestCluster(values, tolerance) {
    let best = [];

    for (const candidate of values) {
      const cluster = values.filter(v =>
        Math.abs(v - candidate) <= tolerance
      );

      if (cluster.length > best.length) {
        best = cluster;
      }
    }

    return best;
  }

  function detectPitchYIN(buffer, sampleRate, config = DEFAULTS) {
    const minHz = config.minHz ?? DEFAULTS.minHz;
    const maxHz = config.maxHz ?? DEFAULTS.maxHz;
    const yinThreshold = config.yinThreshold ?? DEFAULTS.yinThreshold;

    const n = buffer.length;
    const tauMin = Math.max(2, Math.floor(sampleRate / maxHz));
    const tauMax = Math.min(Math.floor(sampleRate / minHz), Math.floor(n / 2));

    if (tauMax <= tauMin) return null;

    const yin = new Float32Array(tauMax + 1);

    for (let tau = 1; tau <= tauMax; tau++) {
      let sum = 0;
      const limit = n - tau;

      for (let i = 0; i < limit; i++) {
        const d = buffer[i] - buffer[i + tau];
        sum += d * d;
      }

      yin[tau] = sum;
    }

    yin[0] = 1;
    let runningSum = 0;

    for (let tau = 1; tau <= tauMax; tau++) {
      runningSum += yin[tau];
      yin[tau] = runningSum === 0 ? 1 : (yin[tau] * tau) / runningSum;
    }

    let tauEstimate = -1;

    for (let tau = tauMin; tau <= tauMax; tau++) {
      if (yin[tau] < yinThreshold) {
        while (tau + 1 <= tauMax && yin[tau + 1] < yin[tau]) tau++;
        tauEstimate = tau;
        break;
      }
    }

    if (tauEstimate < 0) {
      let bestTau = tauMin;
      let bestValue = yin[tauMin];

      for (let tau = tauMin + 1; tau <= tauMax; tau++) {
        if (yin[tau] < bestValue) {
          bestValue = yin[tau];
          bestTau = tau;
        }
      }

      if (bestValue > 0.22) return null;
      tauEstimate = bestTau;
    }

    let betterTau = tauEstimate;

    if (tauEstimate > 1 && tauEstimate < tauMax) {
      const s0 = yin[tauEstimate - 1];
      const s1 = yin[tauEstimate];
      const s2 = yin[tauEstimate + 1];
      const denom = 2 * (2 * s1 - s2 - s0);

      if (Math.abs(denom) > 1e-12) {
        betterTau += (s2 - s0) / denom;
      }
    }

    const hz = sampleRate / betterTau;

    return (
      Number.isFinite(hz) &&
      hz >= minHz &&
      hz <= maxHz
    ) ? hz : null;
  }

  class PitchLockTracker {
    constructor(config = {}) {
      this.config = Object.freeze({ ...DEFAULTS, ...config });

      this.acquireBuffer = [];
      this.displayBuffer = [];
      this.switchBuffer = [];

      this.locked = false;
      this.lockHz = null;
      this.lastStableHz = null;
    }

    reset({ keepStable = false } = {}) {
      this.locked = false;
      this.lockHz = null;

      this.acquireBuffer.length = 0;
      this.displayBuffer.length = 0;
      this.switchBuffer.length = 0;

      if (!keepStable) {
        this.lastStableHz = null;
      }

      return {
        type: "reset",
        locked: false,
        lockHz: null,
        stableHz: this.lastStableHz
      };
    }

    clearCandidates() {
      this.acquireBuffer.length = 0;
      this.switchBuffer.length = 0;
    }

    _setLock(newHz, relocked = false) {
      this.lockHz = newHz;
      this.locked = true;

      this.acquireBuffer.length = 0;
      this.displayBuffer.length = 0;
      this.switchBuffer.length = 0;

      this.displayBuffer.push(newHz);
      this.lastStableHz = newHz;

      return {
        type: relocked ? "relocked" : "locked",
        locked: true,
        lockHz: newHz,
        stableHz: newHz
      };
    }

    process(integerHz) {
      const c = this.config;

      if (!this.locked) {
        this.acquireBuffer.push(integerHz);

        if (this.acquireBuffer.length > c.acquireWindow) {
          this.acquireBuffer.shift();
        }

        if (this.acquireBuffer.length < c.acquireWindow) {
          return {
            type: "acquiring",
            locked: false,
            progress: this.acquireBuffer.length,
            requiredWindow: c.acquireWindow,
            integerHz
          };
        }

        const cluster = bestCluster(
          this.acquireBuffer,
          c.acquireToleranceHz
        );

        if (cluster.length >= c.acquireRequired) {
          return this._setLock(Math.round(median(cluster)), false);
        }

        return {
          type: "acquiring",
          locked: false,
          progress: this.acquireBuffer.length,
          requiredWindow: c.acquireWindow,
          integerHz
        };
      }

      // Sama logiikka kuin alkuperäisessä:
      // jos havainto kuuluu nykyiseen lukitukseen, vakauta mediaanilla.
      if (Math.abs(integerHz - this.lockHz) <= c.lockToleranceHz) {
        this.switchBuffer.length = 0;

        this.displayBuffer.push(integerHz);
        if (this.displayBuffer.length > c.displaySize) {
          this.displayBuffer.shift();
        }

        const stable = Math.round(median(this.displayBuffer));
        this.lastStableHz = stable;

        return {
          type: "pitch",
          locked: true,
          lockHz: this.lockHz,
          stableHz: stable,
          integerHz
        };
      }

      // Selvästi eri taajuus:
      // älä muuta nykyistä vakaata lukemaa vielä.
      this.switchBuffer.push(integerHz);

      if (this.switchBuffer.length > c.switchWindow) {
        this.switchBuffer.shift();
      }

      if (this.switchBuffer.length < c.switchWindow) {
        return {
          type: "switching",
          locked: true,
          lockHz: this.lockHz,
          stableHz: this.lastStableHz,
          progress: this.switchBuffer.length,
          requiredWindow: c.switchWindow,
          integerHz
        };
      }

      const cluster = bestCluster(
        this.switchBuffer,
        c.switchToleranceHz
      );

      if (cluster.length >= c.switchRequired) {
        const newHz = Math.round(median(cluster));

        // Sama alkuperäinen ehto: lähes samaan paikkaan ei uudelleenlukita.
        if (Math.abs(newHz - this.lockHz) > c.lockToleranceHz) {
          return this._setLock(newHz, true);
        }

        this.switchBuffer.length = 0;
      }

      return {
        type: "switching",
        locked: true,
        lockHz: this.lockHz,
        stableHz: this.lastStableHz,
        progress: this.switchBuffer.length,
        requiredWindow: c.switchWindow,
        integerHz
      };
    }
  }

  class PitchEngine {
    constructor(options = {}) {
      const {
        onPitch = null,
        onRawPitch = null,
        onLevel = null,
        onState = null,
        onLock = null,
        onError = null,
        ...configOverrides
      } = options;

      this.config = Object.freeze({ ...DEFAULTS, ...configOverrides });
      this.tracker = new PitchLockTracker(this.config);

      this.audioContext = null;
      this.analyser = null;
      this.stream = null;
      this.source = null;
      this.rafId = 0;
      this.running = false;
      this.lastSoundTime = 0;
      this.lastRawHz = null;

      this.listeners = new Map();

      if (onPitch) this.on("pitch", onPitch);
      if (onRawPitch) this.on("rawPitch", onRawPitch);
      if (onLevel) this.on("level", onLevel);
      if (onState) this.on("state", onState);
      if (onLock) this.on("lock", onLock);
      if (onError) this.on("error", onError);

      this._tick = this._tick.bind(this);
    }

    static get VERSION() {
      return VERSION;
    }

    static get DEFAULTS() {
      return DEFAULTS;
    }

    on(eventName, handler) {
      if (typeof handler !== "function") {
        throw new TypeError("PitchEngine.on: handlerin pitää olla funktio.");
      }

      if (!this.listeners.has(eventName)) {
        this.listeners.set(eventName, new Set());
      }

      this.listeners.get(eventName).add(handler);

      return () => this.off(eventName, handler);
    }

    off(eventName, handler) {
      const set = this.listeners.get(eventName);
      if (!set) return;
      set.delete(handler);
      if (!set.size) this.listeners.delete(eventName);
    }

    _emit(eventName, payload = {}) {
      const event = {
        engine: this,
        timestamp: performance.now(),
        ...payload
      };

      const set = this.listeners.get(eventName);
      if (!set) return;

      for (const handler of [...set]) {
        try {
          handler(event);
        } catch (err) {
          console.error(`PitchEngine ${eventName} -listener error:`, err);
        }
      }
    }

    _emitState(state, extra = {}) {
      this._emit("state", {
        state,
        running: this.running,
        locked: this.tracker.locked,
        lockHz: this.tracker.lockHz,
        stableHz: this.tracker.lastStableHz,
        ...extra
      });
    }

    getState() {
      return {
        version: VERSION,
        running: this.running,
        locked: this.tracker.locked,
        lockHz: this.tracker.lockHz,
        stableHz: this.tracker.lastStableHz,
        rawHz: this.lastRawHz,
        sampleRate: this.audioContext?.sampleRate ?? null,
        config: this.config
      };
    }

    reset({ keepStable = false } = {}) {
      const previousLockHz = this.tracker.lockHz;
      const event = this.tracker.reset({ keepStable });

      if (previousLockHz !== null) {
        this._emit("lock", {
          action: "unlocked",
          locked: false,
          previousLockHz,
          lockHz: null,
          stableHz: this.tracker.lastStableHz
        });
      }

      this._emitState(this.running ? "listening" : "stopped", {
        reason: "manual-reset",
        keepStable
      });

      return event;
    }

    async start() {
      if (this.running) {
        return this.getState();
      }

      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== "function"
      ) {
        const err = new Error(
          "Mikrofonia ei voi avata: navigator.mediaDevices.getUserMedia ei ole käytettävissä."
        );
        this._emit("error", { error: err });
        throw err;
      }

      const AudioContextClass =
        global.AudioContext ||
        global.webkitAudioContext;

      if (!AudioContextClass) {
        const err = new Error("AudioContext ei ole käytettävissä tässä selaimessa.");
        this._emit("error", { error: err });
        throw err;
      }

      this._emitState("starting");

      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          },
          video: false
        });

        this.audioContext = new AudioContextClass();
        await this.audioContext.resume();

        this.source = this.audioContext.createMediaStreamSource(this.stream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = this.config.fftSize;
        this.analyser.smoothingTimeConstant = this.config.analyserSmoothing;

        this.source.connect(this.analyser);

        this.running = true;
        this.tracker.reset({ keepStable: false });
        this.lastRawHz = null;
        this.lastSoundTime = performance.now();

        this._emitState("listening");

        this.rafId = requestAnimationFrame(this._tick);

        return this.getState();
      } catch (error) {
        await this._cleanupAudio();

        this.running = false;
        this.tracker.reset({ keepStable: false });
        this.lastRawHz = null;

        this._emit("error", { error });
        this._emitState("error", { error });

        throw error;
      }
    }

    async stop() {
      if (!this.running && !this.audioContext && !this.stream) {
        this.tracker.reset({ keepStable: false });
        this.lastRawHz = null;
        this._emitState("stopped");
        return this.getState();
      }

      this.running = false;

      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = 0;
      }

      await this._cleanupAudio();

      const previousLockHz = this.tracker.lockHz;
      this.tracker.reset({ keepStable: false });
      this.lastRawHz = null;

      if (previousLockHz !== null) {
        this._emit("lock", {
          action: "unlocked",
          locked: false,
          previousLockHz,
          lockHz: null,
          stableHz: null,
          reason: "stop"
        });
      }

      this._emitState("stopped");

      return this.getState();
    }

    async destroy() {
      return this.stop();
    }

    async _cleanupAudio() {
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }

      if (this.audioContext) {
        try {
          await this.audioContext.close();
        } catch (_) {
          // Ei kaadeta moottoria sulkemisvirheeseen.
        }
        this.audioContext = null;
      }

      this.analyser = null;
      this.source = null;
    }

    _handleTrackerResult(result, rawHz, integerHz) {
      switch (result.type) {
        case "acquiring":
          this._emitState("acquiring", {
            progress: result.progress,
            requiredWindow: result.requiredWindow,
            rawHz,
            integerHz
          });
          break;

        case "locked":
        case "relocked": {
          const action = result.type === "locked" ? "locked" : "relocked";

          this._emit("lock", {
            action,
            locked: true,
            lockHz: result.lockHz,
            stableHz: result.stableHz,
            rawHz,
            integerHz
          });

          this._emit("pitch", {
            hz: result.stableHz,
            stableHz: result.stableHz,
            rawHz,
            integerHz,
            locked: true,
            lockHz: result.lockHz
          });

          this._emitState("locked", {
            action,
            rawHz,
            integerHz
          });
          break;
        }

        case "pitch":
          this._emit("pitch", {
            hz: result.stableHz,
            stableHz: result.stableHz,
            rawHz,
            integerHz,
            locked: true,
            lockHz: result.lockHz
          });

          this._emitState("locked", {
            rawHz,
            integerHz
          });
          break;

        case "switching":
          this._emitState("switching", {
            progress: result.progress,
            requiredWindow: result.requiredWindow,
            rawHz,
            integerHz
          });
          break;
      }
    }

    _tick() {
      if (!this.running || !this.analyser || !this.audioContext) return;

      const buffer = new Float32Array(this.analyser.fftSize);
      this.analyser.getFloatTimeDomainData(buffer);

      const now = performance.now();
      const rms = rmsOf(buffer);

      const levelPercent = clamp(
        (rms / this.config.levelReferenceRms) * 100,
        0,
        100
      );

      this._emit("level", {
        rms,
        level: levelPercent / 100,
        levelPercent
      });

      if (rms >= this.config.rmsGate) {
        this.lastSoundTime = now;
      }

      if (rms < this.config.rmsGate) {
        if (
          this.tracker.locked &&
          now - this.lastSoundTime > this.config.silenceReleaseMs
        ) {
          const previousLockHz = this.tracker.lockHz;

          // Sama käyttäytyminen kuin alkuperäisessä:
          // lukitus puretaan, mutta viimeinen vakaa hertsi voidaan pitää käyttöliittymässä.
          this.tracker.reset({ keepStable: true });

          this._emit("lock", {
            action: "unlocked",
            locked: false,
            previousLockHz,
            lockHz: null,
            stableHz: this.tracker.lastStableHz,
            reason: "silence"
          });

          this._emitState("listening", {
            reason: "silence-release"
          });
        } else if (!this.tracker.locked) {
          this.tracker.clearCandidates();
          this._emitState("listening");
        }

        this.rafId = requestAnimationFrame(this._tick);
        return;
      }

      const rawHz = detectPitchYIN(
        buffer,
        this.audioContext.sampleRate,
        this.config
      );

      if (rawHz !== null) {
        this.lastRawHz = rawHz;
        const integerHz = Math.round(rawHz);

        this._emit("rawPitch", {
          rawHz,
          integerHz
        });

        const result = this.tracker.process(integerHz);
        this._handleTrackerResult(result, rawHz, integerHz);
      }

      this.rafId = requestAnimationFrame(this._tick);
    }
  }

  const PitchEngineUtils = Object.freeze({
    VERSION,
    DEFAULTS,
    clamp,
    rmsOf,
    median,
    bestCluster,
    detectPitchYIN
  });

  global.PitchEngine = PitchEngine;
  global.PitchLockTracker = PitchLockTracker;
  global.PitchEngineUtils = PitchEngineUtils;

})(typeof globalThis !== "undefined" ? globalThis : window);
