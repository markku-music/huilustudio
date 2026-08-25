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
  let thumbState = { rest: false, dots: 0, slur: false, tie: false, layout: false };
  let keyboard = null;
  let thumbRail = null;
  let startScreen = null;
  let selection = null;
  let selectionEditor = null;
  let layoutEditor = null;
  let keyboardEditId = null;
  let lastSelectionEditorAnchor = null;
  let pendingSelectedSlurStartId = null;
  const noteInputMeta = new Map();

  const UNDO_LIMIT = 100;
  const undoStack = [];
  let undoInProgress = false;

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

  function clonePlain(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function currentUiSnapshot() {
    const scoreCard = document.querySelector(".score-card");
    const keyboardViewport = document.getElementById("keyboardViewport");

    return {
      scoreScrollTop: scoreCard ? scoreCard.scrollTop : 0,
      keyboardScrollLeft: keyboardViewport ? keyboardViewport.scrollLeft : 0,
      selectedIds: selection ? selection.selectedIds.slice() : []
    };
  }

  function captureUndoSnapshot(label) {
    return {
      label: label || "muutos",
      score: clonePlain(score),
      settings: clonePlain(settings),
      ui: currentUiSnapshot()
    };
  }

  function commitUndoSnapshot(snapshot) {
    if (!snapshot || undoInProgress) return;

    undoStack.push(snapshot);
    if (undoStack.length > UNDO_LIMIT) {
      undoStack.splice(0, undoStack.length - UNDO_LIMIT);
    }
  }

  function pushUndoSnapshot(label) {
    commitUndoSnapshot(captureUndoSnapshot(label));
  }

  function replaceScoreState(nextScore) {
    Object.keys(score).forEach(function (key) {
      delete score[key];
    });

    Object.assign(score, clonePlain(nextScore));

    window.PikakirjoitinScoreModel.cleanupTies(score);
    window.PikakirjoitinScoreModel.cleanupSlurs(score);
    score.layout =
      window.PikakirjoitinScoreModel.normalizeLayout(score.layout);
  }

  function clearTransientInputState() {
    keyboardEditId = null;
    pendingSelectedSlurStartId = null;
    noteInputMeta.clear();
    audio.noteOff();

    if (thumbRail && thumbState.tie) {
      thumbRail.setToggle("tie", false);
    }
  }

  async function undoLastAction() {
    if (undoInProgress) return;

    const snapshot = undoStack.pop();
    if (!snapshot) {
      updateStatus("Ei kumottavaa.", "ok");
      return;
    }

    undoInProgress = true;

    try {
      clearTransientInputState();
      replaceScoreState(snapshot.score);
      settings = clonePlain(snapshot.settings || {});

      if (startScreen) {
        startScreen.syncSettings(settings);
      }

      if (selection) {
        selection.clear();
      }

      await renderScore();

      if (
        selection &&
        snapshot.ui &&
        Array.isArray(snapshot.ui.selectedIds) &&
        snapshot.ui.selectedIds.length
      ) {
        selection.retainIds(snapshot.ui.selectedIds);
      }

      requestAnimationFrame(function () {
        const scoreCard = document.querySelector(".score-card");
        const keyboardViewport = document.getElementById("keyboardViewport");

        if (scoreCard && snapshot.ui) {
          scoreCard.scrollTop = Number(snapshot.ui.scoreScrollTop) || 0;
        }

        if (keyboardViewport && snapshot.ui) {
          keyboardViewport.scrollLeft =
            Number(snapshot.ui.keyboardScrollLeft) || 0;
        }
      });

      updateStatus("Kumottu · " + snapshot.label + ".", "ok");
    } catch (error) {
      console.error(error);
      updateStatus(
        "Undo epäonnistui: " +
          (error && error.message ? error.message : String(error)),
        "error"
      );
    } finally {
      undoInProgress = false;
    }
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
      return window.PikakirjoitinRenderer.renderMusicXML(
        musicXML,
        "osmd-container",
        "score",
        score.layout
      );
    }).then(function (osmd) {
      refreshSelectionFromRenderedScore();
      if (layoutEditor) layoutEditor.refresh();
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

      const undoSnapshot = captureUndoSnapshot("Slur");

      if (window.PikakirjoitinScoreModel.addSlur(score, startId, nextId)) {
        commitUndoSnapshot(undoSnapshot);
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
    pushUndoSnapshot(
      selectedSingleNote()
        ? "Nuotin muokkaus"
        : "Nuotin kirjoitus"
    );

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

    // Sama kertakäyttöinen Tie-logiikka kuin Pikakirjoitin 2:ssa:
    // Tie viritetään napauttamalla ja kulutetaan heti seuraavaan UUTEEN
    // syötettyyn tapahtumaan riippumatta siitä, onnistuuko side.
    const tieWasArmed = Boolean(thumbState.tie);
    if (tieWasArmed && thumbRail) {
      thumbRail.setToggle("tie", false);
    }

    const previousEntry =
      score.notes.length
        ? score.notes[score.notes.length - 1]
        : null;

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

    let tieApplied = false;

    if (
      tieWasArmed &&
      entry.kind === "note" &&
      previousEntry &&
      previousEntry.kind === "note"
    ) {
      tieApplied = window.PikakirjoitinScoreModel.addTie(
        score,
        previousEntry.id,
        entry.id
      );
    }

    noteInputMeta.set(entry.id, {
      fromEdit: false,
      startedWithSlur: Boolean(thumbState.slur),
      startedWithTie: tieWasArmed,
      tieApplied: tieApplied
    });

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

      if (!meta.fromEdit && meta.startedWithTie) {
        if (meta.tieApplied) {
          message += " · tie edellisestä nuotista";
        } else if (entry && entry.kind === "rest") {
          message += " · tie kulutettu, taukoon ei muodostu sidekaarta";
        } else {
          message += " · tie ei muodostunut, edellisen sävelen on oltava sama";
        }
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

  async function applyStartSettings(nextSettings, context) {
    const isNewProject = Boolean(context && context.newProject);
    const isUpdateExisting = Boolean(context && context.updateExisting);

    if (isNewProject) {
      pushUndoSnapshot("Uusi nuotti");

      clearTransientInputState();

      if (selection) selection.clear();

      score.notes = [];
      score.ties = [];
      score.slurs = [];
      score.layout =
        window.PikakirjoitinScoreModel.normalizeLayout();
    } else if (isUpdateExisting) {
      // Kolmen sormen kautta "PÄIVITÄ TIEDOT" muuttaa nykyistä
      // kappaletta, mutta ei koske nuotteihin, taukoihin, Tie-suhteisiin
      // tai Slureihin. Koko muutos on yksi Undo-askel.
      const nextJson = JSON.stringify(nextSettings || {});
      const currentJson = JSON.stringify(settings || {});

      if (nextJson !== currentJson) {
        pushUndoSnapshot("Kappaleen tietojen päivitys");
      }

      clearTransientInputState();
    }

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

    // Jos tahtilaji tai kohotahti muutti tahtien määrää, säilytetään
    // voimassa olevat rivinvaihdot ja poistetaan vain ulkopuolelle jäävät.
    if (isUpdateExisting) {
      const measureCount =
        window.PikakirjoitinMusicXML.getMeasureCount(score);

      window.PikakirjoitinScoreModel.cleanupSystemBreaks(
        score,
        measureCount
      );
    }

    await renderScore();

    requestAnimationFrame(function () {
      if (keyboard) {
        keyboard.scrollToMidi(Number(settings.keyboardStartMidi) || 60);
      }
    });

    if (isNewProject) {
      updateStatus("Uusi nuotti aloitettu.", "ok");
    } else if (isUpdateExisting) {
      updateStatus("Kappaleen tiedot päivitetty.", "ok");
    } else {
      updateStatus("Valmis · ääni on käytössä ja kirjoitus voi alkaa.", "ok");
    }
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

    const undoSnapshot = captureUndoSnapshot("Slur");

    if (window.PikakirjoitinScoreModel.removeSlurById(score, slurId)) {
      commitUndoSnapshot(undoSnapshot);
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

  function setupSystemLayoutEditor() {
    layoutEditor =
      new window.PikakirjoitinSystemLayoutEditor
        .SystemLayoutEditor({
          overlay:
            document.getElementById("systemLayoutOverlay"),
          paper:
            document.getElementById("a4Paper"),
          container:
            document.getElementById("osmd-container"),

          getMeasureLayout: function () {
            return window.PikakirjoitinRenderer
              .getMeasureLayout();
          },

          getMeasureCount: function () {
            return window.PikakirjoitinMusicXML
              .getMeasureCount(score);
          },

          hasContent: function () {
            return Array.isArray(score.notes) &&
              score.notes.length > 0;
          },

          isSystemBreak: function (startMeasureIndex) {
            return window.PikakirjoitinScoreModel
              .hasSystemBreak(
                score,
                startMeasureIndex
              );
          },

          onToggleSystemBreak: function (
            startMeasureIndex
          ) {
            pushUndoSnapshot("Rivinvaihto");

            const active =
              window.PikakirjoitinScoreModel
                .toggleSystemBreak(
                  score,
                  startMeasureIndex
                );

            const count =
              window.PikakirjoitinMusicXML
                .getMeasureCount(score);

            window.PikakirjoitinScoreModel
              .cleanupSystemBreaks(score, count);

            renderScore()
              .then(function () {
                updateStatus(
                  active
                    ? "Rivinvaihto lisätty."
                    : "Rivinvaihto poistettu.",
                  "ok"
                );
              })
              .catch(function (error) {
                console.error(error);
                updateStatus(
                  "Virhe: " +
                    (
                      error && error.message
                        ? error.message
                        : String(error)
                    ),
                  "error"
                );
              });
          },

          getLastSystemFactor: function () {
            return window.PikakirjoitinScoreModel
              .getLastSystemMaxScalingFactor(score);
          },

          onLastSystemFactorCommit: function (factor) {
            const previousFactor =
              window.PikakirjoitinScoreModel
                .getLastSystemMaxScalingFactor(score);

            if (Math.abs(Number(factor) - Number(previousFactor)) > 0.001) {
              pushUndoSnapshot("Viimeisen rivin venytys");
            }

            window.PikakirjoitinScoreModel
              .setLastSystemMaxScalingFactor(
                score,
                factor
              );

            window.PikakirjoitinRenderer
              .rerenderLayout(
                score.layout,
                "layout"
              )
              .then(function () {
                refreshSelectionFromRenderedScore();
                if (layoutEditor) {
                  layoutEditor.refresh();
                }
                updateStatus(
                  "Viimeisen rivin leveys päivitetty.",
                  "ok"
                );
              })
              .catch(function (error) {
                console.error(error);
                updateStatus(
                  "Virhe: " +
                    (
                      error && error.message
                        ? error.message
                        : String(error)
                    ),
                  "error"
                );
              });
          }
        });
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

        const undoSnapshot = captureUndoSnapshot("Enharmoninen");

        if (window.PikakirjoitinScoreModel.toggleEnharmonic(score, note.id)) {
          commitUndoSnapshot(undoSnapshot);
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
        const undoSnapshot = captureUndoSnapshot("Slur");
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

        commitUndoSnapshot(undoSnapshot);

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

        const undoSnapshot = captureUndoSnapshot("Tauoksi muuttaminen");
        const result = window.PikakirjoitinScoreModel.convertSelectionToRests(score, ids);
        if (!result.changed) return;

        commitUndoSnapshot(undoSnapshot);

        renderScore().then(function () {
          selection.retainIds(result.ids);
          updateStatus(
            ids.length === 1
              ? (result.merged
                  ? "Vierekkäiset tauot yhdistetty järkevästi."
                  : "Valittu tapahtuma muutettu saman aika-arvon tauoksi.")
              : "Valittu alue kirjoitettu uudelleen järkevinä taukoina.",
            "ok"
          );
        }).catch(function (error) {
          console.error(error);
          updateStatus("Virhe: " + (error && error.message ? error.message : String(error)), "error");
        });
      },

      onDelete: function () {
        const ids = selectedIds();
        if (!ids.length) return;

        const undoSnapshot = captureUndoSnapshot("Poisto");

        if (window.PikakirjoitinScoreModel.deleteEntries(score, ids)) {
          commitUndoSnapshot(undoSnapshot);
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

  function openNewProjectScreen() {
    if (!startScreen) return;

    audio.noteOff();
    startScreen.openForNewProject(settings);
  }

  function setupPaperMultiTouchGestures() {
    const surface = document.querySelector(".score-card");
    if (!surface) return;

    // Sama perusmalli kuin toimivassa Pikakirjoitin 1.1.59:ssa:
    // aktiiviset osoittimet ratkaisevat eleen heti sormen tullessa alas.
    const scorePointers = new Set();
    const scoreTouchIds = new Set();

    let scoreGesture = 0;
    let scoreUndoneAction = null;
    let scoreMultiTouchLocked = false;
    let scoreMultiTouchScrollTop = 0;
    let scoreMultiTouchScrollLeft = 0;

    function keepOuterViewportFixed() {
      if (window.scrollX || window.scrollY) {
        window.scrollTo(0, 0);
      }
    }

    function restoreSnapshotUi(snapshot) {
      if (!snapshot || !snapshot.ui) return;

      if (
        selection &&
        Array.isArray(snapshot.ui.selectedIds) &&
        snapshot.ui.selectedIds.length
      ) {
        selection.retainIds(snapshot.ui.selectedIds);
      }

      requestAnimationFrame(function () {
        const keyboardViewport =
          document.getElementById("keyboardViewport");

        surface.scrollTop =
          Number(snapshot.ui.scoreScrollTop) || 0;

        if (keyboardViewport) {
          keyboardViewport.scrollLeft =
            Number(snapshot.ui.keyboardScrollLeft) || 0;
        }
      });
    }

    /*
     * Kahden sormen Undo tehdään HETI toisen sormen pointerdownissa,
     * kuten toimivassa 1.1.59-versiossa. Samalla otetaan talteen tarkka
     * nykytila siltä varalta, että kolmas sormi tulee perään.
     */
    function undoForScoreGesture() {
      if (undoInProgress) return null;

      const undoSnapshot = undoStack.pop();

      if (!undoSnapshot) {
        updateStatus("Ei kumottavaa.", "ok");
        return null;
      }

      const redoSnapshot = captureUndoSnapshot(
        undoSnapshot.label || "muutos"
      );

      clearTransientInputState();
      replaceScoreState(undoSnapshot.score);
      settings = clonePlain(undoSnapshot.settings || {});

      if (startScreen) {
        startScreen.syncSettings(settings);
      }

      if (selection) {
        selection.clear();
      }

      renderScore()
        .then(function () {
          restoreSnapshotUi(undoSnapshot);
        })
        .catch(function (error) {
          console.error(error);
          updateStatus(
            "Undo epäonnistui: " +
              (error && error.message
                ? error.message
                : String(error)),
            "error"
          );
        });

      updateStatus(
        "Kumottu · " + undoSnapshot.label + ".",
        "ok"
      );

      return {
        undoSnapshot: undoSnapshot,
        redoSnapshot: redoSnapshot
      };
    }

    /*
     * Kolmas sormi kulkee luonnostaan 2-sormen tilan kautta.
     * Siksi palautetaan väliaikaisesti kumottu muutos täsmälleen takaisin
     * ja palautetaan sama Undo-snapshot historiaan ennen aloitusikkunaa.
     */
    function redoScoreGestureUndo(action) {
      if (!action || !action.redoSnapshot || !action.undoSnapshot) {
        return;
      }

      clearTransientInputState();
      replaceScoreState(action.redoSnapshot.score);
      settings = clonePlain(action.redoSnapshot.settings || {});

      if (startScreen) {
        startScreen.syncSettings(settings);
      }

      if (selection) {
        selection.clear();
      }

      // Palauta väliaikaisesti käytetty Undo-askel samaan historiaan.
      undoStack.push(action.undoSnapshot);
      if (undoStack.length > UNDO_LIMIT) {
        undoStack.splice(0, undoStack.length - UNDO_LIMIT);
      }

      renderScore()
        .then(function () {
          restoreSnapshotUi(action.redoSnapshot);
        })
        .catch(function (error) {
          console.error(error);
          updateStatus(
            "Eleen palautus epäonnistui: " +
              (error && error.message
                ? error.message
                : String(error)),
            "error"
          );
        });
    }

    function resetScoreGestureState() {
      scorePointers.clear();
      scoreGesture = 0;
      scoreUndoneAction = null;
    }

    function startScoreTouchLock(event) {
      for (const touch of event.changedTouches || []) {
        scoreTouchIds.add(touch.identifier);
      }

      if (
        scoreTouchIds.size >= 2 &&
        !scoreMultiTouchLocked
      ) {
        scoreMultiTouchLocked = true;
        scoreMultiTouchScrollTop = surface.scrollTop;
        scoreMultiTouchScrollLeft = surface.scrollLeft;
      }

      if (scoreMultiTouchLocked) {
        if (event.cancelable) event.preventDefault();
        surface.scrollTop = scoreMultiTouchScrollTop;
        surface.scrollLeft = scoreMultiTouchScrollLeft;
        keepOuterViewportFixed();
      }
    }

    function moveScoreTouchLock(event) {
      if (!scoreMultiTouchLocked) return;

      if (event.cancelable) event.preventDefault();
      surface.scrollTop = scoreMultiTouchScrollTop;
      surface.scrollLeft = scoreMultiTouchScrollLeft;
      keepOuterViewportFixed();
    }

    function endScoreTouchLock(event) {
      for (const touch of event.changedTouches || []) {
        scoreTouchIds.delete(touch.identifier);
      }

      if (scoreMultiTouchLocked) {
        if (event.cancelable) event.preventDefault();
        surface.scrollTop = scoreMultiTouchScrollTop;
        surface.scrollLeft = scoreMultiTouchScrollLeft;
        keepOuterViewportFixed();
      }

      if (!scoreTouchIds.size) {
        scoreMultiTouchLocked = false;
        scoreMultiTouchScrollTop = 0;
        scoreMultiTouchScrollLeft = 0;
      }
    }

    function preventScoreNativeGesture(event) {
      if (scoreMultiTouchLocked && event.cancelable) {
        event.preventDefault();
      }
    }

    function startScoreGesture(event) {
      if (event.pointerType !== "touch") return;

      if (!scorePointers.size) {
        scoreGesture = 0;
        scoreUndoneAction = null;
      }

      scorePointers.add(event.pointerId);

      try {
        surface.setPointerCapture(event.pointerId);
      } catch {}

      if (
        scorePointers.size >= 2 &&
        selection &&
        typeof selection.cancelActiveGesture === "function"
      ) {
        selection.cancelActiveGesture();
      }

      if (scorePointers.size >= 3 && scoreGesture !== 3) {
        // Toinen sormi on jo ehtinyt tehdä Undon. Palauta se ensin.
        if (scoreGesture === 2 && scoreUndoneAction) {
          redoScoreGestureUndo(scoreUndoneAction);
        }

        scoreGesture = 3;
        scoreUndoneAction = null;

        // Kolmen sormen tehtävä P3:ssa ei ole tyhjentää suoraan.
        // Se avaa Kappaleen tiedot -ikkunan, jossa voi päivittää
        // nykyistä tai valita ALOITA UUSI.
        queueMicrotask(function () {
          openNewProjectScreen();
        });
      } else if (
        scorePointers.size === 2 &&
        scoreGesture === 0
      ) {
        scoreGesture = 2;
        scoreUndoneAction = undoForScoreGesture();
      }

      if (scoreGesture !== 0) {
        if (event.cancelable) event.preventDefault();
        event.stopImmediatePropagation();
      }
    }

    function moveScoreGesture(event) {
      if (
        event.pointerType !== "touch" ||
        !scorePointers.has(event.pointerId) ||
        scoreGesture === 0
      ) {
        return;
      }

      if (event.cancelable) event.preventDefault();
      event.stopImmediatePropagation();
    }

    function endScoreGesture(event) {
      if (
        event.pointerType !== "touch" ||
        !scorePointers.has(event.pointerId)
      ) {
        return;
      }

      const wasMultiTouch = scoreGesture !== 0;

      scorePointers.delete(event.pointerId);

      try {
        if (surface.hasPointerCapture(event.pointerId)) {
          surface.releasePointerCapture(event.pointerId);
        }
      } catch {}

      if (wasMultiTouch) {
        if (event.cancelable) event.preventDefault();
        event.stopImmediatePropagation();
      }

      if (!scorePointers.size) {
        scoreGesture = 0;
        scoreUndoneAction = null;
      }
    }

    function resetAllTouchState() {
      resetScoreGestureState();
      scoreTouchIds.clear();
      scoreMultiTouchLocked = false;
      scoreMultiTouchScrollTop = 0;
      scoreMultiTouchScrollLeft = 0;
    }

    // Natiivi Touch Events -lukitus on suoraan toimivan 1.1.59-ratkaisun
    // periaate: 2+ sormella nuottipaperin scrollaus ja Safarin gesturet
    // pysyvät lukittuina eleen ajan.
    surface.addEventListener(
      "touchstart",
      startScoreTouchLock,
      { passive: false, capture: true }
    );
    surface.addEventListener(
      "touchmove",
      moveScoreTouchLock,
      { passive: false, capture: true }
    );
    surface.addEventListener(
      "touchend",
      endScoreTouchLock,
      { passive: false, capture: true }
    );
    surface.addEventListener(
      "touchcancel",
      endScoreTouchLock,
      { passive: false, capture: true }
    );
    surface.addEventListener(
      "gesturestart",
      preventScoreNativeGesture,
      { passive: false, capture: true }
    );
    surface.addEventListener(
      "gesturechange",
      preventScoreNativeGesture,
      { passive: false, capture: true }
    );

    // Pointer Events ratkaisevat sormimäärän heti pointerdownissa.
    surface.addEventListener(
      "pointerdown",
      startScoreGesture,
      { passive: false, capture: true }
    );
    surface.addEventListener(
      "pointermove",
      moveScoreGesture,
      { passive: false, capture: true }
    );
    surface.addEventListener(
      "pointerup",
      endScoreGesture,
      { passive: false, capture: true }
    );
    surface.addEventListener(
      "pointercancel",
      endScoreGesture,
      { passive: false, capture: true }
    );

    // Jos aloitusikkuna muuttuu inertiksi kesken 3-sormen eleen,
    // window-fallback varmistaa että pointer-id:t eivät jää roikkumaan.
    window.addEventListener(
      "pointerup",
      endScoreGesture,
      { passive: false, capture: true }
    );
    window.addEventListener(
      "pointercancel",
      endScoreGesture,
      { passive: false, capture: true }
    );
    window.addEventListener(
      "touchend",
      endScoreTouchLock,
      { passive: false, capture: true }
    );
    window.addEventListener(
      "touchcancel",
      endScoreTouchLock,
      { passive: false, capture: true }
    );

    window.addEventListener("blur", resetAllTouchState);
    window.addEventListener("pagehide", resetAllTouchState);
  }

  function start() {
    setupSelection();
    setupSystemLayoutEditor();
    setupPaperMultiTouchGestures();

    // Orientaation vaihto voi luoda OSMD:n SVG:n uudelleen rendererissä.
    // Päivitetään silloin vain valinnan geometria uuden SVG:n mukaan.
    if (
      window.PikakirjoitinRenderer &&
      typeof window.PikakirjoitinRenderer.subscribeRendered === "function"
    ) {
      window.PikakirjoitinRenderer.subscribeRendered(function (snapshot) {
        if (
          snapshot &&
          (
            snapshot.reason === "resize" ||
            snapshot.reason === "layout"
          )
        ) {
          refreshSelectionFromRenderedScore();
          if (layoutEditor) layoutEditor.refresh();
        }
      });
    }

    thumbRail = new window.PikakirjoitinThumbRail.ThumbRail({
      rail: document.getElementById("thumbRail"),
      boundsElement: document.querySelector(".score-card"),
      onChange: function (state) {
        const wasLayout = Boolean(thumbState.layout);
        const wasTie = Boolean(thumbState.tie);
        thumbState = state;

        if (
          layoutEditor &&
          Boolean(state.layout) !== wasLayout
        ) {
          layoutEditor.setActive(
            Boolean(state.layout)
          );

          updateStatus(
            state.layout
              ? "Rivien muokkaus päällä."
              : "Rivien muokkaus pois.",
            "ok"
          );
          return;
        }

        if (Boolean(state.tie) !== wasTie) {
          updateStatus(
            state.tie
              ? "Tie valmiina · seuraava saman sävelen nuotti sidotaan edelliseen."
              : "Tie pois.",
            "ok"
          );
          return;
        }

        const description =
          describeThumbState(state);

        if (description) {
          updateStatus(description);
        }
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

    startScreen = new window.PikakirjoitinStartScreen.StartScreen({
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
