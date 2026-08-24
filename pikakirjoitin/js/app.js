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

  const durationLabels = {
    whole: "1/1",
    half: "1/2",
    quarter: "1/4",
    eighth: "1/8"
  };

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

  function displayPitch(pitch) {
    return String(pitch).replace("B", "H");
  }

  function startNote(midi, pitch, duration) {
    const note = window.PikakirjoitinScoreModel.addNote(score, {
      pitch: pitch,
      duration: duration
    });

    updateStatus(
      displayPitch(pitch) + " · " + durationLabels[duration] + " · ele kesken…"
    );

    renderScore().catch(function (error) {
      console.error(error);
      updateStatus(
        "Virhe: " + (error && error.message ? error.message : String(error)),
        "error"
      );
    });

    return { id: note.id };
  }

  function changeDuration(id, duration, midi, pitch) {
    if (!window.PikakirjoitinScoreModel.setDuration(score, id, duration)) return;

    updateStatus(
      displayPitch(pitch) + " · aika-arvo " + durationLabels[duration]
    );

    renderScore().catch(function (error) {
      console.error(error);
      updateStatus(
        "Virhe: " + (error && error.message ? error.message : String(error)),
        "error"
      );
    });
  }

  function finishNote(id, duration, midi, pitch) {
    const count = score.notes.length;

    renderScore().then(function () {
      updateStatus(
        "OK · " + displayPitch(pitch) + " " + durationLabels[duration] +
        " · " + count + (count === 1 ? " nuotti" : " nuottia"),
        "ok"
      );
    }).catch(function (error) {
      console.error(error);
      updateStatus(
        "Virhe: " + (error && error.message ? error.message : String(error)),
        "error"
      );
    });
  }

  function start() {
    new window.PikakirjoitinKeyboard.PianoKeyboard({
      piano: document.getElementById("piano"),
      whiteKeys: document.getElementById("whiteKeys"),
      viewport: document.getElementById("keyboardViewport"),
      rail: document.getElementById("keyboardScrollRail"),
      track: document.getElementById("keyboardScrollTrack"),
      thumb: document.getElementById("keyboardScrollThumb"),
      onStart: startNote,
      onDuration: changeDuration,
      onFinish: finishNote
    });

    renderScore().then(function () {
      updateStatus("Valmis · napauta 1/4 · alas 1/8 · ylös 1/2 · pitkä 1/1.", "ok");
    }).catch(function (error) {
      console.error(error);
      updateStatus(
        "Virhe: " + (error && error.message ? error.message : String(error)),
        "error"
      );
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
