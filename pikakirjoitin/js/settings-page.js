import {
  LAYOUT_DEFAULTS,
  OSMD_DEFAULTS,
  LAYOUT_FIELDS,
  sanitizeLayoutSettings,
  saveLayoutSettings
} from './layout-settings.js';

const PREVIEW_XML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <work><work-title>Otsikko</work-title></work>
  <identification>
    <creator type="composer">Säveltäjä</creator>
    <creator type="lyricist">Sanoittaja</creator>
  </identification>
  <part-list><score-part id="P1"><part-name>Music</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>4</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>
      <direction placement="above"><direction-type><words>Allegro</words></direction-type></direction>
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>4</duration><type>quarter</type></note>
      <note><pitch><step>D</step><octave>5</octave></pitch><duration>4</duration><type>quarter</type></note>
      <note><pitch><step>E</step><octave>5</octave></pitch><duration>4</duration><type>quarter</type></note>
      <note><pitch><step>F</step><octave>5</octave></pitch><duration>4</duration><type>quarter</type></note>
    </measure>
    <measure number="2">
      <note><pitch><step>G</step><octave>5</octave></pitch><duration>8</duration><type>half</type></note>
      <note><pitch><step>E</step><octave>5</octave></pitch><duration>8</duration><type>half</type></note>
    </measure>
    <measure number="3">
      <print new-system="yes"/>
      <direction placement="above"><direction-type><words>ritardando</words></direction-type></direction>
      <note><pitch><step>F</step><octave>5</octave></pitch><duration>4</duration><type>quarter</type></note>
      <note><pitch><step>E</step><octave>5</octave></pitch><duration>4</duration><type>quarter</type></note>
      <note><pitch><step>D</step><octave>5</octave></pitch><duration>4</duration><type>quarter</type></note>
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>4</duration><type>quarter</type></note>
    </measure>
    <measure number="4">
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>16</duration><type>whole</type></note>
    </measure>
  </part>
</score-partwise>`;

function setRules(osmd, settings) {
  const rules = osmd?.EngravingRules;
  if (!rules) return;
  for (const field of LAYOUT_FIELDS) rules[field.key] = Number(settings[field.key]);
}

export class SettingsPage {
  #page;
  #mainApp;
  #previewContainer;
  #controls = new Map();
  #draft;
  #saved;
  #previewOsmd = null;
  #previewPreset = '';
  #previewTimer = 0;
  #onSave;

  constructor({ page, mainApp, initialSettings, onSave }) {
    this.#page = page;
    this.#mainApp = mainApp;
    this.#previewContainer = page.querySelector('#settingsPreview');
    this.#saved = sanitizeLayoutSettings(initialSettings);
    this.#draft = { ...this.#saved };
    this.#onSave = onSave;

    this.#buildControls();
    this.#bind();
    this.#syncControls();
  }

  get settings() { return { ...this.#saved }; }

  open() {
    this.#draft = { ...this.#saved };
    this.#syncControls();
    this.#page.hidden = false;
    this.#mainApp.inert = true;
    this.#mainApp.setAttribute('aria-hidden','true');
    requestAnimationFrame(() => this.#schedulePreview(0));
  }

  close() {
    window.clearTimeout(this.#previewTimer);
    this.#page.hidden = true;
    this.#mainApp.inert = false;
    this.#mainApp.setAttribute('aria-hidden','false');
  }

  #buildControls() {
    const list = this.#page.querySelector('#layoutSettingRows');
    list.replaceChildren();
    for (const field of LAYOUT_FIELDS) {
      const row = document.createElement('div');
      row.className = 'layout-setting-row';
      row.innerHTML = `
        <label class="layout-setting-label" for="layout-range-${field.key}">${field.label}</label>
        <input class="layout-setting-range" id="layout-range-${field.key}" type="range"
               min="${field.min}" max="${field.max}" step="${field.step}" aria-label="${field.label}">
        <input class="layout-setting-number" id="layout-number-${field.key}" type="number"
               min="${field.min}" max="${field.max}" step="${field.step}" inputmode="decimal" aria-label="${field.label}, tarkka arvo">
      `;
      list.append(row);
      this.#controls.set(field.key, {
        field,
        range: row.querySelector('.layout-setting-range'),
        number: row.querySelector('.layout-setting-number')
      });
    }
  }

  #bind() {
    const preset = this.#page.querySelector('#layoutPresetSelect');
    preset.addEventListener('change', () => {
      this.#draft.drawingParameters = preset.value;
      this.#schedulePreview();
    });

    for (const [key, control] of this.#controls) {
      control.range.addEventListener('input', () => {
        control.number.value = control.range.value;
        this.#draft[key] = Number(control.range.value);
        this.#schedulePreview();
      });
      control.number.addEventListener('input', () => {
        if (control.number.value === '') return;
        const next = sanitizeLayoutSettings({ ...this.#draft, [key]: Number(control.number.value) });
        this.#draft[key] = next[key];
        control.range.value = String(next[key]);
        this.#schedulePreview();
      });
      control.number.addEventListener('change', () => {
        this.#draft = sanitizeLayoutSettings(this.#draft);
        this.#syncControls();
        this.#schedulePreview();
      });
    }

    this.#page.querySelector('#settingsCloseButton').addEventListener('click', () => this.close());
    this.#page.querySelector('#settingsCancelButton').addEventListener('click', () => this.close());
    this.#page.querySelector('#settingsPkDefaultsButton').addEventListener('click', () => {
      this.#draft = { ...LAYOUT_DEFAULTS };
      this.#syncControls();
      this.#schedulePreview(0);
    });
    this.#page.querySelector('#settingsOsmdDefaultsButton').addEventListener('click', () => {
      this.#draft = { ...OSMD_DEFAULTS };
      this.#syncControls();
      this.#schedulePreview(0);
    });
    this.#page.querySelector('#settingsSaveButton').addEventListener('click', async () => {
      this.#saved = saveLayoutSettings(this.#draft);
      this.#draft = { ...this.#saved };
      await this.#onSave?.({ ...this.#saved });
      this.close();
    });
  }

  #syncControls() {
    this.#draft = sanitizeLayoutSettings(this.#draft);
    this.#page.querySelector('#layoutPresetSelect').value = this.#draft.drawingParameters;
    for (const [key, control] of this.#controls) {
      const value = this.#draft[key];
      control.range.value = String(value);
      control.number.value = String(value);
    }
  }

  #schedulePreview(delay = 120) {
    window.clearTimeout(this.#previewTimer);
    this.#previewTimer = window.setTimeout(() => void this.#renderPreview(), delay);
  }

  #createPreviewOsmd(preset) {
    const OSMD = window.opensheetmusicdisplay?.OpenSheetMusicDisplay;
    if (!OSMD) return null;
    this.#previewContainer.replaceChildren();
    const osmd = new OSMD(this.#previewContainer, {
      backend:'svg',
      autoResize:false,
      drawingParameters:preset,
      drawTitle:true,
      drawSubtitle:false,
      drawComposer:true,
      drawLyricist:true,
      drawCredits:false,
      drawPartNames:false,
      drawMeasureNumbers:false,
      newSystemFromXML:true,
      stretchLastSystemLine:false
    });
    this.#previewPreset = preset;
    return osmd;
  }

  async #renderPreview() {
    if (this.#page.hidden) return;
    const settings = sanitizeLayoutSettings(this.#draft);
    try {
      if (!this.#previewOsmd || this.#previewPreset !== settings.drawingParameters) {
        this.#previewOsmd = this.#createPreviewOsmd(settings.drawingParameters);
        if (!this.#previewOsmd) return;
      }
      await this.#previewOsmd.load(PREVIEW_XML);
      setRules(this.#previewOsmd, settings);
      this.#previewOsmd.Zoom = 0.82;
      await this.#previewOsmd.render();
    } catch (error) {
      console.error('Asetusten esikatselu epäonnistui:', error);
    }
  }
}
