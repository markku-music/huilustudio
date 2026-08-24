(function () {
  "use strict";

  const score = window.PikakirjoitinScoreModel.createScore({
    title: "Pikakirjoitin 3",
    partName: "Huilu",
    clef: "G",
    key: 0,
    time: [4, 4],
    notes: []
  });

  let rendering = Promise.resolve();

  function updateStatus(message, className) {
    const status = document.getElementById("status");
    status.textContent = message;
    status.className = "status" + (className ? " " + className : "");
  }

  function renderScore() {
    const musicXML = window.PikakirjoitinMusicXML.createMusicXML(score);

    console.log("Pikakirjoitin 3 Score Model:", score);
    console.log("Pikakirjoitin 3 generoitu MusicXML:\n", musicXML);

    rendering = rendering.then(function () {
      return window.PikakirjoitinRenderer.renderMusicXML(musicXML, "osmd-container");
    });

    return rendering;
  }

  function addCQuarter() {
    window.PikakirjoitinScoreModel.addNote(score, {
      pitch: "C4",
      duration: "quarter"
    });

    updateStatus("Piirretään…");

    renderScore().then(function () {
      const count = score.notes.length;
      updateStatus(
        "OK · " + count + (count === 1 ? " nuotti" : " nuottia") + " Score Modelissa.",
        "ok"
      );
    }).catch(function (error) {
      console.error(error);
      updateStatus("Virhe: " + (error && error.message ? error.message : String(error)), "error");
    });
  }

  function start() {
    const keyC = document.getElementById("key-c");
    keyC.addEventListener("click", addCQuarter);

    renderScore().then(function () {
      updateStatus("Valmis · paina C-kosketinta.", "ok");
    }).catch(function (error) {
      console.error(error);
      updateStatus("Virhe: " + (error && error.message ? error.message : String(error)), "error");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
