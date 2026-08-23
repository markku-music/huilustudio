const NATURAL_PITCH_CLASS = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
const STEP_ORDER = ['C','D','E','F','G','A','B'];
const SHARP_ORDER = ['F','C','G','D','A','E','B'];
const FLAT_ORDER = ['B','E','A','D','G','C','F'];
const SHARPS = [
  ['C',0], ['C',1], ['D',0], ['D',1], ['E',0], ['F',0],
  ['F',1], ['G',0], ['G',1], ['A',0], ['A',1], ['B',0]
];
const FLATS = [
  ['C',0], ['D',-1], ['D',0], ['E',-1], ['E',0], ['F',0],
  ['G',-1], ['G',0], ['A',-1], ['A',0], ['B',-1], ['B',0]
];

const MINOR_LEADING_SPELLINGS = {
  A:['G',1], E:['D',1], B:['A',1], 'F#':['E',1], 'C#':['B',1],
  'G#':['F',2], 'D#':['C',2], 'A#':['G',2],
  D:['C',1], G:['F',1], C:['B',0], F:['E',0], Bb:['A',0],
  Eb:['D',0], Ab:['G',0]
};

function mod(value, divisor) { return ((value % divisor) + divisor) % divisor; }

function leadingToneSpelling(midi, { keyMode='major', keyTonic='C' } = {}) {
  if (keyMode !== 'minor') return null;
  const spelling = MINOR_LEADING_SPELLINGS[keyTonic];
  if (!spelling) return null;
  const pc = mod(NATURAL_PITCH_CLASS[spelling[0]] + spelling[1], 12);
  return mod(Number(midi), 12) === pc ? spelling : null;
}

function forcedSpelling(midi, preference) {
  if (preference === 'flat') return FLATS[mod(Number(midi),12)];
  if (preference === 'sharp') return SHARPS[mod(Number(midi),12)];
  return null;
}

function useFlats(midi, index, notes, settings) {
  const keySignature = Number(settings?.keySignature) || 0;
  const leading = leadingToneSpelling(midi, settings);
  if (leading) return leading[1] < 0;
  if (keySignature < 0) return true;
  if (keySignature > 0) return false;

  const pc = mod(Number(midi), 12);
  if (![1,3,6,8,10].includes(pc)) return false;
  for (let i = index - 1; i >= 0; i -= 1) {
    const previous = notes?.[i];
    if (!previous || previous.kind === 'rest') continue;
    if (Number(previous.midi) > Number(midi)) return true;
    if (Number(previous.midi) < Number(midi)) return false;
    break;
  }
  return false;
}

function keyAlterForStep(step, keySignature=0) {
  const fifths = Number(keySignature) || 0;
  if (fifths > 0 && SHARP_ORDER.slice(0, Math.min(7, fifths)).includes(step)) return 1;
  if (fifths < 0 && FLAT_ORDER.slice(0, Math.min(7, -fifths)).includes(step)) return -1;
  return 0;
}

export function spellMidi(midi, { index=0, notes=[], settings={} } = {}) {
  const source = notes?.[index];
  const forced = forcedSpelling(midi, source?.spellingPreference);
  const leading = forced ? null : leadingToneSpelling(midi, settings);
  const [step, alter] = forced || leading || (useFlats(midi, index, notes, settings) ? FLATS : SHARPS)[mod(Number(midi), 12)];
  const octave = (Number(midi) - NATURAL_PITCH_CLASS[step] - alter) / 12 - 1;
  return { step, alter, octave };
}

/**
 * Siirtää nuottia yhden viivastoaskeleen. Kohdesävelen etumerkki tulee
 * sävellajista, joten esim. As-duurissa G -> As ja D -> Es.
 */
export function moveDiatonic(midi, direction, { index=0, notes=[], settings={} } = {}) {
  const current = spellMidi(midi, { index, notes, settings });
  const currentIndex = STEP_ORDER.indexOf(current.step);
  const delta = direction > 0 ? 1 : -1;
  let targetIndex = currentIndex + delta;
  let octave = current.octave;
  if (targetIndex > 6) { targetIndex = 0; octave += 1; }
  if (targetIndex < 0) { targetIndex = 6; octave -= 1; }
  const step = STEP_ORDER[targetIndex];
  const alter = keyAlterForStep(step, settings?.keySignature);
  const targetMidi = (octave + 1) * 12 + NATURAL_PITCH_CLASS[step] + alter;
  return { midi: targetMidi, spellingPreference: null };
}
