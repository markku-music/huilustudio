(function () {
  "use strict";

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
        ? config.notes.map(function (note) { return Object.assign({}, note); })
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

    score.notes.push({
      pitch: String(note.pitch),
      duration: String(note.duration)
    });

    return score;
  }

  window.PikakirjoitinScoreModel = {
    createScore: createScore,
    addNote: addNote
  };
})();
