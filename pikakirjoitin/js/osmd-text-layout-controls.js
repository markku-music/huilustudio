const STORAGE_KEY = 'pikakirjoitin2.osmdTextLayout.v1';

export const DEFAULT_OSMD_TEXT_LAYOUT = Object.freeze({
  TitleTopDistance: 5,
  TempoYSpacing: 0.5,
  SystemComposerDistance: 2,
  tempoOffsetDivisions: 0
});

function finite(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_OSMD_TEXT_LAYOUT };
    const parsed = JSON.parse(raw);
    return {
      TitleTopDistance: finite(parsed.TitleTopDistance, DEFAULT_OSMD_TEXT_LAYOUT.TitleTopDistance),
      TempoYSpacing: finite(parsed.TempoYSpacing, DEFAULT_OSMD_TEXT_LAYOUT.TempoYSpacing),
      SystemComposerDistance: finite(parsed.SystemComposerDistance, DEFAULT_OSMD_TEXT_LAYOUT.SystemComposerDistance),
      tempoOffsetDivisions: Math.round(finite(parsed.tempoOffsetDivisions, DEFAULT_OSMD_TEXT_LAYOUT.tempoOffsetDivisions))
    };
  } catch {
    return { ...DEFAULT_OSMD_TEXT_LAYOUT };
  }
}

function save(values) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(values)); } catch {}
}

function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const area = document.createElement('textarea');
  area.value = text;
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  try { document.execCommand('copy'); } finally { area.remove(); }
  return Promise.resolve();
}

export class OsmdTextLayoutControls {
  #root;
  #panel;
  #renderer;
  #values;
  #inputs = new Map();
  #readouts = new Map();
  #timer = 0;

  constructor({ root, renderer }) {
    this.#root = root;
    this.#renderer = renderer;
    this.#values = loadSaved();
    this.#build();
    this.#apply(false);
  }

  #build() {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'osmd-layout-toggle';
    toggle.textContent = 'ASETTELU';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Avaa OSMD-tekstiasettelun säädöt');

    const panel = document.createElement('section');
    panel.className = 'osmd-layout-panel';
    panel.hidden = true;
    panel.setAttribute('aria-label', 'OSMD-tekstiasettelu');
    panel.innerHTML = `
      <div class="osmd-layout-title">OSMD-TEKSTIASETTELU</div>
      <div class="osmd-layout-help">Säädöt muuttavat OSMD:n omaa ladontaa. Tempo X siirtyy MusicXML:n rytmisen offsetin avulla.</div>
      ${this.#row('TitleTopDistance', 'Otsikko Y', 0, 14, 0.1)}
      ${this.#row('tempoOffsetDivisions', 'Tempo X', 0, 32, 1)}
      ${this.#row('TempoYSpacing', 'Tempo Y', -4, 8, 0.1)}
      ${this.#row('SystemComposerDistance', 'Säveltäjä Y', -4, 12, 0.1)}
      <div class="osmd-layout-actions">
        <button type="button" data-action="reset">PALAUTA</button>
        <button type="button" data-action="copy">KOPIOI JSON</button>
      </div>
      <div class="osmd-layout-status" role="status" aria-live="polite"></div>
    `;

    this.#root.append(toggle, panel);
    this.#panel = panel;

    // Paneelin eleet eivät saa käynnistää nuottialueen valintaelettä.
    for (const type of ['pointerdown','pointermove','pointerup','pointercancel']) {
      panel.addEventListener(type, ev => ev.stopPropagation());
      toggle.addEventListener(type, ev => ev.stopPropagation());
    }

    toggle.addEventListener('click', ev => {
      ev.stopPropagation();
      panel.hidden = !panel.hidden;
      toggle.setAttribute('aria-expanded', String(!panel.hidden));
    });

    for (const input of panel.querySelectorAll('input[type="range"]')) {
      const key = input.dataset.key;
      const output = panel.querySelector(`[data-readout="${key}"]`);
      this.#inputs.set(key, input);
      this.#readouts.set(key, output);
      input.value = String(this.#values[key]);
      this.#updateReadout(key);
      input.addEventListener('input', () => {
        const raw = Number(input.value);
        this.#values[key] = key === 'tempoOffsetDivisions' ? Math.round(raw) : raw;
        this.#updateReadout(key);
        save(this.#values);
        window.clearTimeout(this.#timer);
        this.#timer = window.setTimeout(() => this.#apply(true), 35);
      });
    }

    panel.querySelector('[data-action="reset"]').addEventListener('click', () => {
      this.#values = { ...DEFAULT_OSMD_TEXT_LAYOUT };
      for (const [key, input] of this.#inputs) {
        input.value = String(this.#values[key]);
        this.#updateReadout(key);
      }
      save(this.#values);
      this.#apply(true);
      this.#status('OSMD-oletukset palautettu.');
    });

    panel.querySelector('[data-action="copy"]').addEventListener('click', async () => {
      const json = JSON.stringify({
        version: 1,
        units: {
          engravingRules: 'OSMD staff-space units',
          tempoOffsetDivisions: 'MusicXML divisions (quarter note = 16)'
        },
        ...this.#values
      }, null, 2);
      try {
        await copyText(json);
        this.#status('JSON kopioitu.');
      } catch {
        this.#status('Kopiointi epäonnistui.');
      }
    });
  }

  #row(key, label, min, max, step) {
    return `
      <label class="osmd-layout-row">
        <span>${label}</span>
        <input type="range" data-key="${key}" min="${min}" max="${max}" step="${step}">
        <output data-readout="${key}"></output>
      </label>
    `;
  }

  #updateReadout(key) {
    const output = this.#readouts.get(key);
    if (!output) return;
    const value = this.#values[key];
    output.textContent = key === 'tempoOffsetDivisions'
      ? String(Math.round(value))
      : Number(value).toFixed(1);
  }

  #apply(render) {
    this.#renderer.setTextLayout(this.#values, { render });
  }

  #status(text) {
    const status = this.#panel.querySelector('.osmd-layout-status');
    status.textContent = text;
    window.setTimeout(() => {
      if (status.textContent === text) status.textContent = '';
    }, 1600);
  }
}
