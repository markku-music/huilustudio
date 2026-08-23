const NATURAL_PITCH_CLASS = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
const SHARPS = [
  ['C',0], ['C',1], ['D',0], ['D',1], ['E',0], ['F',0],
  ['F',1], ['G',0], ['G',1], ['A',0], ['A',1], ['B',0]
];
const FLATS = [
  ['C',0], ['D',-1], ['D',0], ['E',-1], ['E',0], ['F',0],
  ['G',-1], ['G',0], ['A',-1], ['A',0], ['B',-1], ['B',0]
];

// Sama periaate kuin Pikakirjoitin 1.x:ssä: mollin korotettu johtosävel
// kirjoitetaan teoreettisesti oikein riippumatta etumerkkien yleissuunnasta.
const MINOR_LEADING_SPELLINGS = {
  A:['G',1], E:['D',1], B:['A',1], 'F#':['E',1], 'C#':['B',1],
  'G#':['F',2], 'D#':['C',2], 'A#':['G',2],
  D:['C',1], G:['F',1], C:['B',0], F:['E',0], Bb:['A',0],
  Eb:['D',0], Ab:['G',0]
};

function mod(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function leadingToneSpelling(midi, { keyMode='major', keyTonic='C' } = {}) {
  if (keyMode !== 'minor') return null;
  const spelling = MINOR_LEADING_SPELLINGS[keyTonic];
  if (!spelling) return null;
  const pc = mod(NATURAL_PITCH_CLASS[spelling[0]] + spelling[1], 12);
  return mod(Number(midi), 12) === pc ? spelling : null;
}

function useFlats(midi, index, notes, settings) {
  const keySignature = Number(settings?.keySignature) || 0;
  const leading = leadingToneSpelling(midi, settings);
  if (leading) return leading[1] < 0;
  if (keySignature < 0) return true;
  if (keySignature > 0) return false;

  // C-duuri/a-molli: vanhan Pikakirjoittimen kevyt melodinen heuristiikka.
  // Laskevassa kulussa musta kosketin kirjoitetaan mieluummin alennuksena,
  // nousevassa ylennyksenä. A-mollin G# käsitellään jo yllä johtosävelenä.
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

export function spellMidi(midi, { index=0, notes=[], settings={} } = {}) {
  const leading = leadingToneSpelling(midi, settings);
  const [step, alter] = leading || (useFlats(midi, index, notes, settings) ? FLATS : SHARPS)[mod(Number(midi), 12)];
  const octave = (Number(midi) - NATURAL_PITCH_CLASS[step] - alter) / 12 - 1;
  return { step, alter, octave };
}
