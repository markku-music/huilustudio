export const DIVISIONS = 8;

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
  { units: 1, type: '32nd', dots: 0 }
]);

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

export function durationUnits(duration) {
  return DURATION_UNITS[duration] ?? DURATION_UNITS.quarter;
}

function notationParts(units) {
  let remaining = units;
  const parts = [];

  for (const notation of NOTATABLE) {
    while (remaining >= notation.units) {
      parts.push({ ...notation });
      remaining -= notation.units;
    }
  }

  if (remaining !== 0) {
    throw new Error(`Kestoa ${units} ei voi esittää nykyisillä nuottiarvoilla.`);
  }
  return parts;
}

function createMeasure(capacity) {
  return { capacity, used: 0, notes: [] };
}

/**
 * Muuttaa ScoreModelin loogiset nuotit tahteihin mahtuviksi segmenteiksi.
 * Jos nuotti ylittää tahtirajan, se jatkuu seuraavaan tahtiin tie-kaarella.
 * Sama looginen nuotti voi poikkeustapauksessa jakautua myös useaan
 * nuottikuvaan yhden tahdin sisällä, jos tahdissa jäljellä oleva kesto
 * ei vastaa yhtä tavallista aika-arvoa.
 */
export function layoutNotesIntoMeasures(notes, settings = {}) {
  const [beats, beatType] = timeSignatureParts(settings.timeSignature);
  const normalCapacity = beats * 32 / beatType;
  const rawPickup = Number(settings.pickupDuration) || 0;
  const pickupCapacity = rawPickup > 0 && rawPickup < normalCapacity ? rawPickup : 0;

  const measures = [createMeasure(pickupCapacity || normalCapacity)];
  let current = measures[0];

  const nextMeasure = () => {
    current = createMeasure(normalCapacity);
    measures.push(current);
  };

  for (const note of notes) {
    let remaining = durationUnits(note.duration);
    let segmentIndex = 0;

    while (remaining > 0) {
      if (current.used >= current.capacity) nextMeasure();

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
          tieStart: note.kind !== 'rest' && unitsAfterThisPiece > 0
        };
        current.notes.push(segment);
        current.used += piece.units;
        remaining -= piece.units;
        segmentIndex += 1;
      }

      if (current.used >= current.capacity && remaining > 0) nextMeasure();
    }
  }

  // Älä jätä ylimääräistä tyhjää tahtia loppuun, mutta säilytä aina vähintään yksi tahti.
  if (measures.length > 1 && measures.at(-1).used === 0) measures.pop();

  return { beats, beatType, normalCapacity, pickupCapacity, measures };
}
