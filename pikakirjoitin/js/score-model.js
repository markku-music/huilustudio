(function () {
  "use strict";

  let nextNoteId = 1;

  function makeId() {
    return "n" + (nextNoteId++);
  }

  function cloneNote(note) {
    const copy = Object.assign({}, note);
    if (!copy.id) copy.id = makeId();
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
      notes: Array.isArray(config.notes)
        ? config.notes.map(cloneNote)
        : []
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
      id: makeId(),
      pitch: String(note.pitch),
      duration: String(note.duration)
    };

    score.notes.push(created);
    return created;
  }

  function getNote(score, id) {
    if (!score || !Array.isArray(score.notes)) return null;
    return score.notes.find(function (note) {
      return note.id === id;
    }) || null;
  }

  function setDuration(score, id, duration) {
    const note = getNote(score, id);
    if (!note) return false;

    note.duration = String(duration);
    return true;
  }

  window.PikakirjoitinScoreModel = {
    createScore: createScore,
    addNote: addNote,
    getNote: getNote,
    setDuration: setDuration
  };
})();
