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

  function rectCenterY(rect) {
    return rect.top + rect.height / 2;
  }

  function unionWidth(intervals) {
    if (!intervals.length) return 0;

    const sorted = intervals
      .map(function (pair) {
        return pair[0] <= pair[1]
          ? [pair[0], pair[1]]
          : [pair[1], pair[0]];
      })
      .sort(function (a, b) { return a[0] - b[0]; });

    let total = 0;
    let start = sorted[0][0];
    let end = sorted[0][1];

    for (let i = 1; i < sorted.length; i += 1) {
      const a = sorted[i][0];
      const b = sorted[i][1];

      if (a <= end + 2) {
        end = Math.max(end, b);
      } else {
        total += end - start;
        start = a;
        end = b;
      }
    }

    return total + end - start;
  }

  /*
   * Sama geometrinen viivastotunnistus kuin score-selectionissa.
   * Tärkeä etu: getBoundingClientRect() antaa jo valmiiksi oikeat
   * ruutukoordinaatit myös landscape-zoomauksen ja CSS-skaalauksen jälkeen.
   */
  function detectRenderedStaffBands() {
    if (!container) return [];

    const bands = [];
    const pageSvgs = Array.from(container.querySelectorAll("svg"))
      .filter(function (svg) {
        return svg.getBoundingClientRect().width > 80;
      });

    pageSvgs.forEach(function (svg) {
      const pageRect = svg.getBoundingClientRect();
      if (pageRect.width <= 0 || pageRect.height <= 0) return;

      const raw = [];

      Array.from(svg.querySelectorAll("path,line,rect")).forEach(function (el) {
        if (el.closest(".vf-notehead")) return;

        const rect = el.getBoundingClientRect();

        if (rect.width < Math.max(28, pageRect.width * 0.045)) return;
        if (rect.height > 3.2) return;
        if (rect.right < pageRect.left || rect.left > pageRect.right) return;

        raw.push({
          y: rectCenterY(rect),
          left: rect.left,
          right: rect.right
        });
      });

      raw.sort(function (a, b) { return a.y - b.y; });

      const rows = [];

      raw.forEach(function (item) {
        let row = rows[rows.length - 1];

        if (!row || Math.abs(item.y - row.y) > 1.8) {
          row = {
            y: item.y,
            ys: [item.y],
            intervals: [[item.left, item.right]]
          };
          rows.push(row);
        } else {
          row.ys.push(item.y);
          row.intervals.push([item.left, item.right]);
          row.y =
            row.ys.reduce(function (sum, value) {
              return sum + value;
            }, 0) / row.ys.length;
        }
      });

      const lineRows = rows
        .map(function (row) {
          return {
            y: row.y,
            coverage: unionWidth(row.intervals),
            left: Math.min.apply(
              null,
              row.intervals.map(function (value) { return value[0]; })
            ),
            right: Math.max.apply(
              null,
              row.intervals.map(function (value) { return value[1]; })
            )
          };
        })
        .filter(function (row) {
          return row.coverage >= Math.max(70, pageRect.width * 0.15);
        })
        .sort(function (a, b) { return a.y - b.y; });

      for (let i = 0; i <= lineRows.length - 5;) {
        const five = lineRows.slice(i, i + 5);
        const gaps = five.slice(1).map(function (row, index) {
          return row.y - five[index].y;
        });

        const average =
          gaps.reduce(function (sum, value) {
            return sum + value;
          }, 0) / gaps.length;

        const even =
          average >= 3 &&
          average <= 28 &&
          gaps.every(function (gap) {
            return Math.abs(gap - average) <=
              Math.max(2.2, average * 0.28);
          });

        if (!even) {
          i += 1;
          continue;
        }

        bands.push({
          staffTop: five[0].y,
          staffBottom: five[4].y,
          left: Math.min.apply(
            null,
            five.map(function (row) { return row.left; })
          ),
          right: Math.max.apply(
            null,
            five.map(function (row) { return row.right; })
          )
        });

        i += 5;
      }
    });

    return bands.sort(function (a, b) {
      return a.staffTop - b.staffTop;
    });
  }

  function getMeasureLayout() {
    if (!osmd || !osmd.GraphicSheet || !container) return [];

    const list = osmd.GraphicSheet.MeasureList || [];
    const containerRect = container.getBoundingClientRect();
    const bands = detectRenderedStaffBands();

    /*
     * Ryhmitellään tahdit niiden ParentStaffLine-olion mukaan.
     * Yksi ryhmä = yksi näkyvä nuottirivi tässä yksiviivastoisessa
     * Pikakirjoittimessa.
     */
    const systems = [];
    const systemMap = new Map();
    const measureRows = [];

    list.forEach(function (staffMeasures, measureIndex) {
      if (!Array.isArray(staffMeasures)) return;

      const measure = staffMeasures.find(function (item) {
        return Boolean(item);
      });

      if (!measure) return;

      const staffLine = measure.ParentStaffLine;
      if (!staffLine) return;

      let system = systemMap.get(staffLine);

      if (!system) {
        system = {
          staffLine: staffLine,
          measures: []
        };
        systemMap.set(staffLine, system);
        systems.push(system);
      }

      const stave =
        typeof measure.getVFStave === "function"
          ? measure.getVFStave()
          : measure.stave;

      if (!stave) return;

      const x =
        typeof stave.getX === "function"
          ? Number(stave.getX())
          : Number(stave.x);

      const width =
        typeof stave.getWidth === "function"
          ? Number(stave.getWidth())
          : Number(stave.width);

      if (!Number.isFinite(x) || !Number.isFinite(width) || width <= 0) {
        return;
      }

      const row = {
        measureIndex: measureIndex,
        staffLine: staffLine,
        staveStart: x,
        staveEnd: x + width
      };

      system.measures.push(row);
      measureRows.push(row);
    });

    /*
     * Jos SVG:n viivastotunnistus jostain syystä ei löydä kaikkia rivejä,
     * emme arvaa zoom-kertoimella väärää kohtaa. Käytetään tällöin vanhaa
     * OSMD-yksikköfallbackia vain kyseiselle riville.
     */
    const fallbackUnitPixels = 10 * currentZoom;

    return measureRows.map(function (row) {
      const systemIndex = systems.findIndex(function (system) {
        return system.staffLine === row.staffLine;
      });

      const system = systems[systemIndex];
      const band = bands[systemIndex];

      if (system && band) {
        const minX = Math.min.apply(
          null,
          system.measures.map(function (item) {
            return item.staveStart;
          })
        );

        const maxX = Math.max.apply(
          null,
          system.measures.map(function (item) {
            return item.staveEnd;
          })
        );

        const logicalWidth = Math.max(1, maxX - minX);
        const renderedWidth = Math.max(1, band.right - band.left);

        const startRatio =
          (row.staveStart - minX) / logicalWidth;

        const endRatio =
          (row.staveEnd - minX) / logicalWidth;

        return {
          measureIndex: row.measureIndex,
          startX:
            (band.left - containerRect.left) +
            startRatio * renderedWidth,
          endX:
            (band.left - containerRect.left) +
            endRatio * renderedWidth,
          staffTop: band.staffTop - containerRect.top,
          staffBottom: band.staffBottom - containerRect.top,
          systemTop: band.staffTop - containerRect.top
        };
      }

      /*
       * Fallback pidetään vain varmistuksena. Normaali portrait- ja
       * landscape-kohdistus kulkee yllä olevan DOM-geometrian kautta.
       */
      const staffLine = row.staffLine;
      const box = staffLine && staffLine.PositionAndShape;
      const absolute =
        box && box.AbsolutePosition
          ? box.AbsolutePosition
          : { x:0, y:0 };

      return {
        measureIndex: row.measureIndex,
        startX: row.staveStart * currentZoom,
        endX: row.staveEnd * currentZoom,
        staffTop: Number(absolute.y || 0) * fallbackUnitPixels,
        staffBottom:
          (Number(absolute.y || 0) + 4) * fallbackUnitPixels,
        systemTop: Number(absolute.y || 0) * fallbackUnitPixels
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
