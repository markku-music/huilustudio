export class SelectionEditor {
  #root;
  #buttons = new Map();
  #handlers;
  #spellingPopover;
  #spellingOptions = [];

  constructor({ onDelete, onCopyToEnd, onBeam, onBeamBreak, onSpellingChoice } = {}) {
    const root = document.createElement('div');
    root.className = 'pk-selection-editor';
    root.hidden = true;
    root.setAttribute('role', 'toolbar');
    root.setAttribute('aria-label', 'Nuotin muokkaus');
    root.innerHTML = `
      <button type="button" data-action="spelling" data-mode="single" aria-label="Valitse sävelasu" aria-haspopup="listbox" aria-expanded="false" class="is-spelling">
        <span class="spelling-current">♯/♭</span>
        <svg class="spelling-chevron" viewBox="0 0 12 8" aria-hidden="true"><path d="M2 2l4 4 4-4"/></svg>
      </button>
      <button type="button" data-action="beam-break" data-mode="single" aria-label="Katkaise palkki ennen valittua nuottia" aria-pressed="false" class="is-beam-break">
        <svg viewBox="0 0 30 24" aria-hidden="true">
          <path d="M4 5v14M12 5v14M18 5v14M26 5v14"/>
          <path d="M4 6h8v4H4zM18 6h8v4h-8z"/>
          <ellipse cx="2.8" cy="18.5" rx="2.8" ry="2.1" transform="rotate(-18 2.8 18.5)"/>
          <ellipse cx="10.8" cy="18.5" rx="2.8" ry="2.1" transform="rotate(-18 10.8 18.5)"/>
          <ellipse cx="16.8" cy="18.5" rx="2.8" ry="2.1" transform="rotate(-18 16.8 18.5)"/>
          <ellipse cx="24.8" cy="18.5" rx="2.8" ry="2.1" transform="rotate(-18 24.8 18.5)"/>
          <path class="beam-cut-mark" d="M15 3v9"/>
        </svg>
      </button>
      <button type="button" data-action="delete" data-mode="both" aria-label="Poista valinta" class="is-delete">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 8v10m4-10v10m4-10v10M5 5h14M9 5l1-2h4l1 2m3 0-1 16H7L6 5"/></svg>
      </button>
      <button type="button" data-action="copy" data-mode="range" aria-label="Kopioi valittu jakso kappaleen loppuun" class="is-range-action">
        <svg viewBox="0 0 28 24" aria-hidden="true"><rect x="2.5" y="5" width="9" height="13" rx="1.5"/><rect x="8" y="2" width="9" height="13" rx="1.5"/><path d="M18.5 12h6m-2.5-2.5L24.5 12 22 14.5"/></svg>
      </button>
      <button type="button" data-action="beam" data-mode="range" aria-label="Palkita valitut nuotit yhteen" class="is-range-action is-beam">
        <svg viewBox="0 0 28 24" aria-hidden="true"><path d="M5 5v14M13 5v14M21 5v14M5 6h16v4H5z"/><ellipse cx="3.6" cy="18.5" rx="3" ry="2.2" transform="rotate(-18 3.6 18.5)"/><ellipse cx="11.6" cy="18.5" rx="3" ry="2.2" transform="rotate(-18 11.6 18.5)"/><ellipse cx="19.6" cy="18.5" rx="3" ry="2.2" transform="rotate(-18 19.6 18.5)"/></svg>
      </button>
      <div class="pk-spelling-popover" role="listbox" aria-label="Sävelasun vaihtoehdot" hidden></div>`;
    document.body.appendChild(root);
    this.#root = root;
    this.#spellingPopover = root.querySelector('.pk-spelling-popover');
    for (const button of root.querySelectorAll(':scope > button[data-action]')) this.#buttons.set(button.dataset.action, button);

    this.#handlers = { delete:onDelete, copy:onCopyToEnd, beam:onBeam, 'beam-break':onBeamBreak, spelling:onSpellingChoice };
    root.addEventListener('pointerdown', event => event.stopPropagation());
    root.addEventListener('click', event => {
      const choice = event.target.closest('button[data-spelling-index]');
      if (choice) {
        event.preventDefault();
        event.stopPropagation();
        const option = this.#spellingOptions[Number(choice.dataset.spellingIndex)];
        this.#closeSpelling();
        if (option) this.#handlers.spelling?.(option);
        return;
      }

      const button = event.target.closest('button[data-action]');
      if (!button || button.disabled) return;
      event.preventDefault();
      event.stopPropagation();
      if (button.dataset.action === 'spelling') {
        this.#toggleSpelling();
        return;
      }
      this.#closeSpelling();
      this.#handlers[button.dataset.action]?.();
    });

    document.addEventListener('pointerdown', event => {
      if (!this.#root.hidden && !this.#root.contains(event.target)) this.#closeSpelling();
    }, true);
  }

  update({ visible=false, x=0, staffTop=0, staffBottom=0, noteCount=0, selectionCount=0, beamBreakEnabled=false, beamBreakActive=false, spellingOptions=[] } = {}) {
    if (!visible) {
      this.#closeSpelling();
      this.#root.hidden = true;
      return;
    }

    const rangeMode = selectionCount > 1;
    if (rangeMode) this.#closeSpelling();
    for (const button of this.#buttons.values()) {
      const mode = button.dataset.mode || 'both';
      button.hidden = mode === 'single' ? rangeMode : mode === 'range' ? !rangeMode : false;
    }

    const spelling = this.#buttons.get('spelling');
    this.#spellingOptions = Array.isArray(spellingOptions) ? spellingOptions : [];
    if (spelling && !spelling.hidden) {
      const current = this.#spellingOptions.find(option => option.current) || this.#spellingOptions[0];
      spelling.disabled = noteCount !== 1 || !current;
      const label = current?.label || '♯/♭';
      spelling.querySelector('.spelling-current').textContent = label;
      spelling.setAttribute('aria-label', `Valitse sävelasu, nykyinen ${label}`);
      this.#renderSpellingOptions();
    }

    const beam = this.#buttons.get('beam');
    if (beam && !beam.hidden) beam.disabled = noteCount < 2;

    const beamBreak = this.#buttons.get('beam-break');
    if (beamBreak && !beamBreak.hidden) {
      beamBreak.disabled = !beamBreakEnabled;
      beamBreak.setAttribute('aria-pressed', beamBreakActive ? 'true' : 'false');
    }

    this.#root.setAttribute('aria-label', rangeMode ? 'Alueen muokkaus' : 'Nuotin muokkaus');
    this.#root.hidden = false;
    const width = this.#root.offsetWidth || (rangeMode ? 156 : 146);
    const half = width / 2;
    this.#root.style.left = `${Math.max(half + 6, Math.min(window.innerWidth - half - 6, x))}px`;

    const height = this.#root.offsetHeight || 48;
    const above = staffTop - height - 34;
    const placeAbove = above >= 6;
    const top = placeAbove ? above : Math.min(window.innerHeight - height - 6, staffBottom + 10);
    this.#root.classList.toggle('is-above-staff', placeAbove);
    this.#root.style.top = `${Math.max(6, top)}px`;
  }

  #renderSpellingOptions() {
    if (!this.#spellingPopover) return;
    this.#spellingPopover.replaceChildren();
    this.#spellingOptions.forEach((option, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.spellingIndex = String(index);
      button.className = 'pk-spelling-choice';
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', option.current ? 'true' : 'false');
      button.textContent = option.label;
      this.#spellingPopover.appendChild(button);
    });
  }

  #toggleSpelling() {
    const button = this.#buttons.get('spelling');
    if (!button || button.disabled || !this.#spellingOptions.length) return;
    const opening = this.#spellingPopover.hidden;
    this.#spellingPopover.hidden = !opening;
    button.setAttribute('aria-expanded', opening ? 'true' : 'false');
  }

  #closeSpelling() {
    if (this.#spellingPopover) this.#spellingPopover.hidden = true;
    this.#buttons.get('spelling')?.setAttribute('aria-expanded', 'false');
  }

  hide() {
    this.#closeSpelling();
    this.#root.hidden = true;
  }
}
