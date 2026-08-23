export class SelectionEditor {
  #root;

  constructor({ onEnharmonic, onDelete } = {}) {
    const root = document.createElement('div');
    root.className = 'pk-selection-editor';
    root.hidden = true;
    root.setAttribute('role', 'toolbar');
    root.setAttribute('aria-label', 'Valitun nuotin muokkaus');
    root.innerHTML = `
      <button type="button" data-action="enharmonic" aria-label="Enharmoninen vaihto" title="Enharmoninen vaihto">
        <span class="pk-enharmonic-icon" aria-hidden="true">♯↔♭</span>
      </button>
      <button type="button" data-action="delete" aria-label="Poista nuotti" title="Poista nuotti" class="is-delete">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 8v10m4-10v10m4-10v10M5 5h14M9 5l1-2h4l1 2m3 0-1 16H7L6 5"/></svg>
      </button>`;
    document.body.appendChild(root);
    this.#root = root;

    root.addEventListener('pointerdown', event => event.stopPropagation());
    root.addEventListener('click', event => {
      const button = event.target.closest('button[data-action]');
      if (!button || button.disabled) return;
      event.preventDefault();
      event.stopPropagation();
      if (button.dataset.action === 'enharmonic') onEnharmonic?.();
      if (button.dataset.action === 'delete') onDelete?.();
    });
  }

  update({ visible=false, x=0, staffTop=0, staffBottom=0, canEnharmonic=true } = {}) {
    if (!visible) {
      this.#root.hidden = true;
      return;
    }

    const enharmonic = this.#root.querySelector('[data-action="enharmonic"]');
    enharmonic.disabled = !canEnharmonic;
    this.#root.hidden = false;

    const width = this.#root.offsetWidth || 104;
    const half = width / 2;
    this.#root.style.left = `${Math.max(half + 6, Math.min(window.innerWidth - half - 6, x))}px`;

    const height = this.#root.offsetHeight || 46;
    const above = staffTop - height - 34;
    const top = above >= 6 ? above : Math.min(window.innerHeight - height - 6, staffBottom + 10);
    this.#root.style.top = `${Math.max(6, top)}px`;
  }

  hide() { this.#root.hidden = true; }
}
