const STORAGE_KEY = 'pikakirjoitin.scoreTextLayout.v1';
const PAGE_WIDTH_MM = 210;
const STAFF_LEFT_MM = 15;
const STAFF_RIGHT_MM = 195;

export const DEFAULT_SCORE_TEXT_LAYOUT = Object.freeze({
  version: 1,
  units: 'mm',
  title: Object.freeze({ y: 20 }),
  tempo: Object.freeze({ x: 16, y: 34 }),
  composer: Object.freeze({ y: 34 })
});

function finite(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function round1(value) { return Math.round(value * 10) / 10; }

function normalizeLayout(raw = {}) {
  return {
    version: 1,
    units: 'mm',
    title: { y: clamp(finite(raw?.title?.y, DEFAULT_SCORE_TEXT_LAYOUT.title.y), 6, 75) },
    tempo: {
      x: clamp(finite(raw?.tempo?.x, DEFAULT_SCORE_TEXT_LAYOUT.tempo.x), STAFF_LEFT_MM, STAFF_RIGHT_MM),
      y: clamp(finite(raw?.tempo?.y, DEFAULT_SCORE_TEXT_LAYOUT.tempo.y), 6, 75)
    },
    composer: { y: clamp(finite(raw?.composer?.y, DEFAULT_SCORE_TEXT_LAYOUT.composer.y), 6, 75) }
  };
}

export class ScoreTextLayout {
  #document;
  #osmdContainer;
  #overlay;
  #title;
  #tempo;
  #composer;
  #readout;
  #settings = {};
  #layout = normalizeLayout();
  #drag = null;
  #resizeObserver = null;
  #listeners = new Set();

  constructor({ documentElement, osmdContainer, overlay }) {
    this.#document = documentElement;
    this.#osmdContainer = osmdContainer;
    this.#overlay = overlay;
    this.#title = overlay.querySelector('[data-score-text="title"]');
    this.#tempo = overlay.querySelector('[data-score-text="tempo"]');
    this.#composer = overlay.querySelector('[data-score-text="composer"]');
    this.#readout = overlay.querySelector('.score-text-readout');
    this.#layout = this.#load();

    this.#bind(this.#title, 'title');
    this.#bind(this.#tempo, 'tempo');
    this.#bind(this.#composer, 'composer');

    if ('ResizeObserver' in window) {
      this.#resizeObserver = new ResizeObserver(() => this.syncToRenderedPage());
      this.#resizeObserver.observe(this.#osmdContainer);
    }
  }

  setSettings(settings = {}) {
    this.#settings = { ...settings };
    this.#title.textContent = settings.title || '';
    this.#tempo.textContent = settings.tempoText || '';
    this.#composer.textContent = settings.composer || '';
    this.#title.hidden = !settings.title;
    this.#tempo.hidden = !settings.tempoText;
    this.#composer.hidden = !settings.composer;
    this.#applyPositions();
  }

  syncToRenderedPage() {
    const page = this.#osmdContainer.querySelector('div[id^="osmdCanvasPage"]');
    if (!page) {
      this.#overlay.hidden = true;
      return;
    }
    this.#hideOsmdOriginalTexts();
    const pageRect = page.getBoundingClientRect();
    const docRect = this.#document.getBoundingClientRect();
    if (!pageRect.width || !pageRect.height) return;

    this.#overlay.hidden = false;
    this.#overlay.style.left = `${pageRect.left - docRect.left}px`;
    this.#overlay.style.top = `${pageRect.top - docRect.top}px`;
    this.#overlay.style.width = `${pageRect.width}px`;
    this.#overlay.style.height = `${pageRect.height}px`;
    this.#applyPositions();
  }

  subscribe(listener) {
    this.#listeners.add(listener);
    try { listener(this.layout); } catch {}
    return () => this.#listeners.delete(listener);
  }

  setLayout(patch = {}) {
    this.#layout = normalizeLayout({
      ...this.#layout,
      ...patch,
      title: { ...this.#layout.title, ...(patch.title || {}) },
      tempo: { ...this.#layout.tempo, ...(patch.tempo || {}) },
      composer: { ...this.#layout.composer, ...(patch.composer || {}) }
    });
    this.#applyPositions();
    this.#save();
    this.#notify();
  }

  reset() {
    this.#layout = normalizeLayout(DEFAULT_SCORE_TEXT_LAYOUT);
    this.#applyPositions();
    this.#save();
    this.#notify();
  }

  get layout() {
    return {
      version: 1,
      units: 'mm',
      title: { y: round1(this.#layout.title.y) },
      tempo: { x: round1(this.#layout.tempo.x), y: round1(this.#layout.tempo.y) },
      composer: { y: round1(this.#layout.composer.y) }
    };
  }

  #pxPerMm() { return Math.max(0.01, this.#overlay.clientWidth / PAGE_WIDTH_MM); }

  #applyPositions() {
    if (this.#overlay.hidden) return;
    const px = this.#pxPerMm();

    this.#title.style.left = `${((STAFF_LEFT_MM + STAFF_RIGHT_MM) / 2) * px}px`;
    this.#title.style.top = `${this.#layout.title.y * px}px`;
    this.#title.style.fontSize = `${5.3 * px}px`;

    this.#tempo.style.left = `${this.#layout.tempo.x * px}px`;
    this.#tempo.style.top = `${this.#layout.tempo.y * px}px`;
    this.#tempo.style.fontSize = `${3.5 * px}px`;

    this.#composer.style.right = `${(PAGE_WIDTH_MM - STAFF_RIGHT_MM) * px}px`;
    this.#composer.style.top = `${this.#layout.composer.y * px}px`;
    this.#composer.style.fontSize = `${3.5 * px}px`;
  }


  #hideOsmdOriginalTexts() {
    const values = [this.#settings.title, this.#settings.tempoText, this.#settings.composer]
      .map(value => String(value || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    if (!values.length) return;

    const texts = [...this.#osmdContainer.querySelectorAll('svg text')];
    const used = new Set();
    for (const value of values) {
      const match = texts.find(el => {
        if (used.has(el)) return false;
        const text = String(el.textContent || '').replace(/\s+/g, ' ').trim();
        return text === value;
      });
      if (match) {
        match.style.visibility = 'hidden';
        used.add(match);
      }
    }
  }

  #bind(element, kind) {
    element.addEventListener('pointerdown', ev => this.#pointerDown(ev, element, kind));
    element.addEventListener('pointermove', ev => this.#pointerMove(ev));
    element.addEventListener('pointerup', ev => this.#pointerUp(ev));
    element.addEventListener('pointercancel', ev => this.#pointerUp(ev));
  }

  #pointerDown(ev, element, kind) {
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
    ev.preventDefault();
    ev.stopPropagation();
    this.#drag = {
      pointerId: ev.pointerId,
      element,
      kind,
      startClientX: ev.clientX,
      startClientY: ev.clientY,
      start: this.layout
    };
    element.classList.add('is-dragging');
    try { element.setPointerCapture(ev.pointerId); } catch {}
    this.#showReadout(kind);
  }

  #pointerMove(ev) {
    const d = this.#drag;
    if (!d || ev.pointerId !== d.pointerId) return;
    ev.preventDefault();
    ev.stopPropagation();
    const px = this.#pxPerMm();
    const dx = (ev.clientX - d.startClientX) / px;
    const dy = (ev.clientY - d.startClientY) / px;

    if (d.kind === 'title') {
      this.#layout.title.y = clamp(d.start.title.y + dy, 6, 75);
    } else if (d.kind === 'tempo') {
      const widthMm = d.element.getBoundingClientRect().width / px;
      this.#layout.tempo.x = clamp(d.start.tempo.x + dx, 5, PAGE_WIDTH_MM - 5 - Math.max(0, widthMm));
      this.#layout.tempo.y = clamp(d.start.tempo.y + dy, 6, 75);
    } else if (d.kind === 'composer') {
      this.#layout.composer.y = clamp(d.start.composer.y + dy, 6, 75);
    }
    this.#applyPositions();
    this.#showReadout(d.kind);
  }

  #pointerUp(ev) {
    const d = this.#drag;
    if (!d || ev.pointerId !== d.pointerId) return;
    ev.preventDefault();
    ev.stopPropagation();
    try { d.element.releasePointerCapture(ev.pointerId); } catch {}
    d.element.classList.remove('is-dragging');
    this.#drag = null;
    this.#save();
    this.#notify();
    window.setTimeout(() => { if (!this.#drag) this.#readout.hidden = true; }, 450);
  }

  #showReadout(kind) {
    const L = this.layout;
    if (kind === 'tempo') this.#readout.textContent = `X ${L.tempo.x.toFixed(1)} mm  ·  Y ${L.tempo.y.toFixed(1)} mm`;
    else if (kind === 'composer') this.#readout.textContent = `Y ${L.composer.y.toFixed(1)} mm`;
    else this.#readout.textContent = `Y ${L.title.y.toFixed(1)} mm`;
    this.#readout.hidden = false;
  }

  #notify() {
    const value = this.layout;
    for (const listener of this.#listeners) {
      try { listener(value); } catch {}
    }
  }

  #load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? normalizeLayout(JSON.parse(raw)) : normalizeLayout();
    } catch { return normalizeLayout(); }
  }

  #save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.layout)); } catch {}
  }
}
