/*
 * GAME AUDIO ENGINE 1.1
 * Yhtenäinen pelirajapinta F0Engine- ja PlaneEngineAdapter-moottoreille.
 *
 * Riippuvuudet (lataa ennen tätä tiedostoa):
 *   f0-engine.js
 *   plane-engine.js
 *   plane-engine-adapter.js
 *
 * Pelin tarvitsee tavallisesti kuunnella vain:
 *   - "input"   = jatkuva normalisoitu tila
 *   - "trigger" = yksi laukaisu per uusi hyväksytty toiminto
 *
 * Esimerkki:
 *   const audio = new GameAudioEngine({
 *     engine: 'f0',
 *     notes: { 67: 'GO', 69: 'JUMP', 71: 'SHIELD' }
 *   });
 *
 *   audio.addEventListener('trigger', e => {
 *     if (e.detail.action === 'JUMP') jump();
 *   });
 *
 *   await audio.start();
 */
(function (global) {
  'use strict';

  const VERSION = '1.1.0';

  function normalizeEngineKind(kind) {
    const value = String(kind || 'f0').toLowerCase();
    if (value !== 'f0' && value !== 'plane') {
      throw new Error(`Tuntematon moottori: ${kind}. Käytä "f0" tai "plane".`);
    }
    return value;
  }

  function finiteMidi(value) {
    const midi = Number(value);
    if (!Number.isFinite(midi)) return null;
    return Math.round(midi);
  }

  function cloneFastAccept(value) {
    const src = value && typeof value === 'object' ? value : {};
    return {
      enabled: src.enabled !== false,
      frames: Number.isFinite(Number(src.frames)) ? Math.max(1, Math.round(Number(src.frames))) : 2,
      toleranceCents: Number.isFinite(Number(src.toleranceCents)) ? Math.max(1, Number(src.toleranceCents)) : 30
    };
  }

  class GameAudioEngine extends EventTarget {
    constructor(options = {}) {
      super();

      this.version = VERSION;
      this.engineKind = normalizeEngineKind(options.engine || 'f0');
      this.rawEngine = null;
      this.running = false;
      this.training = false;
      this.trained = false;

      this.profileName = options.profileName || 'GameAudioEngine';
      this.fastAccept = cloneFastAccept(options.fastAccept);
      this.planeAction = options.planeAction ?? 'ACCEPT';
      this.planeTrainingMode = Number(options.planeTrainingMode) === 2 ? 2 : 1;
      this.planeActions = {
        A: options.planeActions?.A ?? options.planeActions?.['1'] ?? 'ACTION_A',
        B: options.planeActions?.B ?? options.planeActions?.['2'] ?? 'ACTION_B'
      };

      this.engineOptions = {
        f0: { ...(options.engineOptions?.f0 || {}) },
        plane: {
          ...(options.engineOptions?.plane || {}),
          trainingMode: this.planeTrainingMode
        }
      };

      this.allowedMidi = [];
      this.actions = new Map();
      this._lastTriggerKey = null;
      this._lastRejectedKey = null;
      this._boundRaw = null;
      this._rawListeners = [];

      if (options.notes !== undefined) {
        this.setNotes(options.notes, { silent: true });
      } else if (options.allowedMidi !== undefined) {
        this.setNotes(options.allowedMidi, { silent: true });
      }

      if (options.actions && typeof options.actions === 'object') {
        this.setActions(options.actions, { silent: true });
      }
    }

    _emit(type, detail = {}) {
      this.dispatchEvent(new CustomEvent(type, { detail }));
    }

    _normalizeNotes(notes) {
      const allowed = [];
      const actions = new Map();

      if (Array.isArray(notes)) {
        for (const item of notes) {
          if (item && typeof item === 'object' && !Array.isArray(item)) {
            const midi = finiteMidi(item.midi);
            if (midi === null) continue;
            if (!allowed.includes(midi)) allowed.push(midi);
            if (item.action !== undefined && item.action !== null) actions.set(midi, item.action);
          } else {
            const midi = finiteMidi(item);
            if (midi !== null && !allowed.includes(midi)) allowed.push(midi);
          }
        }
      } else if (notes && typeof notes === 'object') {
        for (const [key, action] of Object.entries(notes)) {
          const midi = finiteMidi(key);
          if (midi === null) continue;
          if (!allowed.includes(midi)) allowed.push(midi);
          if (action !== undefined && action !== null) actions.set(midi, action);
        }
      } else if (notes !== undefined && notes !== null) {
        const midi = finiteMidi(notes);
        if (midi !== null) allowed.push(midi);
      }

      return { allowed, actions };
    }

    setNotes(notes, options = {}) {
      const normalized = this._normalizeNotes(notes);
      this.allowedMidi = normalized.allowed;

      // Jos notes-oliolla annettiin actionit, ne korvaavat vain kyseisten
      // MIDI-sävelten actionit. Muut setActions()-määritykset säilyvät.
      for (const [midi, action] of normalized.actions) this.actions.set(midi, action);

      this._applyF0Profile();
      if (!options.silent) {
        this._emit('configchange', {
          engine: this.engineKind,
          allowedMidi: [...this.allowedMidi],
          actions: this.getActions()
        });
      }
      return this;
    }

    setActions(actions, options = {}) {
      if (!actions || typeof actions !== 'object') return this;
      for (const [key, action] of Object.entries(actions)) {
        const midi = finiteMidi(key);
        if (midi === null) continue;
        if (action === undefined || action === null || action === '') this.actions.delete(midi);
        else this.actions.set(midi, action);
      }
      if (!options.silent) {
        this._emit('configchange', {
          engine: this.engineKind,
          allowedMidi: [...this.allowedMidi],
          actions: this.getActions()
        });
      }
      return this;
    }

    setPlaneAction(action) {
      this.planeAction = action;
      this._emit('configchange', {
        engine: this.engineKind,
        planeAction: this.planeAction
      });
      return this;
    }


    setPlaneTrainingMode(mode) {
      const n = Number(mode);
      if (n !== 1 && n !== 2) throw new Error('Plane-opetustilan pitää olla 1 tai 2 säveltä.');
      if (n === this.planeTrainingMode) return this;
      this.planeTrainingMode = n;
      this.engineOptions.plane.trainingMode = n;
      this.training = false;
      this.trained = false;
      this._resetTriggerState();
      if (this.engineKind === 'plane' && this.rawEngine?.setTrainingMode) {
        this.rawEngine.setTrainingMode(n);
      }
      this._emit('configchange', {
        engine: this.engineKind,
        planeTrainingMode: this.planeTrainingMode,
        planeActions: { ...this.planeActions }
      });
      return this;
    }

    setPlaneActions(actions = {}) {
      if (actions.A !== undefined) this.planeActions.A = actions.A;
      if (actions.B !== undefined) this.planeActions.B = actions.B;
      if (actions['1'] !== undefined) this.planeActions.A = actions['1'];
      if (actions['2'] !== undefined) this.planeActions.B = actions['2'];
      this._emit('configchange', {
        engine: this.engineKind,
        planeTrainingMode: this.planeTrainingMode,
        planeActions: { ...this.planeActions }
      });
      return this;
    }

    getActions() {
      const result = {};
      for (const [midi, action] of this.actions) result[midi] = action;
      return result;
    }

    getConfig() {
      return {
        version: this.version,
        engine: this.engineKind,
        allowedMidi: [...this.allowedMidi],
        actions: this.getActions(),
        planeAction: this.planeAction,
        planeTrainingMode: this.planeTrainingMode,
        planeActions: { ...this.planeActions },
        profileName: this.profileName,
        fastAccept: { ...this.fastAccept }
      };
    }

    _createRawEngine() {
      if (this.engineKind === 'f0') {
        if (!global.F0Engine) throw new Error('F0Engine ei ole latautunut.');
        return new global.F0Engine(this.engineOptions.f0);
      }

      if (!global.PlaneEngineAdapter) throw new Error('PlaneEngineAdapter ei ole latautunut.');
      return new global.PlaneEngineAdapter({ ...this.engineOptions.plane, trainingMode: this.planeTrainingMode });
    }

    _applyF0Profile() {
      if (this.engineKind !== 'f0' || !this.rawEngine?.setProfile) return;

      // Tyhjä lista tarkoittaa "ei rajausta" vain jos käyttäjä ei ole vielä
      // määrittänyt säveliä. Pelikäytössä suositellaan aina allowedMidi-listaa.
      this.rawEngine.setProfile({
        name: this.profileName,
        allowedMidi: [...this.allowedMidi],
        fastAccept: { ...this.fastAccept }
      });
    }

    _listen(raw, type, handler) {
      const wrapped = (event) => {
        if (raw !== this.rawEngine) return;
        handler(event);
      };
      raw.addEventListener(type, wrapped);
      this._rawListeners.push({ raw, type, wrapped });
    }

    _unbindRaw() {
      for (const item of this._rawListeners) {
        try { item.raw.removeEventListener(item.type, item.wrapped); } catch (_) {}
      }
      this._rawListeners = [];
      this._boundRaw = null;
    }

    _bindRaw(raw) {
      this._unbindRaw();
      this._boundRaw = raw;

      const forward = [
        'calibrationprogress',
        'calibrated',
        'profilechange',
        'trainingstart',
        'trainingprogress',
        'trainingretry',
        'trainingframe',
        'trainingerror',
        'trainingcleared',
        'trainingmodechange',
        'referencetrained',
        'trained',
        'soundstart'
      ];

      for (const type of forward) {
        this._listen(raw, type, e => {
          const detail = { ...(e.detail || {}), engine: this.engineKind };

          if (type === 'trainingstart') {
            this.training = true;
            this.trained = false;
            this._resetTriggerState();
          } else if (type === 'referencetrained') {
            this.training = false;
            this.trained = !!detail.complete;
          } else if (type === 'trained') {
            this.training = false;
            this.trained = true;
          } else if (type === 'trainingerror' || type === 'trainingcleared' || type === 'trainingmodechange') {
            this.training = false;
            this.trained = false;
          }

          this._emit(type, detail);
        });
      }

      this._listen(raw, 'state', e => {
        const state = e.detail?.state;
        if (state === 'running') this.running = true;
        if (state === 'stopped') this.running = false;
        this._emit('state', { ...(e.detail || {}), engine: this.engineKind });
      });

      this._listen(raw, 'error', e => {
        this._emit('error', { ...(e.detail || {}), engine: this.engineKind });
      });

      this._listen(raw, 'silence', e => {
        this._resetTriggerState();
        const detail = {
          engine: this.engineKind,
          active: false,
          accepted: null,
          analyzing: false,
          action: null,
          ...(e.detail || {})
        };
        this._emit('silence', detail);
        this._emit('input', detail);
      });

      if (this.engineKind === 'f0') {
        this._listen(raw, 'pitch', e => this._handleF0Pitch(e.detail || {}));
      } else {
        this._listen(raw, 'decision', e => this._handlePlaneDecision(e.detail || {}));
      }
    }

    _resetTriggerState() {
      this._lastTriggerKey = null;
      this._lastRejectedKey = null;
    }

    _emitNormalizedInput(detail) {
      this._emit('input', detail);

      if (detail.accepted === true) {
        const key = detail.engine === 'f0'
          ? `f0:${detail.midi}`
          : `plane:${String(detail.reference ?? detail.action)}`;

        if (this._lastTriggerKey !== key) {
          this._lastTriggerKey = key;
          this._lastRejectedKey = null;
          this._emit('trigger', { ...detail, trigger: true });
        }
        return;
      }

      if (detail.accepted === false) {
        // Hylätty ääni nollaa hyväksytyn actionin. Jos sama sallittu sävel
        // palaa tämän jälkeen ilman hiljaisuutta, siitä saa uuden triggerin.
        this._lastTriggerKey = null;

        const rejectedKey = detail.engine === 'f0'
          ? `f0:${detail.detectedMidi ?? 'unknown'}`
          : 'plane:rejected';

        if (this._lastRejectedKey !== rejectedKey) {
          this._lastRejectedKey = rejectedKey;
          this._emit('rejected', { ...detail });
        }
      }
    }

    _handleF0Pitch(d) {
      if (!d?.note) return;

      const outputMidi = finiteMidi(d.note.midi);
      const detectedMidi = finiteMidi(d.detectedNote?.midi ?? outputMidi);
      const hasFilter = this.allowedMidi.length > 0;
      const detectedAllowed = !hasFilter || this.allowedMidi.includes(detectedMidi);
      const outputAllowed = !hasFilter || this.allowedMidi.includes(outputMidi);

      // Sama logiikka kuin toimivassa testipenkissä: nykyinen havainto ratkaisee
      // heti hylkäyksen, joten edellinen hyväksytty sävel ei vilahda uuden
      // väärän sävelen alussa.
      if (!detectedAllowed) {
        this._emitNormalizedInput({
          engine: 'f0',
          active: true,
          accepted: false,
          analyzing: false,
          action: null,
          midi: null,
          note: null,
          detectedMidi,
          detectedNote: d.detectedNote?.display ?? null,
          f0: Number.isFinite(d.outputF0) ? d.outputF0 : null,
          detectedF0: Number.isFinite(d.f0) ? d.f0 : null,
          levelDb: Number.isFinite(d.levelDb) ? d.levelDb : null,
          cents: null,
          raw: d
        });
        return;
      }

      // Sävelenvaihdon aikana moottorin vanha hyväksytty ulostulo voi vielä olla
      // hetkellisesti eri kuin uusi havainto. Silloin emme hyväksy emmekä hylkää,
      // vaan ilmoitamme analysointitilan.
      if (!outputAllowed || outputMidi !== detectedMidi) {
        this._emitNormalizedInput({
          engine: 'f0',
          active: true,
          accepted: null,
          analyzing: true,
          action: null,
          midi: null,
          note: null,
          detectedMidi,
          detectedNote: d.detectedNote?.display ?? null,
          f0: Number.isFinite(d.outputF0) ? d.outputF0 : null,
          detectedF0: Number.isFinite(d.f0) ? d.f0 : null,
          levelDb: Number.isFinite(d.levelDb) ? d.levelDb : null,
          cents: null,
          raw: d
        });
        return;
      }

      const action = this.actions.has(outputMidi) ? this.actions.get(outputMidi) : null;
      this._emitNormalizedInput({
        engine: 'f0',
        active: true,
        accepted: true,
        analyzing: false,
        action,
        midi: outputMidi,
        note: d.note.display ?? null,
        detectedMidi,
        detectedNote: d.detectedNote?.display ?? d.note.display ?? null,
        f0: Number.isFinite(d.outputF0) ? d.outputF0 : null,
        detectedF0: Number.isFinite(d.f0) ? d.f0 : null,
        levelDb: Number.isFinite(d.levelDb) ? d.levelDb : null,
        cents: Number.isFinite(d.note.cents) ? d.note.cents : null,
        raw: d
      });
    }

    _handlePlaneDecision(d) {
      if (this.training) return;

      if (!d.ready) {
        this._emitNormalizedInput({
          engine: 'plane',
          active: true,
          accepted: null,
          analyzing: false,
          ready: false,
          trained: false,
          mode: d.mode ?? this.planeTrainingMode,
          missingReferences: d.missingReferences ?? null,
          reference: null,
          action: null,
          levelDb: Number.isFinite(d.levelDb) ? d.levelDb : null,
          raw: d
        });
        return;
      }

      if (d.accepted === null || d.analyzing) {
        this._emitNormalizedInput({
          engine: 'plane',
          active: true,
          accepted: null,
          analyzing: true,
          ready: true,
          trained: this.trained,
          mode: d.mode ?? this.planeTrainingMode,
          reference: d.reference ?? null,
          action: null,
          levelDb: Number.isFinite(d.levelDb) ? d.levelDb : null,
          raw: d
        });
        return;
      }

      const accepted = !!d.accepted;
      const reference = d.reference ?? null;
      const mode = d.mode ?? this.planeTrainingMode;
      const action = accepted
        ? (mode === 2 && reference ? (this.planeActions[reference] ?? this.planeAction) : this.planeAction)
        : null;
      this._emitNormalizedInput({
        engine: 'plane',
        active: true,
        accepted,
        analyzing: false,
        ready: true,
        trained: this.trained,
        mode,
        reference,
        referenceIndex: d.referenceIndex ?? (reference === 'A' ? 1 : reference === 'B' ? 2 : null),
        referenceF0: Number.isFinite(d.referenceF0) ? d.referenceF0 : null,
        action,
        levelDb: Number.isFinite(d.levelDb) ? d.levelDb : null,
        raw: d
      });
    }

    async start() {
      if (this.running && this.rawEngine) return this;

      if (!this.rawEngine) {
        this.rawEngine = this._createRawEngine();
        this._bindRaw(this.rawEngine);
        this._applyF0Profile();
      }

      await this.rawEngine.start();
      this.running = !!this.rawEngine.running;
      return this;
    }

    stop() {
      if (this.rawEngine) {
        try { this.rawEngine.stop(); } catch (_) {}
      }
      this.running = false;
      this.training = false;
      this._resetTriggerState();
      return this;
    }

    async setEngine(kind, options = {}) {
      const nextKind = normalizeEngineKind(kind);
      const shouldRestart = options.restart === true && this.running;

      if (nextKind === this.engineKind && this.rawEngine) {
        if (shouldRestart) {
          this.stop();
          this.rawEngine = null;
          await this.start();
        }
        return this;
      }

      if (this.rawEngine) {
        try { this.rawEngine.stop(); } catch (_) {}
      }
      this._unbindRaw();
      this.rawEngine = null;
      this.running = false;
      this.training = false;
      this.trained = false;
      this._resetTriggerState();
      this.engineKind = nextKind;

      this._emit('enginechange', { engine: this.engineKind });

      if (options.restart === true) await this.start();
      return this;
    }

    async recalibrate() {
      if (!this.rawEngine) await this.start();
      else if (this.rawEngine.recalibrate) await this.rawEngine.recalibrate();
      else if (this.rawEngine.calibrate) await this.rawEngine.calibrate();
      return this;
    }

    pauseInput() {
      if (this.rawEngine?.pauseInput) this.rawEngine.pauseInput();
      return this;
    }

    async resumeInput() {
      if (this.rawEngine?.resumeInput) await this.rawEngine.resumeInput();
      return this;
    }

    train(reference = 'A') {
      if (this.engineKind !== 'plane') {
        throw new Error('train() on käytettävissä vain Plane Enginellä.');
      }
      if (!this.rawEngine) {
        throw new Error('Avaa mikrofoni ensin kutsumalla start().');
      }
      this.rawEngine.startReferenceTraining(reference);
      return this;
    }

    startReferenceTraining(reference = 'A') {
      return this.train(reference);
    }

    clearTrainingReference(reference = null) {
      if (this.engineKind !== 'plane' || !this.rawEngine?.clearTrainingReference) return this;
      this.rawEngine.clearTrainingReference(reference);
      const refs = this.rawEngine.getTrainingReferences?.();
      this.trained = !!refs?.complete;
      this.training = false;
      this._resetTriggerState();
      return this;
    }

    getTrainingReference(reference = 'A') {
      if (this.engineKind !== 'plane' || !this.rawEngine?.getTrainingReference) return null;
      return this.rawEngine.getTrainingReference(reference);
    }

    getTrainingReferences() {
      if (this.engineKind !== 'plane' || !this.rawEngine?.getTrainingReferences) return null;
      return this.rawEngine.getTrainingReferences();
    }

    getRawEngine() {
      return this.rawEngine;
    }
  }

  GameAudioEngine.VERSION = VERSION;
  global.GameAudioEngine = GameAudioEngine;
})(window);
