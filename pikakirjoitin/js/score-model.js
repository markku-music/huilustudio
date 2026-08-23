export class ScoreModel {
  #notes = [];
  #listeners = new Set();
  #nextId = 1;

  get notes() {
    return this.#notes.map(note => ({ ...note }));
  }

  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  addNote({ midi, duration = 'quarter' }) {
    const note = {
      id: `note-${this.#nextId++}`,
      midi: Number(midi),
      duration
    };
    this.#notes.push(note);
    this.#emit();
    return note.id;
  }

  setDuration(id, duration) {
    const note = this.#notes.find(item => item.id === id);
    if (!note || note.duration === duration) return;
    note.duration = duration;
    this.#emit();
  }

  #emit() {
    const snapshot = this.notes;
    for (const listener of this.#listeners) listener(snapshot);
  }
}
