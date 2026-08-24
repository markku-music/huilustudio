const STORAGE_KEY = 'pikakirjoitin2.systemSpacing';

export class SystemSpacingRail {
  #rail;
  #track;
  #thumb;
  #bubble;
  #min;
  #max;
  #step;
  #value;
  #onChange;
  #pointerId = null;

  constructor({ rail, track, thumb, bubble, min = 5, max = 15, step = 0.5, value = 9, onChange = () => {} }) {
    this.#rail = rail;
    this.#track = track;
    this.#thumb = thumb;
    this.#bubble = bubble;
    this.#min = Number(min);
    this.#max = Number(max);
    this.#step = Number(step);
    this.#onChange = onChange;

    const saved = Number.parseFloat(localStorage.getItem(STORAGE_KEY));
    this.#value = Number.isFinite(saved) ? this.#clampAndSnap(saved) : this.#clampAndSnap(value);

    this.#rail.setAttribute('aria-valuemin', String(this.#min));
    this.#rail.setAttribute('aria-valuemax', String(this.#max));
    this.#rail.addEventListener('pointerdown', event => this.#onPointerDown(event));
    this.#rail.addEventListener('pointermove', event => this.#onPointerMove(event));
    this.#rail.addEventListener('pointerup', event => this.#onPointerUp(event));
    this.#rail.addEventListener('pointercancel', event => this.#onPointerUp(event));
    this.#rail.addEventListener('keydown', event => this.#onKeyDown(event));

    this.#updateUi();
    this.#onChange(this.#value, { initial: true });
  }

  get value() { return this.#value; }

  #clampAndSnap(raw) {
    const clamped = Math.min(this.#max, Math.max(this.#min, Number(raw)));
    const snapped = Math.round((clamped - this.#min) / this.#step) * this.#step + this.#min;
    return Number(snapped.toFixed(3));
  }

  #valueFromClientY(clientY) {
    const rect = this.#track.getBoundingClientRect();
    if (!rect.height) return this.#value;
    const t = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    // Ylhäällä minimi, alhaalla maksimi.
    return this.#clampAndSnap(this.#min + t * (this.#max - this.#min));
  }

  #setValue(next, { announce = true } = {}) {
    const value = this.#clampAndSnap(next);
    if (value === this.#value) {
      this.#updateUi();
      return;
    }
    this.#value = value;
    localStorage.setItem(STORAGE_KEY, String(value));
    this.#updateUi();
    this.#onChange(value, { initial: false });
    if (announce) this.#showBubble();
  }

  #updateUi() {
    const range = this.#max - this.#min || 1;
    const normalized = (this.#value - this.#min) / range;
    const percentFromTop = normalized * 100;
    this.#thumb.style.top = `${percentFromTop}%`;
    this.#bubble.style.top = `${percentFromTop}%`;
    this.#bubble.textContent = this.#value.toFixed(1);
    this.#rail.setAttribute('aria-valuenow', String(this.#value));
    this.#rail.setAttribute('aria-valuetext', `${this.#value.toFixed(1)} staff spacea`);
  }

  #showBubble() {
    this.#bubble.hidden = false;
    this.#rail.classList.add('is-adjusting');
  }

  #hideBubble() {
    this.#bubble.hidden = true;
    this.#rail.classList.remove('is-adjusting');
  }

  #onPointerDown(event) {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    this.#pointerId = event.pointerId;
    this.#rail.setPointerCapture?.(event.pointerId);
    this.#showBubble();
    this.#setValue(this.#valueFromClientY(event.clientY), { announce: false });
  }

  #onPointerMove(event) {
    if (this.#pointerId !== event.pointerId) return;
    event.preventDefault();
    this.#setValue(this.#valueFromClientY(event.clientY), { announce: false });
  }

  #onPointerUp(event) {
    if (this.#pointerId !== event.pointerId) return;
    event.preventDefault();
    this.#rail.releasePointerCapture?.(event.pointerId);
    this.#pointerId = null;
    this.#hideBubble();
  }

  #onKeyDown(event) {
    let delta = 0;
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') delta = -this.#step;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') delta = this.#step;
    if (event.key === 'Home') {
      event.preventDefault();
      this.#setValue(this.#min);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      this.#setValue(this.#max);
      return;
    }
    if (!delta) return;
    event.preventDefault();
    this.#setValue(this.#value + delta);
    window.clearTimeout(this._bubbleTimer);
    this._bubbleTimer = window.setTimeout(() => this.#hideBubble(), 700);
  }
}
