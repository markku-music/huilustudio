(function () {
  "use strict";

  let nextEntryId = 1;

  const DURATION_UNITS = {
    whole: 128,
    half: 64,
    quarter: 32,
    eighth: 16,
    sixteenth: 8,
    "thirty-second": 4,
    "sixty-fourth": 2,
    "one-hundred-twenty-eighth": 1
  };

  function makeId(prefix) {
    return (prefix || "e") + (nextEntryId++);
  }

  function normalizeDots(value) {
    const dots = Number(value) || 0;
    return dots >= 2 ? 2 : dots >= 1 ? 1 : 0;
  }

  function cloneEntry(entry) {
    const copy = Object.assign({}, entry);
    if (!copy.kind) copy.kind = "note";
    if (!copy.id) copy.id = makeId(copy.kind === "rest" ? "r" : "n");
    copy.dots = normalizeDots(copy.dots);
    copy.measureRest = Boolean(copy.measureRest);
    return copy;
  }

  function createScore(options) {
    const config = options || {};

    return {
      metadata: {
        title: config.title || "Pikakirjoitin 3",
        composer: config.composer || "",
        tempoText: config.tempoText || "",
        partName: config.partName || "Huilu"
      },
      clef: config.clef || "G",
      key: Number.isInteger(config.key) ? config.key : 0,
      time: Array.isArray(config.time) ? config.time.slice(0, 2) : [4, 4],
      timeSymbol: config.timeSymbol || "",
      pickupDuration: Number(config.pickupDuration) || 0,
      notes: Array.isArray(config.notes) ? config.notes.map(cloneEntry) : []
    };
  }

  function addNote(score, note) {
    if (!score || !Array.isArray(score.notes)) {
      throw new Error("Score Model puuttuu tai on virheellinen.");
    }
    if (!note || !note.pitch || !note.duration) {
      throw new Error("Lisättävä nuotti on virheellinen.");
    }

    const created = {
      id: makeId("n"),
      kind: "note",
      pitch: String(note.pitch),
      duration: String(note.duration),
      dots: normalizeDots(note.dots),
      measureRest: false
    };

    score.notes.push(created);
    return created;
  }

  function addRest(score, rest) {
    if (!score || !Array.isArray(score.notes)) {
      throw new Error("Score Model puuttuu tai on virheellinen.");
    }

    const config = rest || {};
    if (!config.duration) {
      throw new Error("Lisättävän tauon aika-arvo puuttuu.");
    }

    const created = {
      id: makeId("r"),
      kind: "rest",
      duration: String(config.duration),
      dots: normalizeDots(config.dots),
      measureRest: Boolean(config.measureRest)
    };

    score.notes.push(created);
    return created;
  }

  function getEntry(score, id) {
    if (!score || !Array.isArray(score.notes)) return null;
    return score.notes.find(function (entry) {
      return entry.id === id;
    }) || null;
  }

  function setDuration(score, id, duration) {
    const entry = getEntry(score, id);
    if (!entry) return false;
    entry.duration = String(duration);

    // Peukalopakin pitkä Tauko-ele tarkoittaa edelleen kokotahdin taukoa.
    if (entry.kind === "rest") {
      entry.measureRest =
        entry.duration === "whole" &&
        normalizeDots(entry.dots) === 0;
    }
    return true;
  }

  function setDots(score, id, dots) {
    const entry = getEntry(score, id);
    if (!entry) return false;
    entry.dots = normalizeDots(dots);
    if (entry.kind === "rest" && entry.dots > 0) {
      entry.measureRest = false;
    }
    return true;
  }

  function updateEntry(score, id, patch) {
    const entry = getEntry(score, id);
    if (!entry || !patch) return false;

    if (patch.kind !== undefined) entry.kind = patch.kind === "rest" ? "rest" : "note";
    if (patch.pitch !== undefined) entry.pitch = String(patch.pitch);
    if (patch.duration !== undefined) entry.duration = String(patch.duration);
    if (patch.dots !== undefined) entry.dots = normalizeDots(patch.dots);
    if (patch.measureRest !== undefined) entry.measureRest = Boolean(patch.measureRest);

    if (entry.kind === "rest") {
      delete entry.pitch;
      if (entry.dots > 0) entry.measureRest = false;
    } else {
      entry.measureRest = false;
    }

    return true;
  }

  function deleteEntries(score, ids) {
    if (!score || !Array.isArray(score.notes)) return false;
    const selected = new Set(Array.isArray(ids) ? ids : [ids]);
    if (!selected.size) return false;

    const before = score.notes.length;
    score.notes = score.notes.filter(function (entry) {
      return !selected.has(entry.id);
    });
    return score.notes.length !== before;
  }

  function durationUnits(entryOrDuration, dotsOverride) {
    const duration = typeof entryOrDuration === "string"
      ? entryOrDuration
      : entryOrDuration && entryOrDuration.duration;
    const dots = typeof entryOrDuration === "string"
      ? normalizeDots(dotsOverride)
      : normalizeDots(entryOrDuration && entryOrDuration.dots);

    const base = DURATION_UNITS[duration];
    if (!base) throw new Error("Tuntematon aika-arvo: " + duration);

    if (dots === 1) return base * 3 / 2;
    if (dots === 2) return base * 7 / 4;
    return base;
  }

  function fullMeasureCapacity(score) {
    const beats = Number(score && score.time && score.time[0]) || 4;
    const beatType = Number(score && score.time && score.time[1]) || 4;
    return beats * 32 * (4 / beatType);
  }

  function pickupCapacity(score) {
    // StartScreenin pickupDuration: kokonainen = 32.
    return (Number(score && score.pickupDuration) || 0) * 4;
  }

  function positionBeforeIndex(score, targetIndex) {
    const full = fullMeasureCapacity(score);
    const pickup = pickupCapacity(score);
    let capacity = pickup > 0 && pickup < full ? pickup : full;
    let offset = 0;

    function nextMeasure() {
      capacity = full;
      offset = 0;
    }

    for (let index = 0; index < targetIndex; index += 1) {
      const entry = score.notes[index];

      if (entry && entry.kind === "rest" && entry.measureRest) {
        // Sama semantiikka kuin MusicXML-generaattorissa:
        // kokotahdin tauko aloittaa uuden täyden tahdin, jos nykyinen
        // tahti on jo osittain käytetty.
        if (capacity !== full && offset === 0) {
          capacity = full;
        } else if (offset > 0) {
          nextMeasure();
        }
        nextMeasure();
        continue;
      }

      let remaining = durationUnits(entry);
      while (remaining > 0) {
        const available = capacity - offset;
        const chunk = Math.min(remaining, available);
        offset += chunk;
        remaining -= chunk;

        if (offset >= capacity) nextMeasure();
      }
    }

    return {
      offset: offset,
      capacity: capacity,
      fullCapacity: full
    };
  }

  function restPiece(duration, dots, measureRest) {
    return {
      id: makeId("r"),
      kind: "rest",
      duration: duration,
      dots: normalizeDots(dots),
      measureRest: Boolean(measureRest)
    };
  }

  const SIMPLE_REST_CHOICES = [
    { value:128, duration:"whole", dots:0 },
    { value:64, duration:"half", dots:0 },
    { value:32, duration:"quarter", dots:0 },
    { value:16, duration:"eighth", dots:0 },
    { value:8, duration:"sixteenth", dots:0 },
    { value:4, duration:"thirty-second", dots:0 },
    { value:2, duration:"sixty-fourth", dots:0 },
    { value:1, duration:"one-hundred-twenty-eighth", dots:0 }
  ];

  const FALLBACK_REST_CHOICES = [
    { value:112, duration:"half", dots:2 },
    { value:96, duration:"half", dots:1 },
    { value:64, duration:"half", dots:0 },
    { value:56, duration:"quarter", dots:2 },
    { value:48, duration:"quarter", dots:1 },
    { value:32, duration:"quarter", dots:0 },
    { value:28, duration:"eighth", dots:2 },
    { value:24, duration:"eighth", dots:1 },
    { value:16, duration:"eighth", dots:0 },
    { value:14, duration:"sixteenth", dots:2 },
    { value:12, duration:"sixteenth", dots:1 },
    { value:8, duration:"sixteenth", dots:0 },
    { value:7, duration:"thirty-second", dots:2 },
    { value:6, duration:"thirty-second", dots:1 },
    { value:4, duration:"thirty-second", dots:0 },
    { value:3, duration:"sixty-fourth", dots:1 },
    { value:2, duration:"sixty-fourth", dots:0 },
    { value:1, duration:"one-hundred-twenty-eighth", dots:0 }
  ];

  function isCompoundMeter(score) {
    const beats = Number(score && score.time && score.time[0]) || 4;
    const beatType = Number(score && score.time && score.time[1]) || 4;
    return beatType === 8 && beats >= 6 && beats % 3 === 0;
  }

  function chooseSmartRest(score, offset, span, capacity) {
    // Yksi kokonainen täysi tahti on aina yksi kokotahdin tauko.
    if (
      offset === 0 &&
      capacity === fullMeasureCapacity(score) &&
      span >= capacity
    ) {
      return { value:capacity, duration:"whole", dots:0, measureRest:true };
    }

    // Yhdistetyissä tahtilajeissa ensisijainen ryhmä on pisteellinen neljäsosa.
    if (isCompoundMeter(score)) {
      const group = 48;
      if (offset % group === 0 && span >= group && offset + group <= capacity) {
        return { value:group, duration:"quarter", dots:1, measureRest:false };
      }
    }

    // Muuten käytetään suurinta selkeästi iskulle/alijaolle asettuvaa
    // pisteetöntä taukoa. Näin 4/4:ssä ei synny esimerkiksi turhaa
    // neljää kahdeksasosataukoa kahden iskun alueelle.
    for (const choice of SIMPLE_REST_CHOICES) {
      if (choice.value > span) continue;
      if (choice.value > capacity - offset) continue;
      if (choice.value >= 4 && offset % choice.value !== 0) continue;
      if (choice.duration === "whole") continue; // vain measureRest yllä
      return Object.assign({ measureRest:false }, choice);
    }

    // Harvinaiset pisteelliset / 1/64 / 1/128 -rajatapaukset.
    for (const choice of FALLBACK_REST_CHOICES) {
      if (choice.value <= span && choice.value <= capacity - offset) {
        return Object.assign({ measureRest:false }, choice);
      }
    }

    return { value:1, duration:"one-hundred-twenty-eighth", dots:0, measureRest:false };
  }

  function buildSmartRests(score, startPosition, totalUnits) {
    const rests = [];
    const full = startPosition.fullCapacity;
    let capacity = startPosition.capacity;
    let offset = startPosition.offset;
    let remaining = Math.max(0, Math.round(Number(totalUnits) || 0));

    while (remaining > 0) {
      if (offset >= capacity) {
        capacity = full;
        offset = 0;
      }

      const measureRemaining = capacity - offset;
      const span = Math.min(remaining, measureRemaining);
      const choice = chooseSmartRest(score, offset, span, capacity);

      rests.push(restPiece(choice.duration, choice.dots, choice.measureRest));
      offset += choice.value;
      remaining -= choice.value;

      if (offset >= capacity) {
        capacity = full;
        offset = 0;
      }
    }

    return rests;
  }

  function selectedIndexBlocks(score, ids) {
    const selected = new Set(ids);
    const indices = [];

    score.notes.forEach(function (entry, index) {
      if (selected.has(entry.id)) indices.push(index);
    });

    if (!indices.length) return [];

    const blocks = [];
    let start = indices[0];
    let previous = indices[0];

    for (let i = 1; i < indices.length; i += 1) {
      const index = indices[i];
      if (index === previous + 1) {
        previous = index;
        continue;
      }
      blocks.push({ start:start, end:previous });
      start = previous = index;
    }
    blocks.push({ start:start, end:previous });
    return blocks;
  }

  function convertSelectionToRests(score, ids) {
    if (!score || !Array.isArray(score.notes)) return { changed:false, ids:[] };

    const selectedIds = Array.from(new Set(Array.isArray(ids) ? ids : [ids]))
      .filter(Boolean);
    if (!selectedIds.length) return { changed:false, ids:[] };

    const blocks = selectedIndexBlocks(score, selectedIds);
    if (!blocks.length) return { changed:false, ids:[] };

    // Yksi tapahtuma: täsmälleen sama aika-arvo ja pisteet.
    if (blocks.length === 1 && blocks[0].start === blocks[0].end) {
      const index = blocks[0].start;
      const entry = score.notes[index];
      const pos = positionBeforeIndex(score, index);
      const units = entry.measureRest ? pos.fullCapacity : durationUnits(entry);

      entry.kind = "rest";
      delete entry.pitch;

      // "Saman aika-arvon tauko". Kokotahdin semantiikka vain silloin,
      // kun tapahtuma todella täyttää kokonaisen täyden tahdin.
      entry.measureRest =
        pos.offset === 0 &&
        pos.capacity === pos.fullCapacity &&
        units === pos.fullCapacity &&
        entry.duration === "whole" &&
        normalizeDots(entry.dots) === 0;

      return { changed:true, ids:[entry.id] };
    }

    // Useampi valittu tapahtuma: ei nuotti -> tauko yksi kerrallaan.
    // Koko valittu aikajakso kirjoitetaan uudelleen metrisesti järkevinä taukoina.
    const plans = blocks.map(function (block) {
      const startPos = positionBeforeIndex(score, block.start);
      let total = 0;

      for (let index = block.start; index <= block.end; index += 1) {
        const entry = score.notes[index];
        total += entry.measureRest ? startPos.fullCapacity : durationUnits(entry);
      }

      return {
        start:block.start,
        end:block.end,
        rests:buildSmartRests(score, startPos, total)
      };
    });

    // Splice lopusta alkuun, jotta aiemmat indeksit eivät liiku.
    const newIds = [];
    plans.slice().reverse().forEach(function (plan) {
      score.notes.splice(
        plan.start,
        plan.end - plan.start + 1,
        ...plan.rests
      );
    });

    // Palautetaan uusien taukojen id:t nuotin aikajärjestyksessä.
    plans.forEach(function (plan) {
      plan.rests.forEach(function (rest) {
        newIds.push(rest.id);
      });
    });

    return { changed:true, ids:newIds };
  }

  const ENHARMONIC_MAP = {
    "C#":"Db", "Db":"C#",
    "D#":"Eb", "Eb":"D#",
    "F#":"Gb", "Gb":"F#",
    "G#":"Ab", "Ab":"G#",
    "A#":"Bb", "Bb":"A#"
  };

  function enharmonicPitch(pitch) {
    const match = /^([A-G])([#b])(-?\d+)$/.exec(String(pitch || ""));
    if (!match) return null;
    const key = match[1] + match[2];
    const alternate = ENHARMONIC_MAP[key];
    return alternate ? alternate + match[3] : null;
  }

  function canEnharmonic(score, id) {
    const entry = getEntry(score, id);
    return Boolean(entry && entry.kind === "note" && enharmonicPitch(entry.pitch));
  }

  function toggleEnharmonic(score, id) {
    const entry = getEntry(score, id);
    if (!entry || entry.kind !== "note") return false;
    const alternate = enharmonicPitch(entry.pitch);
    if (!alternate) return false;
    entry.pitch = alternate;
    return true;
  }

  window.PikakirjoitinScoreModel = {
    createScore: createScore,
    addNote: addNote,
    addRest: addRest,
    getEntry: getEntry,
    getNote: getEntry,
    setDuration: setDuration,
    setDots: setDots,
    updateEntry: updateEntry,
    deleteEntries: deleteEntries,
    convertSelectionToRests: convertSelectionToRests,
    canEnharmonic: canEnharmonic,
    toggleEnharmonic: toggleEnharmonic,
    durationUnits: durationUnits
  };
})();
