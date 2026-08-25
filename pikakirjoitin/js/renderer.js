(function () {
  "use strict";

  let osmd = null;
  let container = null;
  let paper = null;
  let lastMusicXML = "";
  let lastContainerId = "";
  let rendering = Promise.resolve();

  let resizeObserver = null;
  let resizeTimer = 0;
  let lastObservedPaperWidth = 0;

  let portraitReferenceWidth = 0;
  let currentZoom = 1;

  const renderedListeners = new Set();

  function viewportSize() {
    const viewport = window.visualViewport;
    return {
      width: Number(viewport && viewport.width || window.innerWidth || 0),
      height: Number(viewport && viewport.height || window.innerHeight || 0)
    };
  }

  function isPortraitViewport() {
    const size = viewportSize();
    return !size.width || !size.height || size.height >= size.width;
  }

  function paperWidth() {
    const target = paper || container;
    return Math.max(
      1,
      Number(
        target && (
          target.getBoundingClientRect().width ||
          target.clientWidth ||
          target.offsetWidth
        )
      ) || 1
    );
  }

  function portraitWidthEstimate(currentPaperWidth) {
    if (portraitReferenceWidth > 0) return portraitReferenceWidth;

    // Sama periaate kuin Pikakirjoitin 2:ssa: jos appi avataan suoraan
    // vaakatasoon, arvioi saman laitteen portrait-leveys lyhyemmästä sivusta.
    const size = viewportSize();
    const viewportWidth = Math.max(1, size.width || currentPaperWidth);
    const viewportHeight = Math.max(1, size.height || viewportWidth);
    const portraitViewportWidth = Math.min(viewportWidth, viewportHeight);

    return Math.max(
      1,
      currentPaperWidth * portraitViewportWidth / viewportWidth
    );
  }

  function applyOrientationZoom() {
    const width = paperWidth();

    if (isPortraitViewport()) {
      // Portrait on nuottikoon referenssi, aivan kuten P2:ssa.
      portraitReferenceWidth = width;
      currentZoom = 1;
    } else {
      const referenceWidth = portraitWidthEstimate(width);

      // Landscape skaalataan samassa suhteessa kuin paperi leveni portraitiin
      // nähden. Näin nuottirivien suhteellinen koko paperiin säilyy.
      currentZoom = Math.max(
        1,
        Math.min(1.6, width / Math.max(1, referenceWidth))
      );
    }

    osmd.Zoom = currentZoom;
  }

  function notifyRendered(reason) {
    const snapshot = {
      reason: reason || "render",
      zoom: currentZoom,
      paperWidth: paperWidth(),
      portraitReferenceWidth: portraitReferenceWidth,
      portrait: isPortraitViewport()
    };

    renderedListeners.forEach(function (listener) {
      try { listener(snapshot); }
      catch (error) { console.error("Renderer-listener epäonnistui:", error); }
    });
  }

  function watchPaperWidth() {
    if (resizeObserver || !paper || !("ResizeObserver" in window)) return;

    lastObservedPaperWidth = paperWidth();

    resizeObserver = new ResizeObserver(function (entries) {
      const width = Number(
        entries[0] && entries[0].contentRect && entries[0].contentRect.width
      ) || paperWidth();

      if (!width || Math.abs(width - lastObservedPaperWidth) < 1) return;

      lastObservedPaperWidth = width;
      window.clearTimeout(resizeTimer);

      // Sama 80 ms debounce kuin P2:ssa.
      resizeTimer = window.setTimeout(function () {
        if (!lastMusicXML || !lastContainerId) return;

        renderMusicXML(lastMusicXML, lastContainerId, "resize").catch(function (error) {
          console.error("Nuottikuvan resize-renderöinti epäonnistui:", error);
        });
      }, 80);
    });

    resizeObserver.observe(paper);
  }

  function ensureOSMD(containerId) {
    if (!window.opensheetmusicdisplay || !window.opensheetmusicdisplay.OpenSheetMusicDisplay) {
      throw new Error("OSMD-kirjastoa ei löytynyt.");
    }

    const nextContainer = document.getElementById(containerId);
    if (!nextContainer) throw new Error("OSMD-konttia ei löytynyt: " + containerId);
    if (osmd && container === nextContainer) return;

    container = nextContainer;
    // P3:ssa sivun leveysreferenssi on varsinainen A4-paperi.
    paper = container.closest(".a4-paper") || container;

    osmd = new window.opensheetmusicdisplay.OpenSheetMusicDisplay(containerId, {
      // P2:n toimiva ratkaisu: orientaation resize hoidetaan itse.
      autoResize: false,
      backend: "svg",
      drawingParameters: "default",
      drawTitle: true,
      drawComposer: true,
      autoBeam: true,
      autoGenerateMultipleRestMeasuresFromRestMeasures: false
    });

    watchPaperWidth();
  }

  async function performRender(musicXML, containerId, reason) {
    ensureOSMD(containerId);
    lastMusicXML = musicXML;
    lastContainerId = containerId;

    await osmd.load(musicXML);

    // OSMD load() palauttaa Zoom-arvon yhteen. P2:n tavoin zoom asetetaan
    // vasta loadin jälkeen ennen varsinaista renderöintiä.
    applyOrientationZoom();

    await osmd.render();
    lastObservedPaperWidth = paperWidth();
    notifyRendered(reason);
    return osmd;
  }

  function renderMusicXML(musicXML, containerId, reason) {
    const xml = String(musicXML || "");
    const id = String(containerId || "");

    // Kevyt jono estää ResizeObserverin ja editoinnin yhtäaikaiset renderit.
    rendering = rendering.then(function () {
      return performRender(xml, id, reason || "score");
    });

    return rendering;
  }

  function subscribeRendered(listener) {
    if (typeof listener !== "function") return function () {};
    renderedListeners.add(listener);
    return function () { renderedListeners.delete(listener); };
  }

  function getLayoutState() {
    return {
      zoom: currentZoom,
      paperWidth: paperWidth(),
      portraitReferenceWidth: portraitReferenceWidth,
      portrait: isPortraitViewport(),
      autoResize: false
    };
  }

  window.PikakirjoitinRenderer = {
    renderMusicXML: renderMusicXML,
    subscribeRendered: subscribeRendered,
    getLayoutState: getLayoutState
  };
})();
