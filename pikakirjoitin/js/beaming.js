/**
 * Automaattinen palkitus Pikakirjoitin 2:lle.
 *
 * Tavalliset rytmit seuraavat iskualoja. Tupletit käyttävät vanhan
 * Pikakirjoittimen periaatetta: samaan tuplettiin kuuluvat peräkkäiset
 * palkitettavat tapahtumat pidetään yhtenä palkkiryhmänä riippumatta
 * metrisestä iskualasta. Lyhyessä 1/16- tai 1/32-sekstolissa myös sisäinen
 * tauko voi kuulua ensimmäiseen palkkitasoon.
 */

function beamUnit(beats, beatType) {
  return beatType === 8 && beats % 3 === 0 ? 12 : 32 / beatType;
}

function visualBeamLevel(note) {
  if (!note) return 0;
  if (note.type === '64th') return 4;
  if (note.type === '32nd') return 3;
  if (note.type === '16th') return 2;
  if (note.type === 'eighth') return 1;
  return 0;
}

function isProtectedSextuplet(note) {
  const base = Number(note?.tupletBaseUnits);
  return Boolean(note?.tupletId && Number(note.tupletSize) === 6 && Number.isFinite(base) && base <= 2 + 1e-7);
}

function beamLevelCount(note) {
  const level = visualBeamLevel(note);
  if (note?.kind === 'rest') return isProtectedSextuplet(note) ? Math.max(1, level) : 0;
  return level;
}

function isBeamable(note) {
  return beamLevelCount(note) > 0;
}

function tupletFixedConnection(left, right) {
  if (!left?.tupletId || left.tupletId !== right?.tupletId || !isBeamable(left) || !isBeamable(right)) return null;
  const leftIndex = Number(left.tupletIndex);
  const rightIndex = Number(right.tupletIndex);
  if (!Number.isInteger(leftIndex) || rightIndex !== leftIndex + 1) return false;
  return true;
}

function measureConnections(notes, beats, beatType) {
  const starts = [];
  let offset = 0;
  for (const note of notes) {
    starts.push(offset);
    offset += Number(note.duration) || 0;
  }

  const unit = beamUnit(beats, beatType);
  const connections = [];

  for (let index = 0; index < notes.length - 1; index += 1) {
    const left = notes[index];
    const right = notes[index + 1];
    const leftLevel = beamLevelCount(left);
    const rightLevel = beamLevelCount(right);
    const leftBucket = Math.floor((starts[index] + 1e-7) / unit);
    const rightBucket = Math.floor((starts[index + 1] + 1e-7) / unit);
    const leftInside = starts[index] + (Number(left.duration) || 0) <= (leftBucket + 1) * unit + 1e-7;
    const rightInside = starts[index + 1] + (Number(right.duration) || 0) <= (rightBucket + 1) * unit + 1e-7;
    const metricAutomatic = isBeamable(left)
      && isBeamable(right)
      && leftInside
      && rightInside
      && leftBucket === rightBucket;
    const tupletAutomatic = tupletFixedConnection(left, right);

    // Manuaalinen palkkiryhmä menee automatiikan edelle. Jos jompikumpi
    // tapahtuma kuuluu manuaaliseen ryhmään, yhteys syntyy vain saman ryhmän
    // sisällä. Näin valinta ei vahingossa ime viereistä automaattisesti
    // palkitettavaa nuottia mukaansa. Tauko katkaisee ryhmän luonnostaan.
    const leftManual = left?.manualBeamGroup || null;
    const rightManual = right?.manualBeamGroup || null;
    const hasManualBoundary = Boolean(leftManual || rightManual);
    const manualAutomatic = Boolean(
      leftManual && rightManual && leftManual === rightManual && isBeamable(left) && isBeamable(right)
    );

    // Yksittäisen nuotin käsin asetettu katkaisu on aina kova raja sen
    // edellisen tapahtuman ja tämän nuotin välissä. Se voittaa sekä metrisen,
    // tupletti- että manuaalisen palkkiryhmän.
    const forcedBreakBeforeRight = Boolean(right?.manualBeamBreakBefore);
    const automatic = forcedBreakBeforeRight
      ? false
      : (hasManualBoundary
        ? manualAutomatic
        : (tupletAutomatic === null ? metricAutomatic : tupletAutomatic));

    connections.push({
      index,
      level: automatic ? Math.min(leftLevel, rightLevel) : 0
    });
  }

  return { starts, connections };
}

function addBeamLevelRuns(tags, notes, starts, connections, level) {
  let index = 0;

  while (index < notes.length) {
    const eligible = isBeamable(notes[index]) && beamLevelCount(notes[index]) >= level;
    if (!eligible) {
      index += 1;
      continue;
    }

    const run = [index];
    while (index < notes.length - 1) {
      const connection = connections[index];
      const nextIndex = index + 1;
      const nextEligible = isBeamable(notes[nextIndex]) && beamLevelCount(notes[nextIndex]) >= level;
      if (!nextEligible || !connection || connection.level < level) break;
      index += 1;
      run.push(index);
    }

    if (run.length > 1) {
      run.forEach((noteIndex, position) => {
        tags[noteIndex].push({
          number: level,
          value: position === 0 ? 'begin' : position === run.length - 1 ? 'end' : 'continue'
        });
      });
    } else if (level > 1 && notes[run[0]]?.kind !== 'rest') {
      const noteIndex = run[0];
      const subdivision = level === 2 ? 4 : level === 3 ? 2 : 1;
      tags[noteIndex].push({
        number: level,
        value: Math.abs(starts[noteIndex] % subdivision) < 1e-7 ? 'forward hook' : 'backward hook'
      });
    }

    index += 1;
  }
}

export function beamTagsForMeasure(notes, beats, beatType, { osmdCompatible = true } = {}) {
  const tags = notes.map(() => []);
  const { starts, connections } = measureConnections(notes, beats, beatType);

  addBeamLevelRuns(tags, notes, starts, connections, 1);

  if (!osmdCompatible) {
    addBeamLevelRuns(tags, notes, starts, connections, 2);
    addBeamLevelRuns(tags, notes, starts, connections, 3);
    addBeamLevelRuns(tags, notes, starts, connections, 4);
  }

  return tags;
}

export function beamTagsXml(tags = []) {
  return tags.map(({ number, value }) => `<beam number="${number}">${value}</beam>`).join('');
}
