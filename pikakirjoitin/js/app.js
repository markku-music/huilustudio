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
  let thumbState = { rest: false, dots: 0 };

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

  function dotWord(dots) {
    if (dots === 2) return "kaksipisteinen ";
    if (dots === 1) return "pisteellinen ";
    return "";
  }

  function entryLabel(entry, pitch, duration) {
    const dots = entry ? Number(entry.dots) || 0 : 0;

    if (entry && entry.kind === "rest") {
      if (duration === "whole" && dots === 0) {
        return "kokotahdin tauko";
      }
      return dotWord(dots) + durationLabels[duration] + "-tauko";
    }

    return displayPitch(pitch) + " " +
      dotWord(dots) + durationLabels[duration];
  }

  function startEntry(midi, pitch, duration) {
    const dots = thumbState.dots || 0;

    const entry = thumbState.rest
      ? window.PikakirjoitinScoreModel.addRest(score, {
          duration: duration,
          dots: dots
        })
      : window.PikakirjoitinScoreModel.addNote(score, {
          pitch: pitch,
          duration: duration,
          dots: dots
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

  function describeThumbState(state) {
    const parts = [];

    if (state.rest) parts.push("Tauko");
    if (state.dots === 1) parts.push("1 piste");
    if (state.dots === 2) parts.push("2 pistettä");

    return parts.length
      ? parts.join(" + ") + " pohjassa · tee aika-arvoele koskettimella."
      : "";
  }

  function start() {
    new window.PikakirjoitinThumbRail.ThumbRail({
      rail: document.getElementById("thumbRail"),
      boundsElement: document.querySelector(".score-card"),
      onChange: function (state) {
        thumbState = state;
        const description = describeThumbState(state);
        if (description) updateStatus(description);
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
        "Valmis · peukalopalkissa Tauko, yksi piste ja kaksi pistettä.",
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
