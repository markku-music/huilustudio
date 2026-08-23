export class SelectionEditor {
  #root;
  #buttons = new Map();
  #handlers;

  constructor({ onFlat, onUp, onDown, onSharp, onDelete, onCopyToEnd, onBeam } = {}) {
    const root = document.createElement('div');
    root.className = 'pk-selection-editor';
    root.hidden = true;
    root.setAttribute('role', 'toolbar');
    root.setAttribute('aria-label', 'Nuotin muokkaus');
    root.innerHTML = `
      <button type="button" data-action="flat" data-mode="single" aria-label="Alenna tai kirjoita enharmonisesti alennusmerkkisenä">♭</button>
      <button type="button" data-action="up" data-mode="both" aria-label="Siirrä sävelaskel ylöspäin">↑</button>
      <button type="button" data-action="down" data-mode="both" aria-label="Siirrä sävelaskel alaspäin">↓</button>
      <button type="button" data-action="sharp" data-mode="single" aria-label="Ylennä tai kirjoita enharmonisesti ylennysmerkkisenä">♯</button>
      <button type="button" data-action="delete" data-mode="both" aria-label="Poista valinta" class="is-delete">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 8v10m4-10v10m4-10v10M5 5h14M9 5l1-2h4l1 2m3 0-1 16H7L6 5"/></svg>
      </button>
      <button type="button" data-action="copy" data-mode="range" aria-label="Kopioi valittu jakso kappaleen loppuun" class="is-range-action">
        <svg viewBox="0 0 28 24" aria-hidden="true"><rect x="2.5" y="5" width="9" height="13" rx="1.5"/><rect x="8" y="2" width="9" height="13" rx="1.5"/><path d="M18.5 12h6m-2.5-2.5L24.5 12 22 14.5"/></svg>
      </button>
      <button type="button" data-action="beam" data-mode="range" aria-label="Palkita valitut nuotit yhteen" class="is-range-action is-beam">
        <svg viewBox="0 0 28 24" aria-hidden="true"><path d="M5 5v14M13 5v14M21 5v14M5 6h16v4H5z"/><ellipse cx="3.6" cy="18.5" rx="3" ry="2.2" transform="rotate(-18 3.6 18.5)"/><ellipse cx="11.6" cy="18.5" rx="3" ry="2.2" transform="rotate(-18 11.6 18.5)"/><ellipse cx="19.6" cy="18.5" rx="3" ry="2.2" transform="rotate(-18 19.6 18.5)"/></svg>
      </button>`;
    document.body.appendChild(root);
    this.#root = root;
    for (const button of root.querySelectorAll('button')) this.#buttons.set(button.dataset.action, button);

    this.#handlers = { flat:onFlat, up:onUp, down:onDown, sharp:onSharp, delete:onDelete, copy:onCopyToEnd, beam:onBeam };
    root.addEventListener('pointerdown', event => event.stopPropagation());
    root.addEventListener('click', event => {
      const button = event.target.closest('button[data-action]');
      if (!button || button.disabled) return;
      event.preventDefault();
      event.stopPropagation();
      this.#handlers[button.dataset.action]?.();
    });
  }

  update({ visible=false, x=0, staffTop=0, staffBottom=0, noteCount=0, selectionCount=0 } = {}) {
    if (!visible) {
      this.#root.hidden = true;
      return;
    }

    const rangeMode = selectionCount > 1;
    for (const button of this.#buttons.values()) {
      const mode = button.dataset.mode || 'both';
      button.hidden = mode === 'single' ? rangeMode : mode === 'range' ? !rangeMode : false;
    }

    for (const key of ['flat','up','down','sharp']) {
      const button = this.#buttons.get(key);
      if (button && !button.hidden) button.disabled = noteCount <= 0;
    }
    const beam = this.#buttons.get('beam');
    if (beam && !beam.hidden) beam.disabled = noteCount < 2;

    this.#root.setAttribute('aria-label', rangeMode ? 'Alueen muokkaus' : 'Nuotin muokkaus');
    this.#root.hidden = false;
    const width = this.#root.offsetWidth || (rangeMode ? 238 : 238);
    const half = width / 2;
    this.#root.style.left = `${Math.max(half + 6, Math.min(window.innerWidth - half - 6, x))}px`;

    const height = this.#root.offsetHeight || 48;
    const above = staffTop - height - 34;
    const top = above >= 6 ? above : Math.min(window.innerHeight - height - 6, staffBottom + 10);
    this.#root.style.top = `${Math.max(6, top)}px`;
  }

  hide() { this.#root.hidden = true; }
}
