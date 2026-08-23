/**
 * Automaattinen palkitus Pikakirjoitin 2:lle.
 *
 * Periaate on siirretty Pikakirjoitin 1.x:n vakaasta palkituslogiikasta:
 * - tavallisissa tahtilajeissa palkkiryhmä ei ylitä iskualaa
 * - 6/8, 9/8, 12/8 jne. ryhmitellään pisteellisen neljäsosan iskuihin
 * - 1/8, 1/16 ja 1/32 voivat kuulua samaan palkkiryhmään
 * - tauko katkaisee tavallisen palkkiryhmän
 *
 * Moduuli ei tunne OSMD:n DOM-rakennetta eikä ScoreModelia. Se käsittelee
 * measure-layout.js:n tuottamia tahdin segmenttejä.
 */

function beamUnit(beats, beatType) {
  // Sisäinen rytmiyksikkö: 1/32 = 1, 1/16 = 2, 1/8 = 4, 1/4 = 8.
  // Yhdistetyissä kahdeksasosatahtilajeissa isku = pisteellinen 1/4 = 12.
  return beatType === 8 && beats % 3 === 0 ? 12 : 32 / beatType;
}

function beamLevelCount(note) {
  if (!note || note.kind === 'rest') return 0;
  if (note.type === '32nd') return 3;
  if (note.type === '16th') return 2;
  if (note.type === 'eighth') return 1;
  return 0;
}

function isBeamable(note) {
  return beamLevelCount(note) > 0;
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
    const leftBucket = Math.floor(starts[index] / unit);
    const rightBucket = Math.floor(starts[index + 1] / unit);
    const leftInside = starts[index] + (Number(left.duration) || 0) <= (leftBucket + 1) * unit + 1e-7;
    const rightInside = starts[index + 1] + (Number(right.duration) || 0) <= (rightBucket + 1) * unit + 1e-7;
    const automatic = isBeamable(left)
      && isBeamable(right)
      && leftInside
      && rightInside
      && leftBucket === rightBucket;

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
    } else if (level > 1) {
      // Yksittäinen alempi palkkitaso tarvitsee hookin. Suunta määräytyy
      // rytmipaikan mukaan samalla periaatteella kuin Pikakirjoitin 1.x:ssä.
      const noteIndex = run[0];
      const subdivision = level === 2 ? 4 : 2;
      tags[noteIndex].push({
        number: level,
        value: starts[noteIndex] % subdivision === 0 ? 'forward hook' : 'backward hook'
      });
    }

    index += 1;
  }
}

/**
 * Palauttaa jokaiselle tahdin tapahtumalle MusicXML beam -tunnisteiden datan.
 *
 * osmdCompatible=true jäljittelee vanhan Pikakirjoittimen renderöintipolkua:
 * OSMD:lle annetaan ensimmäinen palkkitaso eksplisiittisesti ja se johtaa
 * lyhyempien aika-arvojen alemmat palkit nuotin type-arvosta itse.
 *
 * Kun myöhemmin teemme varsinaisen MusicXML-exportin, voidaan käyttää
 * osmdCompatible=false ja kirjoittaa kaikki palkkitasot eksplisiittisesti.
 */
export function beamTagsForMeasure(notes, beats, beatType, { osmdCompatible = true } = {}) {
  const tags = notes.map(() => []);
  const { starts, connections } = measureConnections(notes, beats, beatType);

  addBeamLevelRuns(tags, notes, starts, connections, 1);

  if (!osmdCompatible) {
    addBeamLevelRuns(tags, notes, starts, connections, 2);
    addBeamLevelRuns(tags, notes, starts, connections, 3);
  }

  return tags;
}

export function beamTagsXml(tags = []) {
  return tags
    .map(({ number, value }) => `<beam number="${number}">${value}</beam>`)
    .join('');
}
