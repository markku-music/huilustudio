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
  let thumbState = { rest: false, dots: 0, slur: false };
  let keyboard = null;
  let selection = null;
  let selectionEditor = null;
  let keyboardEditId = null;
  let lastSelectionEditorAnchor = null;
  let pendingSelectedSlurStartId = null;
  const noteInputMeta = new Map();

  let settings = {
    transpose: 0,
    keyboardStartMidi: 60
  };

  const durationLabels = {
    whole: "1/1",
    half: "1/2",
    quarter: "1/4",
    eighth: "1/8",
    sixteenth: "1/16",
    "thirty-second": "1/32",
    "sixty-fourth": "1/64",
    "one-hundred-twenty-eighth": "1/128"
  };

  function updateStatus(message, className) {
    const status = document.getElementById("status");
    status.textContent = message;
    status.className = "status" + (className ? " " + className : "");
  }

  function refreshSelectionFromRenderedScore() {
    if (!selection) return;
    const segments = window.PikakirjoitinMusicXML.getLogicalSegments(score);
    selection.refresh({ segments: segments });
    if (keyboardEditId) {
      selection.retainSingle(keyboardEditId);
    }
  }

  function renderScore() {
    const musicXML = window.PikakirjoitinMusicXML.createMusicXML(score);
    console.log("Pikakirjoitin 3 Score Model:", score);
    console.log("Pikakirjoitin 3 generoitu MusicXML:\n", musicXML);

    rendering = rendering.then(function () {
      return window.PikakirjoitinRenderer.renderMusicXML(musicXML, "osmd-container");
    }).then(function (osmd) {
      refreshSelectionFromRenderedScore();
      return osmd;
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
    const label = durationLabels[duration] || duration;

    if (entry && entry.kind === "rest") {
      if (entry.measureRest) return "kokotahdin tauko";
      return dotWord(dots) + label + "-tauko";
    }

    return displayPitch(pitch || (entry && entry.pitch) || "") + " " + dotWord(dots) + label;
  }

  function selectedIds() { return selection ? selection.selectedIds : []; }

  function selectedSingleNote() {
    const ids = selectedIds();
    if (ids.length !== 1) return null;
    const entry = window.PikakirjoitinScoreModel.getEntry(score, ids[0]);
    return entry && entry.kind === "note" ? entry : null;
  }

  function applyThumbSlurFromSelectedNote(startId) {
    const start = window.PikakirjoitinScoreModel.getEntry(score, startId);

    if (!start || start.kind !== "note") {
      updateStatus("Slur voi alkaa vain nuotista.");
      return;
    }

    const nextId = window.PikakirjoitinScoreModel.nextNoteId(score, startId);

    // Olemassa olevaa nuottia klikattaessa suunta on eteenpäin:
    // valittu nuotti -> seuraava nuotti.
    if (nextId) {
      pendingSelectedSlurStartId = null;

      if (window.PikakirjoitinScoreModel.hasSlur(score, startId, nextId)) {
        updateStatus("Slur on jo valitusta nuotista seuraavaan nuottiin.", "ok");
        return;
      }

      if (window.PikakirjoitinScoreModel.addSlur(score, startId, nextId)) {
        renderScore().then(function () {
          selection.retainSingle(startId);
          updateStatus("Slur lisätty valitusta nuotista seuraavaan nuottiin.", "ok");
        }).catch(function (error) {
          console.error(error);
          updateStatus(
            "Virhe: " + (error && error.message ? error.message : String(error)),
            "error"
          );
        });
      }

      return;
    }

    // Jos klikattu nuotti on viimeinen, se jää odottamaan seuraavaa
    // myöhemmin kirjoitettavaa nuottia.
    pendingSelectedSlurStartId = startId;
    updateStatus("Slur alkaa valitusta nuotista · odottaa seuraavaa nuottia.", "ok");
  }

  function startEntry(midi, pitch, duration) {
    const dots = thumbState.dots || 0;
    const selected = selectedSingleNote();

    if (selected) {
      keyboardEditId = selected.id;
      if (thumbState.rest) {
        window.PikakirjoitinScoreModel.updateEntry(score, selected.id, {
          kind: "rest",
          duration: duration,
          dots: dots,
          measureRest: duration === "whole" && dots === 0
        });
      } else {
        window.PikakirjoitinScoreModel.updateEntry(score, selected.id, {
          kind: "note",
          pitch: pitch,
          duration: duration,
          dots: dots,
          measureRest: false
        });
      }

      const edited = window.PikakirjoitinScoreModel.getEntry(score, selected.id);
      noteInputMeta.set(selected.id, { fromEdit: true, startedWithSlur: Boolean(thumbState.slur) });
      updateStatus(entryLabel(edited, pitch, duration) + " · muokataan…");

      renderScore().catch(function (error) {
        console.error(error);
        updateStatus("Virhe: " + (error && error.message ? error.message : String(error)), "error");
      });

      return { id: selected.id, sound: edited && edited.kind !== "rest" };
    }

    if (selection && selectedIds().length) selection.clear();

    const entry = thumbState.rest
      ? window.PikakirjoitinScoreModel.addRest(score, {
          duration: duration,
          dots: dots,
          measureRest: duration === "whole" && dots === 0
        })
      : window.PikakirjoitinScoreModel.addNote(score, {
          pitch: pitch,
          duration: duration,
          dots: dots
        });

    noteInputMeta.set(entry.id, { fromEdit: false, startedWithSlur: Boolean(thumbState.slur) });
    updateStatus(entryLabel(entry, pitch, duration) + " · ele kesken…");

    renderScore().catch(function (error) {
      console.error(error);
      updateStatus("Virhe: " + (error && error.message ? error.message : String(error)), "error");
    });

    return { id: entry.id, sound: entry.kind !== "rest" };
  }

  function changeDuration(id, duration, midi, pitch) {
    const targetId = keyboardEditId || id;
    if (!window.PikakirjoitinScoreModel.setDuration(score, targetId, duration)) {
      return;
    }
    const entry = window.PikakirjoitinScoreModel.getEntry(score, targetId);
    updateStatus(entryLabel(entry, pitch, duration) + " · aika-arvo muutettu");

    renderScore().catch(function (error) {
      console.error(error);
      updateStatus("Virhe: " + (error && error.message ? error.message : String(error)), "error");
    });
  }

  function finishEntry(id, duration, midi, pitch) {
    const count = score.notes.length;
    const targetId = keyboardEditId || id;
    const entry = window.PikakirjoitinScoreModel.getEntry(score, targetId);
    const meta = noteInputMeta.get(targetId) || {};

    if (entry && !meta.fromEdit && entry.kind === "note") {
      // Jos olemassa oleva viimeinen nuotti klikattiin Slur pohjassa,
      // seuraava kirjoitettu nuotti sulkee sen eteenpäin-slurin.
      if (
        pendingSelectedSlurStartId &&
        pendingSelectedSlurStartId !== targetId
      ) {
        window.PikakirjoitinScoreModel.addSlur(
          score,
          pendingSelectedSlurStartId,
          targetId
        );
        pendingSelectedSlurStartId = null;
      }

      // Uutta nuottia KIRJOITETTAESSA Slur-modifieri toimii vastakkaiseen
      // suuntaan: juuri kirjoitettu nuotti kytkeytyy edelliseen nuottiin.
      if (meta.startedWithSlur) {
        const previousId = window.PikakirjoitinScoreModel.previousNoteId(
          score,
          targetId
        );

        if (previousId) {
          window.PikakirjoitinScoreModel.addSlur(score, previousId, targetId);
        }
      }
    }

    if (entry && entry.kind === "rest" && meta.startedWithSlur) {
      updateStatus("Slur voidaan kytkeä vain nuottiin. Tauko kirjoitettiin normaalisti.");
    }

    noteInputMeta.delete(targetId);

    renderScore().then(function () {
      if (keyboardEditId && selection) {
        selection.retainSingle(keyboardEditId);
      }

      let message = "OK · " + entryLabel(entry, pitch, duration) + " · " + count + (count === 1 ? " tapahtuma" : " tapahtumaa");
      if (!meta.fromEdit && entry && entry.kind === "note" && meta.startedWithSlur) {
        const previousId = window.PikakirjoitinScoreModel.previousNoteId(score, targetId);
        message += previousId
          ? " · slur edellisestä nuotista"
          : " · ei edellistä nuottia";
      }
      updateStatus(message, "ok");
      keyboardEditId = null;
    }).catch(function (error) {
      keyboardEditId = null;
      console.error(error);
      updateStatus("Virhe: " + (error && error.message ? error.message : String(error)), "error");
    });
  }

  function describeThumbState(state) {
    const parts = [];
    if (state.rest) parts.push("Tauko");
    if (state.dots === 1) parts.push("1 piste");
    if (state.dots === 2) parts.push("2 pistettä");
    if (state.slur) parts.push("Slur");
    return parts.length ? parts.join(" + ") + " pohjassa · tee aika-arvoele koskettimella." : "";
  }

  function timeSettings(value) {
    if (value === "C") return { time: [4, 4], symbol: "common" };
    if (value === "cutC") return { time: [2, 2], symbol: "cut" };
    const parts = String(value || "4/4").split("/").map(Number);
    return { time: [parts[0] || 4, parts[1] || 4], symbol: "" };
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
    score.key = Number.isInteger(settings.keySignature) ? settings.keySignature : 0;
    score.time = meter.time;
    score.timeSymbol = meter.symbol;
    score.pickupDuration = Number(settings.pickupDuration) || 0;
    score.clef = clefValue(settings.clef);

    await renderScore();

    requestAnimationFrame(function () {
      if (keyboard) {
        keyboard.scrollToMidi(Number(settings.keyboardStartMidi) || 60);
      }
    });

    updateStatus("Valmis · ääni on käytössä ja kirjoitus voi alkaa.", "ok");
  }

  function slurChoiceLabel(slur) {
    const start = window.PikakirjoitinScoreModel.getEntry(score, slur.startId);
    const end = window.PikakirjoitinScoreModel.getEntry(score, slur.endId);

    const startName = start && start.pitch ? displayPitch(start.pitch) : "alku";
    const endName = end && end.pitch ? displayPitch(end.pitch) : "loppu";

    return startName + "–" + endName;
  }

  function slurChoicesForSingleNote(noteId) {
    return window.PikakirjoitinScoreModel.slursAtNote(score, noteId)
      .map(function (slur) {
        return {
          id: slur.id,
          label: slurChoiceLabel(slur)
        };
      });
  }

  function removeSlurByIdAndKeepSelection(slurId) {
    const ids = selectedIds();
    if (!slurId || !ids.length) return;

    if (window.PikakirjoitinScoreModel.removeSlurById(score, slurId)) {
      renderScore().then(function () {
        selection.retainIds(ids);
        updateStatus("Slur poistettu.", "ok");
      }).catch(function (error) {
        console.error(error);
        updateStatus(
          "Virhe: " + (error && error.message ? error.message : String(error)),
          "error"
        );
      });
    }
  }

  function setupSelection() {
    selection = new window.PikakirjoitinSelection.ScoreRangeSelection({
      viewport: document.querySelector(".score-card"),
      container: document.getElementById("osmd-container")
    });

    selectionEditor = new window.PikakirjoitinSelectionEditor.SelectionEditor({
      onEnharmonic: function () {
        const note = selectedSingleNote();
        if (!note) return;
        if (window.PikakirjoitinScoreModel.toggleEnharmonic(score, note.id)) {
          renderScore().then(function () {
            selection.retainSingle(note.id);
            updateStatus("Enharmoninen kirjoitusasu vaihdettu.", "ok");
          });
        }
      },

      onSlur: function () {
        const ids = selectedIds();
        if (!ids.length) return;

        // Yksi nuotti: kelluvan palkin Slur poistaa sen kohdalla olevan
        // ainoan slurin. Jos slurreja on useita, editori avaa flyoutin.
        if (ids.length === 1) {
          const slurs = window.PikakirjoitinScoreModel.slursAtNote(
            score,
            ids[0]
          );

          if (slurs.length === 1) {
            removeSlurByIdAndKeepSelection(slurs[0].id);
          }
          return;
        }

        // Useampi nuotti: 0.14.4:n korvauslogiikka säilyy.
        const result =
          window.PikakirjoitinScoreModel.toggleSlurForSelection(score, ids);

        if (!result.changed) {
          if (result.reason === "need_two_notes") {
            updateStatus("Slur vaatii vähintään kaksi valittua nuottia.", "error");
          } else if (result.reason === "notes_only") {
            updateStatus("Slur voidaan lisätä vain pelkille nuoteille.", "error");
          }
          return;
        }

        renderScore().then(function () {
          selection.retainIds(ids);
          updateStatus(
            result.active
              ? (result.replacedCount
                  ? "Aiemmat valinta-alueen slurit korvattu uudella slurilla."
                  : "Slur lisätty valittujen nuottien ylle.")
              : "Slur poistettu valinnasta.",
            "ok"
          );
        }).catch(function (error) {
          console.error(error);
          updateStatus(
            "Virhe: " + (error && error.message ? error.message : String(error)),
            "error"
          );
        });
      },

      onSlurChoice: function (slurId) {
        removeSlurByIdAndKeepSelection(slurId);
      },

      onRest: function () {
        const ids = selectedIds();
        if (!ids.length) return;

        const result = window.PikakirjoitinScoreModel.convertSelectionToRests(score, ids);
        if (!result.changed) return;

        renderScore().then(function () {
          selection.retainIds(result.ids);
          updateStatus(ids.length === 1 ? "Valittu tapahtuma muutettu saman aika-arvon tauoksi." : "Valittu alue kirjoitettu uudelleen järkevinä taukoina.", "ok");
        }).catch(function (error) {
          console.error(error);
          updateStatus("Virhe: " + (error && error.message ? error.message : String(error)), "error");
        });
      },

      onDelete: function () {
        const ids = selectedIds();
        if (!ids.length) return;
        if (window.PikakirjoitinScoreModel.deleteEntries(score, ids)) {
          selection.clear();
          renderScore().then(function () {
            updateStatus(ids.length === 1 ? "Tapahtuma poistettu." : ids.length + " tapahtumaa poistettu.", "ok");
          });
        }
      }
    });

    selection.subscribeCommit(function (state) {
      const ids = state.selectedIds || [];

      if (!thumbState.slur || state.count !== 1) return;

      // Tämä laukeaa vasta sormen nostossa. Peukalopakin Slur täytyy siis
      // olla edelleen pohjassa, kun yhden nuotin valinta valmistuu.
      applyThumbSlurFromSelectedNote(ids[0]);
    });

    selection.subscribe(function (state) {
      const ids = state.selectedIds || [];
      const single = state.count === 1 ? window.PikakirjoitinScoreModel.getEntry(score, ids[0]) : null;

      if (state.anchor) {
        lastSelectionEditorAnchor = Object.assign({}, state.anchor);
      }

      if (!state.count) {
        lastSelectionEditorAnchor = null;
        selectionEditor.update({ visible:false });
        return;
      }

      const anchor = state.anchor || lastSelectionEditorAnchor;
      if (!anchor) return;

      const singleSlurChoices =
        single && single.kind === "note"
          ? slurChoicesForSingleNote(single.id)
          : [];

      const canCreateMultiSlur =
        window.PikakirjoitinScoreModel.canCreateSlurFromSelection(score, ids);

      selectionEditor.update({
        visible: true,
        x: anchor.x,
        staffTop: anchor.staffTop,
        staffBottom: anchor.staffBottom,
        canEnharmonic: Boolean(
          single &&
          single.kind === "note" &&
          window.PikakirjoitinScoreModel.canEnharmonic(score, single.id)
        ),
        singleSelection: state.count === 1,
        slurChoices: singleSlurChoices,
        canSlur:
          state.count === 1
            ? singleSlurChoices.length > 0
            : canCreateMultiSlur,
        slurActive:
          state.count === 1
            ? singleSlurChoices.length > 0
            : window.PikakirjoitinScoreModel.hasSlurForSelection(score, ids)
      });
    });
  }

  function start() {
    setupSelection();

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
      updateStatus("Virhe: " + (error && error.message ? error.message : String(error)), "error");
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
