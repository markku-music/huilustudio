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
  let lastLayoutOptions = {
    systemBreaks: [],
    lastSystemMaxScalingFactor: 1.4
  };

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

        renderMusicXML(lastMusicXML, lastContainerId, "resize", lastLayoutOptions).catch(function (error) {
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
      newSystemFromXML: true,
      stretchLastSystemLine: false,
      autoGenerateMultipleRestMeasuresFromRestMeasures: false
    });

    watchPaperWidth();
  }

  function normalizeLayoutOptions(layout) {
    const source = layout || {};
    let factor = Number(source.lastSystemMaxScalingFactor);
    if (!Number.isFinite(factor)) factor = 1.4;

    return {
      systemBreaks: Array.isArray(source.systemBreaks)
        ? source.systemBreaks.slice()
        : [],
      lastSystemMaxScalingFactor:
        Math.max(1, Math.min(6, factor))
    };
  }

  function applyLayoutRules(layout) {
    if (!osmd || !osmd.EngravingRules) return;

    const normalized = normalizeLayoutOptions(layout);
    lastLayoutOptions = normalized;

    osmd.EngravingRules.NewSystemAtXMLNewSystemAttribute = true;
    osmd.EngravingRules.StretchLastSystemLine = false;
    osmd.EngravingRules.LastSystemMaxScalingFactor =
      normalized.lastSystemMaxScalingFactor;
  }

  function finite(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function getMeasureLayout() {
    if (!osmd || !osmd.GraphicSheet || !container) return [];

    const list = osmd.GraphicSheet.MeasureList || [];
    const unitPixels = 10 * currentZoom;

    // OSMD:n SVG voi olla CSS:llä skaalattu. Kalibroidaan GraphicalMusicSheet-
    // koordinaatit todelliseen ruutukoordinaattiin SVG:n viewBoxin avulla.
    const svg = container.querySelector("svg");
    const containerRect = container.getBoundingClientRect();
    let offsetX = 0;
    let offsetY = 0;
    let cssScaleX = 1;
    let cssScaleY = 1;

    if (svg) {
      const svgRect = svg.getBoundingClientRect();
      offsetX = svgRect.left - containerRect.left;
      offsetY = svgRect.top - containerRect.top;

      const viewBox = svg.viewBox && svg.viewBox.baseVal;
      const baseWidth =
        viewBox && viewBox.width
          ? viewBox.width
          : parseFloat(svg.getAttribute("width")) || svgRect.width;
      const baseHeight =
        viewBox && viewBox.height
          ? viewBox.height
          : parseFloat(svg.getAttribute("height")) || svgRect.height;

      if (baseWidth > 0) cssScaleX = svgRect.width / baseWidth;
      if (baseHeight > 0) cssScaleY = svgRect.height / baseHeight;
    }

    function pxX(unitValue) {
      return offsetX + unitValue * unitPixels * cssScaleX;
    }

    function pxY(unitValue) {
      return offsetY + unitValue * unitPixels * cssScaleY;
    }

    return list.map(function (staffMeasures, measureIndex) {
      if (!Array.isArray(staffMeasures)) return null;

      const measure = staffMeasures.find(function (item) {
        return Boolean(item);
      });

      if (!measure || !measure.PositionAndShape) return null;

      const box = measure.PositionAndShape;
      const absolute = box.AbsolutePosition || { x:0, y:0 };
      const borderLeft = finite(box.BorderLeft, 0);
      const borderRight = finite(
        box.BorderRight,
        box.Size ? finite(box.Size.width, 0) : 0
      );

      const staffLine = measure.ParentStaffLine;
      const staffBox = staffLine && staffLine.PositionAndShape;
      const staffAbsolute =
        staffBox && staffBox.AbsolutePosition
          ? staffBox.AbsolutePosition
          : absolute;

      const staffTopUnits =
        finite(staffAbsolute.y, 0) +
        (staffBox ? finite(staffBox.BorderTop, 0) : 0);

      const staffBottomUnits =
        finite(staffAbsolute.y, 0) +
        (staffBox ? finite(staffBox.BorderBottom, 4) : 4);

      const system = measure.ParentMusicSystem;
      const systemBox = system && system.PositionAndShape;
      const systemAbsolute =
        systemBox && systemBox.AbsolutePosition
          ? systemBox.AbsolutePosition
          : staffAbsolute;

      return {
        measureIndex: measureIndex,
        startX: pxX(finite(absolute.x, 0) + borderLeft),
        endX: pxX(finite(absolute.x, 0) + borderRight),
        staffTop: pxY(staffTopUnits),
        staffBottom: pxY(staffBottomUnits),
        systemTop: pxY(finite(systemAbsolute.y, staffAbsolute.y))
      };
    });
  }

  async function performRender(
    musicXML,
    containerId,
    reason,
    layoutOptions
  ) {
    ensureOSMD(containerId);
    lastMusicXML = musicXML;
    lastContainerId = containerId;
    lastLayoutOptions =
      normalizeLayoutOptions(layoutOptions || lastLayoutOptions);

    await osmd.load(musicXML);

    // OSMD load() palauttaa Zoom-arvon yhteen. P2:n tavoin zoom asetetaan
    // vasta loadin jälkeen ennen varsinaista renderöintiä.
    applyOrientationZoom();
    applyLayoutRules(lastLayoutOptions);

    await osmd.render();
    lastObservedPaperWidth = paperWidth();
    notifyRendered(reason);
    return osmd;
  }

  function renderMusicXML(
    musicXML,
    containerId,
    reason,
    layoutOptions
  ) {
    const xml = String(musicXML || "");
    const id = String(containerId || "");
    const nextLayout =
      normalizeLayoutOptions(layoutOptions || lastLayoutOptions);

    // Kevyt jono estää ResizeObserverin ja editoinnin yhtäaikaiset renderit.
    rendering = rendering.then(function () {
      return performRender(
        xml,
        id,
        reason || "score",
        nextLayout
      );
    });

    return rendering;
  }

  function rerenderLayout(layoutOptions, reason) {
    const nextLayout =
      normalizeLayoutOptions(layoutOptions || lastLayoutOptions);

    rendering = rendering.then(async function () {
      if (!osmd) return null;

      applyLayoutRules(nextLayout);
      await osmd.render();
      lastObservedPaperWidth = paperWidth();
      notifyRendered(reason || "layout");
      return osmd;
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
    rerenderLayout: rerenderLayout,
    getMeasureLayout: getMeasureLayout,
    subscribeRendered: subscribeRendered,
    getLayoutState: getLayoutState
  };
})();
