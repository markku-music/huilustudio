import { durationUnits } from './measure-layout.js';

const EPS = 1e-7;

function normalNotes(size) {
  return size === 5 || size === 6 ? 4 : 2;
}

function tupletName(size) {
  return size === 5 ? 'Kvintoli' : size === 6 ? 'Sekstoli' : 'Trioli';
}

export class TupletController {
  #model;
  #onStateChange;
  #onWarning;
  #size = 0;
  #groupId = null;
  #nextGroupId = 1;
  #nextIndex = 0;
  #baseUnits = null;
  #groupStartSnapshot = null;
  #successfulEntries = 0;

  constructor({ model, onStateChange, onWarning } = {}) {
    this.#model = model;
    this.#onStateChange = onStateChange;
    this.#onWarning = onWarning;
  }

  get active() { return this.#size > 0; }
  get size() { return this.#size; }

  request(size = 3) {
    const nextSize = [3, 5, 6].includes(Number(size)) ? Number(size) : 3;
    const hasEntries = this.#currentEntries().length > 0;

    if (this.active && hasEntries) {
      this.#warn('Kirjoita tupletti loppuun');
      return false;
    }

    if (this.active && this.#size === nextSize) {
      this.#deactivate();
      return true;
    }

    this.#size = nextSize;
    this.#groupId = `tuplet-${this.#nextGroupId++}`;
    this.#nextIndex = 0;
    this.#baseUnits = null;
    this.#groupStartSnapshot = null;
    this.#successfulEntries = 0;
    this.#emitState();
    return true;
  }

  metadataForNewEntry() {
    if (!this.active) return null;
    if (this.#nextIndex === 0 && this.#currentEntries().length === 0) this.#groupStartSnapshot = this.#model.notes;
    if (!this.#groupId) this.#groupId = `tuplet-${this.#nextGroupId++}`;
    const metadata = {
      tupletId: this.#groupId,
      tupletIndex: this.#nextIndex,
      tupletSize: this.#size,
      tupletNormalNotes: normalNotes(this.#size)
    };
    if (Number.isFinite(this.#baseUnits) && this.#baseUnits > 0) metadata.tupletBaseUnits = this.#baseUnits;
    this.#nextIndex += 1;
    return metadata;
  }

  finishEntry(id) {
    if (!this.active || !this.#groupId) return { ok: true, completed: false };
    const note = this.#model.notes.find(item => item.id === id);
    if (!note || note.tupletId !== this.#groupId) return { ok: true, completed: false };

    const nominal = durationUnits(note.duration, note.dotted);
    if (!Number.isFinite(this.#baseUnits) || this.#baseUnits <= 0) {
      this.#baseUnits = nominal;
      this.#model.updateEntry(id, { tupletBaseUnits: this.#baseUnits });
    }

    const entries = this.#currentEntries();
    const target = this.#baseUnits * this.#size;
    const used = entries.reduce((sum, item) => sum + durationUnits(item.duration, item.dotted), 0);

    if (used > target + EPS) {
      this.#nextIndex = Math.max(0, this.#nextIndex - 1);
      const remaining = Math.max(0, target - (used - nominal));
      this.#warn(`Ei mahdu ${tupletName(this.#size).toLowerCase()}in · jäljellä ${this.#formatUnits(remaining)}`);
      return { ok: false, completed: false };
    }

    this.#successfulEntries += 1;

    if (Math.abs(used - target) <= EPS) {
      const completedSize = this.#size;
      const historyGroup = {
        actionCount: this.#successfulEntries,
        beforeSnapshot: (this.#groupStartSnapshot || []).map(item => ({ ...item }))
      };
      this.#deactivate();
      return { ok: true, completed: true, size: completedSize, historyGroup };
    }

    this.#emitState();
    return { ok: true, completed: false };
  }

  syncFromModel() {
    if (!this.active || !this.#groupId) return;
    const entries = this.#currentEntries();
    this.#nextIndex = entries.length ? Math.max(...entries.map(item => Number(item.tupletIndex) || 0)) + 1 : 0;
    this.#successfulEntries = entries.length;
    if (!entries.length) this.#groupStartSnapshot = this.#model.notes;
    const storedBase = Number(entries.find(item => Number(item.tupletBaseUnits) > 0)?.tupletBaseUnits);
    this.#baseUnits = Number.isFinite(storedBase) && storedBase > 0 ? storedBase : null;
    this.#emitState();
  }

  #currentEntries() {
    if (!this.#groupId) return [];
    return this.#model.notes
      .filter(item => item?.tupletId === this.#groupId)
      .sort((a, b) => (Number(a.tupletIndex) || 0) - (Number(b.tupletIndex) || 0));
  }

  #deactivate() {
    this.#size = 0;
    this.#groupId = null;
    this.#nextIndex = 0;
    this.#baseUnits = null;
    this.#groupStartSnapshot = null;
    this.#successfulEntries = 0;
    this.#emitState();
  }

  #emitState() {
    if (!this.#onStateChange) return;
    let remaining = null;
    if (this.active && Number.isFinite(this.#baseUnits) && this.#baseUnits > 0) {
      const target = this.#baseUnits * this.#size;
      const used = this.#currentEntries().reduce((sum, item) => sum + durationUnits(item.duration, item.dotted), 0);
      remaining = Math.max(0, target - used);
    }
    this.#onStateChange({ active: this.active, size: this.#size, remaining });
  }

  #warn(message) {
    this.#onWarning?.(message);
  }

  #formatUnits(units) {
    const names = new Map([
      [32, '1/1'], [24, 'pisteellinen 1/2'], [16, '1/2'], [12, 'pisteellinen 1/4'], [8, '1/4'],
      [6, 'pisteellinen 1/8'], [4, '1/8'], [3, 'pisteellinen 1/16'], [2, '1/16'], [1.5, 'pisteellinen 1/32'], [1, '1/32']
    ]);
    for (const [value, label] of names) if (Math.abs(units - value) <= EPS) return label;
    return `${units}`;
  }
}
