(function () {
  "use strict";

  const STORAGE_KEY = "pikakirjoitin3.language";
  const SUPPORTED = ["fi", "en"];

  const STRINGS = {
    fi: {
      appName: "Pikakirjoitin 3",
      documentTitle: "Pikakirjoitin 3 · BASE 0.17.6.4",
      subtitle: "BASE 0.17.6.6 · Soitinnimen korkeus oletus 14 · Riviväli · Marginaalit 2.5 · PDF-asettelu · Artikulaatiot · Recent 50 · FI / EN · OSMD 2.1.2",
      projectDetails: "Kappaleen tiedot",
      openProject: "Avaa projekti",
      recentProjects: "Viimeisimmät",
      noRecentProjects: "Ei vielä tallennettuja projekteja.",
      openFromFile: "Avaa tiedostosta…",
      removeRecent: "Poista viimeisimmistä",
      removeRecentConfirm: "Poistetaanko tämä projekti viimeisimmistä?",
      recentSaved: "Tallennettu viimeisimpiin.",
      recentSaveFailed: "Tallennus viimeisimpiin epäonnistui.",
      recentOpenFailed: "Projektin avaaminen epäonnistui.",
      invalidProjectFile: "Tiedosto ei ole kelvollinen Pikakirjoitin-projekti.",
      modified: "Muokattu",
      name: "Nimi",
      tempoText: "Tempoteksti",
      composer: "Säveltäjä",
      instrument: "Soitin",
      keySignature: "Sävellaji",
      timeSignature: "Tahtilaji",
      pickup: "Kohotahti",
      tuning: "Viritys",
      clef: "Nuottiavain",
      gClef: "G-avain",
      cClef: "C-avain",
      fClef: "F-avain",
      colorTheme: "Värimaailma",
      start: "ALOITA",
      chooseKey: "Valitse sävellaji kvinttiympyrästä",
      closeKey: "Sulje sävellajivalinta",
      chooseMeter: "Valitse tahtiosoitus",
      closeMeter: "Sulje tahtiosoitusvalinta",
      scoreImage: "Nuottikuva",
      selectPitch: "Valitse sävel.",
      thumbRail: "Peukalopalkki",
      holdRest: "Pidä pohjassa: tauko",
      holdDot: "Pidä pohjassa: yksi piste. Liu'uta oikealle kahteen pisteeseen.",
      doubleDot: "Kaksi pistettä",
      slurHelp: "Slur: kirjoittaessa kytke edelliseen, nuottia valitessa seuraavaan",
      tieHelp: "Tie / sidekaari: seuraava saman sävelen nuotti sidotaan edelliseen",
      tieTitle: "Tie / sidekaari",
      lineEdit: "Rivien muokkaus",
      keyboard: "Koskettimisto",
      moveKeyboard: "Siirrä koskettimistoa",
      moveKeyboardText: "SIIRRÄ KOSKETTIMISTOA",
      quickActions: "Pikatoiminnot",
      restart: "Aloita alusta ja päivitä Pikakirjoitin",
      restartTitle: "Aloita alusta / refresh",
      undo: "Kumoa",
      redo: "Tee uudelleen",
      saveProject: "Tallenna projekti",
      save: "Tallenna",
      savePdf: "Tallenna PDF",
      print: "Tulosta",
      layoutSettings: "Asettelu",
      notationSize: "Nuottikoko",
      systemSpacing: "Riviväli",
      instrumentCreditHeight: "Soitinnimen korkeus",
      topMargin: "Ylämarginaali",
      bottomMargin: "Alamarginaali",
      leftMargin: "Vasen marginaali",
      rightMargin: "Oikea marginaali",
      resetLayout: "Palauta oletukset",
      closeLayout: "Sulje asettelu",
      durationGestures: "Aika-arvoeleet",
      tap: "Napauta",
      hold: "Pidä",
      selectionEdit: "Valinnan muokkaus",
      enharmonic: "Enharmoninen vaihto",
      convertRest: "Muuta valinta tauoksi",
      deleteSelection: "Poista valinta",
      removeSlur: "Poista slur",
      accent: "Aksentti",
      staccato: "Staccato",
      marcato: "Marcato",
      tenuto: "Tenuto",
      stretchLastSystem: "Venytä viimeistä nuottiriviä",
      verySlow: "Hyvin hitaat",
      slow: "Hitaat",
      walkingMedium: "Kävelyvauhti ja keskitempo",
      fast: "Nopeat",
      veryFast: "Hyvin nopeat",
      copper: "Kupari",
      sage: "Salvia",
      plum: "Luumu",
      electric: "Sähkö",
      coral: "Koralli",
      vanilla: "Vanilja",
      language: "Kieli",
      wholeMeasureRest: "kokotahdin tauko",
      dotted: "pisteellinen ",
      doubleDotted: "kaksipisteinen ",
      restSuffix: "-tauko",
      rest: "Tauko",
      oneDot: "1 piste",
      twoDots: "2 pistettä",
      heldHint: "pohjassa · tee aika-arvoele koskettimella.",
      startName: "alku",
      endName: "loppu",
      flute: "Huilu"
    },
    en: {
      appName: "SwipeScore",
      documentTitle: "SwipeScore · BASE 0.17.6.4",
      subtitle: "BASE 0.17.6.6 · Instrument-name height default 14 · System spacing · Margins 2.5 · PDF layout · Articulations · Recent 50 · FI / EN · OSMD 2.1.2",
      projectDetails: "Score details",
      openProject: "Open project",
      recentProjects: "Recent",
      noRecentProjects: "No saved projects yet.",
      openFromFile: "Open from file…",
      removeRecent: "Remove from recent",
      removeRecentConfirm: "Remove this project from Recent?",
      recentSaved: "Saved to Recent.",
      recentSaveFailed: "Saving to Recent failed.",
      recentOpenFailed: "Could not open project.",
      invalidProjectFile: "This is not a valid SwipeScore project file.",
      modified: "Modified",
      name: "Title",
      tempoText: "Tempo text",
      composer: "Composer",
      instrument: "Instrument",
      keySignature: "Key signature",
      timeSignature: "Time signature",
      pickup: "Pickup",
      tuning: "Transposition",
      clef: "Clef",
      gClef: "Treble clef",
      cClef: "Alto clef",
      fClef: "Bass clef",
      colorTheme: "Color theme",
      start: "START",
      chooseKey: "Choose key from the circle of fifths",
      closeKey: "Close key selection",
      chooseMeter: "Choose time signature",
      closeMeter: "Close time signature selection",
      scoreImage: "Score",
      selectPitch: "Choose a note.",
      thumbRail: "Thumb tools",
      holdRest: "Hold: rest",
      holdDot: "Hold: one dot. Slide right for two dots.",
      doubleDot: "Two dots",
      slurHelp: "Slur: while writing connect from previous note; when selecting connect to next note",
      tieHelp: "Tie: tie the next note to the previous note when the pitch is the same",
      tieTitle: "Tie",
      lineEdit: "Edit systems",
      keyboard: "Keyboard",
      moveKeyboard: "Move keyboard",
      moveKeyboardText: "MOVE KEYBOARD",
      quickActions: "Quick actions",
      restart: "Start over and refresh SwipeScore",
      restartTitle: "Start over / refresh",
      undo: "Undo",
      redo: "Redo",
      saveProject: "Save project",
      save: "Save",
      savePdf: "Save PDF",
      print: "Print",
      layoutSettings: "Layout",
      notationSize: "Notation size",
      systemSpacing: "System spacing",
      instrumentCreditHeight: "Instrument name height",
      topMargin: "Top margin",
      bottomMargin: "Bottom margin",
      leftMargin: "Left margin",
      rightMargin: "Right margin",
      resetLayout: "Reset defaults",
      closeLayout: "Close layout",
      durationGestures: "Duration gestures",
      tap: "Tap",
      hold: "Hold",
      selectionEdit: "Edit selection",
      enharmonic: "Change enharmonic spelling",
      convertRest: "Convert selection to rests",
      deleteSelection: "Delete selection",
      removeSlur: "Remove slur",
      accent: "Accent",
      staccato: "Staccato",
      marcato: "Marcato",
      tenuto: "Tenuto",
      stretchLastSystem: "Stretch last system",
      verySlow: "Very slow",
      slow: "Slow",
      walkingMedium: "Walking pace and moderate",
      fast: "Fast",
      veryFast: "Very fast",
      copper: "Copper",
      sage: "Sage",
      plum: "Plum",
      electric: "Electric",
      coral: "Coral",
      vanilla: "Vanilla",
      language: "Language",
      wholeMeasureRest: "whole-measure rest",
      dotted: "dotted ",
      doubleDotted: "double-dotted ",
      restSuffix: " rest",
      rest: "Rest",
      oneDot: "1 dot",
      twoDots: "2 dots",
      heldHint: "held · make a duration gesture on a key.",
      startName: "start",
      endName: "end",
      flute: "Flute"
    }
  };

  const EXACT_MESSAGES_EN = {
    "Ei kumottavaa.": "Nothing to undo.",
    "Ei uudelleen tehtävää.": "Nothing to redo.",
    "Projekti tallennettu.": "Project saved.",
    "Tallennus epäonnistui.": "Save failed.",
    "Tallennettu viimeisimpiin.": "Saved to Recent.",
    "Tallennus viimeisimpiin epäonnistui.": "Saving to Recent failed.",
    "Projekti avattu.": "Project opened.",
    "Muodostetaan PDF…": "Creating PDF…",
    "PDF tallennettu.": "PDF saved.",
    "Slur voi alkaa vain nuotista.": "A slur can start only on a note.",
    "Slur on jo valitusta nuotista seuraavaan nuottiin.": "A slur already connects the selected note to the next note.",
    "Slur lisätty valitusta nuotista seuraavaan nuottiin.": "Slur added from the selected note to the next note.",
    "Slur alkaa valitusta nuotista · odottaa seuraavaa nuottia.": "Slur starts at the selected note · waiting for the next note.",
    "Slur voidaan kytkeä vain nuottiin. Tauko kirjoitettiin normaalisti.": "A slur can connect only notes. The rest was entered normally.",
    "Valmis · ääni on käytössä ja kirjoitus voi alkaa.": "Ready · audio is active and writing can begin.",
    "Slur poistettu.": "Slur removed.",
    "Enharmoninen kirjoitusasu vaihdettu.": "Enharmonic spelling changed.",
    "Slur vaatii vähintään kaksi valittua nuottia.": "A slur requires at least two selected notes.",
    "Slur voidaan lisätä vain pelkille nuoteille.": "A slur can be added only to notes.",
    "Aiemmat valinta-alueen slurit korvattu uudella slurilla.": "Previous slurs inside the selection were replaced with a new slur.",
    "Slur lisätty valittujen nuottien ylle.": "Slur added over the selected notes.",
    "Slur poistettu valinnasta.": "Slur removed from the selection.",
    "Vierekkäiset tauot yhdistetty järkevästi.": "Adjacent rests were combined intelligently.",
    "Valittu tapahtuma muutettu saman aika-arvon tauoksi.": "Selected event converted to a rest of the same duration.",
    "Valittu alue kirjoitettu uudelleen järkevinä taukoina.": "Selected range rewritten as sensible rests.",
    "Tapahtuma poistettu.": "Event deleted.",
    "Rivinvaihto lisätty.": "System break added.",
    "Rivinvaihto poistettu.": "System break removed.",
    "Viimeisen rivin leveys päivitetty.": "Last system width updated.",
    "Rivien muokkaus päällä.": "System editing on.",
    "Rivien muokkaus pois.": "System editing off.",
    "Tie valmiina · seuraava saman sävelen nuotti sidotaan edelliseen.": "Tie armed · the next note of the same pitch will be tied to the previous note.",
    "Tie pois.": "Tie off."
  };

  const HISTORY_EN = {
    "muutos": "change",
    "Slur": "Slur",
    "Nuotin muokkaus": "note edit",
    "Nuotin kirjoitus": "note entry",
    "Rivinvaihto": "system break",
    "Viimeisen rivin leveys": "last system width",
    "Enharmoninen": "enharmonic spelling",
    "Tauoksi muuttaminen": "convert to rests",
    "Poisto": "delete"
  };

  function detectInitialLanguage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (SUPPORTED.includes(saved)) return saved;
    } catch (error) {}
    const browser = String(navigator.language || "").toLowerCase();
    return browser.startsWith("fi") ? "fi" : "en";
  }

  let language = detectInitialLanguage();

  function t(key) {
    const table = STRINGS[language] || STRINGS.fi;
    return Object.prototype.hasOwnProperty.call(table, key) ? table[key] : (STRINGS.fi[key] || key);
  }

  function setText(selector, key, root) {
    const element = (root || document).querySelector(selector);
    if (element) element.textContent = t(key);
  }

  function setAttr(selector, name, key, root) {
    const element = (root || document).querySelector(selector);
    if (element) element.setAttribute(name, t(key));
  }

  function keySignatureName(tonic, mode) {
    const isMinor = mode === "minor";
    if (language === "en") {
      const names = {
        C: "C", A: "A", G: "G", E: "E", D: "D", B: "B", "F#": "F♯", "C#": "C♯", "G#": "G♯",
        F: "F", "Bb": "B♭", "Eb": "E♭", "Ab": "A♭", "Db": "D♭", "Gb": "G♭"
      };
      return (names[tonic] || tonic) + (isMinor ? " minor" : " major");
    }
    const names = {
      C: isMinor ? "c" : "C",
      A: isMinor ? "a" : "A",
      G: isMinor ? "g" : "G",
      E: isMinor ? "e" : "E",
      D: isMinor ? "d" : "D",
      B: isMinor ? "h" : "H",
      "F#": isMinor ? "fis" : "Fis",
      "C#": isMinor ? "cis" : "Cis",
      "G#": isMinor ? "gis" : "Gis",
      F: isMinor ? "f" : "F",
      "Bb": isMinor ? "b" : "B",
      "Eb": isMinor ? "es" : "Es",
      "Ab": isMinor ? "as" : "As",
      "Db": isMinor ? "des" : "Des",
      "Gb": isMinor ? "ges" : "Ges"
    };
    return (names[tonic] || tonic) + (isMinor ? "-molli" : "-duuri");
  }

  function keyWheelLabel(tonic, mode) {
    const full = keySignatureName(tonic, mode);
    if (language === "en") return full.replace(/ (major|minor)$/, "");
    return full.replace(/-(duuri|molli)$/, "");
  }

  function displayPitch(pitch) {
    const value = String(pitch || "");
    const match = /^([A-G])([#b]?)(-?\d+)?$/.exec(value);
    if (!match) return value;
    const step = match[1];
    const accidental = match[2];
    const octave = match[3] || "";
    if (language === "en") {
      const acc = accidental === "#" ? "♯" : accidental === "b" ? "♭" : "";
      return step + acc + octave;
    }
    if (step === "B" && accidental === "b") return "B" + octave;
    if (step === "B" && !accidental) return "H" + octave;
    const acc = accidental === "#" ? "#" : accidental === "b" ? "♭" : "";
    return step + acc + octave;
  }

  function keyboardLetter(pitchClass) {
    const base = {0:"C",2:"D",4:"E",5:"F",7:"G",9:"A",11:"B"}[pitchClass];
    if (base === "B" && language === "fi") return "H";
    return base || "";
  }

  function spokenPitch(pitch) {
    const value = String(pitch || "");
    const match = /^([A-G])([#b]?)(-?\d+)?$/.exec(value);
    if (!match) return value;
    const step = match[1];
    const accidental = match[2];
    const octave = match[3] || "";
    if (language === "fi") {
      const names = {
        C: "C", "C#": "cis", Db: "des",
        D: "D", "D#": "dis", Eb: "es",
        E: "E", F: "F", "F#": "fis", Gb: "ges",
        G: "G", "G#": "gis", Ab: "as",
        A: "A", "A#": "ais", Bb: "b", B: "h"
      };
      return (names[step + accidental] || step + accidental) + octave;
    }
    const accidentalWord = accidental === "#" ? " sharp " : accidental === "b" ? " flat " : "";
    return step + accidentalWord + octave;
  }

  function historyLabel(label) {
    return language === "en" ? (HISTORY_EN[label] || label) : label;
  }

  function translateRuntimeMessage(message) {
    const raw = String(message == null ? "" : message);
    if (language !== "en" || !raw) return raw;
    if (EXACT_MESSAGES_EN[raw]) return EXACT_MESSAGES_EN[raw];
    if (raw.startsWith("Virhe: ")) return "Error: " + raw.slice(7);
    if (raw.startsWith("Kumottu · ")) {
      const label = raw.slice(10).replace(/\.$/, "");
      return "Undone · " + historyLabel(label) + ".";
    }
    if (raw.startsWith("Uudelleen · ")) {
      const label = raw.slice(12).replace(/\.$/, "");
      return "Redone · " + historyLabel(label) + ".";
    }
    let out = raw;
    out = out.replace(/ · muokataan…/g, " · editing…");
    out = out.replace(/ · ele kesken…/g, " · gesture in progress…");
    out = out.replace(/ · aika-arvo muutettu/g, " · duration changed");
    out = out.replace(/ · (\d+) tapahtumaa/g, " · $1 events");
    out = out.replace(/ · 1 tapahtuma/g, " · 1 event");
    out = out.replace(/ · slur edellisestä nuotista/g, " · slur from previous note");
    out = out.replace(/ · ei edellistä nuottia/g, " · no previous note");
    out = out.replace(/ · tie edellisestä nuotista/g, " · tie from previous note");
    out = out.replace(/ · tie kulutettu, taukoon ei muodostu sidekaarta/g, " · tie consumed; a rest cannot be tied");
    out = out.replace(/ · tie ei muodostunut, edellisen sävelen on oltava sama/g, " · tie not created; previous pitch must be the same");
    out = out.replace(/ tapahtumaa poistettu\./g, " events deleted.");
    return out;
  }

  function applyStatic(root) {
    const scope = root || document;
    document.documentElement.lang = language;
    document.title = t("documentTitle");

    setText(".test-header h1", "appName", scope);
    setText(".test-header p", "subtitle", scope);
    setAttr("#projectModal", "aria-label", "projectDetails", scope);
    setText("#recentProjectsTriggerText", "openProject", scope);
    setText("#recentProjectsHeading", "recentProjects", scope);
    setText("#openProjectFileButton", "openFromFile", scope);
    setAttr("#recentProjectsTrigger", "aria-label", "openProject", scope);
    setAttr("#titleInput", "placeholder", "name", scope);
    setAttr("#titleInput", "aria-label", "name", scope);
    setAttr("#tempoInput", "aria-label", "tempoText", scope);
    setAttr("#composerInput", "placeholder", "composer", scope);
    setAttr("#composerInput", "aria-label", "composer", scope);
    setAttr("#instrumentInput", "placeholder", "instrument", scope);
    setAttr("#instrumentInput", "aria-label", "instrument", scope);
    setAttr("#keySignatureSelect", "aria-label", "keySignature", scope);
    setAttr("#timeSignatureSelect", "aria-label", "timeSignature", scope);
    setAttr(".pickup-control", "aria-label", "pickup", scope);
    setText(".pickup-label", "pickup", scope);
    setAttr(".tuning-setting", "aria-label", "tuning", scope);
    setText(".tuning-setting .notation-setting-label", "tuning", scope);
    const clefSetting = scope.querySelector('.notation-setting[aria-label="Nuottiavain"], .notation-setting[aria-label="Clef"]');
    if (clefSetting) clefSetting.setAttribute("aria-label", t("clef"));
    setAttr('[data-clef="treble"]', "aria-label", "gClef", scope);
    setAttr('[data-clef="alto"]', "aria-label", "cClef", scope);
    setAttr('[data-clef="bass"]', "aria-label", "fClef", scope);
    setText('.field-caption', "colorTheme", scope);
    setAttr('#themeSelect', "aria-label", "colorTheme", scope);
    setText('#projectSaveButton', "start", scope);
    setAttr('#keyWheelPopover', "aria-label", "chooseKey", scope);
    setAttr('#keyWheelClose', "aria-label", "closeKey", scope);
    setAttr('#meterWheelPopover', "aria-label", "chooseMeter", scope);
    setAttr('#meterWheelClose', "aria-label", "closeMeter", scope);
    setAttr('.score-card', "aria-label", "scoreImage", scope);
    const status = scope.querySelector('#status');
    if (status && !status.dataset.rawMessage) status.textContent = t("selectPitch");
    setAttr('#thumbRail', "aria-label", "thumbRail", scope);
    setAttr('[data-modifier="rest"]', "aria-label", "holdRest", scope);
    setAttr('#dot1Button', "aria-label", "holdDot", scope);
    setAttr('#dot2Flyout', "aria-label", "doubleDot", scope);
    setAttr('[data-modifier="slur"]', "aria-label", "slurHelp", scope);
    setAttr('[data-modifier="tie"]', "aria-label", "tieHelp", scope);
    setAttr('[data-modifier="tie"]', "title", "tieTitle", scope);
    setAttr('#lineEditButton', "aria-label", "lineEdit", scope);
    setAttr('#lineEditButton', "title", "lineEdit", scope);
    setAttr('.keyboard-panel', "aria-label", "keyboard", scope);
    setAttr('#keyboardScrollRail', "aria-label", "moveKeyboard", scope);
    setText('#keyboardScrollThumb', "moveKeyboardText", scope);
    setAttr('.keyboard-tools', "aria-label", "quickActions", scope);
    setAttr('#startOverButton', "aria-label", "restart", scope);
    setAttr('#startOverButton', "title", "restartTitle", scope);
    setAttr('#undoButton', "aria-label", "undo", scope);
    setAttr('#undoButton', "title", "undo", scope);
    setAttr('#redoButton', "aria-label", "redo", scope);
    setAttr('#redoButton', "title", "redo", scope);
    setAttr('#saveProjectButton', "aria-label", "saveProject", scope);
    setAttr('#saveProjectButton', "title", "save", scope);
    setAttr('#savePdfButton', "aria-label", "savePdf", scope);
    setAttr('#printButton', "aria-label", "print", scope);
    setAttr('#printButton', "title", "print", scope);
    setAttr('#layoutSettingsButton', "aria-label", "layoutSettings", scope);
    setAttr('#layoutSettingsButton', "title", "layoutSettings", scope);
    setAttr('#layoutSettingsPanel', "aria-label", "layoutSettings", scope);
    setText('#layoutSettingsTitle', "layoutSettings", scope);
    setText('#notationSizeLabel', "notationSize", scope);
    setText('#systemSpacingLabel', "systemSpacing", scope);
    setText('#instrumentCreditDistanceLabel', "instrumentCreditHeight", scope);
    setText('#topMarginLabel', "topMargin", scope);
    setText('#bottomMarginLabel', "bottomMargin", scope);
    setText('#leftMarginLabel', "leftMargin", scope);
    setText('#rightMarginLabel', "rightMargin", scope);
    setText('#layoutResetButton', "resetLayout", scope);
    setAttr('#layoutSettingsClose', "aria-label", "closeLayout", scope);
    setAttr('.gesture-guide', "aria-label", "durationGestures", scope);

    const gestureSpans = scope.querySelectorAll('.gesture-guide span');
    if (gestureSpans[2]) gestureSpans[2].innerHTML = '<strong>' + t('tap') + '</strong> 1/4';
    if (gestureSpans[5]) gestureSpans[5].innerHTML = '<strong>' + t('hold') + '</strong> 1/1';

    const tempoGroups = scope.querySelectorAll('#tempoInput optgroup');
    ["verySlow", "slow", "walkingMedium", "fast", "veryFast"].forEach(function (key, i) {
      if (tempoGroups[i]) tempoGroups[i].label = t(key);
    });

    const themes = {kupari:"copper",salvia:"sage",luumu:"plum",sahko:"electric",koralli:"coral",vanilja:"vanilla"};
    Object.keys(themes).forEach(function (value) {
      const option = scope.querySelector('#themeSelect option[value="' + value + '"]');
      if (option) option.textContent = t(themes[value]);
    });

    scope.querySelectorAll('[data-language]').forEach(function (button) {
      button.setAttribute('aria-pressed', button.dataset.language === language ? 'true' : 'false');
    });
    scope.querySelectorAll('.language-switch').forEach(function (element) {
      element.setAttribute('aria-label', t('language'));
    });
  }

  function bindLanguageButtons() {
    document.querySelectorAll('[data-language]').forEach(function (button) {
      if (button.dataset.languageBound === '1') return;
      button.dataset.languageBound = '1';
      button.addEventListener('click', function (event) {
        event.preventDefault();
        setLanguage(button.dataset.language);
      });
    });
  }

  function setLanguage(next) {
    const normalized = SUPPORTED.includes(next) ? next : "fi";
    const changed = normalized !== language;
    language = normalized;
    try { localStorage.setItem(STORAGE_KEY, language); } catch (error) {}
    applyStatic(document);
    bindLanguageButtons();
    if (changed) {
      document.dispatchEvent(new CustomEvent("pk-languagechange", { detail: { language: language } }));
    }
  }

  function init() {
    applyStatic(document);
    bindLanguageButtons();
  }

  window.PikakirjoitinI18n = {
    t: t,
    setLanguage: setLanguage,
    getLanguage: function () { return language; },
    applyStatic: applyStatic,
    keySignatureName: keySignatureName,
    keyWheelLabel: keyWheelLabel,
    displayPitch: displayPitch,
    keyboardLetter: keyboardLetter,
    spokenPitch: spokenPitch,
    historyLabel: historyLabel,
    translateRuntimeMessage: translateRuntimeMessage
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
