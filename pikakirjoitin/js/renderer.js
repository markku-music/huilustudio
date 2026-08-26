(function () {
  "use strict";

  let container = null;
  let paper = null;
  let lastScore = null;
  let lastContainerId = "";
  let rendering = Promise.resolve();
  let resizeObserver = null;
  let resizeTimer = 0;
  let lastObservedPaperWidth = 0;
  let portraitReferenceWidth = 0;
  let currentZoom = 1;
  let measureLayout = [];
  let lastLayoutOptions = {
    systemBreaks: [],
    lastSystemMaxScalingFactor: 1.4,
    notationScale: 1,
    systemSpacing: 1,
    instrumentCreditDistance: 14,
    pageMargins: { top: 5, right: 2.5, bottom: 5, left: 2.5 }
  };

  const renderedListeners = new Set();
  const KEY_NAMES = {
    "-7":"Cb", "-6":"Gb", "-5":"Db", "-4":"Ab", "-3":"Eb", "-2":"Bb", "-1":"F",
    "0":"C", "1":"G", "2":"D", "3":"A", "4":"E", "5":"B", "6":"F#", "7":"C#"
  };
  const DURATION_CODES = {
    whole: "w",
    half: "h",
    quarter: "q",
    eighth: "8",
    sixteenth: "16",
    "thirty-second": "32",
    "sixty-fourth": "64",
    "one-hundred-twenty-eighth": "128"
  };
  const ARTICULATION_CODES = {
    accent: "a>",
    staccato: "a.",
    marcato: "a^",
    tenuto: "a-"
  };

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
    return Math.max(1, Number(target && (
      target.getBoundingClientRect().width || target.clientWidth || target.offsetWidth
    )) || 1);
  }

  function portraitWidthEstimate(currentPaperWidth) {
    if (portraitReferenceWidth > 0) return portraitReferenceWidth;
    const size = viewportSize();
    const viewportWidth = Math.max(1, size.width || currentPaperWidth);
    const viewportHeight = Math.max(1, size.height || viewportWidth);
    return Math.max(1, currentPaperWidth * Math.min(viewportWidth, viewportHeight) / viewportWidth);
  }

  function updateOrientationZoom() {
    const width = paperWidth();
    let orientationZoom = 1;
    if (isPortraitViewport()) {
      portraitReferenceWidth = width;
    } else {
      orientationZoom = Math.max(1, Math.min(1.6, width / Math.max(1, portraitWidthEstimate(width))));
    }
    const notationScale = Number(lastLayoutOptions.notationScale) || 1;
    currentZoom = Math.max(0.6, Math.min(2.25, orientationZoom * notationScale));
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

  function normalizeLayoutOptions(layout) {
    const source = layout || {};
    let factor = Number(source.lastSystemMaxScalingFactor);
    if (!Number.isFinite(factor)) factor = 1.4;
    let notationScale = Number(source.notationScale);
    if (!Number.isFinite(notationScale)) notationScale = 1;
    let systemSpacing = Number(source.systemSpacing);
    if (!Number.isFinite(systemSpacing)) systemSpacing = 1;
    let instrumentCreditDistance = Number(source.instrumentCreditDistance);
    if (!Number.isFinite(instrumentCreditDistance)) instrumentCreditDistance = 14;
    const sourceMargins = source.pageMargins || {};
    function marginValue(name) {
      const value = Number(sourceMargins[name]);
      const fallback = (name === "left" || name === "right") ? 2.5 : 5;
      return Number.isFinite(value) ? Math.max(0, Math.min(12, value)) : fallback;
    }
    return {
      systemBreaks: Array.isArray(source.systemBreaks) ? source.systemBreaks.slice() : [],
      lastSystemMaxScalingFactor: Math.max(1, Math.min(6, factor)),
      notationScale: Math.max(0.75, Math.min(1.2, notationScale)),
      systemSpacing: Math.max(0.5, Math.min(3, systemSpacing)),
      instrumentCreditDistance: Math.max(2, Math.min(14, instrumentCreditDistance)),
      pageMargins: {
        top: marginValue("top"), right: marginValue("right"),
        bottom: marginValue("bottom"), left: marginValue("left")
      }
    };
  }

  function ensureVexFlow(containerId) {
    if (!window.VexFlow || !window.VexFlow.Renderer || !window.VexFlow.StaveNote) {
      throw new Error("VexFlow 5 -kirjastoa ei löytynyt.");
    }
    const next = document.getElementById(containerId);
    if (!next) throw new Error("VexFlow-konttia ei löytynyt: " + containerId);
    container = next;
    paper = container.closest(".a4-paper") || container;
    lastContainerId = containerId;
    watchPaperWidth();
  }

  function watchPaperWidth() {
    if (resizeObserver || !paper || !("ResizeObserver" in window)) return;
    lastObservedPaperWidth = paperWidth();
    resizeObserver = new ResizeObserver(function (entries) {
      const width = Number(entries[0] && entries[0].contentRect && entries[0].contentRect.width) || paperWidth();
      if (!width || Math.abs(width - lastObservedPaperWidth) < 1) return;
      lastObservedPaperWidth = width;
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        if (!lastScore || !lastContainerId) return;
        renderScore(lastScore, lastContainerId, "resize", lastLayoutOptions).catch(function (error) {
          console.error("VexFlow resize-renderöinti epäonnistui:", error);
        });
      }, 80);
    });
    resizeObserver.observe(paper);
  }

  function clefName(clef) {
    if (clef === "F") return "bass";
    if (clef === "C") return "alto";
    return "treble";
  }

  function keyName(fifths) {
    const n = Math.max(-7, Math.min(7, Math.round(Number(fifths) || 0)));
    return KEY_NAMES[String(n)] || "C";
  }

  function pitchKey(pitch) {
    const match = /^([A-G])([#b]?)(-?\d+)$/.exec(String(pitch || ""));
    if (!match) return "b/4";
    return (match[1].toLowerCase() + match[2] + "/" + match[3]);
  }

  function durationCode(entry) {
    const base = DURATION_CODES[entry && entry.duration] || "q";
    const dots = Math.max(0, Math.min(2, Number(entry && entry.dots) || 0));
    return base + "d".repeat(dots) + (entry && entry.kind === "rest" ? "r" : "");
  }

  function measureNaturalWidth(measure, firstInSystem) {
    const entries = Array.isArray(measure && measure.entries) ? measure.entries : [];
    let width = 58 + (firstInSystem ? 72 : 0);
    entries.forEach(function (entry) {
      width += 23;
      if (entry && entry.pitch && /[#b]/.test(entry.pitch)) width += 5;
      if (entry && Number(entry.dots) > 0) width += 4;
      if (entry && Array.isArray(entry.articulations) && entry.articulations.length) width += 3;
    });
    return Math.max(firstInSystem ? 150 : 92, Math.min(300, width));
  }

  function buildSystems(measures, logicalWidth, layout) {
    const left = 18 + layout.pageMargins.left * 5;
    const right = 18 + layout.pageMargins.right * 5;
    const available = Math.max(180, logicalWidth - left - right);
    const forced = new Set(layout.systemBreaks || []);
    const systems = [];
    let current = [];
    let natural = 0;

    function pushCurrent() {
      if (!current.length) return;
      systems.push({ measures: current, naturalWidth: natural });
      current = [];
      natural = 0;
    }

    measures.forEach(function (measure, index) {
      if (index > 0 && forced.has(index)) pushCurrent();
      const wanted = measureNaturalWidth(measure, current.length === 0);
      if (current.length && natural + wanted > available) pushCurrent();
      const adjusted = measureNaturalWidth(measure, current.length === 0);
      current.push({ measure: measure, measureIndex: index, wanted: adjusted });
      natural += adjusted;
    });
    pushCurrent();
    if (!systems.length) systems.push({ measures: [], naturalWidth: available });

    systems.forEach(function (system, index) {
      const isLast = index === systems.length - 1;
      const target = isLast
        ? Math.min(available, Math.max(system.naturalWidth, system.naturalWidth * layout.lastSystemMaxScalingFactor))
        : available;
      const totalWanted = Math.max(1, system.measures.reduce(function (sum, item) { return sum + item.wanted; }, 0));
      system.width = target;
      system.x = left;
      system.measures.forEach(function (item) {
        item.width = target * item.wanted / totalWanted;
      });
    });
    return systems;
  }

  function createVexNote(entry, clef) {
    const VF = window.VexFlow;
    const isRest = entry && entry.kind === "rest";
    const options = {
      keys: [isRest ? "b/4" : pitchKey(entry.pitch)],
      duration: durationCode(entry),
      clef: clef,
      auto_stem: true
    };
    if (isRest && entry.measureRest) options.align_center = true;
    const note = new VF.StaveNote(options);

    const dots = Math.max(0, Math.min(2, Number(entry && entry.dots) || 0));
    for (let i = 0; i < dots; i += 1) {
      try { VF.Dot.buildAndAttach([note], { all: true }); } catch (_) {}
    }

    if (!isRest && Array.isArray(entry.articulations) && VF.Articulation) {
      entry.articulations.forEach(function (name) {
        const code = ARTICULATION_CODES[name];
        if (!code) return;
        try {
          const articulation = new VF.Articulation(code);
          const above = VF.ModifierPosition && VF.ModifierPosition.ABOVE !== undefined
            ? VF.ModifierPosition.ABOVE
            : (VF.Modifier && VF.Modifier.Position ? VF.Modifier.Position.ABOVE : undefined);
          if (above !== undefined && typeof articulation.setPosition === "function") articulation.setPosition(above);
          note.addModifier(articulation, 0);
        } catch (_) {}
      });
    }
    return note;
  }

  function addSvgText(svg, x, y, text, options) {
    if (!svg || !text) return;
    const ns = "http://www.w3.org/2000/svg";
    const el = document.createElementNS(ns, "text");
    const opts = options || {};
    el.setAttribute("x", String(x));
    el.setAttribute("y", String(y));
    el.setAttribute("text-anchor", opts.anchor || "start");
    el.setAttribute("font-family", "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif");
    el.setAttribute("font-size", String(opts.size || 14));
    if (opts.weight) el.setAttribute("font-weight", String(opts.weight));
    if (opts.style) el.setAttribute("font-style", opts.style);
    el.setAttribute("fill", "#111");
    el.textContent = String(text);
    svg.appendChild(el);
  }

  function drawStaveTie(context, from, to) {
    const VF = window.VexFlow;
    if (!VF.StaveTie) return;
    try {
      new VF.StaveTie({
        from: from || null,
        to: to || null,
        firstIndexes: [0],
        lastIndexes: [0]
      }).setContext(context).draw();
      return;
    } catch (_) {}

    // Fallback vanhemmalle VexFlow-rakenteelle.
    try {
      new VF.StaveTie({
        first_note: from || null,
        last_note: to || null,
        first_indices: [0],
        last_indices: [0]
      }).setContext(context).draw();
    } catch (_) {}
  }

  function drawCurves(context, rendered) {
    const VF = window.VexFlow;
    let pendingTie = null;
    let pendingSlur = null;

    rendered.forEach(function (item) {
      const piece = item.piece;
      if (!piece || piece.kind === "rest") return;

      if (piece.tieStop && pendingTie && VF.StaveTie) {
        if (pendingTie.systemIndex === item.systemIndex) {
          drawStaveTie(context, pendingTie.note, item.note);
        } else {
          drawStaveTie(context, pendingTie.note, null);
          drawStaveTie(context, null, item.note);
        }
        pendingTie = null;
      }
      if (piece.tieStart) pendingTie = item;

      if (piece.slurStop && pendingSlur && VF.Curve) {
        try {
          if (pendingSlur.systemIndex === item.systemIndex) {
            new VF.Curve(pendingSlur.note, item.note, {
              position: VF.Curve.Position.NEAR_TOP,
              position_end: VF.Curve.Position.NEAR_TOP,
              cps: [{x:0,y:10},{x:0,y:10}], thickness: 1.4, y_shift: 6
            }).setContext(context).draw();
          } else {
            new VF.Curve(pendingSlur.note, null, {
              position: VF.Curve.Position.NEAR_TOP,
              cps: [{x:0,y:10},{x:0,y:10}], thickness: 1.4, y_shift: 6
            }).setContext(context).draw();
            new VF.Curve(null, item.note, {
              position: VF.Curve.Position.NEAR_TOP,
              position_end: VF.Curve.Position.NEAR_TOP,
              cps: [{x:0,y:10},{x:0,y:10}], thickness: 1.4, y_shift: 6
            }).setContext(context).draw();
          }
        } catch (_) {}
        pendingSlur = null;
      }
      if (piece.slurStart) pendingSlur = item;
    });
  }

  async function performRender(score, containerId, reason, layoutOptions) {
    ensureVexFlow(containerId);
    lastScore = score;
    lastLayoutOptions = normalizeLayoutOptions(layoutOptions || (score && score.layout) || lastLayoutOptions);
    updateOrientationZoom();

    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch (_) {}
    }
    if (window.VexFlow.setFonts) {
      try { window.VexFlow.setFonts("Bravura", "Academico"); } catch (_) {}
    }

    const VF = window.VexFlow;
    const actualWidth = Math.max(280, container.clientWidth || Math.round(paperWidth()));
    const logicalWidth = Math.max(280, actualWidth / currentZoom);
    const renderMeasures = window.PikakirjoitinMusicXML.getRenderMeasures(score);
    const systems = buildSystems(renderMeasures, logicalWidth, lastLayoutOptions);
    const topArea = 88 + lastLayoutOptions.pageMargins.top * 4;
    const systemStep = 126 * lastLayoutOptions.systemSpacing;
    const logicalHeight = Math.max(210, topArea + systems.length * systemStep + 70 + lastLayoutOptions.pageMargins.bottom * 4);

    container.replaceChildren();
    const renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
    renderer.resize(logicalWidth, logicalHeight);
    const context = renderer.getContext();
    const clef = clefName(score && score.clef);
    const key = keyName(score && score.key);
    const beats = Number(score && score.time && score.time[0]) || 4;
    const beatType = Number(score && score.time && score.time[1]) || 4;
    const timeText = beats + "/" + beatType;
    const renderedPieces = [];
    measureLayout = [];

    systems.forEach(function (system, systemIndex) {
      let x = system.x;
      const y = topArea + systemIndex * systemStep;
      system.measures.forEach(function (item, localIndex) {
        const measure = item.measure;
        const stave = new VF.Stave(x, y, item.width, {
          left_bar: localIndex === 0,
          right_bar: true
        });
        stave.setContext(context);
        if (localIndex === 0) {
          stave.addClef(clef);
          if (key !== "C") stave.addKeySignature(key);
          if (item.measureIndex === 0) stave.addTimeSignature(timeText);
        } else {
          if (typeof stave.setClefLines === "function") stave.setClefLines(clef);
        }
        stave.draw();

        const pieces = Array.isArray(measure && measure.entries) ? measure.entries : [];
        const notes = pieces.map(function (piece) { return createVexNote(piece, clef); });
        if (notes.length) {
          const voice = new VF.Voice({ num_beats: beats, beat_value: beatType });
          const softMode = VF.VoiceMode && VF.VoiceMode.SOFT !== undefined
            ? VF.VoiceMode.SOFT
            : (VF.Voice && VF.Voice.Mode ? VF.Voice.Mode.SOFT : null);
          if (softMode !== null && typeof voice.setMode === "function") voice.setMode(softMode);
          else if (typeof voice.setStrict === "function") voice.setStrict(false);
          voice.addTickables(notes);
          try { VF.Accidental.applyAccidentals([voice], key); } catch (_) {}
          new VF.Formatter().joinVoices([voice]).formatToStave([voice], stave, {
            alignRests: true, stave: stave, context: context
          });
          voice.draw(context, stave);

          // VexFlow 5 uses .vf-stavenote by default. Pikakirjoittimen
          // selection layer expects one stable .vf-note group per visible
          // logical segment, so mark the rendered SVG groups explicitly.
          notes.forEach(function (note, noteIndex) {
            try {
              const el = typeof note.getSVGElement === "function" ? note.getSVGElement() : null;
              const piece = pieces[noteIndex] || {};
              if (!el) return;
              el.classList.add("vf-note");
              if (piece.sourceId || piece.id) el.setAttribute("data-source-id", String(piece.sourceId || piece.id));
              el.setAttribute("data-segment-order", String(renderedPieces.length + noteIndex));
            } catch (_) {}
          });

          try {
            const beams = VF.Beam.generateBeams(notes);
            beams.forEach(function (beam) { beam.setContext(context).draw(); });
          } catch (_) {}

          pieces.forEach(function (piece, index) {
            renderedPieces.push({
              piece: piece,
              note: notes[index],
              systemIndex: systemIndex,
              measureIndex: item.measureIndex
            });
          });
        }

        let staffTop = y + 40;
        let staffBottom = y + 80;
        try {
          const a = stave.getYForLine(0);
          const b = stave.getYForLine(4);
          staffTop = Math.min(a, b);
          staffBottom = Math.max(a, b);
        } catch (_) {}

        measureLayout.push({
          measureIndex: item.measureIndex,
          startX: x * currentZoom,
          endX: (x + item.width) * currentZoom,
          staffTop: staffTop * currentZoom,
          staffBottom: staffBottom * currentZoom,
          systemTop: staffTop * currentZoom
        });
        x += item.width;
      });
    });

    drawCurves(context, renderedPieces);

    const svg = container.querySelector("svg");
    if (svg) {
      svg.style.display = "block";
      svg.style.width = actualWidth + "px";
      svg.style.height = (logicalHeight * currentZoom) + "px";
      svg.setAttribute("preserveAspectRatio", "xMinYMin meet");
      const metadata = score && score.metadata || {};
      addSvgText(svg, logicalWidth / 2, 26, metadata.title || "", { anchor:"middle", size:19, weight:700 });
      addSvgText(svg, logicalWidth - 20, 47, metadata.composer || "", { anchor:"end", size:12 });
      addSvgText(svg, 20, 54, metadata.partName || "", { anchor:"start", size:12, weight:600 });
      addSvgText(svg, systems[0] ? systems[0].x : 20, topArea - 10, metadata.tempoText || "", { anchor:"start", size:12, style:"italic" });
    }
    container.style.minHeight = Math.ceil(logicalHeight * currentZoom) + "px";
    lastObservedPaperWidth = paperWidth();
    notifyRendered(reason || "score");
    return { engine: "VexFlow", version: "5.0.0", score: score };
  }

  function renderScore(score, containerId, reason, layoutOptions) {
    const id = String(containerId || "");
    const nextLayout = normalizeLayoutOptions(layoutOptions || (score && score.layout) || lastLayoutOptions);
    rendering = rendering.then(function () {
      return performRender(score, id, reason || "score", nextLayout);
    });
    return rendering;
  }

  function rerenderLayout(layoutOptions, reason) {
    const nextLayout = normalizeLayoutOptions(layoutOptions || lastLayoutOptions);
    rendering = rendering.then(function () {
      if (!lastScore || !lastContainerId) return null;
      return performRender(lastScore, lastContainerId, reason || "layout", nextLayout);
    });
    return rendering;
  }

  function subscribeRendered(listener) {
    if (typeof listener !== "function") return function () {};
    renderedListeners.add(listener);
    return function () { renderedListeners.delete(listener); };
  }

  function getMeasureLayout() {
    return measureLayout.map(function (item) { return Object.assign({}, item); });
  }

  function getLayoutState() {
    return {
      zoom: currentZoom,
      paperWidth: paperWidth(),
      portraitReferenceWidth: portraitReferenceWidth,
      portrait: isPortraitViewport(),
      notationScale: lastLayoutOptions.notationScale,
      systemSpacing: lastLayoutOptions.systemSpacing,
      pageMargins: Object.assign({}, lastLayoutOptions.pageMargins),
      autoResize: false,
      engine: "VexFlow"
    };
  }

  window.PikakirjoitinRenderer = {
    renderScore: renderScore,
    rerenderLayout: rerenderLayout,
    getMeasureLayout: getMeasureLayout,
    subscribeRendered: subscribeRendered,
    getLayoutState: getLayoutState
  };
})();
