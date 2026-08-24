(function () {
  "use strict";

  let nextEntryId = 1;

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
    return copy;
  }

  function createScore(options) {
    const config = options || {};

    return {
      metadata: {
        title: config.title || "Pikakirjoitin 3",
        partName: config.partName || "Huilu"
      },
      clef: config.clef || "G",
      key: Number.isInteger(config.key) ? config.key : 0,
      time: Array.isArray(config.time) ? config.time.slice(0, 2) : [4, 4],
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
      dots: normalizeDots(note.dots)
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
      dots: normalizeDots(config.dots)
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
    return true;
  }

  function setDots(score, id, dots) {
    const entry = getEntry(score, id);
    if (!entry) return false;
    entry.dots = normalizeDots(dots);
    return true;
  }

  window.PikakirjoitinScoreModel = {
    createScore: createScore,
    addNote: addNote,
    addRest: addRest,
    getEntry: getEntry,
    getNote: getEntry,
    setDuration: setDuration,
    setDots: setDots
  };
})();
