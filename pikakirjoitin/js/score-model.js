(function () {
  "use strict";

  function createScore(options) {
    const config = options || {};

    return {
      metadata: {
        title: config.title || "Pikakirjoitin 3 · Score Model -testi",
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

  function createTestScore() {
    return createScore({
      notes: [
        { pitch: "C5", duration: "quarter" },
        { pitch: "D5", duration: "quarter" },
        { pitch: "E5", duration: "quarter" },
        { pitch: "F5", duration: "quarter" }
      ]
    });
  }

  window.PikakirjoitinScoreModel = {
    createScore: createScore,
    createTestScore: createTestScore
  };
})();
