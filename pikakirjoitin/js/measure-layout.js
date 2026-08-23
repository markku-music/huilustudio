export const DIVISIONS = 480;

export const DURATION_UNITS = Object.freeze({
  'thirty-second': 1,
  sixteenth: 2,
  eighth: 4,
  quarter: 8,
  half: 16,
  whole: 32
});

const NOTATABLE = Object.freeze([
  { units: 32, type: 'whole', dots: 0 },
  { units: 24, type: 'half', dots: 1 },
  { units: 16, type: 'half', dots: 0 },
  { units: 12, type: 'quarter', dots: 1 },
  { units: 8, type: 'quarter', dots: 0 },
  { units: 6, type: 'eighth', dots: 1 },
  { units: 4, type: 'eighth', dots: 0 },
  { units: 3, type: '16th', dots: 1 },
  { units: 2, type: '16th', dots: 0 },
  { units: 1.5, type: '32nd', dots: 1 },
  { units: 1, type: '32nd', dots: 0 },
  { units: 0.5, type: '64th', dots: 0 }
]);

const TYPE_BY_DURATION = Object.freeze({
  whole: 'whole', half: 'half', quarter: 'quarter', eighth: 'eighth',
  sixteenth: '16th', 'thirty-second': '32nd'
});

export function timeSignatureParts(value = '4/4') {
  if (value === 'C') return [4, 4];
  if (value === 'cutC') return [2, 2];
  const [beats, beatType] = String(value).split('/').map(Number);
  return [beats || 4, beatType || 4];
}

export function measureCapacity(value = '4/4') {
  const [beats, beatType] = timeSignatureParts(value);
  return beats * 32 / beatType;
}

export function durationUnits(duration, dotted = false) {
  const base = DURATION_UNITS[duration] ?? DURATION_UNITS.quarter;
  return dotted ? base * 1.5 : base;
}

export function tupletNormalNotes(size) {
  return Number(size) === 5 || Number(size) === 6 ? 4 : 2;
}

export function actualDurationUnits(note) {
  const nominal = durationUnits(note?.duration, note?.dotted);
  if (!note?.tupletId) return nominal;
  const actual = [3,5,6].includes(Number(note.tupletSize)) ? Number(note.tupletSize) : 3;
  const normal = Number(note.tupletNormalNotes) || tupletNormalNotes(actual);
  return nominal * normal / actual;
}

export function musicXmlDuration(units) {
  return Math.round(Number(units) * (DIVISIONS / 8));
}

function notationParts(units) {
  let remaining = units;
  const parts = [];

  for (const notation of NOTATABLE) {
    while (remaining >= notation.units - 1e-7) {
      parts.push({ ...notation });
      remaining -= notation.units;
      if (Math.abs(remaining) < 1e-7) remaining = 0;
    }
  }

  if (Math.abs(remaining) > 1e-7) throw new Error(`Kestoa ${units} ei voi esittää nykyisillä nuottiarvoilla.`);
  return parts;
}

function createMeasure(capacity) {
  return { capacity, used: 0, notes: [], explicitMeasureRest: false };
}

function copyTupletMetadata(source, target) {
  if (!source?.tupletId) return target;
  target.tupletId = source.tupletId;
  target.tupletIndex = Number(source.tupletIndex) || 0;
  target.tupletSize = [3,5,6].includes(Number(source.tupletSize)) ? Number(source.tupletSize) : 3;
  target.tupletNormalNotes = Number(source.tupletNormalNotes) || tupletNormalNotes(target.tupletSize);
  const base = Number(source.tupletBaseUnits);
  if (Number.isFinite(base) && base > 0) target.tupletBaseUnits = base;
  return target;
}

/**
 * Muuttaa ScoreModelin loogiset tapahtumat tahteihin mahtuviksi segmenteiksi.
 * Tavalliset nuotit voidaan jakaa tahtirajalla sidekaarella. Tupletti säilyttää
 * oman nimellisarvonsa, mutta vie tahdista time-modification-suhteen mukaisen ajan.
 */
export function layoutNotesIntoMeasures(notes, settings = {}) {
  const [beats, beatType] = timeSignatureParts(settings.timeSignature);
  const normalCapacity = beats * 32 / beatType;
  const rawPickup = Number(settings.pickupDuration) || 0;
  const pickupCapacity = rawPickup > 0 && rawPickup < normalCapacity ? rawPickup : 0;

  const measures = [createMeasure(pickupCapacity || normalCapacity)];
  const segmentsBySource = new Map();
  let current = measures[0];

  const nextMeasure = () => {
    current = createMeasure(normalCapacity);
    measures.push(current);
  };

  const rememberSegment = (sourceId, segment) => {
    current.notes.push(segment);
    if (!segmentsBySource.has(sourceId)) segmentsBySource.set(sourceId, []);
    segmentsBySource.get(sourceId).push(segment);
  };

  for (const note of notes) {
    // Tauko + pitkä painallus ilman tuplettia = koko tahdin tauko.
    if (note.kind === 'rest' && note.measureRest && !note.tupletId) {
      if (current.notes.length > 0 || current.used > 0 || current.capacity !== normalCapacity) nextMeasure();
      current.explicitMeasureRest = true;
      const segment = {
        sourceId: note.id, segmentIndex: 0, kind: 'rest', midi: null,
        duration: normalCapacity, type: 'whole', dots: 0, measureRest: true,
        tieStop: false, tieStart: false
      };
      rememberSegment(note.id, segment);
      current.used = normalCapacity;
      continue;
    }

    // Tuplettitapahtuma pidetään yhtenä nuottikuvana. Sen visuaalinen type/dot
    // on nimellisarvo, mutta tahdista kulutetaan tuplettisuhteen mukainen aika.
    if (note.tupletId) {
      const actualUnits = actualDurationUnits(note);
      if (current.used >= current.capacity - 1e-7) nextMeasure();
      if (current.notes.length > 0 && current.used + actualUnits > current.capacity + 1e-7) nextMeasure();

      const segment = copyTupletMetadata(note, {
        sourceId: note.id,
        segmentIndex: 0,
        kind: note.kind === 'rest' ? 'rest' : 'note',
        midi: note.kind === 'rest' ? null : note.midi,
        duration: actualUnits,
        nominalDuration: durationUnits(note.duration, note.dotted),
        type: TYPE_BY_DURATION[note.duration] || 'quarter',
        dots: note.dotted ? 1 : 0,
        measureRest: false,
        tieStop: false,
        tieStart: false
      });
      rememberSegment(note.id, segment);
      current.used += actualUnits;
      continue;
    }

    let remaining = durationUnits(note.duration, note.dotted);
    let segmentIndex = 0;

    while (remaining > 1e-7) {
      if (current.used >= current.capacity - 1e-7) nextMeasure();

      const available = current.capacity - current.used;
      const chunk = Math.min(remaining, available);
      const pieces = notationParts(chunk);

      for (const piece of pieces) {
        const unitsAfterThisPiece = remaining - piece.units;
        const segment = {
          sourceId: note.id,
          segmentIndex,
          kind: note.kind === 'rest' ? 'rest' : 'note',
          midi: note.kind === 'rest' ? null : note.midi,
          duration: piece.units,
          type: piece.type,
          dots: piece.dots,
          tieStop: note.kind !== 'rest' && segmentIndex > 0,
          tieStart: note.kind !== 'rest' && unitsAfterThisPiece > 1e-7
        };
        rememberSegment(note.id, segment);
        current.used += piece.units;
        remaining -= piece.units;
        segmentIndex += 1;
      }

      if (current.used >= current.capacity - 1e-7 && remaining > 1e-7) nextMeasure();
    }
  }

  // Käsin aseistettu sidekaari yhdistää kaksi peräkkäistä saman sävelen loogista nuottia.
  for (let i = 1; i < notes.length; i += 1) {
    const currentNote = notes[i];
    const previousNote = notes[i - 1];
    if (!currentNote?.tieFromPrevious || currentNote.kind === 'rest' || previousNote?.kind === 'rest') continue;
    if (Number(currentNote.midi) !== Number(previousNote.midi)) continue;
    const previousSegments = segmentsBySource.get(previousNote.id) || [];
    const currentSegments = segmentsBySource.get(currentNote.id) || [];
    const from = previousSegments.at(-1);
    const to = currentSegments[0];
    if (from && to) { from.tieStart = true; to.tieStop = true; }
  }

  // Merkitään kunkin tupletin ensimmäinen ja viimeinen renderöitävä tapahtuma.
  const tuplets = new Map();
  for (const measure of measures) {
    for (const segment of measure.notes) {
      if (!segment.tupletId) continue;
      if (!tuplets.has(segment.tupletId)) tuplets.set(segment.tupletId, []);
      tuplets.get(segment.tupletId).push(segment);
    }
  }
  for (const group of tuplets.values()) {
    if (!group.length) continue;
    group[0].tupletStart = true;
    group.at(-1).tupletStop = true;
  }

  if (measures.length > 1 && measures.at(-1).used <= 1e-7) measures.pop();

  return { beats, beatType, normalCapacity, pickupCapacity, measures };
}
