(function () {
  "use strict";

  let nextEntryId = 1;
  let nextSlurId = 1;
  let nextTieId = 1;


  const ARTICULATIONS = ["accent", "staccato", "marcato", "tenuto"];

  function normalizeArticulations(value) {
    const items = Array.isArray(value) ? value : [];
    return Array.from(new Set(items.filter(function (item) {
      return ARTICULATIONS.indexOf(String(item)) >= 0;
    }).map(String)));
  }

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

  function makeSlurId() {
    return "s" + (nextSlurId++);
  }

  function makeTieId() {
    return "t" + (nextTieId++);
  }

  function pitchMidiValue(pitch) {
    const match = /^([A-G])([#b]?)(-?\d+)$/.exec(String(pitch || ""));
    if (!match) return null;

    const semitones = {
      C: 0,
      D: 2,
      E: 4,
      F: 5,
      G: 7,
      A: 9,
      B: 11
    };

    const alter =
      match[2] === "#" ? 1 :
      match[2] === "b" ? -1 :
      0;

    return (Number(match[3]) + 1) * 12 +
      semitones[match[1]] +
      alter;
  }

  function sameSoundingPitch(a, b) {
    const first = pitchMidiValue(a);
    const second = pitchMidiValue(b);
    return first !== null && second !== null && first === second;
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
    if (copy.kind === "rest") {
      delete copy.articulations;
    } else {
      copy.articulations = normalizeArticulations(copy.articulations);
    }
    return copy;
  }

  function cloneSlur(slur) {
    if (!slur || !slur.startId || !slur.endId) return null;
    return {
      id: slur.id || makeSlurId(),
      startId: String(slur.startId),
      endId: String(slur.endId)
    };
  }

  function cloneTie(tie) {
    if (!tie || !tie.startId || !tie.endId) return null;
    return {
      id: tie.id || makeTieId(),
      startId: String(tie.startId),
      endId: String(tie.endId)
    };
  }

  function normalizeLayout(layout) {
    const source = layout || {};

    const breaks = Array.isArray(source.systemBreaks)
      ? source.systemBreaks
          .map(function (value) { return Math.round(Number(value)); })
          .filter(function (value) {
            return Number.isInteger(value) && value > 0;
          })
      : [];

    let factor = Number(source.lastSystemMaxScalingFactor);
    if (!Number.isFinite(factor)) factor = 1.4;

    let notationScale = Number(source.notationScale);
    if (!Number.isFinite(notationScale)) notationScale = 1;

    let systemSpacing = Number(source.systemSpacing);
    if (!Number.isFinite(systemSpacing)) systemSpacing = 1;

    let instrumentCreditDistance = Number(source.instrumentCreditDistance);
    if (!Number.isFinite(instrumentCreditDistance)) instrumentCreditDistance = 6.5;

    const sourceMargins = source.pageMargins || {};
    function marginValue(name) {
      const value = Number(sourceMargins[name]);
      const fallback = (name === "left" || name === "right") ? 2.5 : 5;
      return Number.isFinite(value) ? Math.max(0, Math.min(12, value)) : fallback;
    }

    return {
      systemBreaks: Array.from(new Set(breaks)).sort(function (a, b) {
        return a - b;
      }),
      lastSystemMaxScalingFactor: Math.max(1, Math.min(6, factor)),
      notationScale: Math.max(0.75, Math.min(1.2, notationScale)),
      systemSpacing: Math.max(0.5, Math.min(3, systemSpacing)),
      instrumentCreditDistance: Math.max(2, Math.min(14, instrumentCreditDistance)),
      pageMargins: {
        top: marginValue("top"),
        right: marginValue("right"),
        bottom: marginValue("bottom"),
        left: marginValue("left")
      }
    };
  }

  function ensureLayout(score) {
    if (!score) return normalizeLayout();
    score.layout = normalizeLayout(score.layout);
    return score.layout;
  }

  function getSystemBreaks(score) {
    return ensureLayout(score).systemBreaks.slice();
  }

  function hasSystemBreak(score, startMeasureIndex) {
    const index = Math.round(Number(startMeasureIndex));
    return Number.isInteger(index) &&
      index > 0 &&
      ensureLayout(score).systemBreaks.includes(index);
  }

  function toggleSystemBreak(score, startMeasureIndex) {
    const index = Math.round(Number(startMeasureIndex));
    if (!score || !Number.isInteger(index) || index <= 0) return false;

    const layout = ensureLayout(score);
    const breaks = new Set(layout.systemBreaks);

    if (breaks.has(index)) breaks.delete(index);
    else breaks.add(index);

    layout.systemBreaks = Array.from(breaks).sort(function (a, b) {
      return a - b;
    });

    return breaks.has(index);
  }

  function cleanupSystemBreaks(score, measureCount) {
    const count = Math.max(0, Math.round(Number(measureCount) || 0));
    const layout = ensureLayout(score);
    const before = layout.systemBreaks.length;

    layout.systemBreaks = layout.systemBreaks.filter(function (index) {
      return index > 0 && index < count;
    });

    return layout.systemBreaks.length !== before;
  }

  function getLastSystemMaxScalingFactor(score) {
    return ensureLayout(score).lastSystemMaxScalingFactor;
  }

  function setLastSystemMaxScalingFactor(score, value) {
    if (!score) return 1.4;

    const layout = ensureLayout(score);
    let factor = Number(value);

    if (!Number.isFinite(factor)) {
      factor = layout.lastSystemMaxScalingFactor;
    }

    layout.lastSystemMaxScalingFactor =
      Math.max(1, Math.min(6, factor));

    return layout.lastSystemMaxScalingFactor;
  }

  function createScore(options) {
    const config = options || {};

    const score = {
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
      notes: Array.isArray(config.notes) ? config.notes.map(cloneEntry) : [],
      ties: Array.isArray(config.ties)
        ? config.ties.map(cloneTie).filter(Boolean)
        : [],
      slurs: Array.isArray(config.slurs)
        ? config.slurs.map(cloneSlur).filter(Boolean)
        : [],
      layout: normalizeLayout(config.layout)
    };

    cleanupTies(score);
    cleanupSlurs(score);
    return score;
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
      measureRest: false,
      articulations: normalizeArticulations(note.articulations)
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

  function noteIndexMap(score) {
    const map = new Map();
    (score.notes || []).forEach(function (entry, index) {
      map.set(entry.id, index);
    });
    return map;
  }

  function cleanupTies(score) {
    if (!score) return [];
    if (!Array.isArray(score.ties)) score.ties = [];

    const entryMap = new Map();
    (score.notes || []).forEach(function (entry, index) {
      if (entry && entry.id) {
        entryMap.set(entry.id, { entry: entry, index: index });
      }
    });

    const seen = new Set();

    score.ties = score.ties.filter(function (tie) {
      if (!tie || !tie.startId || !tie.endId) return false;
      if (tie.startId === tie.endId) return false;

      const start = entryMap.get(tie.startId);
      const end = entryMap.get(tie.endId);

      if (!start || !end) return false;
      if (start.entry.kind !== "note" || end.entry.kind !== "note") return false;

      // Tie yhdistää vain kaksi peräkkäistä rytmistä tapahtumaa.
      if (end.index !== start.index + 1) return false;

      if (!sameSoundingPitch(start.entry.pitch, end.entry.pitch)) return false;

      const key = tie.startId + "->" + tie.endId;
      if (seen.has(key)) return false;
      seen.add(key);

      if (!tie.id) tie.id = makeTieId();
      return true;
    });

    return score.ties;
  }

  function hasTie(score, startId, endId) {
    return Boolean(
      score &&
      Array.isArray(score.ties) &&
      score.ties.find(function (tie) {
        return tie.startId === startId && tie.endId === endId;
      })
    );
  }

  function addTie(score, startId, endId) {
    if (!score) return false;
    if (!Array.isArray(score.ties)) score.ties = [];

    const indexMap = noteIndexMap(score);
    const start = getEntry(score, startId);
    const end = getEntry(score, endId);

    if (!start || !end) return false;
    if (start.kind !== "note" || end.kind !== "note") return false;
    if (!indexMap.has(startId) || !indexMap.has(endId)) return false;

    // Manuaalinen tie saa yhdistää vain välittömästi peräkkäiset tapahtumat.
    if (indexMap.get(endId) !== indexMap.get(startId) + 1) return false;
    if (!sameSoundingPitch(start.pitch, end.pitch)) return false;
    if (hasTie(score, startId, endId)) return false;

    score.ties.push({
      id: makeTieId(),
      startId: startId,
      endId: endId
    });

    cleanupTies(score);
    return true;
  }

  function removeTie(score, startId, endId) {
    if (!score || !Array.isArray(score.ties)) return false;

    const before = score.ties.length;
    score.ties = score.ties.filter(function (tie) {
      return !(tie.startId === startId && tie.endId === endId);
    });

    return score.ties.length !== before;
  }

  function cleanupSlurs(score) {
    if (!score) return [];
    if (!Array.isArray(score.slurs)) score.slurs = [];

    const entryMap = new Map();
    (score.notes || []).forEach(function (entry, index) {
      if (entry && entry.id && entry.kind === "note") {
        entryMap.set(entry.id, { entry: entry, index: index });
      }
    });

    const seen = new Set();
    score.slurs = score.slurs.filter(function (slur) {
      if (!slur || !slur.startId || !slur.endId) return false;
      if (slur.startId === slur.endId) return false;
      const start = entryMap.get(slur.startId);
      const end = entryMap.get(slur.endId);
      if (!start || !end) return false;
      if (start.index >= end.index) return false;
      const key = slur.startId + "->" + slur.endId;
      if (seen.has(key)) return false;
      seen.add(key);
      if (!slur.id) slur.id = makeSlurId();
      return true;
    });

    return score.slurs;
  }

  function setDuration(score, id, duration) {
    const entry = getEntry(score, id);
    if (!entry) return false;
    entry.duration = String(duration);

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
    if (patch.articulations !== undefined) entry.articulations = normalizeArticulations(patch.articulations);

    if (entry.kind === "rest") {
      delete entry.pitch;
      delete entry.articulations;
      if (entry.dots > 0) entry.measureRest = false;
    } else {
      entry.measureRest = false;
    }

    cleanupTies(score);
    cleanupSlurs(score);
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
    const changed = score.notes.length !== before;
    if (changed) {
      cleanupTies(score);
      cleanupSlurs(score);
    }
    return changed;
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
    if (
      offset === 0 &&
      capacity === fullMeasureCapacity(score) &&
      span >= capacity
    ) {
      return { value:capacity, duration:"whole", dots:0, measureRest:true };
    }

    if (isCompoundMeter(score)) {
      const group = 48;
      if (offset % group === 0 && span >= group && offset + group <= capacity) {
        return { value:group, duration:"quarter", dots:1, measureRest:false };
      }
    }

    for (const choice of SIMPLE_REST_CHOICES) {
      if (choice.value > span) continue;
      if (choice.value > capacity - offset) continue;
      if (choice.value >= 4 && offset % choice.value !== 0) continue;
      if (choice.duration === "whole") continue;
      return Object.assign({ measureRest:false }, choice);
    }

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

    if (blocks.length === 1 && blocks[0].start === blocks[0].end) {
      const index = blocks[0].start;
      const entry = score.notes[index];
      const pos = positionBeforeIndex(score, index);
      const units = entry.measureRest ? pos.fullCapacity : durationUnits(entry);

      entry.kind = "rest";
      delete entry.pitch;
      delete entry.articulations;
      entry.measureRest =
        pos.offset === 0 &&
        pos.capacity === pos.fullCapacity &&
        units === pos.fullCapacity &&
        entry.duration === "whole" &&
        normalizeDots(entry.dots) === 0;

      /*
       * Jos uuden tauon vieressä ei ole taukoja, säilytetään täsmälleen
       * vanha yhden tapahtuman toiminta ja sama id.
       *
       * Jos vieressä on taukoja, laajennetaan käsittely koko yhtenäiseen
       * taukojaksoon. Näin peräkkäin yksitellen poistettavat nuotit
       * yhdistyvät samoilla metrisillä säännöillä kuin monivalinnan
       * "Tauko"-toiminnossa.
       */
      let runStart = index;
      let runEnd = index;

      while (
        runStart > 0 &&
        score.notes[runStart - 1] &&
        score.notes[runStart - 1].kind === "rest" &&
        !score.notes[runStart - 1].measureRest &&
        !score.notes[runStart].measureRest
      ) {
        runStart -= 1;
      }

      while (
        runEnd + 1 < score.notes.length &&
        score.notes[runEnd + 1] &&
        score.notes[runEnd + 1].kind === "rest" &&
        !score.notes[runEnd + 1].measureRest &&
        !score.notes[runEnd].measureRest
      ) {
        runEnd += 1;
      }

      if (runStart === runEnd) {
        cleanupTies(score);
        cleanupSlurs(score);
        return { changed:true, ids:[entry.id], merged:false };
      }

      const runPos = positionBeforeIndex(score, runStart);
      let total = 0;

      for (let runIndex = runStart; runIndex <= runEnd; runIndex += 1) {
        total += durationUnits(score.notes[runIndex]);
      }

      const rests = buildSmartRests(score, runPos, total);

      score.notes.splice(
        runStart,
        runEnd - runStart + 1,
        ...rests
      );

      cleanupTies(score);
      cleanupSlurs(score);

      return {
        changed:true,
        ids:rests.map(function (rest) { return rest.id; }),
        merged:true
      };
    }

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

    const newIds = [];
    plans.slice().reverse().forEach(function (plan) {
      score.notes.splice(
        plan.start,
        plan.end - plan.start + 1,
        ...plan.rests
      );
    });

    plans.forEach(function (plan) {
      plan.rests.forEach(function (rest) {
        newIds.push(rest.id);
      });
    });

    cleanupTies(score);
    cleanupSlurs(score);
    return { changed:true, ids:newIds };
  }

  function selectedNoteEntries(score, ids) {
    if (!score || !Array.isArray(score.notes)) return [];
    const selected = new Set(Array.isArray(ids) ? ids : [ids]);
    return score.notes.filter(function (entry) {
      return entry && entry.kind === "note" && selected.has(entry.id);
    });
  }

  function canArticulateSelection(score, ids) {
    return selectedNoteEntries(score, ids).length > 0;
  }

  function hasArticulationForSelection(score, ids, articulation) {
    const type = String(articulation || "");
    if (ARTICULATIONS.indexOf(type) < 0) return false;
    const notes = selectedNoteEntries(score, ids);
    if (!notes.length) return false;
    return notes.every(function (entry) {
      return normalizeArticulations(entry.articulations).indexOf(type) >= 0;
    });
  }

  function toggleArticulationForSelection(score, ids, articulation) {
    const type = String(articulation || "");
    if (ARTICULATIONS.indexOf(type) < 0) {
      return { changed:false, active:false, ids:[] };
    }

    const notes = selectedNoteEntries(score, ids);
    if (!notes.length) return { changed:false, active:false, ids:[] };

    const remove = notes.every(function (entry) {
      return normalizeArticulations(entry.articulations).indexOf(type) >= 0;
    });

    notes.forEach(function (entry) {
      const current = normalizeArticulations(entry.articulations);
      if (remove) {
        entry.articulations = current.filter(function (item) { return item !== type; });
      } else if (current.indexOf(type) < 0) {
        entry.articulations = current.concat(type);
      } else {
        entry.articulations = current;
      }
    });

    return {
      changed:true,
      active:!remove,
      ids:notes.map(function (entry) { return entry.id; })
    };
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

  function nextNoteId(score, startId) {
    if (!score || !Array.isArray(score.notes)) return null;

    const startIndex = score.notes.findIndex(function (entry) {
      return entry.id === startId;
    });

    if (startIndex < 0) return null;

    for (let index = startIndex + 1; index < score.notes.length; index += 1) {
      const entry = score.notes[index];
      if (entry && entry.kind === "note") {
        return entry.id;
      }
    }

    return null;
  }

  function previousNoteId(score, endId) {
    if (!score || !Array.isArray(score.notes)) return null;

    const endIndex = score.notes.findIndex(function (entry) {
      return entry.id === endId;
    });

    if (endIndex <= 0) return null;

    for (let index = endIndex - 1; index >= 0; index -= 1) {
      const entry = score.notes[index];
      if (entry && entry.kind === "note") {
        return entry.id;
      }
    }

    return null;
  }

  function slursAtNote(score, noteId) {
    if (!score || !Array.isArray(score.notes) || !Array.isArray(score.slurs)) {
      return [];
    }

    const entry = getEntry(score, noteId);
    if (!entry || entry.kind !== "note") return [];

    const indexMap = noteIndexMap(score);
    const noteIndex = indexMap.get(noteId);
    if (!Number.isInteger(noteIndex)) return [];

    return score.slurs
      .filter(function (slur) {
        const startIndex = indexMap.get(slur.startId);
        const endIndex = indexMap.get(slur.endId);

        return (
          Number.isInteger(startIndex) &&
          Number.isInteger(endIndex) &&
          startIndex <= noteIndex &&
          noteIndex <= endIndex
        );
      })
      .slice()
      .sort(function (a, b) {
        const aStart = indexMap.get(a.startId);
        const aEnd = indexMap.get(a.endId);
        const bStart = indexMap.get(b.startId);
        const bEnd = indexMap.get(b.endId);

        const aSpan = aEnd - aStart;
        const bSpan = bEnd - bStart;
        if (aSpan !== bSpan) return aSpan - bSpan;
        if (aStart !== bStart) return aStart - bStart;
        return aEnd - bEnd;
      });
  }

  function removeSlurById(score, slurId) {
    if (!score || !Array.isArray(score.slurs) || !slurId) return false;

    const before = score.slurs.length;
    score.slurs = score.slurs.filter(function (slur) {
      return slur.id !== slurId;
    });

    return score.slurs.length !== before;
  }

  function hasSlur(score, startId, endId) {
    return Boolean(
      score && Array.isArray(score.slurs) &&
      score.slurs.find(function (slur) {
        return slur.startId === startId && slur.endId === endId;
      })
    );
  }

  function addSlur(score, startId, endId) {
    if (!score) return false;
    if (!Array.isArray(score.slurs)) score.slurs = [];
    const indexMap = noteIndexMap(score);
    const start = getEntry(score, startId);
    const end = getEntry(score, endId);
    if (!start || !end || start.kind !== "note" || end.kind !== "note") return false;
    if (!indexMap.has(startId) || !indexMap.has(endId)) return false;
    if (indexMap.get(startId) >= indexMap.get(endId)) return false;
    if (hasSlur(score, startId, endId)) return false;
    score.slurs.push({ id: makeSlurId(), startId: startId, endId: endId });
    cleanupSlurs(score);
    return true;
  }

  function removeSlur(score, startId, endId) {
    if (!score || !Array.isArray(score.slurs)) return false;
    const before = score.slurs.length;
    score.slurs = score.slurs.filter(function (slur) {
      return !(slur.startId === startId && slur.endId === endId);
    });
    return score.slurs.length !== before;
  }

  function canCreateSlurFromSelection(score, ids) {
    if (!score || !Array.isArray(score.notes)) return false;
    const selected = new Set(Array.isArray(ids) ? ids : [ids]);
    const entries = score.notes.filter(function (entry) {
      return selected.has(entry.id);
    });
    return entries.length >= 2 && entries.every(function (entry) { return entry.kind === "note"; });
  }

  function toggleSlurForSelection(score, ids) {
    if (!score || !Array.isArray(score.notes)) {
      return { changed:false, active:false, reason:"invalid" };
    }

    const selected = new Set(Array.isArray(ids) ? ids : [ids]);
    const entries = score.notes.filter(function (entry) {
      return selected.has(entry.id);
    });

    if (entries.length < 2) {
      return { changed:false, active:false, reason:"need_two_notes" };
    }
    if (!entries.every(function (entry) { return entry.kind === "note"; })) {
      return { changed:false, active:false, reason:"notes_only" };
    }

    const startId = entries[0].id;
    const endId = entries[entries.length - 1].id;
    const indexMap = noteIndexMap(score);
    const startIndex = indexMap.get(startId);
    const endIndex = indexMap.get(endId);

    // Kaikki slurit, joiden molemmat päät ovat valitun nuottijakson sisällä,
    // kuuluvat tähän muokkausalueeseen. Kelluvasta palkista annettu uusi slur
    // korvaa ne yhdellä kaarella ensimmäisestä viimeiseen valittuun nuottiin.
    const internalSlurs = (score.slurs || []).filter(function (slur) {
      const a = indexMap.get(slur.startId);
      const b = indexMap.get(slur.endId);
      return (
        Number.isInteger(a) &&
        Number.isInteger(b) &&
        a >= startIndex &&
        b <= endIndex
      );
    });

    const exactOnly =
      internalSlurs.length === 1 &&
      internalSlurs[0].startId === startId &&
      internalSlurs[0].endId === endId;

    // Säilytetään aiempi toggle-käytös siinä ainoassa yksiselitteisessä
    // tilanteessa, jossa valinnalla on jo täsmälleen tämä yksi slur.
    if (exactOnly) {
      return {
        changed: removeSlur(score, startId, endId),
        active: false,
        startId: startId,
        endId: endId,
        replacedCount: 0
      };
    }

    const internalIds = new Set(internalSlurs.map(function (slur) {
      return slur.id;
    }));

    if (internalIds.size) {
      score.slurs = (score.slurs || []).filter(function (slur) {
        return !internalIds.has(slur.id);
      });
    }

    const added = addSlur(score, startId, endId);

    return {
      changed: Boolean(added || internalIds.size),
      active: true,
      startId: startId,
      endId: endId,
      replacedCount: internalIds.size
    };
  }

  function hasSlurForSelection(score, ids) {
    if (!canCreateSlurFromSelection(score, ids)) return false;
    const selected = new Set(Array.isArray(ids) ? ids : [ids]);
    const entries = score.notes.filter(function (entry) {
      return selected.has(entry.id);
    });
    return hasSlur(score, entries[0].id, entries[entries.length - 1].id);
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
    canArticulateSelection: canArticulateSelection,
    hasArticulationForSelection: hasArticulationForSelection,
    toggleArticulationForSelection: toggleArticulationForSelection,
    canEnharmonic: canEnharmonic,
    toggleEnharmonic: toggleEnharmonic,
    durationUnits: durationUnits,
    sameSoundingPitch: sameSoundingPitch,
    cleanupTies: cleanupTies,
    addTie: addTie,
    removeTie: removeTie,
    hasTie: hasTie,
    cleanupSlurs: cleanupSlurs,
    nextNoteId: nextNoteId,
    previousNoteId: previousNoteId,
    addSlur: addSlur,
    removeSlur: removeSlur,
    removeSlurById: removeSlurById,
    hasSlur: hasSlur,
    slursAtNote: slursAtNote,
    canCreateSlurFromSelection: canCreateSlurFromSelection,
    toggleSlurForSelection: toggleSlurForSelection,
    hasSlurForSelection: hasSlurForSelection,
    normalizeLayout: normalizeLayout,
    getSystemBreaks: getSystemBreaks,
    hasSystemBreak: hasSystemBreak,
    toggleSystemBreak: toggleSystemBreak,
    cleanupSystemBreaks: cleanupSystemBreaks,
    getLastSystemMaxScalingFactor: getLastSystemMaxScalingFactor,
    setLastSystemMaxScalingFactor: setLastSystemMaxScalingFactor
  };
})();
