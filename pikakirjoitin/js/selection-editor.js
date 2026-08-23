export class SelectionEditor {
  #root;
  #buttons = new Map();

  constructor({ onFlat, onUp, onDown, onSharp, onDelete } = {}) {
    const root = document.createElement('div');
    root.className = 'pk-selection-editor';
    root.hidden = true;
    root.setAttribute('role', 'toolbar');
    root.setAttribute('aria-label', 'Nuotin muokkaus');
    root.innerHTML = `
      <button type="button" data-action="flat" aria-label="Alenna tai kirjoita enharmonisesti alennusmerkkisenä">♭</button>
      <button type="button" data-action="up" aria-label="Siirrä sävelaskel ylöspäin">↑</button>
      <button type="button" data-action="down" aria-label="Siirrä sävelaskel alaspäin">↓</button>
      <button type="button" data-action="sharp" aria-label="Ylennä tai kirjoita enharmonisesti ylennysmerkkisenä">♯</button>
      <button type="button" data-action="delete" aria-label="Poista valinta" class="is-delete">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 8v10m4-10v10m4-10v10M5 5h14M9 5l1-2h4l1 2m3 0-1 16H7L6 5"/></svg>
      </button>`;
    document.body.appendChild(root);
    this.#root = root;
    for (const button of root.querySelectorAll('button')) this.#buttons.set(button.dataset.action, button);

    const handlers = { flat:onFlat, up:onUp, down:onDown, sharp:onSharp, delete:onDelete };
    root.addEventListener('pointerdown', event => event.stopPropagation());
    root.addEventListener('click', event => {
      const button = event.target.closest('button[data-action]');
      if (!button || button.disabled) return;
      event.preventDefault();
      event.stopPropagation();
      handlers[button.dataset.action]?.();
    });
  }

  update({ visible=false, x=0, staffTop=0, staffBottom=0, noteCount=0 } = {}) {
    if (!visible) {
      this.#root.hidden = true;
      return;
    }

    const pitchDisabled = noteCount <= 0;
    for (const key of ['flat','up','down','sharp']) this.#buttons.get(key).disabled = pitchDisabled;

    this.#root.hidden = false;
    const width = this.#root.offsetWidth || 238;
    const half = width / 2;
    this.#root.style.left = `${Math.max(half + 6, Math.min(window.innerWidth - half - 6, x))}px`;

    // Palkki mieluiten viivaston yläpuolelle. Jos tila loppuu, laitetaan se alle.
    const height = this.#root.offsetHeight || 48;
    const above = staffTop - height - 34;
    const top = above >= 6 ? above : Math.min(window.innerHeight - height - 6, staffBottom + 10);
    this.#root.style.top = `${Math.max(6, top)}px`;
  }

  hide() { this.#root.hidden = true; }
}
