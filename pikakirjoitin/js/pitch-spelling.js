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

function explicitSpelling(midi, source) {
  const explicit = source?.spellingOverride;
  if (!explicit || !Object.hasOwn(NATURAL_PITCH_CLASS, explicit.step)) return null;
  const step = explicit.step;
  const alter = Number(explicit.alter);
  const octave = Number(explicit.octave);
  if (!Number.isFinite(alter) || !Number.isFinite(octave)) return null;
  const expectedMidi = (octave + 1) * 12 + NATURAL_PITCH_CLASS[step] + alter;
  if (expectedMidi !== Number(midi)) return null;
  return [step, alter, octave];
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
  const explicit = explicitSpelling(midi, source);
  if (explicit) return { step:explicit[0], alter:explicit[1], octave:explicit[2] };
  const forced = forcedSpelling(midi, source?.spellingPreference);
  const leading = forced ? null : leadingToneSpelling(midi, settings);
  const [step, alter] = forced || leading || (useFlats(midi, index, notes, settings) ? FLATS : SHARPS)[mod(Number(midi), 12)];
  const octave = (Number(midi) - NATURAL_PITCH_CLASS[step] - alter) / 12 - 1;
  return { step, alter, octave };
}

/**
 * ♯/♭-editorin semantiikka:
 * - luonnollinen sävel: lisää pyydetty etumerkki ja muuttaa soivaa korkeutta 1/2 askelta
 * - vastakkaisella etumerkillä kirjoitettu sävel: enharmoninen uudelleenkirjoitus, soiva korkeus ei muutu
 * - jo samalla etumerkillä kirjoitettu sävel: ei muutosta
 * Kaksoisylennyksiä/-alennuksia ei luoda tässä editorissa.
 */
export function applyAccidental(midi, accidental, { index=0, notes=[], settings={} } = {}) {
  const target = accidental === 'flat' ? -1 : accidental === 'sharp' ? 1 : 0;
  if (!target) return null;
  const current = spellMidi(midi, { index, notes, settings });

  if (Math.sign(Number(current.alter) || 0) === target) return null;

  // Vastakkainen etumerkki: sama soiva sävel, mutta kirjoitusasu vaihdetaan.
  if ((Number(current.alter) || 0) * target < 0) {
    return {
      midi:Number(midi),
      spellingPreference: target > 0 ? 'sharp' : 'flat',
      spellingOverride:null
    };
  }

  // Diatoninen/naturaali sävel: pidetään kirjain ja oktaavi, lisätään ♯ tai ♭.
  const step=current.step;
  const octave=current.octave;
  const nextMidi=(octave + 1) * 12 + NATURAL_PITCH_CLASS[step] + target;
  return {
    midi:nextMidi,
    spellingPreference:null,
    spellingOverride:{ step, alter:target, octave }
  };
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
  return { midi: targetMidi, spellingPreference: null, spellingOverride: null };
}

const DISPLAY_STEP = { C:'C', D:'D', E:'E', F:'F', G:'G', A:'A', B:'H' };

export function formatSpelling({ step, alter=0 } = {}) {
  const base = DISPLAY_STEP[step] || step || '';
  const n = Number(alter) || 0;
  if (n === -2) return `${base}𝄫`;
  if (n === -1) return `${base}♭`;
  if (n === 1) return `${base}♯`;
  if (n === 2) return `${base}𝄪`;
  return base;
}

/**
 * Rakentaa yhden valitun nuotin sävelasuvalikon.
 *
 * Naturaali kirjoitusasu: saman kirjainnimen ♭ / naturaali / ♯. Näissä
 * soiva korkeus muuttuu tarvittaessa puolisävelaskeleen.
 *
 * Jo muunnettu kirjoitusasu: saman soivan sävelen kaikki tavalliset
 * (ei kaksoisetumerkkiä tarvitsevat) enharmoniset kirjoitusasut.
 * Nykyinen mahdollinen kaksoisetumerkkinen asu säilytetään vaihtoehtona,
 * mutta editori ei luo uusia kaksoisetumerkkejä.
 */
export function getSpellingChoices(midi, { index=0, notes=[], settings={} } = {}) {
  const current = spellMidi(midi, { index, notes, settings });
  const currentAlter = Number(current.alter) || 0;
  const choices = [];

  const addChoice = ({ step, alter, octave, midi:choiceMidi }) => {
    if (!Object.hasOwn(NATURAL_PITCH_CLASS, step)) return;
    const key = `${step}:${alter}:${octave}:${choiceMidi}`;
    if (choices.some(choice => choice.key === key)) return;
    choices.push({
      key,
      label: formatSpelling({ step, alter }),
      midi: Number(choiceMidi),
      spellingPreference: null,
      spellingOverride: { step, alter:Number(alter), octave:Number(octave) },
      current: step === current.step && Number(alter) === currentAlter && Number(octave) === Number(current.octave) && Number(choiceMidi) === Number(midi)
    });
  };

  if (currentAlter === 0) {
    for (const alter of [-1, 0, 1]) {
      const choiceMidi = (Number(current.octave) + 1) * 12 + NATURAL_PITCH_CLASS[current.step] + alter;
      addChoice({ step:current.step, alter, octave:current.octave, midi:choiceMidi });
    }
    return choices;
  }

  // Pidä nykyinen asu mukana myös silloin, jos se on esim. mollin johtosävelen
  // vuoksi kaksoisylennetty. Uusia kaksoisetumerkkejä ei kuitenkaan tarjota.
  addChoice({ step:current.step, alter:currentAlter, octave:current.octave, midi:Number(midi) });

  for (const step of STEP_ORDER) {
    for (const alter of [-1, 0, 1]) {
      const octave = (Number(midi) - NATURAL_PITCH_CLASS[step] - alter) / 12 - 1;
      if (!Number.isInteger(octave)) continue;
      addChoice({ step, alter, octave, midi:Number(midi) });
    }
  }

  // Luetaan valikko vasemmalta oikealle alennusmerkkinen -> naturaali -> ylennysmerkkinen.
  choices.sort((a,b) => {
    const aa = Number(a.spellingOverride.alter) || 0;
    const ba = Number(b.spellingOverride.alter) || 0;
    if (aa !== ba) return aa - ba;
    return STEP_ORDER.indexOf(a.spellingOverride.step) - STEP_ORDER.indexOf(b.spellingOverride.step);
  });
  return choices;
}
