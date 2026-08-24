export const LAYOUT_STORAGE_KEY = 'pikakirjoitin2.osmdLayoutSettings.v1';

export const LAYOUT_DEFAULTS = Object.freeze({
  drawingParameters: 'compact',
  SheetTitleHeight: 4,
  TitleTopDistance: 5,
  TitleBottomDistance: 1,
  SheetComposerHeight: 2,
  SystemComposerDistance: 2,
  SystemLyricistDistance: 2,
  InstantaneousTempoTextHeight: 2.3,
  ContinuousTempoTextHeight: 2.3,
  TempoYSpacing: 0.5
});

export const OSMD_DEFAULTS = Object.freeze({
  ...LAYOUT_DEFAULTS,
  drawingParameters: 'default'
});

export const LAYOUT_FIELDS = Object.freeze([
  { key:'SheetTitleHeight', label:'Otsikon koko', min:2, max:8, step:0.25 },
  { key:'TitleTopDistance', label:'Otsikon etäisyys sivun yläosasta', min:0, max:15, step:0.5 },
  { key:'TitleBottomDistance', label:'Otsikon jälkeinen tila', min:0, max:10, step:0.5 },
  { key:'SheetComposerHeight', label:'Säveltäjän koko', min:1, max:5, step:0.25 },
  { key:'SystemComposerDistance', label:'Säveltäjän etäisyys systeemistä', min:0, max:10, step:0.5 },
  { key:'SystemLyricistDistance', label:'Sanoittajan etäisyys systeemistä', min:0, max:10, step:0.5 },
  { key:'InstantaneousTempoTextHeight', label:'Tempotekstin koko', min:1, max:5, step:0.1 },
  { key:'ContinuousTempoTextHeight', label:'Jatkuvan tempotekstin koko', min:1, max:5, step:0.1 },
  { key:'TempoYSpacing', label:'Tempon pystysuuntainen välys', min:0, max:5, step:0.1 }
]);

const PRESETS = new Set(['default','compact','compacttight']);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundToStep(value, step) {
  const decimals = String(step).split('.')[1]?.length || 0;
  return Number((Math.round(value / step) * step).toFixed(decimals));
}

export function sanitizeLayoutSettings(input = {}) {
  const output = { ...LAYOUT_DEFAULTS };
  output.drawingParameters = PRESETS.has(input.drawingParameters)
    ? input.drawingParameters
    : LAYOUT_DEFAULTS.drawingParameters;

  for (const field of LAYOUT_FIELDS) {
    const raw = Number(input[field.key]);
    if (!Number.isFinite(raw)) continue;
    output[field.key] = roundToStep(clamp(raw, field.min, field.max), field.step);
  }
  return output;
}

export function loadLayoutSettings() {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) return { ...LAYOUT_DEFAULTS };
    return sanitizeLayoutSettings(JSON.parse(raw));
  } catch {
    return { ...LAYOUT_DEFAULTS };
  }
}

export function saveLayoutSettings(settings) {
  const safe = sanitizeLayoutSettings(settings);
  try { localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(safe)); } catch {}
  return safe;
}
