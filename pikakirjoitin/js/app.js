(function () {
  "use strict";

  const I18N = window.PikakirjoitinI18n;

  const app = document.getElementById("app");
  if (app) {
    app.inert = true;
    app.setAttribute("aria-hidden", "true");
  }

  const score = window.PikakirjoitinScoreModel.createScore({
    title: I18N.t("appName"),
    composer: "",
    tempoText: "",
    partName: I18N.t("flute"),
    clef: "G",
    key: 0,
    time: [4, 4],
    timeSymbol: "",
    pickupDuration: 0,
    notes: []
  });

  const audio = new window.PikakirjoitinAudio.AudioEngine();

  let rendering = Promise.resolve();
  let thumbState = { rest: false, dots: 0, slur: false, tie: false, layout: false, barlines: false };
  let keyboard = null;
  let thumbRail = null;
  let selection = null;
  let selectionEditor = null;
  let layoutEditor = null;
  let barlineEditor = null;
  let startScreen = null;
  let keyboardEditId = null;
  let lastSelectionEditorAnchor = null;
  let pendingSelectedSlurStartId = null;
  const noteInputMeta = new Map();

  let musicStandMode = false;
  let musicStandScrollLeft = 0;
  let musicStandScrollTop = 0;

  const UNDO_LIMIT = 100;
  const undoStack = [];
  const redoStack = [];
  let currentProjectId = window.PikakirjoitinRecentProjects.makeId();

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
    if (!status) return;
    status.dataset.rawMessage = String(message == null ? "" : message);
    status.textContent = I18N.translateRuntimeMessage(status.dataset.rawMessage);
    status.className = "status" + (className ? " " + className : "");
  }

  function clonePlain(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function captureHistoryState() {
    return {
      score: clonePlain(score),
      settings: clonePlain(settings)
    };
  }

  function historySnapshot(label) {
    return {
      label: label || "muutos",
      state: captureHistoryState()
    };
  }

  function updateHistoryButtons() {
    const undoButton = document.getElementById("undoButton");
    const redoButton = document.getElementById("redoButton");
    if (undoButton) undoButton.disabled = undoStack.length === 0;
    if (redoButton) redoButton.disabled = redoStack.length === 0;
  }

  function commitHistory(snapshot) {
    if (!snapshot) return;
    undoStack.push(snapshot);
    if (undoStack.length > UNDO_LIMIT) {
      undoStack.splice(0, undoStack.length - UNDO_LIMIT);
    }
    redoStack.length = 0;
    updateHistoryButtons();
  }

  function replaceScoreState(nextScore) {
    Object.keys(score).forEach(function (key) {
      delete score[key];
    });
    Object.assign(score, clonePlain(nextScore));
    // Tallennetun projektin nuotti-/slur-/tie-ID:t täytyy huomioida ennen
    // kuin cleanup-funktiot tai seuraava kosketinele voivat luoda uusia ID:itä.
    window.PikakirjoitinScoreModel.syncIdCounters(score);
    score.layout = window.PikakirjoitinScoreModel.normalizeLayout(score.layout);
    score.barlines = window.PikakirjoitinScoreModel.normalizeBarlines(score.barlines);
    window.PikakirjoitinScoreModel.cleanupTies(score);
    window.PikakirjoitinScoreModel.cleanupSlurs(score);
    window.PikakirjoitinScoreModel.cleanupBeamGroups(score);
    window.PikakirjoitinScoreModel.cleanupBeamBreaks(score);
  }

  function restoreHistoryState(state) {
    if (!state) return;
    replaceScoreState(state.score);
    settings = clonePlain(state.settings || {});
    keyboardEditId = null;
    pendingSelectedSlurStartId = null;
    noteInputMeta.clear();
    audio.noteOff();
    if (selection) selection.clear();
  }

  function finishHistoryRestore(message) {
    renderScore().then(function () {
      requestAnimationFrame(function () {
        if (keyboard) {
          keyboard.scrollToMidi(Number(settings.keyboardStartMidi) || 60);
        }
      });
      updateStatus(message, "ok");
    }).catch(function (error) {
      console.error(error);
      updateStatus(
        "Virhe: " + (error && error.message ? error.message : String(error)),
        "error"
      );
    });
  }

  function undoLastChange() {
    const snapshot = undoStack.pop();
    if (!snapshot) {
      updateStatus("Ei kumottavaa.", "ok");
      updateHistoryButtons();
      return;
    }

    redoStack.push({
      label: snapshot.label,
      state: captureHistoryState()
    });

    restoreHistoryState(snapshot.state);
    updateHistoryButtons();
    finishHistoryRestore("Kumottu · " + snapshot.label + ".");
  }

  function redoLastChange() {
    const snapshot = redoStack.pop();
    if (!snapshot) {
      updateStatus("Ei uudelleen tehtävää.", "ok");
      updateHistoryButtons();
      return;
    }

    undoStack.push({
      label: snapshot.label,
      state: captureHistoryState()
    });
    if (undoStack.length > UNDO_LIMIT) {
      undoStack.splice(0, undoStack.length - UNDO_LIMIT);
    }

    restoreHistoryState(snapshot.state);
    updateHistoryButtons();
    finishHistoryRestore("Uudelleen · " + snapshot.label + ".");
  }

  function startOverAndRefresh() {
    audio.noteOff();
    const ok = window.confirm(
      I18N.getLanguage() === "en"
        ? "Start over? The current score will be cleared and SwipeScore refreshed."
        : "Aloitetaanko alusta? Nykyinen nuotti tyhjennetään ja Pikakirjoitin päivitetään."
    );
    if (!ok) return;
    window.location.reload();
  }

  function fileBaseName() {
    const fallback = I18N.getLanguage() === "en" ? "SwipeScore" : "Pikakirjoitin";
    const scoreTitle = score && score.metadata ? score.metadata.title : "";
    const raw = String(scoreTitle || settings.title || fallback).trim() || fallback;
    return raw
      .replace(/[\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80) || fallback;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
  }

  function isTouchShareDevice() {
    const userAgent = String(navigator.userAgent || "");
    const isIPadOS = navigator.platform === "MacIntel" && Number(navigator.maxTouchPoints || 0) > 1;
    const isMobileUserAgent = /iPad|iPhone|iPod|Android/i.test(userAgent);
    let coarsePointer = false;
    try {
      coarsePointer = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
    } catch (_) {}
    return isIPadOS || isMobileUserAgent || (Number(navigator.maxTouchPoints || 0) > 1 && coarsePointer);
  }

  async function sharePdfOnTouchDevice(pdfBlob, filename) {
    if (!isTouchShareDevice()) return false;
    if (typeof navigator.share !== "function" || typeof navigator.canShare !== "function") return false;
    if (typeof File !== "function") return false;

    const file = new File([pdfBlob], filename, { type: "application/pdf" });
    let canShareFile = false;
    try {
      canShareFile = navigator.canShare({ files: [file] });
    } catch (_) {
      canShareFile = false;
    }
    if (!canShareFile) return false;

    updateStatus("Avataan jakovalikko…");
    try {
      await navigator.share({
        files: [file],
        title: filename
      });
      updateStatus("PDF jaettu.", "ok");
      return true;
    } catch (error) {
      if (error && error.name === "AbortError") {
        updateStatus("PDF:n jako peruttiin.");
        return true;
      }
      console.warn("PDF-jakovalikko ei avautunut, käytetään tavallista tallennusta.", error);
      return false;
    }
  }

  function currentProjectPayload() {
    return {
      format: "Pikakirjoitin3",
      version: "0.17.6.36",
      projectId: currentProjectId,
      savedAt: new Date().toISOString(),
      score: clonePlain(score),
      settings: clonePlain(settings)
    };
  }

  async function saveProjectFile() {
    try {
      const record = await window.PikakirjoitinRecentProjects.save(currentProjectPayload());
      currentProjectId = record.id;
      updateStatus("Tallennettu viimeisimpiin.", "ok");
      document.dispatchEvent(new CustomEvent("pk-recentschanged"));
    } catch (error) {
      console.error(error);
      updateStatus("Tallennus viimeisimpiin epäonnistui.", "error");
    }
  }

  function bytesFromBase64(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  function textBytes(text) {
    return new TextEncoder().encode(String(text));
  }

  function concatBytes(parts) {
    let length = 0;
    parts.forEach(function (part) { length += part.length; });
    const out = new Uint8Array(length);
    let offset = 0;
    parts.forEach(function (part) {
      out.set(part, offset);
      offset += part.length;
    });
    return out;
  }

  function loadImageFromUrl(url) {
    return new Promise(function (resolve, reject) {
      const image = new Image();
      image.onload = function () { resolve(image); };
      image.onerror = function () { reject(new Error("Nuottisivua ei voitu muuntaa kuvaksi.")); };
      image.src = url;
    });
  }

  async function svgToJpegBytes(svg, paper) {
    const clone = svg.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    const viewBox = svg.viewBox && svg.viewBox.baseVal;
    const svgRect = svg.getBoundingClientRect();
    const sourceWidth = Math.max(1, Number(viewBox && viewBox.width) || svgRect.width || 1000);
    const sourceHeight = Math.max(1, Number(viewBox && viewBox.height) || svgRect.height || 1400);

    if (!clone.getAttribute("viewBox")) {
      clone.setAttribute("viewBox", "0 0 " + sourceWidth + " " + sourceHeight);
    }
    clone.setAttribute("width", String(sourceWidth));
    clone.setAttribute("height", String(sourceHeight));

    const xml = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    try {
      const image = await loadImageFromUrl(url);
      const canvas = document.createElement("canvas");
      canvas.width = 1240;
      canvas.height = 1754;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas ei ole käytettävissä.");

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);

      /*
       * BASE 0.17.6.1:
       * PDF ei lisää enää omia kiinteitä marginaaleja. SVG sijoitetaan
       * A4-canvakselle samassa suhteessa kuin se sijaitsee ruudun oikean
       * .a4-paper-elementin sisällä. Näin paperin CSS-sisennys sekä OSMD:n
       * käyttäjän säätämät PageTop/Right/Bottom/LeftMargin-arvot säilyvät
       * samassa geometriassa myös PDF:ssä.
       */
      const paperRect = paper && paper.getBoundingClientRect
        ? paper.getBoundingClientRect()
        : null;

      let x = 0;
      let y = 0;
      let drawWidth = canvas.width;
      let drawHeight = sourceHeight * (canvas.width / sourceWidth);

      if (
        paperRect &&
        paperRect.width > 1 && paperRect.height > 1 &&
        svgRect.width > 1 && svgRect.height > 1
      ) {
        const scaleX = canvas.width / paperRect.width;
        const scaleY = canvas.height / paperRect.height;
        x = (svgRect.left - paperRect.left) * scaleX;
        y = (svgRect.top - paperRect.top) * scaleY;
        drawWidth = svgRect.width * scaleX;
        drawHeight = svgRect.height * scaleY;
      } else {
        const scale = Math.min(canvas.width / sourceWidth, canvas.height / sourceHeight);
        drawWidth = sourceWidth * scale;
        drawHeight = sourceHeight * scale;
        x = (canvas.width - drawWidth) / 2;
        y = 0;
      }

      context.drawImage(image, x, y, drawWidth, drawHeight);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.94);
      return {
        bytes: bytesFromBase64(dataUrl.split(",")[1]),
        width: canvas.width,
        height: canvas.height
      };
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function buildPdfFromJpegs(images) {
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const objectCount = 2 + images.length * 3;
    const objects = new Array(objectCount + 1);
    const pageNumbers = [];

    objects[1] = textBytes("<< /Type /Catalog /Pages 2 0 R >>");

    images.forEach(function (image, index) {
      const pageNo = 3 + index * 3;
      const imageNo = pageNo + 1;
      const contentNo = pageNo + 2;
      pageNumbers.push(pageNo);

      objects[pageNo] = textBytes(
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " +
        pageWidth + " " + pageHeight + "] /Resources << /XObject << /Im0 " +
        imageNo + " 0 R >> >> /Contents " + contentNo + " 0 R >>"
      );

      const imageHeader = textBytes(
        "<< /Type /XObject /Subtype /Image /Width " + image.width +
        " /Height " + image.height +
        " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " +
        image.bytes.length + " >>\nstream\n"
      );
      const imageFooter = textBytes("\nendstream");
      objects[imageNo] = concatBytes([imageHeader, image.bytes, imageFooter]);

      const content = "q " + pageWidth + " 0 0 " + pageHeight + " 0 0 cm /Im0 Do Q";
      const contentBytes = textBytes(content);
      objects[contentNo] = concatBytes([
        textBytes("<< /Length " + contentBytes.length + " >>\nstream\n"),
        contentBytes,
        textBytes("\nendstream")
      ]);
    });

    objects[2] = textBytes(
      "<< /Type /Pages /Count " + pageNumbers.length + " /Kids [" +
      pageNumbers.map(function (number) { return number + " 0 R"; }).join(" ") +
      "] >>"
    );

    const parts = [textBytes("%PDF-1.4\n%PK3\n")];
    const offsets = new Array(objectCount + 1).fill(0);
    let total = parts[0].length;

    for (let number = 1; number <= objectCount; number += 1) {
      offsets[number] = total;
      const head = textBytes(number + " 0 obj\n");
      const tail = textBytes("\nendobj\n");
      parts.push(head, objects[number], tail);
      total += head.length + objects[number].length + tail.length;
    }

    const xrefOffset = total;
    let xref = "xref\n0 " + (objectCount + 1) + "\n";
    xref += "0000000000 65535 f \n";
    for (let number = 1; number <= objectCount; number += 1) {
      xref += String(offsets[number]).padStart(10, "0") + " 00000 n \n";
    }
    xref += "trailer\n<< /Size " + (objectCount + 1) + " /Root 1 0 R >>\n";
    xref += "startxref\n" + xrefOffset + "\n%%EOF";
    parts.push(textBytes(xref));

    return new Blob(parts, { type: "application/pdf" });
  }

  async function buildCurrentPdfBlob() {
    await rendering;
    const container = document.getElementById("osmd-container");
    if (!container) throw new Error("Nuottikuvaa ei löytynyt.");

    let svgs = Array.from(container.children).filter(function (element) {
      return element.tagName && element.tagName.toLowerCase() === "svg";
    });
    if (!svgs.length) {
      svgs = Array.from(container.querySelectorAll("svg")).filter(function (svg) {
        const rect = svg.getBoundingClientRect();
        return rect.width > 80 && rect.height > 80;
      });
    }
    if (!svgs.length) throw new Error("PDF:ään ei löytynyt nuottisivua.");

    const paper = container.closest(".a4-paper");
    const pages = [];
    for (const svg of svgs) {
      pages.push(await svgToJpegBytes(svg, paper));
    }

    return buildPdfFromJpegs(pages);
  }

  async function savePdfFile() {
    const button = document.getElementById("savePdfButton");
    if (button) button.disabled = true;
    updateStatus("Muodostetaan PDF…");

    try {
      const pdfBlob = await buildCurrentPdfBlob();
      const pdfFilename = fileBaseName() + ".pdf";
      const shared = await sharePdfOnTouchDevice(pdfBlob, pdfFilename);
      if (!shared) {
        downloadBlob(pdfBlob, pdfFilename);
        updateStatus("PDF tallennettu.", "ok");
      }
    } catch (error) {
      console.error(error);
      updateStatus(
        "PDF-tallennus epäonnistui: " + (error && error.message ? error.message : String(error)),
        "error"
      );
    } finally {
      if (button) button.disabled = false;
    }
  }

  async function openPdfOrPrintOnTouchDevice() {
    const button = document.getElementById("savePdfButton");
    if (button) button.disabled = true;
    updateStatus("Muodostetaan PDF…");
    try {
      const pdfBlob = await buildCurrentPdfBlob();
      const filename = fileBaseName() + ".pdf";
      const shared = await sharePdfOnTouchDevice(pdfBlob, filename);
      if (shared) return;

      // Galaxy/Android-varareitti, jos tiedoston jako ei ole selaimessa
      // käytettävissä: avataan valmis A4-PDF omaan näkymään. Sieltä sen
      // voi tallentaa tai tulostaa selaimen/järjestelmän omilla toiminnoilla.
      const url = URL.createObjectURL(pdfBlob);
      const opened = window.open(url, "_blank");
      if (!opened) {
        downloadBlob(pdfBlob, filename);
        updateStatus("PDF tallennettu.", "ok");
      } else {
        updateStatus("PDF avattu.", "ok");
      }
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    } catch (error) {
      console.error(error);
      updateStatus(
        "PDF:n muodostus epäonnistui: " + (error && error.message ? error.message : String(error)),
        "error"
      );
    } finally {
      if (button) button.disabled = false;
    }
  }

  function updateTabletPdfPrintButton() {
    const tabletMode = isTouchShareDevice();
    const pdfButton = document.getElementById("savePdfButton");
    const printButton = document.getElementById("printButton");
    const english = I18N.getLanguage() === "en";

    if (pdfButton) {
      const label = pdfButton.querySelector("span");
      if (tabletMode) {
        // Tabletilla yksi kompakti PDF-painike avaa järjestelmän jakovalikon,
        // josta PDF:n voi tallentaa, jakaa tai tulostaa.
        pdfButton.setAttribute("aria-label", english ? "PDF / Print" : "PDF / Tulosta");
        pdfButton.setAttribute("title", english ? "PDF / Print" : "PDF / Tulosta");
        if (label) label.textContent = "PDF";
        pdfButton.classList.add("keyboard-tool-pdf-print");
      } else {
        pdfButton.setAttribute("aria-label", english ? "Save PDF" : "Tallenna PDF");
        pdfButton.setAttribute("title", "PDF");
        if (label) label.textContent = "PDF";
        pdfButton.classList.remove("keyboard-tool-pdf-print");
      }
    }

    if (printButton) {
      // Pelkkä hidden-attribuutti ei riitä, koska .keyboard-tool-buttonin
      // author-CSS:n display:grid voi ohittaa selaimen [hidden]-oletuksen.
      printButton.hidden = tabletMode;
      printButton.classList.toggle("pk-tablet-hidden", tabletMode);
      if (tabletMode) {
        printButton.setAttribute("aria-hidden", "true");
        printButton.setAttribute("tabindex", "-1");
      } else {
        printButton.removeAttribute("aria-hidden");
        printButton.removeAttribute("tabindex");
      }
    }
  }

  function removePrintSnapshot() {
    const snapshot = document.querySelector(".pk-print-snapshot");
    if (snapshot) snapshot.remove();
    document.body.classList.remove("pk-printing");
    window.PikakirjoitinPrintMode = false;
  }

  function createPrintSnapshot() {
    const oldSnapshot = document.querySelector(".pk-print-snapshot");
    if (oldSnapshot) oldSnapshot.remove();

    const paper = document.getElementById("a4Paper");
    const container = document.getElementById("osmd-container");
    if (!paper || !container) {
      throw new Error("Nuottisivua ei löytynyt tulostusta varten.");
    }

    const paperRect = paper.getBoundingClientRect();
    if (!(paperRect.width > 1 && paperRect.height > 1)) {
      throw new Error("Nuottisivun mittoja ei voitu lukea.");
    }

    let svgs = Array.from(container.children).filter(function (element) {
      return element.tagName && element.tagName.toLowerCase() === "svg";
    });
    if (!svgs.length) {
      svgs = Array.from(container.querySelectorAll("svg")).filter(function (svg) {
        const rect = svg.getBoundingClientRect();
        return rect.width > 80 && rect.height > 80;
      });
    }
    if (!svgs.length) {
      throw new Error("Tulostukseen ei löytynyt nuottikuvaa.");
    }

    /*
     * 0.17.6.20:
     * Tulostus ei enää muuta oikean .a4-paper-elementin kokoa. Sen sijaan
     * ruudulla jo valmiiksi renderöidystä SVG:stä tehdään print-only A4-kopio.
     * Jokaisen SVG:n paikka ja koko tallennetaan prosentteina alkuperäisestä
     * paperista. Tämä on sama geometria, jota PDF-tallennus käyttää.
     */
    const snapshot = document.createElement("div");
    snapshot.className = "pk-print-snapshot";
    snapshot.setAttribute("aria-hidden", "true");

    svgs.forEach(function (svg) {
      const rect = svg.getBoundingClientRect();
      if (!(rect.width > 1 && rect.height > 1)) return;

      const clone = svg.cloneNode(true);
      if (clone.removeAttribute) clone.removeAttribute("id");
      clone.querySelectorAll("[id]").forEach(function (element) {
        element.removeAttribute("id");
      });

      const left = ((rect.left - paperRect.left) / paperRect.width) * 100;
      const top = ((rect.top - paperRect.top) / paperRect.height) * 100;
      const width = (rect.width / paperRect.width) * 100;
      const height = (rect.height / paperRect.height) * 100;

      clone.style.position = "absolute";
      clone.style.left = left + "%";
      clone.style.top = top + "%";
      clone.style.width = width + "%";
      clone.style.height = height + "%";
      clone.style.maxWidth = "none";
      clone.style.margin = "0";
      clone.style.padding = "0";

      snapshot.appendChild(clone);
    });

    if (!snapshot.children.length) {
      throw new Error("Tulostukseen ei löytynyt näkyvää nuottikuvaa.");
    }

    document.body.appendChild(snapshot);
    return snapshot;
  }

  function nextAnimationFrame() {
    return new Promise(function (resolve) {
      requestAnimationFrame(resolve);
    });
  }

  async function preparePaperGeometryForPrint() {
    const paper = document.getElementById("a4Paper");
    const container = document.getElementById("osmd-container");
    if (!paper || !container) return;

    /*
     * 0.17.6.29 · iPad/Safari print-geometrian vakautus
     *
     * Nuottiteline käyttää transformoitua compositing-kerrosta. iPad Safari voi
     * hetken aikaa palauttaa siitä vanhoja getBoundingClientRect()-mittoja vielä
     * normaalinäkymään paluun jälkeenkin. Print-snapshot rakennetaan juuri näistä
     * mitoista, joten vanha geometria voi siirtää SVG:n A4-sivun ulkopuolelle.
     *
     * Ennen mittausta pakotetaan paperi varmasti normaalitilaan, tehdään layout-
     * luku ja annetaan WebKitille kaksi maalauskierrosta. OSMD:tä ei renderöidä
     * uudelleen tätä varten.
     */
    window.PikakirjoitinPrintMode = true;

    if (musicStandMode) {
      setMusicStandMode(false);
    } else {
      document.body.classList.remove("pk-music-stand-mode");
      paper.style.removeProperty("--pk-stand-scale");
      paper.style.removeProperty("--pk-stand-x");
      paper.style.removeProperty("--pk-stand-y");
      paper.style.removeProperty("--pk-stand-paper-width");
      paper.style.removeProperty("--pk-stand-paper-height");
    }

    // Pakota WebKit laskemaan normaali paperigeometria heti.
    void paper.offsetWidth;
    void paper.offsetHeight;
    paper.getBoundingClientRect();
    container.getBoundingClientRect();

    await nextAnimationFrame();
    paper.getBoundingClientRect();
    container.getBoundingClientRect();

    await nextAnimationFrame();
    paper.getBoundingClientRect();
    container.getBoundingClientRect();
  }

  // 0.17.6.30 · print-layoutin sivuraja ja marginaalittomuus hoidetaan CSS:ssä.
  async function printScore() {
    audio.noteOff();

    // iPad / kosketustabletit: tulostetaan sama A4-PDF, jonka PDF-tallennus
    // muodostaa. iOS:n HTML-printtaus voi lisätä omia marginaaleja tai tyhjän
    // lisäsivun, mutta PDF:n sivugeometria on yksiselitteinen.
    if (isTouchShareDevice()) {
      const button = document.getElementById("printButton");
      if (button) button.disabled = true;
      updateStatus("Muodostetaan tulostettava PDF…");
      try {
        await preparePaperGeometryForPrint();
        const pdfBlob = await buildCurrentPdfBlob();
        const filename = fileBaseName() + ".pdf";

        if (typeof navigator.share === "function" && typeof navigator.canShare === "function" && typeof File === "function") {
          const file = new File([pdfBlob], filename, { type: "application/pdf" });
          let canShare = false;
          try {
            canShare = navigator.canShare({ files: [file] });
          } catch (_) {}

          if (canShare) {
            updateStatus("Valitse jakovalikosta Tulosta.");
            try {
              await navigator.share({ files: [file], title: filename });
              updateStatus("Tulostusvalikko suljettu.", "ok");
              return;
            } catch (error) {
              if (error && error.name === "AbortError") {
                updateStatus("Tulostus peruttiin.");
                return;
              }
              console.warn("PDF-tulostuksen jakovalikko ei avautunut.", error);
            }
          }
        }

        // Varareitti: avataan täsmälleen sama PDF. iPadissa sen Jaa-valikosta
        // voi valita Tulosta ilman HTML-sivutuksen marginaaleja tai lisäsivuja.
        const url = URL.createObjectURL(pdfBlob);
        const opened = window.open(url, "_blank");
        if (!opened) downloadBlob(pdfBlob, filename);
        window.setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
        updateStatus("PDF avattu tulostusta varten.", "ok");
        return;
      } catch (error) {
        console.error(error);
        updateStatus(
          "Tulostus epäonnistui: " + (error && error.message ? error.message : String(error)),
          "error"
        );
        return;
      } finally {
        window.PikakirjoitinPrintMode = false;
        if (button) button.disabled = false;
      }
    }

    // Mac / desktop: pidetään nykyinen suora print preview, joka toimii oikein.
    try {
      await preparePaperGeometryForPrint();
      createPrintSnapshot();
      document.body.classList.add("pk-printing");

      await nextAnimationFrame();

      const cleanup = function () {
        removePrintSnapshot();
      };
      window.addEventListener("afterprint", cleanup, { once: true });

      window.print();
    } catch (error) {
      console.error(error);
      removePrintSnapshot();
      updateStatus(
        "Tulostus epäonnistui: " + (error && error.message ? error.message : String(error)),
        "error"
      );
    }
  }

  const LAYOUT_DEFAULTS = {
    notationScale: 0.95,
    systemSpacing: 1,
    instrumentCreditDistance: 14,
    pageMargins: { top: 5, right: 2.5, bottom: 5, left: 2.5 }
  };
  let layoutEditSnapshot = null;
  let layoutRenderTimer = 0;

  function currentLayout() {
    score.layout = window.PikakirjoitinScoreModel.normalizeLayout(score.layout);
    return score.layout;
  }

  function setLayoutPanelValues() {
    const layout = currentLayout();
    const fields = {
      notationSizeSlider: Math.round(layout.notationScale * 100),
      systemSpacingSlider: Math.round(layout.systemSpacing * 100),
      instrumentCreditDistanceSlider: layout.instrumentCreditDistance,
      topMarginSlider: layout.pageMargins.top,
      bottomMarginSlider: layout.pageMargins.bottom,
      leftMarginSlider: layout.pageMargins.left,
      rightMarginSlider: layout.pageMargins.right
    };

    Object.keys(fields).forEach(function (id) {
      const input = document.getElementById(id);
      if (input) input.value = String(fields[id]);
    });

    const sizeOutput = document.getElementById("notationSizeValue");
    if (sizeOutput) sizeOutput.textContent = Math.round(layout.notationScale * 100) + " %";
    const spacingOutput = document.getElementById("systemSpacingValue");
    if (spacingOutput) spacingOutput.textContent = Math.round(layout.systemSpacing * 100) + " %";
    const instrumentOutput = document.getElementById("instrumentCreditDistanceValue");
    if (instrumentOutput) instrumentOutput.textContent = Number(layout.instrumentCreditDistance).toFixed(layout.instrumentCreditDistance % 1 ? 1 : 0);
    [
      ["topMarginValue", layout.pageMargins.top],
      ["bottomMarginValue", layout.pageMargins.bottom],
      ["leftMarginValue", layout.pageMargins.left],
      ["rightMarginValue", layout.pageMargins.right]
    ].forEach(function (pair) {
      const output = document.getElementById(pair[0]);
      if (output) output.textContent = Number(pair[1]).toFixed(pair[1] % 1 ? 1 : 0);
    });
  }

  function scheduleLayoutRender() {
    window.clearTimeout(layoutRenderTimer);
    layoutRenderTimer = window.setTimeout(function () {
      window.PikakirjoitinRenderer.rerenderLayout(score.layout, "layout-settings")
        .then(function () {
          refreshSelectionFromRenderedScore();
          if (layoutEditor) layoutEditor.refresh();
          if (barlineEditor && barlineEditor.isActive()) barlineEditor.refresh();
        })
        .catch(function (error) {
          console.error(error);
          updateStatus("Virhe: " + (error && error.message ? error.message : String(error)), "error");
        });
    }, 45);
  }

  function applyLayoutControl(input) {
    const layout = currentLayout();
    const value = Number(input.value);
    const setting = input.dataset.layoutSetting;

    if (setting === "notationScale") layout.notationScale = Math.max(0.75, Math.min(1.2, value / 100));
    if (setting === "systemSpacing") layout.systemSpacing = Math.max(0.5, Math.min(3, value / 100));
    if (setting === "instrumentCreditDistance") layout.instrumentCreditDistance = Math.max(2, Math.min(14, value));
    if (setting === "marginTop") layout.pageMargins.top = Math.max(0, Math.min(12, value));
    if (setting === "marginBottom") layout.pageMargins.bottom = Math.max(0, Math.min(12, value));
    if (setting === "marginLeft") layout.pageMargins.left = Math.max(0, Math.min(12, value));
    if (setting === "marginRight") layout.pageMargins.right = Math.max(0, Math.min(12, value));

    setLayoutPanelValues();
    scheduleLayoutRender();
  }

  function setupLayoutSettings() {
    const button = document.getElementById("layoutSettingsButton");
    const panel = document.getElementById("layoutSettingsPanel");
    const close = document.getElementById("layoutSettingsClose");
    const reset = document.getElementById("layoutResetButton");
    const inputs = Array.from(document.querySelectorAll("[data-layout-setting]"));
    if (!button || !panel) return;

    function setOpen(open) {
      panel.hidden = !open;
      button.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) setLayoutPanelValues();
    }

    button.addEventListener("click", function () {
      setOpen(panel.hidden);
    });
    if (close) close.addEventListener("click", function () { setOpen(false); });

    inputs.forEach(function (input) {
      function beginEdit() {
        if (!layoutEditSnapshot) layoutEditSnapshot = historySnapshot("Asettelu");
      }
      input.addEventListener("pointerdown", beginEdit);
      input.addEventListener("focus", beginEdit);
      input.addEventListener("input", function () {
        beginEdit();
        applyLayoutControl(input);
      });
      input.addEventListener("change", function () {
        if (layoutEditSnapshot) {
          commitHistory(layoutEditSnapshot);
          layoutEditSnapshot = null;
        }
      });
      input.addEventListener("blur", function () {
        if (layoutEditSnapshot) {
          commitHistory(layoutEditSnapshot);
          layoutEditSnapshot = null;
        }
      });
    });

    if (reset) {
      reset.addEventListener("click", function () {
        const snapshot = historySnapshot("Asettelu");
        const layout = currentLayout();
        layout.notationScale = LAYOUT_DEFAULTS.notationScale;
        layout.systemSpacing = LAYOUT_DEFAULTS.systemSpacing;
        layout.instrumentCreditDistance = LAYOUT_DEFAULTS.instrumentCreditDistance;
        layout.pageMargins = clonePlain(LAYOUT_DEFAULTS.pageMargins);
        commitHistory(snapshot);
        setLayoutPanelValues();
        scheduleLayoutRender();
      });
    }

    setLayoutPanelValues();
  }

  function getMusicStandContentBounds(paper) {
    const container = document.getElementById("osmd-container");
    if (!paper || !container) return null;

    // Mitataan vain OSMD:n oikeasti piirtämät graafiset alkiot. Root-SVG:t ja
    // mahdolliset sivun taustarectit jätetään pois, jotta A4-paperin tyhjä alue
    // ei päädy nuottitelineen sovituslaatikkoon.
    const selector = [
      "svg path",
      "svg text",
      "svg line",
      "svg polyline",
      "svg polygon",
      "svg circle",
      "svg ellipse",
      "svg use",
      "svg image"
    ].join(",");

    const nodes = Array.from(container.querySelectorAll(selector));
    if (!nodes.length) return null;

    const paperRect = paper.getBoundingClientRect();
    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;

    for (const node of nodes) {
      if (!node || typeof node.getBoundingClientRect !== "function") continue;
      const rect = node.getBoundingClientRect();
      if (!rect || !Number.isFinite(rect.left) || !Number.isFinite(rect.top)) continue;
      if (rect.width < 0.15 && rect.height < 0.15) continue;

      // Paikalliset koordinaatit paperin vasemmasta yläkulmasta.
      const l = rect.left - paperRect.left;
      const t = rect.top - paperRect.top;
      const r = rect.right - paperRect.left;
      const b = rect.bottom - paperRect.top;

      left = Math.min(left, l);
      top = Math.min(top, t);
      right = Math.max(right, r);
      bottom = Math.max(bottom, b);
    }

    if (![left, top, right, bottom].every(Number.isFinite)) return null;
    if (right <= left || bottom <= top) return null;

    // Hieman hengitystilaa, ettei nuotti osu aivan näytön reunaan. Tämä ei ole
    // paperimarginaali vaan pieni esitystilan turvaväli sisällön ympärillä.
    const sourcePad = 8;
    return {
      left: Math.max(0, left - sourcePad),
      top: Math.max(0, top - sourcePad),
      right: Math.min(paper.offsetWidth, right + sourcePad),
      bottom: Math.min(paper.offsetHeight, bottom + sourcePad)
    };
  }

  function fitMusicStandPage() {
    if (!musicStandMode) return;

    const viewport = document.querySelector(".score-card");
    const paper = document.getElementById("a4Paper");
    if (!viewport || !paper) return;

    // Nollataan vanha transformi ennen mittausta. Paperin leveys ja korkeus on
    // lukittu setMusicStandMode():ssa normaalinäkymän arvoihin, joten OSMD:n
    // layout ei muutu telineeseen siirryttäessä tai ruutua käännettäessä.
    paper.style.setProperty("--pk-stand-scale", "1");
    paper.style.setProperty("--pk-stand-x", "0px");
    paper.style.setProperty("--pk-stand-y", "0px");

    const paperWidth = Math.max(1, Number(paper.offsetWidth) || 1);
    const paperHeight = Math.max(1, Number(paper.offsetHeight) || 1);
    const viewportWidth = Math.max(1, Number(viewport.clientWidth) || window.innerWidth || 1);
    const viewportHeight = Math.max(1, Number(viewport.clientHeight) || window.innerHeight || 1);

    const bounds = getMusicStandContentBounds(paper) || {
      left: 0,
      top: 0,
      right: paperWidth,
      bottom: paperHeight
    };

    const contentWidth = Math.max(1, bounds.right - bounds.left);
    const contentHeight = Math.max(1, bounds.bottom - bounds.top);
    const viewportPad = 6;
    const usableWidth = Math.max(1, viewportWidth - viewportPad * 2);
    const usableHeight = Math.max(1, viewportHeight - viewportPad * 2);
    const scale = Math.min(usableWidth / contentWidth, usableHeight / contentHeight);

    const scaledWidth = contentWidth * scale;
    const x = viewportPad + (usableWidth - scaledWidth) / 2 - bounds.left * scale;

    // Nuottitelineessä sisältö ankkuroidaan pystysuunnassa yläreunaan.
    // Vaakasuunnassa se pysyy keskitettynä. Näin lyhytkään nuotti ei
    // kellu keskellä näyttöä, vaan alkaa aina samasta luonnollisesta
    // lukukohdasta pienellä turvavälillä.
    const y = viewportPad - bounds.top * scale;

    paper.style.setProperty("--pk-stand-scale", String(scale));
    paper.style.setProperty("--pk-stand-x", x + "px");
    paper.style.setProperty("--pk-stand-y", y + "px");
  }

  function setMusicStandMode(active) {
    const next = Boolean(active);
    if (musicStandMode === next) return;

    const viewport = document.querySelector(".score-card");
    const paper = document.getElementById("a4Paper");
    const button = document.getElementById("musicStandButton");

    musicStandMode = next;

    if (next) {
      // Renderer ei saa reflowata nuottia nuottitelineen CSS-muutosten vuoksi.
      window.PikakirjoitinMusicStandMode = true;
      if (viewport) {
        musicStandScrollLeft = viewport.scrollLeft;
        musicStandScrollTop = viewport.scrollTop;
      }

      // Nuottiteline ei ole muokkaustila. Suljetaan kaikki mahdolliset
      // nuotti-, tahtiviiva- ja rivinvaihtovalinnat ennen esitysnäkymää.
      if (thumbRail) {
        if (thumbRail.state.barlines) thumbRail.setToggle("barlines", false);
        if (thumbRail.state.layout) thumbRail.setToggle("layout", false);
      }
      if (layoutEditor) layoutEditor.setActive(false);
      if (barlineEditor) barlineEditor.setActive(false);
      if (selection) {
        if (typeof selection.setEnabled === "function") selection.setEnabled(false);
        selection.clear();
      }
      if (selectionEditor) {
        if (typeof selectionEditor.hide === "function") selectionEditor.hide();
        else selectionEditor.update({ visible:false });
      }
      lastSelectionEditorAnchor = null;

      const layoutPanel = document.getElementById("layoutSettingsPanel");
      const layoutButton = document.getElementById("layoutSettingsButton");
      if (layoutPanel) layoutPanel.hidden = true;
      if (layoutButton) layoutButton.setAttribute("aria-expanded", "false");

      // Lukitaan paperin täsmälliset normaalinäkymän mitat ennen kuin
      // nuottitelineen full-screen-CSS aktivoituu. Näin landscape-mediaquery
      // tai viewportin muuttuminen ei laukaise eri paperileveyttä / OSMD-reflow'ta.
      if (paper) {
        paper.style.setProperty("--pk-stand-paper-width", Math.max(1, paper.offsetWidth) + "px");
        paper.style.setProperty("--pk-stand-paper-height", Math.max(1, paper.offsetHeight) + "px");
      }

      document.body.classList.add("pk-music-stand-mode");
      if (button) button.setAttribute("aria-pressed", "true");
      if (document.activeElement && typeof document.activeElement.blur === "function") {
        document.activeElement.blur();
      }

      requestAnimationFrame(function () {
        fitMusicStandPage();
        requestAnimationFrame(fitMusicStandPage);
      });
      return;
    }

    document.body.classList.remove("pk-music-stand-mode");
    if (paper) {
      paper.style.removeProperty("--pk-stand-scale");
      paper.style.removeProperty("--pk-stand-x");
      paper.style.removeProperty("--pk-stand-y");
      paper.style.removeProperty("--pk-stand-paper-width");
      paper.style.removeProperty("--pk-stand-paper-height");
    }
    if (button) button.setAttribute("aria-pressed", "false");

    if (selection && typeof selection.setEnabled === "function") {
      selection.setEnabled(!(thumbState.layout || thumbState.barlines));
    }

    requestAnimationFrame(function () {
      if (viewport) {
        viewport.scrollLeft = musicStandScrollLeft;
        viewport.scrollTop = musicStandScrollTop;
      }
      refreshSelectionFromRenderedScore();
      // Vapautetaan ResizeObserver vasta kun normaalinäkymän geometria on
      // palautunut. Näin poistuminenkaan ei tee turhaa välirenderöintiä.
      requestAnimationFrame(function () {
        window.PikakirjoitinMusicStandMode = false;
      });
    });
  }

  function setupMusicStandMode() {
    const button = document.getElementById("musicStandButton");
    const viewport = document.querySelector(".score-card");
    if (!button || !viewport) return;

    button.addEventListener("click", function () {
      setMusicStandMode(true);
    });

    // Nuottitelineessä itse sivun napautus palauttaa normaalitilan. Listener
    // on capture-vaiheessa, jotta sama kosketus ei ehdi valita nuottia.
    viewport.addEventListener("pointerdown", function (event) {
      if (!musicStandMode) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setMusicStandMode(false);
    }, true);

    window.addEventListener("resize", function () {
      if (musicStandMode) requestAnimationFrame(fitMusicStandPage);
    });

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", function () {
        if (musicStandMode) requestAnimationFrame(fitMusicStandPage);
      });
    }

    document.addEventListener("keydown", function (event) {
      if (musicStandMode && event.key === "Escape") {
        event.preventDefault();
        setMusicStandMode(false);
      }
    });
  }

  function setupHistoryControls() {
    const undoButton = document.getElementById("undoButton");
    const redoButton = document.getElementById("redoButton");
    const resetButton = document.getElementById("startOverButton");
    const detailsButton = document.getElementById("projectDetailsButton");
    const saveButton = document.getElementById("saveProjectButton");
    const pdfButton = document.getElementById("savePdfButton");
    const printButton = document.getElementById("printButton");

    if (undoButton) undoButton.addEventListener("click", undoLastChange);
    if (redoButton) redoButton.addEventListener("click", redoLastChange);
    if (resetButton) resetButton.addEventListener("click", startOverAndRefresh);
    if (detailsButton) detailsButton.addEventListener("click", function () {
      if (startScreen && typeof startScreen.openForEdit === "function") {
        startScreen.openForEdit(currentProjectDetailsSettings());
      }
    });
    if (saveButton) saveButton.addEventListener("click", saveProjectFile);
    if (pdfButton) {
      pdfButton.addEventListener("click", isTouchShareDevice() ? openPdfOrPrintOnTouchDevice : savePdfFile);
    }
    if (printButton) printButton.addEventListener("click", printScore);

    // 0.17.6.33 · Tabletilla PDF ja Tulosta käyttävät samaa A4-PDF:n
    // toimintovalikkoa, joten näytetään vain yksi yhteinen painike.
    updateTabletPdfPrintButton();

    updateHistoryButtons();
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
    const measureCount = window.PikakirjoitinMusicXML.getMeasureCount(score);
    window.PikakirjoitinScoreModel.cleanupBarlines(score, measureCount);
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
      if (barlineEditor && barlineEditor.isActive()) barlineEditor.refresh();
      return osmd;
    });

    return rendering;
  }

  function displayPitch(pitch) {
    return I18N.displayPitch(pitch);
  }

  function dotWord(dots) {
    if (dots === 2) return I18N.t("doubleDotted");
    if (dots === 1) return I18N.t("dotted");
    return "";
  }

  function entryLabel(entry, pitch, duration) {
    const dots = entry ? Number(entry.dots) || 0 : 0;
    const label = durationLabels[duration] || duration;

    if (entry && entry.kind === "rest") {
      if (entry.measureRest) return I18N.t("wholeMeasureRest");
      return dotWord(dots) + label + I18N.t("restSuffix");
    }

    return displayPitch((entry && entry.pitch) || pitch || "") + " " + dotWord(dots) + label;
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

      const undoSnapshot = historySnapshot("Slur");
      if (window.PikakirjoitinScoreModel.addSlur(score, startId, nextId)) {
        commitHistory(undoSnapshot);
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

  function keyAwareInputPitch(midi, fallbackPitch) {
    const spelled = window.PikakirjoitinScoreModel.spellMidiForKey(
      midi,
      Number.isInteger(score.key) ? score.key : 0
    );
    return spelled || fallbackPitch;
  }

  function startEntry(midi, pitch, duration) {
    const dots = thumbState.dots || 0;
    const writtenPitch = keyAwareInputPitch(midi, pitch);
    const selected = selectedSingleNote();
    commitHistory(historySnapshot(selected ? "Nuotin muokkaus" : "Nuotin kirjoitus"));

    if (selected) {
      // 0.17.6.25: kun yksi nuotti on valittuna, koskettimisto siirtyy
      // nimenomaan tämän nuotin muokkaustilaan. Sama kosketusele kuin
      // kirjoittaessa määrää sekä uuden sävelkorkeuden että aika-arvon:
      // napautus = 1/4, alas = 1/8, ylös = 1/2, oikealle = 1/16,
      // vasemmalle = 1/32 ja pitkä painallus = 1/1.
      // sourceId ei vaihdu, joten valinta voidaan pitää varmasti kiinni
      // samassa nuotissa myös OSMD:n uudelleenrenderöinnin yli.
      const editId = selected.id;
      keyboardEditId = editId;

      if (thumbState.rest) {
        window.PikakirjoitinScoreModel.updateEntry(score, editId, {
          kind: "rest",
          duration: duration,
          dots: dots,
          measureRest: duration === "whole" && dots === 0
        });
      } else {
        window.PikakirjoitinScoreModel.updateEntry(score, editId, {
          kind: "note",
          pitch: writtenPitch,
          duration: duration,
          dots: dots,
          measureRest: false
        });
      }

      const edited = window.PikakirjoitinScoreModel.getEntry(score, editId);
      noteInputMeta.set(editId, {
        fromEdit: true,
        startedWithSlur: Boolean(thumbState.slur)
      });

      // Pidä valinta päällä heti, eikä vasta renderöinnin valmistuttua.
      // Tämä estää kelluvan palkin välähdyksen pois ja ennen kaikkea
      // varmistaa, että saman eleen duration-vaihe muokkaa samaa nuottia.
      if (selection) selection.retainSingle(editId);

      updateStatus(entryLabel(edited, writtenPitch, duration) + " · muokataan…");

      renderScore().then(function () {
        if (selection && keyboardEditId === editId) {
          selection.retainSingle(editId);
        }
      }).catch(function (error) {
        console.error(error);
        updateStatus("Virhe: " + (error && error.message ? error.message : String(error)), "error");
      });

      return { id: editId, sound: edited && edited.kind !== "rest" };
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
          pitch: writtenPitch,
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

    updateStatus(entryLabel(entry, writtenPitch, duration) + " · ele kesken…");

    renderScore().catch(function (error) {
      console.error(error);
      updateStatus("Virhe: " + (error && error.message ? error.message : String(error)), "error");
    });

    return { id: entry.id, sound: entry.kind !== "rest" };
  }

  function changeDuration(id, duration, midi, pitch) {
    const targetId = keyboardEditId || id;
    const editingSelectedNote = Boolean(keyboardEditId);

    if (!window.PikakirjoitinScoreModel.setDuration(score, targetId, duration)) {
      return;
    }

    const entry = window.PikakirjoitinScoreModel.getEntry(score, targetId);
    updateStatus(entryLabel(entry, pitch, duration) + " · aika-arvo muutettu");

    // Eleen aikana OSMD voi renderöityä useamman kerran. Valitun nuotin
    // muokkaustilassa valinta lukitaan aina takaisin samaan sourceId:hen.
    if (editingSelectedNote && selection) {
      selection.retainSingle(targetId);
    }

    renderScore().then(function () {
      if (editingSelectedNote && selection && keyboardEditId === targetId) {
        selection.retainSingle(targetId);
      }
    }).catch(function (error) {
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
    if (state.rest) parts.push(I18N.t("rest"));
    if (state.dots === 1) parts.push(I18N.t("oneDot"));
    if (state.dots === 2) parts.push(I18N.t("twoDots"));
    if (state.slur) parts.push("Slur");
    return parts.length ? parts.join(" + ") + " " + I18N.t("heldHint") : "";
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

    score.metadata.title = settings.title || I18N.t("appName");
    score.metadata.partName = settings.instrumentName || I18N.t("flute");
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


  function currentProjectDetailsSettings() {
    const next = Object.assign({}, settings);
    const metadata = score.metadata || {};

    next.title = metadata.title || settings.title || "";
    next.composer = metadata.composer || settings.composer || "";
    next.instrumentName = metadata.partName || settings.instrumentName || "";
    next.tempoText = metadata.tempoText || settings.tempoText || "";
    next.keySignature = Number.isInteger(score.key) ? score.key : (Number(settings.keySignature) || 0);
    next.pickupDuration = Number(score.pickupDuration) || 0;

    if (score.timeSymbol === "common") next.timeSignature = "C";
    else if (score.timeSymbol === "cut") next.timeSignature = "cutC";
    else if (Array.isArray(score.time) && score.time.length >= 2) next.timeSignature = score.time[0] + "/" + score.time[1];

    if (score.clef === "C") next.clef = "alto";
    else if (score.clef === "F") next.clef = "bass";
    else next.clef = "treble";

    return next;
  }

  async function updateProjectDetails(nextSettings) {
    const snapshot = historySnapshot("Kappaleen tiedot");
    await applyStartSettings(nextSettings);
    commitHistory(snapshot);
    updateStatus(
      I18N.getLanguage() === "en" ? "Score details updated." : "Kappaleen tiedot päivitetty.",
      "ok"
    );
  }

  async function openProjectPayload(payload, meta) {
    const normalized = window.PikakirjoitinRecentProjects.normalizePayload(payload);
    if (normalized.settings && normalized.settings.language) {
      I18N.setLanguage(normalized.settings.language);
    }

    replaceScoreState(normalized.score);
    settings = Object.assign({ transpose: 0, keyboardStartMidi: 60 }, clonePlain(normalized.settings || {}));
    currentProjectId = String((meta && meta.recentId) || normalized.projectId || window.PikakirjoitinRecentProjects.makeId());
    normalized.projectId = currentProjectId;

    undoStack.length = 0;
    redoStack.length = 0;
    keyboardEditId = null;
    pendingSelectedSlurStartId = null;
    noteInputMeta.clear();
    if (selection) selection.clear();
    updateHistoryButtons();

    await renderScore();
    requestAnimationFrame(function () {
      if (keyboard) keyboard.scrollToMidi(Number(settings.keyboardStartMidi) || 60);
    });

    if (meta && meta.fromFile) {
      const record = await window.PikakirjoitinRecentProjects.save(currentProjectPayload());
      currentProjectId = record.id;
      document.dispatchEvent(new CustomEvent("pk-recentschanged"));
    }

    updateStatus("Projekti avattu.", "ok");
  }

  function slurChoiceLabel(slur) {
    const start = window.PikakirjoitinScoreModel.getEntry(score, slur.startId);
    const end = window.PikakirjoitinScoreModel.getEntry(score, slur.endId);

    const startName = start && start.pitch ? displayPitch(start.pitch) : I18N.t("startName");
    const endName = end && end.pitch ? displayPitch(end.pitch) : I18N.t("endName");

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

    const undoSnapshot = historySnapshot("Slur");
    if (window.PikakirjoitinScoreModel.removeSlurById(score, slurId)) {
      commitHistory(undoSnapshot);
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

  function setupBarlineEditor() {
    barlineEditor = new window.PikakirjoitinBarlineEditor.BarlineEditor({
      overlay: document.getElementById("barlineEditorOverlay"),
      paper: document.getElementById("a4Paper"),
      container: document.getElementById("osmd-container"),

      getMeasureLayout: function () {
        return window.PikakirjoitinRenderer.getMeasureLayout();
      },

      getMeasureCount: function () {
        return window.PikakirjoitinMusicXML.getMeasureCount(score);
      },

      getBarlineType: function (boundaryIndex) {
        const count = window.PikakirjoitinMusicXML.getMeasureCount(score);
        return window.PikakirjoitinScoreModel.getBarlineType(
          score,
          boundaryIndex,
          count
        );
      },

      onSetBarline: function (boundaryIndex, type) {
        const count = window.PikakirjoitinMusicXML.getMeasureCount(score);
        const undoSnapshot = historySnapshot("Tahtiviiva");
        const changed = window.PikakirjoitinScoreModel.setBarlineType(
          score,
          boundaryIndex,
          type,
          count
        );
        if (!changed) return;
        commitHistory(undoSnapshot);
        renderScore().then(function () {
          const labels = {
            normal:"Tavallinen tahtiviiva",
            double:"Kaksoisviiva",
            final:"Loppuviiva",
            "repeat-start":"Kertauksen alku",
            "repeat-end":"Kertauksen loppu",
            "repeat-both":"Kertaus molempiin suuntiin"
          };
          updateStatus((labels[type] || "Tahtiviiva") + " asetettu.", "ok");
        }).catch(function (error) {
          console.error(error);
          updateStatus(
            "Virhe: " + (error && error.message ? error.message : String(error)),
            "error"
          );
        });
      }
    });
  }

  function getLastSystemFillGeometry() {
    if (!window.PikakirjoitinRenderer) return null;

    const measures = window.PikakirjoitinRenderer
      .getMeasureLayout()
      .filter(Boolean);

    if (!measures.length) return null;

    const lastMeasure = measures[measures.length - 1];
    const sameLine = measures.filter(function (measure) {
      return Math.abs(
        Number(measure.systemTop) - Number(lastMeasure.systemTop)
      ) < 4;
    });

    if (!sameLine.length) return null;

    const paper = document.getElementById("a4Paper");
    const container = document.getElementById("osmd-container");
    if (!paper || !container) return null;

    const paperRect = paper.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const offsetX = containerRect.left - paperRect.left;

    const lineStart = offsetX + Math.min.apply(
      null,
      sameLine.map(function (measure) { return Number(measure.startX); })
    );

    const lineEnd = offsetX + Math.max.apply(
      null,
      sameLine.map(function (measure) { return Number(measure.endX); })
    );

    if (!Number.isFinite(lineStart) || !Number.isFinite(lineEnd)) {
      return null;
    }

    return {
      lineStart: lineStart,
      lineEnd: lineEnd,
      targetEnd: Math.max(lineStart + 80, paperRect.width - 18)
    };
  }

  async function maximizeLastSystemToRightMargin() {
    const ScoreModel = window.PikakirjoitinScoreModel;
    const Renderer = window.PikakirjoitinRenderer;
    if (!ScoreModel || !Renderer) return;

    const previousFactor = ScoreModel
      .getLastSystemMaxScalingFactor(score);
    const undoSnapshot = historySnapshot("Viimeisen rivin leveys");

    const MAX_AUTO_FACTOR = 24;
    const TARGET_TOLERANCE_PX = 2.5;
    const MAX_CORRECTIONS = 6;

    let factor = Number(previousFactor) || 1.4;
    let changed = false;

    try {
      for (let pass = 0; pass < MAX_CORRECTIONS; pass += 1) {
        const geometry = getLastSystemFillGeometry();
        if (!geometry) break;

        const gap = geometry.targetEnd - geometry.lineEnd;
        if (Math.abs(gap) <= TARGET_TOLERANCE_PX) break;

        const currentWidth = Math.max(80, geometry.lineEnd - geometry.lineStart);
        const targetWidth = Math.max(80, geometry.targetEnd - geometry.lineStart);

        let nextFactor = factor * (targetWidth / currentWidth);
        nextFactor = Math.max(1, Math.min(MAX_AUTO_FACTOR, nextFactor));

        // Jos OSMD:n vaste on hyvin loiva, pakotetaan pieni etenemä ettei
        // korjaussilmukka jämähdä lähes samaan arvoon.
        if (gap > TARGET_TOLERANCE_PX && nextFactor <= factor + 0.002) {
          nextFactor = Math.min(MAX_AUTO_FACTOR, factor * 1.03);
        }

        if (Math.abs(nextFactor - factor) < 0.0005) break;

        ScoreModel.setLastSystemMaxScalingFactor(score, nextFactor);
        factor = ScoreModel.getLastSystemMaxScalingFactor(score);
        changed = Math.abs(Number(factor) - Number(previousFactor)) > 0.001;

        await Renderer.rerenderLayout(score.layout, "layout");
      }

      if (changed) {
        commitHistory(undoSnapshot);
      }

      refreshSelectionFromRenderedScore();
      if (layoutEditor) layoutEditor.refresh();

      updateStatus(
        "Viimeinen rivi venytetty oikeaan marginaaliin.",
        "ok"
      );
    } catch (error) {
      console.error(error);
      ScoreModel.setLastSystemMaxScalingFactor(score, previousFactor);
      try {
        await Renderer.rerenderLayout(score.layout, "layout");
      } catch (restoreError) {
        console.error(restoreError);
      }
      updateStatus(
        "Virhe: " + (error && error.message ? error.message : String(error)),
        "error"
      );
      throw error;
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
            const undoSnapshot = historySnapshot("Rivinvaihto");
            const active =
              window.PikakirjoitinScoreModel
                .toggleSystemBreak(
                  score,
                  startMeasureIndex
                );
            commitHistory(undoSnapshot);

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

          onLastSystemMaximize: function () {
            return maximizeLastSystemToRightMargin();
          },

          onLastSystemFactorCommit: function (factor) {
            const previousFactor = window.PikakirjoitinScoreModel
              .getLastSystemMaxScalingFactor(score);
            const undoSnapshot = historySnapshot("Viimeisen rivin leveys");

            window.PikakirjoitinScoreModel
              .setLastSystemMaxScalingFactor(
                score,
                factor
              );

            if (
              Math.abs(
                Number(window.PikakirjoitinScoreModel.getLastSystemMaxScalingFactor(score)) -
                Number(previousFactor)
              ) > 0.001
            ) {
              commitHistory(undoSnapshot);
            }

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
        const undoSnapshot = historySnapshot("Enharmoninen");
        if (window.PikakirjoitinScoreModel.toggleEnharmonic(score, note.id)) {
          commitHistory(undoSnapshot);
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
        const undoSnapshot = historySnapshot("Slur");
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

        commitHistory(undoSnapshot);
        renderScore().then(function () {
          selection.retainIds(ids);
          updateStatus(
            result.active
              ? (result.replacedCount
                  ? "Aiemmat valinta-alueen slurit korvattu uudella slurilla."
                  : "Slur lisätty valituille nuoteille.")
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


      onStemDirection: function (direction) {
        const ids = selectedIds();
        if (!ids.length) return;
        const model = window.PikakirjoitinScoreModel;
        if (!model.canSetStemDirectionForSelection(score, ids)) return;

        const nextDirection = direction === "up" || direction === "down" ? direction : "auto";
        const undoSnapshot = historySnapshot("Varren suunta");
        if (!model.setStemDirectionForSelection(score, ids, nextDirection)) return;
        commitHistory(undoSnapshot);

        renderScore().then(function () {
          selection.retainIds(ids);
          updateStatus(
            nextDirection === "up"
              ? "Varsi pakotettu ylös."
              : nextDirection === "down"
                ? "Varsi pakotettu alas."
                : "Varren suunta palautettu automaattiseksi.",
            "ok"
          );
        }).catch(function (error) {
          console.error(error);
          updateStatus("Virhe: " + (error && error.message ? error.message : String(error)), "error");
        });
      },

      onSlurPlacement: function (placement) {
        const ids = selectedIds();
        if (!ids.length) return;
        const model = window.PikakirjoitinScoreModel;
        const target = model.slurForDirectionSelection(score, ids);
        if (!target) {
          updateStatus("Slurin suunta vaatii yhden yksiselitteisen slurin.", "error");
          return;
        }

        const nextPlacement = placement === "above" || placement === "below" ? placement : "auto";
        const undoSnapshot = historySnapshot("Slurin suunta");
        if (!model.setSlurPlacement(score, target.id, nextPlacement)) return;
        commitHistory(undoSnapshot);

        renderScore().then(function () {
          selection.retainIds(ids);
          updateStatus(
            nextPlacement === "above"
              ? "Slur pakotettu nuottien yläpuolelle."
              : nextPlacement === "below"
                ? "Slur pakotettu nuottien alapuolelle."
                : "Slurin suunta palautettu automaattiseksi.",
            "ok"
          );
        }).catch(function (error) {
          console.error(error);
          updateStatus("Virhe: " + (error && error.message ? error.message : String(error)), "error");
        });
      },

      onBeam: function () {
        const ids = selectedIds();
        if (!ids.length) return;

        const single = ids.length === 1;
        const undoSnapshot = historySnapshot(single ? "Palkinkatko" : "Palkitus");
        const result = single
          ? window.PikakirjoitinScoreModel.breakBeamBefore(score, ids[0])
          : window.PikakirjoitinScoreModel.joinEighthSelection(score, ids);

        if (!result.changed) {
          updateStatus(
            single
              ? "Valitun nuotin edellä ei ole katkaistavaa palkkia."
              : "Yhdistäminen vaatii vähintään kaksi peräkkäistä 1/8-nuottia samassa tahdissa.",
            "error"
          );
          return;
        }

        commitHistory(undoSnapshot);
        renderScore().then(function () {
          if (single) selection.retainSingle(ids[0]);
          else selection.retainIds(ids);
          updateStatus(
            single ? "Palkki katkaistu ennen valittua nuottia." : "Valitut 1/8-nuotit yhdistetty samaan palkkiin.",
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

      onArticulation: function (articulation) {
        const ids = selectedIds();
        if (!ids.length) return;

        const label = {
          accent: I18N.t("accent"),
          staccato: I18N.t("staccato"),
          marcato: I18N.t("marcato"),
          tenuto: I18N.t("tenuto")
        }[articulation] || articulation;

        const undoSnapshot = historySnapshot(label);
        const result = window.PikakirjoitinScoreModel
          .toggleArticulationForSelection(score, ids, articulation);

        if (!result.changed) return;
        commitHistory(undoSnapshot);

        renderScore().then(function () {
          selection.retainIds(ids);
          updateStatus(
            label + (result.active ? " lisätty." : " poistettu."),
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

      onRest: function () {
        const ids = selectedIds();
        if (!ids.length) return;

        const undoSnapshot = historySnapshot("Tauoksi muuttaminen");
        const result = window.PikakirjoitinScoreModel.convertSelectionToRests(score, ids);
        if (!result.changed) return;
        commitHistory(undoSnapshot);

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
        const undoSnapshot = historySnapshot("Poisto");
        if (window.PikakirjoitinScoreModel.deleteEntries(score, ids)) {
          commitHistory(undoSnapshot);
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

      const slurDirectionTarget =
        window.PikakirjoitinScoreModel.slurForDirectionSelection(score, ids);

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
        canStemDirection: window.PikakirjoitinScoreModel.canSetStemDirectionForSelection(score, ids),
        stemDirection: window.PikakirjoitinScoreModel.stemDirectionForSelection(score, ids),
        canSlurPlacement: Boolean(slurDirectionTarget),
        slurPlacement: slurDirectionTarget
          ? window.PikakirjoitinScoreModel.getSlurPlacement(score, slurDirectionTarget.id)
          : "auto",
        slurChoices: singleSlurChoices,
        canSlur:
          state.count === 1
            ? singleSlurChoices.length > 0
            : canCreateMultiSlur,
        slurActive:
          state.count === 1
            ? singleSlurChoices.length > 0
            : window.PikakirjoitinScoreModel.hasSlurForSelection(score, ids),
        beamMode:
          state.count === 1 && window.PikakirjoitinScoreModel.canBreakBeamBefore(score, ids[0])
            ? "break"
            : state.count >= 2 && window.PikakirjoitinScoreModel.canJoinEighthSelection(score, ids)
              ? "join"
              : "",
        canArticulate: window.PikakirjoitinScoreModel.canArticulateSelection(score, ids),
        articulations: {
          accent: window.PikakirjoitinScoreModel.hasArticulationForSelection(score, ids, "accent"),
          staccato: window.PikakirjoitinScoreModel.hasArticulationForSelection(score, ids, "staccato"),
          marcato: window.PikakirjoitinScoreModel.hasArticulationForSelection(score, ids, "marcato"),
          tenuto: window.PikakirjoitinScoreModel.hasArticulationForSelection(score, ids, "tenuto")
        }
      });
    });
  }

  function start() {
    setupHistoryControls();
    setupMusicStandMode();
    setupLayoutSettings();
    setupSelection();
    setupSystemLayoutEditor();
    setupBarlineEditor();

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
          if (barlineEditor && barlineEditor.isActive()) barlineEditor.refresh();
        }
      });
    }

    thumbRail = new window.PikakirjoitinThumbRail.ThumbRail({
      rail: document.getElementById("thumbRail"),
      boundsElement: document.querySelector(".score-card"),
      onChange: function (state) {
        const wasLayout = Boolean(thumbState.layout);
        const wasBarlines = Boolean(thumbState.barlines);
        const wasTie = Boolean(thumbState.tie);
        thumbState = state;

        let editModeChanged = false;
        const layoutActive = Boolean(state.layout);
        const barlinesActive = Boolean(state.barlines);

        if (layoutEditor && layoutActive !== wasLayout) {
          layoutEditor.setActive(layoutActive);
          editModeChanged = true;
        }

        if (barlineEditor && barlinesActive !== wasBarlines) {
          barlineEditor.setActive(barlinesActive);
          editModeChanged = true;
        }

        // Rivinvaihto- ja tahtiviivamuokkaus ovat varsinaisia editointitiloja.
        // Kun jompikumpi on aktiivinen, nuottien napautus, pyyhkäisyvalinta
        // ja kelluva nuottipalkki ovat kokonaan pois käytöstä. Yhtenäinen
        // lukko estää myös sen, että vaihto tahtiviivoista rivinvaihtoon ehtisi
        // hetkeksi kytkeä nuottivalinnan takaisin päälle.
        const scoreSelectionEnabled = !(layoutActive || barlinesActive);
        if (selection && typeof selection.setEnabled === "function") {
          selection.setEnabled(scoreSelectionEnabled);
        } else if (!scoreSelectionEnabled && selection) {
          selection.clear();
        }

        if (!scoreSelectionEnabled && selectionEditor) {
          selectionEditor.update({ visible:false });
          lastSelectionEditorAnchor = null;
        }

        if (editModeChanged) {
          updateStatus(
            state.barlines
              ? "Tahtiviivojen muokkaus päällä · valitse tahtiviivan yläpuolelta +."
              : state.layout
                ? "Rivien muokkaus päällä."
                : "Muokkaustila pois.",
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

    document.addEventListener("pk-project-ui-ready", function () {
      const activeElement = document.activeElement;
      if (activeElement && activeElement !== document.body && typeof activeElement.blur === "function") {
        activeElement.blur();
      }
      if (!keyboard) return;
      if (typeof keyboard.rearmAfterProjectOpen === "function") {
        keyboard.rearmAfterProjectOpen();
      } else if (typeof keyboard.resetInteractionState === "function") {
        keyboard.resetInteractionState();
      }
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (!keyboard) return;
          keyboard.scrollToMidi(Number(settings.keyboardStartMidi) || 60);
        });
      });
    });

    // 0.17.6.17: Rivinvaihto- ja tahtiviivatilan voi sulkea myös
    // napauttamalla mitä tahansa tavallista kohtaa nuottisivulla.
    // Muokkaustilan omat ohjaimet jätetään rauhaan, jotta + -merkin,
    // tahtiviivavalikon tai viimeisen rivin venytyskahvan käyttö ei
    // sulje tilaa kesken varsinaisen toiminnon.
    const scorePaper = document.getElementById("a4Paper");
    if (scorePaper) {
      scorePaper.addEventListener("click", function (event) {
        if (!thumbRail) return;

        const target = event.target instanceof Element ? event.target : null;
        if (
          target &&
          target.closest(
            ".system-break-marker, " +
            ".last-system-stretch-handle, " +
            ".barline-marker, " +
            ".barline-choice, " +
            ".barline-choice-popover"
          )
        ) {
          return;
        }

        const state = thumbRail.state;
        if (state.barlines) {
          thumbRail.setToggle("barlines", false);
        } else if (state.layout) {
          thumbRail.setToggle("layout", false);
        }
      });
    }

    renderScore().catch(function (error) {
      console.error(error);
      updateStatus("Virhe: " + (error && error.message ? error.message : String(error)), "error");
    });

    startScreen = new window.PikakirjoitinStartScreen.StartScreen({
      audio: audio,
      onStart: applyStartSettings,
      onUpdate: updateProjectDetails,
      onOpenProject: openProjectPayload
    });
  }

  document.addEventListener("pk-languagechange", function () {
    settings.language = I18N.getLanguage();
    updateTabletPdfPrintButton();
    const status = document.getElementById("status");
    if (status && status.dataset.rawMessage) {
      status.textContent = I18N.translateRuntimeMessage(status.dataset.rawMessage);
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
