export class ScoreModel {
  #notes = [];
  #listeners = new Set();
  #historyListeners = new Set();
  #nextId = 1;
  #undoStack = [];
  #redoStack = [];
  #transactionSnapshot = null;

  get notes() {
    return this.#cloneNotes(this.#notes);
  }

  get canUndo() {
    return this.#undoStack.length > 0;
  }

  get canRedo() {
    return this.#redoStack.length > 0;
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

  addNote({ midi, duration = 'quarter', dotted = false, tieFromPrevious = false }) {
    this.#recordStandaloneMutation();
    const note = {
      id: `note-${this.#nextId++}`,
      kind: 'note',
      midi: Number(midi),
      duration,
      dotted: Boolean(dotted),
      tieFromPrevious: Boolean(tieFromPrevious)
    };
    this.#notes.push(note);
    this.#emit();
    this.#finishStandaloneMutation();
    return note.id;
  }

  addRest({ duration = 'quarter', dotted = false } = {}) {
    this.#recordStandaloneMutation();
    const rest = {
      id: `rest-${this.#nextId++}`,
      kind: 'rest',
      duration,
      dotted: Boolean(dotted)
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
    this.#emit();
    this.#finishStandaloneMutation();
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

  #cloneNotes(notes) {
    return notes.map(note => ({ ...note }));
  }

  #sameNotes(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  #emit() {
    const snapshot = this.notes;
    for (const listener of this.#listeners) listener(snapshot);
  }

  #emitHistory() {
    const state = { canUndo: this.canUndo, canRedo: this.canRedo };
    for (const listener of this.#historyListeners) listener(state);
  }
}
