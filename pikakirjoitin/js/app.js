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
  let thumbState = { rest: false };

  const durationLabels = {
    whole: "1/1",
    half: "1/2",
    quarter: "1/4",
    eighth: "1/8",
    sixteenth: "1/16",
    "thirty-second": "1/32"
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
      return window.PikakirjoitinRenderer.renderMusicXML(
        musicXML,
        "osmd-container"
      );
    });

    return rendering;
  }

  function displayPitch(pitch) {
    return String(pitch).replace("B", "H");
  }

  function entryLabel(entry, pitch, duration) {
    if (entry && entry.kind === "rest") {
      return duration === "whole"
        ? "kokotahdin tauko"
        : durationLabels[duration] + "-tauko";
    }
    return displayPitch(pitch) + " " + durationLabels[duration];
  }

  function startEntry(midi, pitch, duration) {
    const entry = thumbState.rest
      ? window.PikakirjoitinScoreModel.addRest(score, { duration: duration })
      : window.PikakirjoitinScoreModel.addNote(score, {
          pitch: pitch,
          duration: duration
        });

    updateStatus(entryLabel(entry, pitch, duration) + " · ele kesken…");

    renderScore().catch(function (error) {
      console.error(error);
      updateStatus(
        "Virhe: " + (error && error.message ? error.message : String(error)),
        "error"
      );
    });

    return { id: entry.id };
  }

  function changeDuration(id, duration, midi, pitch) {
    if (!window.PikakirjoitinScoreModel.setDuration(score, id, duration)) return;

    const entry = window.PikakirjoitinScoreModel.getEntry(score, id);
    updateStatus(entryLabel(entry, pitch, duration) + " · aika-arvo muutettu");

    renderScore().catch(function (error) {
      console.error(error);
      updateStatus(
        "Virhe: " + (error && error.message ? error.message : String(error)),
        "error"
      );
    });
  }

  function finishEntry(id, duration, midi, pitch) {
    const count = score.notes.length;
    const entry = window.PikakirjoitinScoreModel.getEntry(score, id);

    renderScore().then(function () {
      updateStatus(
        "OK · " + entryLabel(entry, pitch, duration) +
        " · " + count + (count === 1 ? " tapahtuma" : " tapahtumaa"),
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
    new window.PikakirjoitinThumbRail.ThumbRail({
      rail: document.getElementById("thumbRail"),
      boundsElement: document.querySelector(".score-card"),
      onChange: function (state) {
        thumbState = state;
        if (state.rest) {
          updateStatus(
            "Tauko pohjassa · valitse aika-arvo koskettimen eleellä."
          );
        }
      }
    });

    new window.PikakirjoitinKeyboard.PianoKeyboard({
      piano: document.getElementById("piano"),
      whiteKeys: document.getElementById("whiteKeys"),
      viewport: document.getElementById("keyboardViewport"),
      rail: document.getElementById("keyboardScrollRail"),
      track: document.getElementById("keyboardScrollTrack"),
      thumb: document.getElementById("keyboardScrollThumb"),
      onStart: startEntry,
      onDuration: changeDuration,
      onFinish: finishEntry
    });

    renderScore().then(function () {
      updateStatus(
        "Valmis · pidä Tauko pohjassa + tee aika-arvoele koskettimella.",
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
