const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const distance = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
const midpoint = (a, b) => ({ x:(a.x+b.x)/2, y:(a.y+b.y)/2 });

/**
 * Kahden sormen katseluzoom nuottipaperille.
 *
 * - 1 sormi ei kuulu tälle moduulille lainkaan.
 * - 2 sormea keskeyttää yhden sormen valintaeleen ja lukitsee zoom-tilan.
 * - Pinchin aikana käytetään vain kevyttä CSS-esikatselua.
 * - Kun molemmat sormet on nostettu, OSMD renderöidään kerran lopulliseen zoomiin.
 * - Zoom ei koskaan mene alle 100 %.
 */
export class ScoreZoomController {
  #viewport;
  #document;
  #renderer;
  #selection;
  #pointers = new Map();
  #gesture = null;
  #zoom = 1;
  #minZoom;
  #maxZoom;
  #indicator = null;
  #indicatorTimer = 0;

  constructor({ viewport, documentElement, renderer, selection, minZoom=1, maxZoom=1.5 }) {
    this.#viewport = viewport;
    this.#document = documentElement;
    this.#renderer = renderer;
    this.#selection = selection;
    this.#minZoom = minZoom;
    this.#maxZoom = maxZoom;
    this.#zoom = clamp(Number(renderer.getZoom?.() || 1), minZoom, maxZoom);
    this.#createIndicator();
    this.#bind();
  }

  get zoom() { return this.#zoom; }

  #bind() {
    // Capture-vaihe on tarkoituksellinen: toisen sormen tullessa mukaan
    // zoom ehtii keskeyttää yhden sormen valinnan ennen sen omia handlereita.
    this.#viewport.addEventListener('pointerdown', ev => this.#pointerDown(ev), {capture:true});
    this.#viewport.addEventListener('pointermove', ev => this.#pointerMove(ev), {capture:true});
    this.#viewport.addEventListener('pointerup', ev => this.#pointerUp(ev), {capture:true});
    this.#viewport.addEventListener('pointercancel', ev => this.#pointerCancel(ev), {capture:true});
  }

  #pointerDown(ev) {
    if (ev.pointerType === 'mouse') return;
    this.#pointers.set(ev.pointerId, {x:ev.clientX, y:ev.clientY});

    if (!this.#gesture && this.#pointers.size === 2) {
      const points = [...this.#pointers.entries()];
      const a = points[0][1], b = points[1][1];
      const startDistance = distance(a,b);
      if (startDistance < 8) return;

      this.#selection?.suspendForExternalGesture?.();
      const mid = midpoint(a,b);
      const viewportRect = this.#viewport.getBoundingClientRect();
      const documentRect = this.#document.getBoundingClientRect();
      const localY = mid.y - viewportRect.top;
      const anchorY = this.#viewport.scrollTop + localY;
      const scrollHeight = Math.max(1, this.#viewport.scrollHeight);

      this.#gesture = {
        pointerIds: new Set(points.map(([id])=>id)),
        startDistance,
        startZoom: this.#zoom,
        targetZoom: this.#zoom,
        originX: mid.x - documentRect.left,
        originY: mid.y - documentRect.top,
        localY,
        anchorRatioY: anchorY / scrollHeight,
        changed: false
      };

      for (const [id] of points) {
        try { this.#viewport.setPointerCapture(id); } catch {}
      }
      this.#showIndicator(this.#zoom, true);
      ev.preventDefault();
      ev.stopPropagation();
    }
  }

  #pointerMove(ev) {
    if (ev.pointerType === 'mouse') return;
    if (this.#pointers.has(ev.pointerId)) {
      this.#pointers.set(ev.pointerId, {x:ev.clientX, y:ev.clientY});
    }

    const g = this.#gesture;
    if (!g || !g.pointerIds.has(ev.pointerId)) return;

    const active = [...g.pointerIds]
      .map(id => this.#pointers.get(id))
      .filter(Boolean);
    if (active.length < 2) return;

    const currentDistance = distance(active[0], active[1]);
    if (!Number.isFinite(currentDistance) || currentDistance < 1) return;

    const nextZoom = clamp(g.startZoom * (currentDistance / g.startDistance), this.#minZoom, this.#maxZoom);
    g.targetZoom = nextZoom;
    g.changed = g.changed || Math.abs(nextZoom - g.startZoom) > 0.002;

    const previewScale = nextZoom / g.startZoom;
    this.#document.style.transformOrigin = `${g.originX}px ${g.originY}px`;
    this.#document.style.transform = `scale(${previewScale})`;
    this.#document.classList.add('is-pinch-preview');
    this.#showIndicator(nextZoom, true);

    ev.preventDefault();
    ev.stopPropagation();
  }

  #pointerUp(ev) {
    if (ev.pointerType === 'mouse') return;
    const g = this.#gesture;
    const belongedToZoom = Boolean(g?.pointerIds.has(ev.pointerId));
    this.#pointers.delete(ev.pointerId);

    if (!g || !belongedToZoom) return;
    ev.preventDefault();
    ev.stopPropagation();

    try { this.#viewport.releasePointerCapture(ev.pointerId); } catch {}

    // Yksi jäljelle jäävä sormi ei saa muuttua valinta- tai scroll-eleeksi.
    // Zoom päätetään vasta kun kaikki alkuperäisen pinchin sormet ovat ylhäällä.
    const anyZoomPointerStillDown = [...g.pointerIds].some(id => this.#pointers.has(id));
    if (anyZoomPointerStillDown) return;
    void this.#commitGesture();
  }

  #pointerCancel(ev) {
    if (ev.pointerType === 'mouse') return;
    const g = this.#gesture;
    const belongedToZoom = Boolean(g?.pointerIds.has(ev.pointerId));
    this.#pointers.delete(ev.pointerId);
    if (!g || !belongedToZoom) return;

    const anyZoomPointerStillDown = [...g.pointerIds].some(id => this.#pointers.has(id));
    if (!anyZoomPointerStillDown) void this.#commitGesture();
  }

  async #commitGesture() {
    const g = this.#gesture;
    if (!g) return;
    this.#gesture = null;

    const nextZoom = clamp(g.targetZoom, this.#minZoom, this.#maxZoom);
    this.#zoom = nextZoom;

    // Poistetaan kevyt esikatselu ennen varsinaista OSMD-renderöintiä.
    this.#document.classList.remove('is-pinch-preview');
    this.#document.style.transform = '';
    this.#document.style.transformOrigin = '';

    if (g.changed && Math.abs(nextZoom - g.startZoom) > 0.002) {
      await this.#renderer.setZoom(nextZoom);

      // Pidetään pystysuunnassa suunnilleen sama musiikkikohta sormien alla.
      // OSMD voi reflowata rivejä zoomissa, joten absoluuttinen pikselikohdistus
      // ei ole mielekäs; suhteellinen sisältöankkuri on vakaampi.
      requestAnimationFrame(() => {
        const newScrollHeight = Math.max(1, this.#viewport.scrollHeight);
        const wanted = g.anchorRatioY * newScrollHeight - g.localY;
        const maxScroll = Math.max(0, newScrollHeight - this.#viewport.clientHeight);
        this.#viewport.scrollTop = clamp(wanted, 0, maxScroll);
      });
    }

    this.#selection?.resumeAfterExternalGesture?.();
    this.#showIndicator(nextZoom, false);
  }

  #createIndicator() {
    const el = document.createElement('div');
    el.className = 'pk-zoom-indicator';
    el.setAttribute('aria-hidden','true');
    el.textContent = '100%';
    this.#viewport.appendChild(el);
    this.#indicator = el;
  }

  #showIndicator(zoom, keepVisible) {
    if (!this.#indicator) return;
    window.clearTimeout(this.#indicatorTimer);
    this.#indicator.textContent = `${Math.round(zoom*100)}%`;
    this.#indicator.classList.add('is-visible');
    if (!keepVisible) {
      this.#indicatorTimer = window.setTimeout(() => this.#indicator?.classList.remove('is-visible'), 700);
    }
  }
}
