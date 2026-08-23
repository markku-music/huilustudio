const POSITION_KEY = 'pikakirjoitin2.thumbRailY';
const DRAG_THRESHOLD = 14;
const EDGE_GAP = 8;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export class ThumbRail {
  #rail;
  #boundsElement;
  #onChange;
  #activePointers = new Map();
  #dragPointerId = null;
  #state = { dot: false, rest: false };
  #ratio = 0.52;

  constructor({ rail, boundsElement, onChange }) {
    this.#rail = rail;
    this.#boundsElement = boundsElement;
    this.#onChange = onChange;
    this.#restorePosition();
    this.#bind();
    requestAnimationFrame(() => this.#positionFromRatio());
    window.addEventListener('resize', () => this.#positionFromRatio());
  }

  get state() {
    return { ...this.#state };
  }

  #bind() {
    this.#rail.addEventListener('pointerdown', event => this.#pointerDown(event));
    this.#rail.addEventListener('pointermove', event => this.#pointerMove(event));
    this.#rail.addEventListener('pointerup', event => this.#pointerEnd(event));
    this.#rail.addEventListener('pointercancel', event => this.#pointerEnd(event));
    this.#rail.addEventListener('contextmenu', event => event.preventDefault());
  }

  #pointerDown(event) {
    const button = event.target.closest('.thumb-modifier');
    if (!button || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault();
    event.stopPropagation();

    const modifier = button.dataset.modifier;
    if (!modifier) return;
    const rect = this.#rail.getBoundingClientRect();
    this.#activePointers.set(event.pointerId, {
      button,
      modifier,
      startX: event.clientX,
      startY: event.clientY,
      startTop: rect.top,
      dragging: false
    });

    button.classList.add('active');
    button.setAttribute('aria-pressed', 'true');
    this.#state[modifier] = true;
    this.#emit();

    try { button.setPointerCapture(event.pointerId); } catch {}
  }

  #pointerMove(event) {
    const active = this.#activePointers.get(event.pointerId);
    if (!active) return;
    event.preventDefault();
    event.stopPropagation();

    const dx = event.clientX - active.startX;
    const dy = event.clientY - active.startY;

    if (!active.dragging && this.#dragPointerId === null && Math.abs(dy) >= DRAG_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
      active.dragging = true;
      this.#dragPointerId = event.pointerId;
      this.#rail.classList.add('is-dragging');
    }

    if (!active.dragging || this.#dragPointerId !== event.pointerId) return;
    const { minTop, maxTop } = this.#bounds();
    const top = clamp(active.startTop + dy, minTop, maxTop);
    this.#rail.style.top = `${top}px`;
    this.#ratio = maxTop > minTop ? (top - minTop) / (maxTop - minTop) : 0;
  }

  #pointerEnd(event) {
    const active = this.#activePointers.get(event.pointerId);
    if (!active) return;
    event.preventDefault();
    event.stopPropagation();

    this.#activePointers.delete(event.pointerId);
    try {
      if (active.button.hasPointerCapture(event.pointerId)) active.button.releasePointerCapture(event.pointerId);
    } catch {}

    // Sama modifioija voi teoriassa olla toisenkin osoittimen pohjassa.
    const stillHeld = [...this.#activePointers.values()].some(item => item.modifier === active.modifier);
    if (!stillHeld) {
      active.button.classList.remove('active');
      active.button.setAttribute('aria-pressed', 'false');
      this.#state[active.modifier] = false;
      this.#emit();
    }

    if (this.#dragPointerId === event.pointerId) {
      this.#dragPointerId = null;
      this.#rail.classList.remove('is-dragging');
      this.#savePosition();
    }
  }

  #bounds() {
    const rect = this.#boundsElement.getBoundingClientRect();
    const minTop = rect.top + EDGE_GAP;
    const maxTop = Math.max(minTop, rect.bottom - this.#rail.offsetHeight - EDGE_GAP);
    return { minTop, maxTop };
  }

  #positionFromRatio() {
    const { minTop, maxTop } = this.#bounds();
    const top = minTop + (maxTop - minTop) * clamp(this.#ratio, 0, 1);
    this.#rail.style.top = `${top}px`;
  }

  #restorePosition() {
    try {
      const saved = Number.parseFloat(localStorage.getItem(POSITION_KEY));
      if (Number.isFinite(saved)) this.#ratio = clamp(saved, 0, 1);
    } catch {}
  }

  #savePosition() {
    try { localStorage.setItem(POSITION_KEY, this.#ratio.toFixed(4)); } catch {}
  }

  #emit() {
    this.#onChange?.(this.state);
  }
}
