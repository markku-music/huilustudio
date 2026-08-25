(function () {
  "use strict";

  const app = document.getElementById("app");
  if (app) {
    app.inert = true;
    app.setAttribute("aria-hidden", "true");
  }

  const score = window.PikakirjoitinScoreModel.createScore({
    title: "Pikakirjoitin 3",
    composer: "",
    tempoText: "",
    partName: "Huilu",
    clef: "G",
    key: 0,
    time: [4, 4],
    timeSymbol: "",
    pickupDuration: 0,
    notes: []
  });

  const audio = new window.PikakirjoitinAudio.AudioEngine();

  let rendering = Promise.resolve();
  let thumbState = { rest: false, dots: 0 };
  let keyboard = null;
  let settings = {
    transpose: 0,
    keyboardStartMidi: 60
  };

  const ENGRAVING_STORAGE_KEY = "pikakirjoitin3.osmdTextSpacing";
  let engravingSettings =
    window.PikakirjoitinRenderer.getEngravingSettings();

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

    return {
      id: entry.id,
      sound: entry.kind !== "rest"
    };
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

  function clampNumber(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
  }

  function normalizeEngravingSettings(value) {
    const defaults =
      window.PikakirjoitinRenderer.DEFAULT_ENGRAVING_SETTINGS;

    value = value || {};

    return {
      titleTopDistance: clampNumber(
        value.titleTopDistance, 2, 7, defaults.titleTopDistance
      ),
      composerDistance: clampNumber(
        value.composerDistance, 0.5, 4, defaults.composerDistance
      ),
      tempoYSpacing: clampNumber(
        value.tempoYSpacing, 0, 2, defaults.tempoYSpacing
      )
    };
  }

  function loadEngravingSettings() {
    try {
      const raw = localStorage.getItem(ENGRAVING_STORAGE_KEY);
      if (!raw) {
        return normalizeEngravingSettings(
          window.PikakirjoitinRenderer.DEFAULT_ENGRAVING_SETTINGS
        );
      }

      return normalizeEngravingSettings(JSON.parse(raw));
    } catch (error) {
      return normalizeEngravingSettings(
        window.PikakirjoitinRenderer.DEFAULT_ENGRAVING_SETTINGS
      );
    }
  }

  function saveEngravingSettings() {
    try {
      localStorage.setItem(
        ENGRAVING_STORAGE_KEY,
        JSON.stringify(engravingSettings)
      );
    } catch (error) {}
  }

  function closestOptionValue(select, value) {
    const options = Array.from(select.options);
    if (!options.length) return "";

    let best = options[0];
    let bestDistance = Math.abs(Number(best.value) - Number(value));

    for (const option of options.slice(1)) {
      const distance = Math.abs(Number(option.value) - Number(value));
      if (distance < bestDistance) {
        best = option;
        bestDistance = distance;
      }
    }

    return best.value;
  }

  function syncEngravingControls() {
    const titleSelect = document.getElementById("titleDistanceSelect");
    const composerSelect = document.getElementById("composerDistanceSelect");
    const tempoSelect = document.getElementById("tempoSpacingSelect");

    if (titleSelect) {
      titleSelect.value = closestOptionValue(
        titleSelect, engravingSettings.titleTopDistance
      );
    }

    if (composerSelect) {
      composerSelect.value = closestOptionValue(
        composerSelect, engravingSettings.composerDistance
      );
    }

    if (tempoSelect) {
      tempoSelect.value = closestOptionValue(
        tempoSelect, engravingSettings.tempoYSpacing
      );
    }
  }

  function applyEngravingControls() {
    engravingSettings = normalizeEngravingSettings({
      titleTopDistance:
        document.getElementById("titleDistanceSelect").value,
      composerDistance:
        document.getElementById("composerDistanceSelect").value,
      tempoYSpacing:
        document.getElementById("tempoSpacingSelect").value
    });

    window.PikakirjoitinRenderer.setEngravingSettings(
      engravingSettings
    );

    saveEngravingSettings();

    renderScore().then(function () {
      updateStatus(
        "OSMD-asetukset päivitetty · otsikko " +
        engravingSettings.titleTopDistance +
        " · säveltäjä " +
        engravingSettings.composerDistance +
        " · tempo " +
        engravingSettings.tempoYSpacing,
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

  function initEngravingSettings() {
    const gear = document.getElementById("engravingGear");
    const popover = document.getElementById("engravingPopover");
    const reset = document.getElementById("engravingReset");
    const selects = [
      document.getElementById("titleDistanceSelect"),
      document.getElementById("composerDistanceSelect"),
      document.getElementById("tempoSpacingSelect")
    ].filter(Boolean);

    engravingSettings = loadEngravingSettings();
    window.PikakirjoitinRenderer.setEngravingSettings(
      engravingSettings
    );
    syncEngravingControls();

    function setOpen(open) {
      popover.hidden = !open;
      gear.setAttribute("aria-expanded", open ? "true" : "false");
    }

    gear.addEventListener("click", function (event) {
      event.stopPropagation();
      setOpen(popover.hidden);
    });

    popover.addEventListener("click", function (event) {
      event.stopPropagation();
    });

    for (const select of selects) {
      select.addEventListener("change", applyEngravingControls);
    }

    reset.addEventListener("click", function () {
      engravingSettings = normalizeEngravingSettings(
        window.PikakirjoitinRenderer.DEFAULT_ENGRAVING_SETTINGS
      );

      window.PikakirjoitinRenderer.setEngravingSettings(
        engravingSettings
      );

      syncEngravingControls();
      saveEngravingSettings();

      renderScore().then(function () {
        updateStatus("OSMD:n tekstietäisyydet palautettu oletuksiin.", "ok");
      }).catch(function (error) {
        console.error(error);
        updateStatus(
          "Virhe: " + (error && error.message ? error.message : String(error)),
          "error"
        );
      });
    });

    document.addEventListener("pointerdown", function (event) {
      if (popover.hidden) return;
      if (popover.contains(event.target) || gear.contains(event.target)) return;
      setOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !popover.hidden) {
        setOpen(false);
        gear.focus();
      }
    });
  }

  function timeSettings(value) {
    if (value === "C") {
      return { time: [4, 4], symbol: "common" };
    }

    if (value === "cutC") {
      return { time: [2, 2], symbol: "cut" };
    }

    const parts = String(value || "4/4").split("/").map(Number);
    return {
      time: [parts[0] || 4, parts[1] || 4],
      symbol: ""
    };
  }

  function clefValue(value) {
    if (value === "alto") return "C";
    if (value === "bass") return "F";
    return "G";
  }

  async function applyStartSettings(nextSettings) {
    settings = Object.assign({}, nextSettings);

    const meter = timeSettings(settings.timeSignature);

    score.metadata.title = settings.title || "Pikakirjoitin 3";
    score.metadata.composer = settings.composer || "";
    score.metadata.tempoText = settings.tempoText || "";

    score.key = Number.isInteger(settings.keySignature)
      ? settings.keySignature
      : 0;

    score.time = meter.time;
    score.timeSymbol = meter.symbol;
    score.pickupDuration = Number(settings.pickupDuration) || 0;
    score.clef = clefValue(settings.clef);

    await renderScore();

    requestAnimationFrame(function () {
      if (keyboard) {
        keyboard.scrollToMidi(
          Number(settings.keyboardStartMidi) || 60
        );
      }
    });

    updateStatus(
      "Valmis · ääni on käytössä ja kirjoitus voi alkaa.",
      "ok"
    );
  }

  function start() {
    initEngravingSettings();

    new window.PikakirjoitinThumbRail.ThumbRail({
      rail: document.getElementById("thumbRail"),
      boundsElement: document.querySelector(".score-card"),
      onChange: function (state) {
        thumbState = state;
        const description = describeThumbState(state);
        if (description) updateStatus(description);
      }
    });

    keyboard = new window.PikakirjoitinKeyboard.PianoKeyboard({
      piano: document.getElementById("piano"),
      whiteKeys: document.getElementById("whiteKeys"),
      viewport: document.getElementById("keyboardViewport"),
      rail: document.getElementById("keyboardScrollRail"),
      track: document.getElementById("keyboardScrollTrack"),
      thumb: document.getElementById("keyboardScrollThumb"),
      onStart: startEntry,
      onDuration: changeDuration,
      onSoundStart: function (midi) {
        audio.noteOn(Number(midi) + (Number(settings.transpose) || 0));
      },
      onSoundStop: function () {
        audio.noteOff();
      },
      onFinish: finishEntry
    });

    renderScore().catch(function (error) {
      console.error(error);
      updateStatus(
        "Virhe: " + (error && error.message ? error.message : String(error)),
        "error"
      );
    });

    new window.PikakirjoitinStartScreen.StartScreen({
      audio: audio,
      onStart: applyStartSettings
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
