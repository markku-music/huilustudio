const DEFAULT_X = 0.125;
const DEFAULT_Y = 0.145;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class TempoOverlay {
  #documentElement;
  #osmdContainer;
  #element;
  #x = DEFAULT_X;
  #y = DEFAULT_Y;
  #drag = null;

  constructor({ documentElement, osmdContainer, element }) {
    this.#documentElement = documentElement;
    this.#osmdContainer = osmdContainer;
    this.#element = element;
    this.#bind();
  }

  setText(text) {
    const value = String(text || '').trim();
    this.#element.textContent = value;
    this.#element.hidden = !value;
    if (value) this.syncToPage();
  }

  syncToPage() {
    if (this.#element.hidden) return;
    const page = this.#firstPage();
    if (!page) return;

    const docRect = this.#documentElement.getBoundingClientRect();
    const pageRect = page.getBoundingClientRect();
    const left = pageRect.left - docRect.left + pageRect.width * this.#x;
    const top = pageRect.top - docRect.top + pageRect.height * this.#y;
    this.#element.style.left = `${left}px`;
    this.#element.style.top = `${top}px`;
  }

  #firstPage() {
    return this.#osmdContainer.querySelector('div[id^="osmdCanvasPage"]') ||
           this.#osmdContainer.querySelector('svg')?.parentElement || null;
  }

  #bind() {
    this.#element.addEventListener('pointerdown', ev => this.#pointerDown(ev));
    this.#element.addEventListener('pointermove', ev => this.#pointerMove(ev));
    this.#element.addEventListener('pointerup', ev => this.#pointerUp(ev));
    this.#element.addEventListener('pointercancel', ev => this.#pointerUp(ev));
    window.addEventListener('resize', () => this.syncToPage(), { passive:true });
  }

  #pointerDown(ev) {
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
    const page = this.#firstPage();
    if (!page) return;
    ev.preventDefault();
    ev.stopPropagation();
    const elementRect = this.#element.getBoundingClientRect();
    this.#drag = {
      pointerId:ev.pointerId,
      offsetX:ev.clientX - elementRect.left,
      offsetY:ev.clientY - elementRect.top
    };
    this.#element.classList.add('is-dragging');
    try { this.#element.setPointerCapture(ev.pointerId); } catch {}
  }

  #pointerMove(ev) {
    if (!this.#drag || ev.pointerId !== this.#drag.pointerId) return;
    const page = this.#firstPage();
    if (!page) return;
    ev.preventDefault();
    ev.stopPropagation();
    this.#updateFromPointer(ev, page);
  }

  #pointerUp(ev) {
    if (!this.#drag || ev.pointerId !== this.#drag.pointerId) return;
    ev.preventDefault();
    ev.stopPropagation();
    try { this.#element.releasePointerCapture(ev.pointerId); } catch {}
    this.#drag = null;
    this.#element.classList.remove('is-dragging');
  }

  #updateFromPointer(ev, page) {
    const pageRect = page.getBoundingClientRect();
    if (!pageRect.width || !pageRect.height) return;

    // Pidetään tempotekstin ankkuri sivun sisällä. Oikealle jätetään hieman
    // tilaa myös pidemmälle tempotekstille, mutta käyttäjä voi muuten sijoittaa
    // tekstin vapaasti paperin yläosaan tai alemmaksi.
    const offsetX = this.#drag?.offsetX || 0;
    const offsetY = this.#drag?.offsetY || 0;
    this.#x = clamp((ev.clientX - offsetX - pageRect.left) / pageRect.width, 0.02, 0.92);
    this.#y = clamp((ev.clientY - offsetY - pageRect.top) / pageRect.height, 0.02, 0.94);
    this.syncToPage();
  }
}
