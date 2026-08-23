export class ScoreLayoutControls {
  #layout;
  #toggle;
  #panel;
  #close;
  #reset;
  #copy;
  #status;
  #inputs = new Map();
  #unsubscribe = null;

  constructor({ layout, toggle, panel }) {
    this.#layout = layout;
    this.#toggle = toggle;
    this.#panel = panel;
    this.#close = panel.querySelector('[data-layout-close]');
    this.#reset = panel.querySelector('[data-layout-reset]');
    this.#copy = panel.querySelector('[data-layout-copy]');
    this.#status = panel.querySelector('[data-layout-status]');

    for (const row of panel.querySelectorAll('[data-layout-key]')) {
      const key = row.dataset.layoutKey;
      const input = row.querySelector('input[type="range"]');
      const output = row.querySelector('output');
      if (!key || !input || !output) continue;
      this.#inputs.set(key, { input, output });
      input.addEventListener('input', () => this.#onInput(key, input.value));
    }

    toggle.addEventListener('click', () => this.setOpen(this.#panel.hidden));
    this.#close.addEventListener('click', () => this.setOpen(false));
    this.#reset.addEventListener('click', () => {
      this.#layout.reset();
      this.#flash('Oletukset palautettu');
    });
    this.#copy.addEventListener('click', () => this.#copyJson());

    this.#unsubscribe = this.#layout.subscribe(value => this.#sync(value));
    this.#sync(this.#layout.layout);
  }

  setOpen(open) {
    this.#panel.hidden = !open;
    this.#toggle.setAttribute('aria-expanded', String(open));
    this.#toggle.classList.toggle('is-active', open);
  }

  #onInput(key, rawValue) {
    const value = Number(rawValue);
    if (!Number.isFinite(value)) return;
    const patch = {};
    if (key === 'titleY') patch.title = { y: value };
    if (key === 'tempoX') patch.tempo = { x: value };
    if (key === 'tempoY') patch.tempo = { y: value };
    if (key === 'composerY') patch.composer = { y: value };
    this.#layout.setLayout(patch);
  }

  #sync(layout) {
    const values = {
      titleY: layout.title.y,
      tempoX: layout.tempo.x,
      tempoY: layout.tempo.y,
      composerY: layout.composer.y
    };
    for (const [key, parts] of this.#inputs) {
      const value = Number(values[key]);
      parts.input.value = String(value);
      parts.output.value = `${value.toFixed(1)} mm`;
      parts.output.textContent = `${value.toFixed(1)} mm`;
    }
  }

  async #copyJson() {
    const text = JSON.stringify(this.#layout.layout, null, 2);
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        ok = true;
      }
    } catch {}
    if (!ok) {
      try {
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.append(area);
        area.select();
        ok = document.execCommand('copy');
        area.remove();
      } catch {}
    }
    this.#flash(ok ? 'JSON kopioitu' : 'Kopiointi ei onnistunut');
  }

  #flash(message) {
    this.#status.textContent = message;
    this.#status.hidden = false;
    clearTimeout(this.#status._pkTimer);
    this.#status._pkTimer = setTimeout(() => { this.#status.hidden = true; }, 1400);
  }
}
