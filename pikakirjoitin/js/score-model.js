export class ScoreModel {
  #notes = [];
  #listeners = new Set();
  #historyListeners = new Set();
  #nextId = 1;
  #nextGroupId = 1;
  #undoStack = [];
  #redoStack = [];
  #transactionSnapshot = null;

  get notes() { return this.#cloneNotes(this.#notes); }
  get canUndo() { return this.#undoStack.length > 0; }
  get canRedo() { return this.#redoStack.length > 0; }

  getEntry(id) {
    const entry = this.#notes.find(item => item.id === id);
    return entry ? { ...entry } : null;
  }

  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  subscribeHistory(listener) {
    this.#historyListeners.add(listener);
    listener({ canUndo: this.canUndo, canRedo: this.canRedo });
    return () => this.#historyListeners.delete(listener);
  }

  beginAction() {
    if (this.#transactionSnapshot) return;
    this.#transactionSnapshot = this.notes;
  }

  endAction() {
    if (!this.#transactionSnapshot) return;
    const before = this.#transactionSnapshot;
    this.#transactionSnapshot = null;
    if (this.#sameNotes(before, this.#notes)) return;
    this.#undoStack.push(before);
    this.#redoStack = [];
    this.#emitHistory();
  }

  cancelAction() {
    if (!this.#transactionSnapshot) return;
    this.#notes = this.#cloneNotes(this.#transactionSnapshot);
    this.#transactionSnapshot = null;
    this.#emit();
    this.#emitHistory();
  }

  addNote({ midi, duration = 'quarter', dotted = false, tieFromPrevious = false, tuplet = null }) {
    this.#recordStandaloneMutation();
    const note = {
      id: `note-${this.#nextId++}`,
      kind: 'note',
      midi: Number(midi),
      duration,
      dotted: Boolean(dotted),
      tieFromPrevious: Boolean(tieFromPrevious),
      spellingPreference: null,
      spellingOverride: null,
      ...this.#tupletFields(tuplet)
    };
    this.#notes.push(note);
    this.#emit();
    this.#finishStandaloneMutation();
    return note.id;
  }

  addRest({ duration = 'quarter', dotted = false, tuplet = null } = {}) {
    this.#recordStandaloneMutation();
    const tupletFields = this.#tupletFields(tuplet);
    const rest = {
      id: `rest-${this.#nextId++}`,
      kind: 'rest',
      duration,
      dotted: Boolean(dotted),
      measureRest: duration === 'whole' && !Boolean(dotted) && !tupletFields.tupletId,
      ...tupletFields
    };
    this.#notes.push(rest);
    this.#emit();
    this.#finishStandaloneMutation();
    return rest.id;
  }

  setDuration(id, duration) {
    const note = this.#notes.find(item => item.id === id);
    if (!note || note.duration === duration) return;
    this.#recordStandaloneMutation();
    note.duration = duration;
    if (note.kind === 'rest') note.measureRest = duration === 'whole' && !Boolean(note.dotted) && !note.tupletId;
    this.#emit();
    this.#finishStandaloneMutation();
  }

  updateEntry(id, patch = {}) {
    const note = this.#notes.find(item => item.id === id);
    if (!note) return false;
    const cleanPatch = { ...patch };
    this.#recordStandaloneMutation();
    Object.assign(note, cleanPatch);
    if (note.kind === 'rest') note.measureRest = note.duration === 'whole' && !Boolean(note.dotted) && !note.tupletId;
    this.#emit();
    this.#finishStandaloneMutation();
    return true;
  }

  updateEntries(ids, updater) {
    const wanted = new Set(Array.isArray(ids) ? ids : [ids]);
    if (!wanted.size) return false;
    const before = this.notes;
    let changed = false;
    this.#recordStandaloneMutation();

    this.#notes = this.#notes.map((entry, index) => {
      if (!wanted.has(entry.id)) return entry;
      const patch = typeof updater === 'function'
        ? updater({ ...entry }, index, before.map(item => ({ ...item })))
        : updater;
      if (!patch || typeof patch !== 'object') return entry;
      const next = { ...entry, ...patch };
      if (next.kind === 'rest') next.measureRest = next.duration === 'whole' && !Boolean(next.dotted) && !next.tupletId;
      if (JSON.stringify(next) !== JSON.stringify(entry)) changed = true;
      return next;
    });

    if (changed) this.#emit();
    this.#finishStandaloneMutation();
    return changed;
  }

  deleteEntries(ids) {
    const wanted = new Set(Array.isArray(ids) ? ids : [ids]);
    if (!wanted.size) return false;
    const beforeLength = this.#notes.length;
    this.#recordStandaloneMutation();
    this.#notes = this.#notes.filter(entry => !wanted.has(entry.id));
    const changed = this.#notes.length !== beforeLength;
    if (changed) this.#emit();
    this.#finishStandaloneMutation();
    return changed;
  }

  copyEntriesToEnd(ids) {
    const wanted = new Set(Array.isArray(ids) ? ids : [ids]);
    const indexed = this.#notes.map((entry, index) => ({ entry, index })).filter(({ entry }) => wanted.has(entry.id));
    if (!indexed.length) return [];

    this.#recordStandaloneMutation();

    const selectedOriginalIndexes = new Set(indexed.map(item => item.index));
    const tupletMap = new Map();
    const beamMap = new Map();
    const newIds = [];

    const cloneGroupId = (map, oldId, prefix) => {
      if (!oldId) return null;
      if (!map.has(oldId)) map.set(oldId, `${prefix}-${this.#nextGroupId++}`);
      return map.get(oldId);
    };

    const copies = indexed.map(({ entry, index }) => {
      const copy = this.#cloneNotes([entry])[0];
      copy.id = `${entry.kind === 'rest' ? 'rest' : 'note'}-${this.#nextId++}`;
      newIds.push(copy.id);

      // Käsin tehty side säilyy vain, jos myös sen edellinen looginen tapahtuma
      // kuuluu kopioituun jaksoon. Kopio ei siis koskaan sido itseään vahingossa
      // alkuperäisen musiikin viimeiseen nuottiin.
      if (copy.tieFromPrevious) copy.tieFromPrevious = selectedOriginalIndexes.has(index - 1);

      if (copy.tupletId) copy.tupletId = cloneGroupId(tupletMap, copy.tupletId, 'copy-tuplet');
      if (copy.manualBeamGroup) copy.manualBeamGroup = cloneGroupId(beamMap, copy.manualBeamGroup, 'copy-beam');
      return copy;
    });

    this.#notes.push(...copies);
    this.#emit();
    this.#finishStandaloneMutation();
    return newIds;
  }

  toggleManualBeamGroup(ids) {
    const wanted = new Set(Array.isArray(ids) ? ids : [ids]);
    const beamableDurations = new Set(['eighth', 'sixteenth', 'thirty-second']);
    const candidates = this.#notes.filter(entry =>
      wanted.has(entry.id) && entry.kind === 'note' && beamableDurations.has(entry.duration)
    );
    if (candidates.length < 2) return { changed: false, active: false };

    const shared = candidates[0].manualBeamGroup || null;
    const alreadyGrouped = Boolean(shared && candidates.every(entry => entry.manualBeamGroup === shared));
    const nextGroup = alreadyGrouped ? null : `beam-${this.#nextGroupId++}`;

    this.#recordStandaloneMutation();
    for (const entry of candidates) entry.manualBeamGroup = nextGroup;
    this.#emit();
    this.#finishStandaloneMutation();
    return { changed: true, active: !alreadyGrouped, groupId: nextGroup };
  }

  undo() {
    if (!this.canUndo || this.#transactionSnapshot) return false;
    this.#redoStack.push(this.notes);
    this.#notes = this.#cloneNotes(this.#undoStack.pop());
    this.#emit();
    this.#emitHistory();
    return true;
  }

  redo() {
    if (!this.canRedo || this.#transactionSnapshot) return false;
    this.#undoStack.push(this.notes);
    this.#notes = this.#cloneNotes(this.#redoStack.pop());
    this.#emit();
    this.#emitHistory();
    return true;
  }

  // Vanhan Pikakirjoittimen tapaan valmis tupletti on yksi Undo/Redo-tapahtuma,
  // vaikka sen nuotit kirjoitetaan yksitellen.
  collapseRecentActions(actionCount, beforeSnapshot) {
    if (this.#transactionSnapshot) return false;
    const count = Math.max(1, Math.min(Number(actionCount) || 1, this.#undoStack.length));
    this.#undoStack.splice(this.#undoStack.length - count, count);
    this.#undoStack.push(this.#cloneNotes(beforeSnapshot || []));
    this.#redoStack = [];
    this.#emitHistory();
    return true;
  }

  #standaloneSnapshot = null;

  #recordStandaloneMutation() {
    if (this.#transactionSnapshot || this.#standaloneSnapshot) return;
    this.#standaloneSnapshot = this.notes;
  }

  #finishStandaloneMutation() {
    if (this.#transactionSnapshot || !this.#standaloneSnapshot) return;
    const before = this.#standaloneSnapshot;
    this.#standaloneSnapshot = null;
    if (this.#sameNotes(before, this.#notes)) return;
    this.#undoStack.push(before);
    this.#redoStack = [];
    this.#emitHistory();
  }

  #tupletFields(tuplet) {
    if (!tuplet?.tupletId) return {};
    const fields = {
      tupletId: String(tuplet.tupletId),
      tupletIndex: Number(tuplet.tupletIndex) || 0,
      tupletSize: [3,5,6].includes(Number(tuplet.tupletSize)) ? Number(tuplet.tupletSize) : 3,
      tupletNormalNotes: Number(tuplet.tupletNormalNotes) || (Number(tuplet.tupletSize) === 5 || Number(tuplet.tupletSize) === 6 ? 4 : 2)
    };
    if (Number.isFinite(Number(tuplet.tupletBaseUnits)) && Number(tuplet.tupletBaseUnits) > 0) fields.tupletBaseUnits = Number(tuplet.tupletBaseUnits);
    return fields;
  }

  #cloneNotes(notes) { return notes.map(note => ({ ...note })); }
  #sameNotes(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

  #emit() {
    const snapshot = this.notes;
    for (const listener of this.#listeners) listener(snapshot);
  }

  #emitHistory() {
    const state = { canUndo: this.canUndo, canRedo: this.canRedo };
    for (const listener of this.#historyListeners) listener(state);
  }
}
