const DIVISIONS = 8;
const MEASURE_CAPACITY = 32;

const DURATIONS = {
  eighth: 4,
  quarter: 8,
  half: 16,
  whole: 32
};

const TYPES = {
  eighth: 'eighth',
  quarter: 'quarter',
  half: 'half',
  whole: 'whole'
};

const SHARP_SPELLING = [
  ['C', 0], ['C', 1], ['D', 0], ['D', 1], ['E', 0], ['F', 0],
  ['F', 1], ['G', 0], ['G', 1], ['A', 0], ['A', 1], ['B', 0]
];

function pitchXml(midi) {
  const pitchClass = ((midi % 12) + 12) % 12;
  const [step, alter] = SHARP_SPELLING[pitchClass];
  const octave = Math.floor(midi / 12) - 1;
  return `<pitch><step>${step}</step>${alter ? `<alter>${alter}</alter>` : ''}<octave>${octave}</octave></pitch>`;
}

function noteXml(note) {
  const duration = DURATIONS[note.duration] ?? DURATIONS.quarter;
  const type = TYPES[note.duration] ?? TYPES.quarter;
  return `<note>${pitchXml(note.midi)}<duration>${duration}</duration><voice>1</voice><type>${type}</type></note>`;
}

function hiddenRestXml(duration) {
  if (duration <= 0) return '';
  return `<note print-object="no"><rest/><duration>${duration}</duration><voice>1</voice></note>`;
}

function packMeasures(notes) {
  const measures = [];
  let current = [];
  let used = 0;

  for (const note of notes) {
    const duration = DURATIONS[note.duration] ?? DURATIONS.quarter;
    if (used > 0 && used + duration > MEASURE_CAPACITY) {
      measures.push({ notes: current, used });
      current = [];
      used = 0;
    }
    current.push(note);
    used += duration;
    if (used >= MEASURE_CAPACITY) {
      measures.push({ notes: current, used: MEASURE_CAPACITY });
      current = [];
      used = 0;
    }
  }

  if (current.length) measures.push({ notes: current, used });
  if (!measures.length) measures.push({ notes: [], used: 0 });
  return measures;
}

export function buildMusicXml(notes) {
  const measures = packMeasures(notes).map((measure, index) => {
    const attributes = index === 0
      ? `<attributes><divisions>${DIVISIONS}</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>`
      : '';

    const content = measure.notes.length
      ? measure.notes.map(noteXml).join('') + hiddenRestXml(MEASURE_CAPACITY - measure.used)
      : `<note><rest measure="yes"/><duration>${MEASURE_CAPACITY}</duration><voice>1</voice><type>whole</type></note>`;

    return `<measure number="${index + 1}">${attributes}${content}</measure>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<score-partwise version="3.1"><part-list><score-part id="P1"><part-name>Pikakirjoitin</part-name></score-part></part-list><part id="P1">${measures}</part></score-partwise>`;
}
