export class SelectionEditor {
  #root;
  #buttons = new Map();
  #handlers;
  #view = 'primary';
  #lastState = {};
  #selectionKey = '';

  constructor({ onFlat, onSharp, onDelete, onCopyToEnd, onBeam, onBeamBreak } = {}) {
    const root = document.createElement('div');
    root.className = 'pk-selection-editor';
    root.hidden = true;
    root.setAttribute('role', 'toolbar');
    root.setAttribute('aria-label', 'Nuotin muokkaus');
    root.innerHTML = `
      <button type="button" data-action="accidental-menu" data-mode="single" data-view="primary" aria-label="Etumerkki ja enharmoninen kirjoitusasu" class="is-accidental-menu"><span aria-hidden="true">♭♯</span></button>
      <button type="button" data-action="beam-break" data-mode="single" data-view="primary" aria-label="Katkaise palkki ennen valittua nuottia" aria-pressed="false" class="is-beam-break">
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
      <button type="button" data-action="delete" data-mode="both" data-view="primary" aria-label="Poista valinta" class="is-delete">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 8v10m4-10v10m4-10v10M5 5h14M9 5l1-2h4l1 2m3 0-1 16H7L6 5"/></svg>
      </button>
      <button type="button" data-action="copy" data-mode="range" data-view="primary" aria-label="Kopioi valittu jakso kappaleen loppuun" class="is-range-action">
        <svg viewBox="0 0 28 24" aria-hidden="true"><rect x="2.5" y="5" width="9" height="13" rx="1.5"/><rect x="8" y="2" width="9" height="13" rx="1.5"/><path d="M18.5 12h6m-2.5-2.5L24.5 12 22 14.5"/></svg>
      </button>
      <button type="button" data-action="beam" data-mode="range" data-view="primary" aria-label="Palkita valitut nuotit yhteen" class="is-range-action is-beam">
        <svg viewBox="0 0 28 24" aria-hidden="true"><path d="M5 5v14M13 5v14M21 5v14M5 6h16v4H5z"/><ellipse cx="3.6" cy="18.5" rx="3" ry="2.2" transform="rotate(-18 3.6 18.5)"/><ellipse cx="11.6" cy="18.5" rx="3" ry="2.2" transform="rotate(-18 11.6 18.5)"/><ellipse cx="19.6" cy="18.5" rx="3" ry="2.2" transform="rotate(-18 19.6 18.5)"/></svg>
      </button>

      <button type="button" data-action="flat" data-mode="single" data-view="accidental" aria-label="Alenna tai kirjoita enharmonisesti alennusmerkkisenä" class="is-accidental-choice">♭</button>
      <button type="button" data-action="sharp" data-mode="single" data-view="accidental" aria-label="Ylennä tai kirjoita enharmonisesti ylennysmerkkisenä" class="is-accidental-choice">♯</button>
      <button type="button" data-action="accidental-back" data-mode="single" data-view="accidental" aria-label="Palaa nuotin työkaluihin" class="is-editor-back">←</button>`;
    document.body.appendChild(root);
    this.#root = root;
    for (const button of root.querySelectorAll('button')) this.#buttons.set(button.dataset.action, button);

    this.#handlers = { flat:onFlat, sharp:onSharp, delete:onDelete, copy:onCopyToEnd, beam:onBeam, 'beam-break':onBeamBreak };
    root.addEventListener('pointerdown', event => event.stopPropagation());
    root.addEventListener('click', event => {
      const button = event.target.closest('button[data-action]');
      if (!button || button.disabled) return;
      event.preventDefault();
      event.stopPropagation();

      const action = button.dataset.action;
      if (action === 'accidental-menu') {
        this.#view = 'accidental';
        this.#renderState();
        return;
      }
      if (action === 'accidental-back') {
        this.#view = 'primary';
        this.#renderState();
        return;
      }

      this.#handlers[action]?.();
      if (action === 'flat' || action === 'sharp') {
        this.#view = 'primary';
        this.#renderState();
      }
    });
  }

  #renderState() {
    const {
      visible=false, x=0, staffTop=0, staffBottom=0,
      noteCount=0, selectionCount=0,
      beamBreakEnabled=false, beamBreakActive=false
    } = this.#lastState;

    if (!visible) {
      this.#root.hidden = true;
      return;
    }

    const rangeMode = selectionCount > 1;
    if (rangeMode) this.#view = 'primary';

    for (const button of this.#buttons.values()) {
      const mode = button.dataset.mode || 'both';
      const view = button.dataset.view || 'primary';
      const modeMatches = mode === 'both' || (mode === 'single' ? !rangeMode : rangeMode);
      button.hidden = !modeMatches || view !== this.#view;
    }

    const accidentalMenu = this.#buttons.get('accidental-menu');
    if (accidentalMenu && !accidentalMenu.hidden) accidentalMenu.disabled = noteCount <= 0;
    for (const key of ['flat','sharp']) {
      const button = this.#buttons.get(key);
      if (button && !button.hidden) button.disabled = noteCount <= 0;
    }

    const beam = this.#buttons.get('beam');
    if (beam && !beam.hidden) beam.disabled = noteCount < 2;

    const beamBreak = this.#buttons.get('beam-break');
    if (beamBreak && !beamBreak.hidden) {
      beamBreak.disabled = !beamBreakEnabled;
      beamBreak.setAttribute('aria-pressed', beamBreakActive ? 'true' : 'false');
    }

    this.#root.setAttribute(
      'aria-label',
      rangeMode ? 'Alueen muokkaus' : this.#view === 'accidental' ? 'Etumerkin valinta' : 'Nuotin muokkaus'
    );
    this.#root.hidden = false;

    const width = this.#root.offsetWidth || 136;
    const half = width / 2;
    this.#root.style.left = `${Math.max(half + 6, Math.min(window.innerWidth - half - 6, x))}px`;

    const height = this.#root.offsetHeight || 52;
    const above = staffTop - height - 34;
    const top = above >= 6 ? above : Math.min(window.innerHeight - height - 6, staffBottom + 10);
    this.#root.style.top = `${Math.max(6, top)}px`;
  }

  update(state = {}) {
    const nextKey = String(state.selectionKey || '');
    if (nextKey !== this.#selectionKey) {
      this.#selectionKey = nextKey;
      this.#view = 'primary';
    }
    this.#lastState = { ...state };
    this.#renderState();
  }

  hide() {
    this.#view = 'primary';
    this.#root.hidden = true;
  }
}
