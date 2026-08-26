(function () {
  "use strict";

  const DIVISIONS = 32;
  const DURATION_VALUES = {
    whole: 128,
    half: 64,
    quarter: 32,
    eighth: 16,
    sixteenth: 8,
    "thirty-second": 4,
    "sixty-fourth": 2,
    "one-hundred-twenty-eighth": 1
  };

  const MUSICXML_TYPES = {
    sixteenth: "16th",
    "thirty-second": "32nd",
    "sixty-fourth": "64th",
    "one-hundred-twenty-eighth": "128th"
  };

  const RENDER_DURATION_CHOICES = [
    { value:224, duration:"whole", dots:2 },
    { value:192, duration:"whole", dots:1 },
    { value:128, duration:"whole", dots:0 },
    { value:112, duration:"half", dots:2 },
    { value:96,  duration:"half", dots:1 },
    { value:64,  duration:"half", dots:0 },
    { value:56,  duration:"quarter", dots:2 },
    { value:48,  duration:"quarter", dots:1 },
    { value:32,  duration:"quarter", dots:0 },
    { value:28,  duration:"eighth", dots:2 },
    { value:24,  duration:"eighth", dots:1 },
    { value:16,  duration:"eighth", dots:0 },
    { value:14,  duration:"sixteenth", dots:2 },
    { value:12,  duration:"sixteenth", dots:1 },
    { value:8,   duration:"sixteenth", dots:0 },
    { value:7,   duration:"thirty-second", dots:2 },
    { value:6,   duration:"thirty-second", dots:1 },
    { value:4,   duration:"thirty-second", dots:0 },
    { value:3,   duration:"sixty-fourth", dots:1 },
    { value:2,   duration:"sixty-fourth", dots:0 },
    { value:1,   duration:"one-hundred-twenty-eighth", dots:0 }
  ];

  function escapeXML(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function parsePitch(pitch) {
    const match = /^([A-G])([#b]?)(-?\d+)$/.exec(String(pitch || ""));
    if (!match) throw new Error("Virheellinen sävel: " + pitch);

    return {
      step: match[1],
      alter: match[2] === "#" ? 1 : match[2] === "b" ? -1 : 0,
      octave: Number(match[3])
    };
  }

  function normalizeDots(value) {
    const dots = Number(value) || 0;
    return dots >= 2 ? 2 : dots >= 1 ? 1 : 0;
  }

  function baseDurationValue(duration) {
    const value = DURATION_VALUES[duration];
    if (!value) throw new Error("Tuntematon aika-arvo: " + duration);
    return value;
  }

  function durationValue(entryOrDuration, dotsOverride) {
    const duration = typeof entryOrDuration === "string"
      ? entryOrDuration
      : entryOrDuration.duration;

    const dots = typeof entryOrDuration === "string"
      ? normalizeDots(dotsOverride)
      : normalizeDots(entryOrDuration.dots);

    const base = baseDurationValue(duration);

    if (dots === 1) return base * 3 / 2;
    if (dots === 2) return base * 7 / 4;
    return base;
  }

  function xmlType(duration) {
    return MUSICXML_TYPES[duration] || duration;
  }

  function dotsToXML(dots) {
    const count = normalizeDots(dots);
    if (count === 0) return [];
    return Array.from({ length: count }, function () {
      return "        <dot/>";
    });
  }

  function notationElementsToXML(entry) {
    if (!entry || entry.kind === "rest") {
      return { ties: [], notations: [] };
    }

    const ties = [];
    const notations = [];

    if (entry.tieStop) {
      ties.push('        <tie type="stop"/>');
      notations.push('          <tied type="stop"/>');
    }

    if (entry.tieStart) {
      ties.push('        <tie type="start"/>');
      notations.push('          <tied type="start"/>');
    }

    if (entry.slurStop) {
      notations.push('          <slur type="stop" number="1"/>');
    }

    if (entry.slurStart) {
      notations.push('          <slur type="start" number="1"/>');
    }

    const articulations = Array.isArray(entry.articulations)
      ? entry.articulations
      : [];

    if (articulations.length) {
      const articulationXML = [];
      if (articulations.indexOf("accent") >= 0) articulationXML.push("            <accent/>");
      if (articulations.indexOf("staccato") >= 0) articulationXML.push("            <staccato/>");
      if (articulations.indexOf("marcato") >= 0) articulationXML.push("            <strong-accent/>");
      if (articulations.indexOf("tenuto") >= 0) articulationXML.push("            <tenuto/>");

      if (articulationXML.length) {
        notations.push("          <articulations>");
        notations.push.apply(notations, articulationXML);
        notations.push("          </articulations>");
      }
    }

    return { ties: ties, notations: notations };
  }

  function entryToXML(entry, options) {
    const config = options || {};
    const isMeasureRest = Boolean(config.measureRest);

    if (entry.kind === "rest") {
      const value = isMeasureRest
        ? Number(config.measureCapacity)
        : durationValue(entry);

      const parts = [
        "      <note>",
        isMeasureRest ? "        <rest measure=\"yes\"/>" : "        <rest/>",
        "        <duration>" + value + "</duration>",
        "        <voice>1</voice>",
        "        <type>" + (isMeasureRest ? "whole" : escapeXML(xmlType(entry.duration))) + "</type>"
      ];

      if (!isMeasureRest) {
        parts.push.apply(parts, dotsToXML(entry.dots));
      }

      parts.push("      </note>");
      return parts.join("\n");
    }

    const pitch = parsePitch(entry.pitch);
    const value = durationValue(entry);
    const alterXML = pitch.alter !== 0
      ? "<alter>" + pitch.alter + "</alter>"
      : "";

    const notationXML = notationElementsToXML(entry);

    const parts = [
      "      <note>",
      "        <pitch><step>" + pitch.step + "</step>" + alterXML + "<octave>" + pitch.octave + "</octave></pitch>",
      "        <duration>" + value + "</duration>"
    ];

    parts.push.apply(parts, notationXML.ties);

    parts.push(
      "        <voice>1</voice>",
      "        <type>" + escapeXML(xmlType(entry.duration)) + "</type>"
    );

    parts.push.apply(parts, dotsToXML(entry.dots));

    if (entry.beam) {
      parts.push('        <beam number="1">' + escapeXML(entry.beam) + '</beam>');
    }

    if (notationXML.notations.length) {
      parts.push("        <notations>");
      parts.push.apply(parts, notationXML.notations);
      parts.push("        </notations>");
    }

    parts.push("      </note>");
    return parts.join("\n");
  }

  function clefToXML(clef) {
    if (clef === "F") return "<sign>F</sign><line>4</line>";
    if (clef === "C") return "<sign>C</sign><line>3</line>";
    return "<sign>G</sign><line>2</line>";
  }

  function measureCapacity(beats, beatType) {
    return beats * DIVISIONS * (4 / beatType);
  }

  function isMeasureRestEntry(entry) {
    return Boolean(
      entry &&
      entry.kind === "rest" &&
      entry.measureRest === true
    );
  }

  function decomposeRenderValue(value) {
    const target = Math.round(Number(value));
    if (!Number.isInteger(target) || target <= 0) {
      throw new Error("Virheellinen renderöitävä rytmikesto: " + value);
    }

    const best = new Array(target + 1).fill(null);
    best[0] = [];

    for (let total = 1; total <= target; total += 1) {
      for (const choice of RENDER_DURATION_CHOICES) {
        if (choice.value > total) continue;
        const previous = best[total - choice.value];
        if (!previous) continue;
        const candidate = previous.concat([choice]);
        if (!best[total] || candidate.length < best[total].length) {
          best[total] = candidate;
        }
      }
    }

    if (!best[target]) {
      throw new Error("Rytmikestoa " + target + " ei voitu jakaa nuottiarvoiksi.");
    }

    return best[target].slice().sort(function (a, b) { return b.value - a.value; });
  }

  function buildSlurMarkers(score) {
    const startIds = new Set();
    const stopIds = new Set();
    const slurs = Array.isArray(score && score.slurs) ? score.slurs : [];

    slurs.forEach(function (slur) {
      if (!slur || !slur.startId || !slur.endId) return;
      startIds.add(slur.startId);
      stopIds.add(slur.endId);
    });

    return { startIds: startIds, stopIds: stopIds };
  }

  function pitchMidiValue(pitch) {
    const match = /^([A-G])([#b]?)(-?\d+)$/.exec(String(pitch || ""));
    if (!match) return null;

    const semitones = {
      C: 0,
      D: 2,
      E: 4,
      F: 5,
      G: 7,
      A: 9,
      B: 11
    };

    const alter =
      match[2] === "#" ? 1 :
      match[2] === "b" ? -1 :
      0;

    return (Number(match[3]) + 1) * 12 +
      semitones[match[1]] +
      alter;
  }

  function sameSoundingPitch(a, b) {
    const first = pitchMidiValue(a);
    const second = pitchMidiValue(b);
    return first !== null && second !== null && first === second;
  }

  function buildManualTieMarkers(score) {
    const startIds = new Set();
    const stopIds = new Set();
    const ties = Array.isArray(score && score.ties) ? score.ties : [];
    const notes = Array.isArray(score && score.notes) ? score.notes : [];

    const indexMap = new Map();
    notes.forEach(function (entry, index) {
      if (entry && entry.id) indexMap.set(entry.id, index);
    });

    ties.forEach(function (tie) {
      if (!tie || !tie.startId || !tie.endId) return;

      const startIndex = indexMap.get(tie.startId);
      const endIndex = indexMap.get(tie.endId);

      if (!Number.isInteger(startIndex) || !Number.isInteger(endIndex)) return;
      if (endIndex !== startIndex + 1) return;

      const start = notes[startIndex];
      const end = notes[endIndex];

      if (!start || !end) return;
      if (start.kind !== "note" || end.kind !== "note") return;
      if (!sameSoundingPitch(start.pitch, end.pitch)) return;

      startIds.add(start.id);
      stopIds.add(end.id);
    });

    return { startIds: startIds, stopIds: stopIds };
  }

  function makeRenderPiece(entry, choice, tieStop, tieStart, slurStop, slurStart, articulations) {
    const piece = {
      id: entry.id,
      sourceId: entry.id,
      kind: entry.kind || "note",
      duration: choice.duration,
      dots: choice.dots
    };

    if (entry.pitch) piece.pitch = entry.pitch;

    if (piece.kind !== "rest") {
      piece.tieStop = Boolean(tieStop);
      piece.tieStart = Boolean(tieStart);
      piece.slurStop = Boolean(slurStop);
      piece.slurStart = Boolean(slurStart);
      if (Array.isArray(articulations) && articulations.length) {
        piece.articulations = articulations.slice();
      }
    }

    return piece;
  }

  function splitIntoMeasures(entries, capacity, pickupCapacity, slurMarkers, manualTieMarkers) {
    const hasPickup = Number(pickupCapacity) > 0 && Number(pickupCapacity) < capacity;

    function makeMeasure(measureCapacity, implicit) {
      return {
        entries: [],
        used: 0,
        capacity: measureCapacity,
        implicit: Boolean(implicit),
        explicitMeasureRest: false
      };
    }

    const measures = [ makeMeasure(hasPickup ? Number(pickupCapacity) : capacity, hasPickup) ];

    function currentMeasure() { return measures[measures.length - 1]; }
    function ensureWritableMeasure() {
      let current = currentMeasure();
      if (current.used >= current.capacity) {
        current = makeMeasure(capacity, false);
        measures.push(current);
      }
      return current;
    }

    entries.forEach(function (entry) {
      let current = ensureWritableMeasure();

      if (isMeasureRestEntry(entry)) {
        if (current.implicit && current.entries.length === 0) {
          current.capacity = capacity;
          current.implicit = false;
        } else if (current.used > 0 || current.entries.length > 0) {
          current = makeMeasure(capacity, false);
          measures.push(current);
        }

        current.entries.push(entry);
        current.used = capacity;
        current.capacity = capacity;
        current.explicitMeasureRest = true;
        measures.push(makeMeasure(capacity, false));
        return;
      }

      let remaining = durationValue(entry);
      let consumed = 0;
      const hasSourceSlurStart = Boolean(slurMarkers && slurMarkers.startIds && slurMarkers.startIds.has(entry.id));
      const hasSourceSlurStop = Boolean(slurMarkers && slurMarkers.stopIds && slurMarkers.stopIds.has(entry.id));
      const hasManualTieStart = Boolean(
        manualTieMarkers &&
        manualTieMarkers.startIds &&
        manualTieMarkers.startIds.has(entry.id)
      );
      const hasManualTieStop = Boolean(
        manualTieMarkers &&
        manualTieMarkers.stopIds &&
        manualTieMarkers.stopIds.has(entry.id)
      );

      while (remaining > 0) {
        current = ensureWritableMeasure();
        const available = current.capacity - current.used;
        const chunkValue = Math.min(remaining, available);
        const choices = decomposeRenderValue(chunkValue);

        choices.forEach(function (choice) {
          const isFirstPiece = consumed === 0;
          const remainingAfterPiece = remaining - choice.value;
          const isLastPiece = remainingAfterPiece <= 0;

          const tieStop =
            entry.kind !== "rest" &&
            (
              consumed > 0 ||
              (hasManualTieStop && isFirstPiece)
            );

          const tieStart =
            entry.kind !== "rest" &&
            (
              remainingAfterPiece > 0 ||
              (hasManualTieStart && isLastPiece)
            );
          const slurStart = entry.kind !== "rest" && hasSourceSlurStart && isFirstPiece;
          const slurStop = entry.kind !== "rest" && hasSourceSlurStop && isLastPiece;

          current.entries.push(
            makeRenderPiece(entry, choice, tieStop, tieStart, slurStop, slurStart, isFirstPiece ? entry.articulations : [])
          );

          current.used += choice.value;
          consumed += choice.value;
          remaining = remainingAfterPiece;
        });

        if (current.used === current.capacity && remaining > 0) {
          measures.push(makeMeasure(capacity, false));
        }
      }

      if (current.used === current.capacity) {
        measures.push(makeMeasure(capacity, false));
      }
    });

    if (measures.length > 1 && measures[measures.length - 1].entries.length === 0) {
      measures.pop();
    }

    return measures;
  }


  function isBeamableRenderEntry(entry) {
    if (!entry || entry.kind !== "note") return false;
    const base = DURATION_VALUES[entry.duration];
    return Number.isFinite(base) && base <= DURATION_VALUES.eighth;
  }

  function beamUnit(beats, beatType) {
    if (beatType === 8 && (beats === 3 || beats === 6 || beats === 9 || beats === 12)) {
      return 48; // pisteellinen neljäsosa
    }
    if (beatType === 2) return 64; // puolinuotti
    return 32 * (4 / beatType);    // yksinkertaisissa tahtilajeissa yksi isku
  }

  function annotateBeams(measures, score, beats, beatType) {
    const manualBreaks = new Set(
      score && Array.isArray(score.beamBreaks)
        ? score.beamBreaks.map(function (boundary) {
            if (boundary && boundary.startId && boundary.endId) {
              return String(boundary.startId) + "->" + String(boundary.endId);
            }
            return String(boundary || "");
          })
        : []
    );

    const manualGroupBySourceId = new Map();
    if (score && Array.isArray(score.beamGroups)) {
      score.beamGroups.forEach(function (group, groupIndex) {
        const noteIds = group && Array.isArray(group.noteIds) ? group.noteIds : [];
        noteIds.forEach(function (id, index) {
          manualGroupBySourceId.set(String(id), {
            groupIndex:groupIndex,
            index:index
          });
        });
      });
    }

    const unit = beamUnit(beats, beatType);

    measures.forEach(function (measure) {
      let offset = 0;
      let group = [];
      let previous = null;

      function flushGroup() {
        if (group.length >= 2) {
          group.forEach(function (entry, index) {
            entry.beam = index === 0
              ? "begin"
              : index === group.length - 1
                ? "end"
                : "continue";
          });
        }
        group = [];
      }

      measure.entries.forEach(function (entry) {
        const value = durationValue(entry);
        const sourceChanged = Boolean(
          previous &&
          previous.sourceId &&
          entry.sourceId &&
          previous.sourceId !== entry.sourceId
        );

        let manualBreak = false;
        let sameManualGroup = false;
        let manualGroupBoundary = false;

        if (sourceChanged) {
          const previousId = String(previous.sourceId);
          const currentId = String(entry.sourceId);
          manualBreak = manualBreaks.has(previousId + "->" + currentId);

          const previousManual = manualGroupBySourceId.get(previousId);
          const currentManual = manualGroupBySourceId.get(currentId);

          sameManualGroup = Boolean(
            previousManual && currentManual &&
            previousManual.groupIndex === currentManual.groupIndex &&
            currentManual.index === previousManual.index + 1
          );

          // Käsin yhdistetty palkkiryhmä on täsmällinen: sen alku- ja loppurajalla
          // automaattipalkitus ei saa liimata ulkopuolista nuottia ryhmään.
          manualGroupBoundary = Boolean(
            (previousManual || currentManual) && !sameManualGroup
          );
        }

        const startsNewUnit = Boolean(
          group.length &&
          unit > 0 &&
          Math.abs(offset % unit) < 1e-7
        );

        if (
          manualBreak ||
          manualGroupBoundary ||
          (!sameManualGroup && startsNewUnit) ||
          !isBeamableRenderEntry(entry)
        ) {
          flushGroup();
        }

        if (isBeamableRenderEntry(entry)) {
          group.push(entry);
        }

        offset += value;
        previous = entry;
      });

      flushGroup();
    });

    return measures;
  }


  function annotateMultipleRests(measures) {
    let index = 0;
    while (index < measures.length) {
      if (!measures[index].explicitMeasureRest) {
        index += 1;
        continue;
      }
      let end = index + 1;
      while (end < measures.length && measures[end].explicitMeasureRest) {
        end += 1;
      }
      const count = end - index;
      if (count >= 2) {
        measures[index].multipleRestCount = count;
      }
      index = end;
    }
    return measures;
  }

  function measureStyleXML(count) {
    if (!Number.isInteger(count) || count < 2) return "";
    return [
      "        <measure-style>",
      "          <multiple-rest>" + count + "</multiple-rest>",
      "        </measure-style>"
    ].join("\n");
  }

  function attributesToXML(score, beats, beatType, fifths, multipleRestCount) {
    const timeSymbol = score.timeSymbol === "common"
      ? ' symbol="common"'
      : score.timeSymbol === "cut"
        ? ' symbol="cut"'
        : "";

    const parts = [
      "      <attributes>",
      "        <divisions>" + DIVISIONS + "</divisions>",
      "        <key>",
      "          <fifths>" + fifths + "</fifths>",
      "        </key>",
      "        <time" + timeSymbol + ">",
      "          <beats>" + beats + "</beats>",
      "          <beat-type>" + beatType + "</beat-type>",
      "        </time>",
      "        <clef>",
      "          " + clefToXML(score.clef),
      "        </clef>"
    ];

    const style = measureStyleXML(multipleRestCount);
    if (style) parts.push(style);

    parts.push("      </attributes>");
    return parts.join("\n");
  }

  function measureStyleAttributesXML(multipleRestCount) {
    const style = measureStyleXML(multipleRestCount);
    if (!style) return "";
    return ["      <attributes>", style, "      </attributes>"].join("\n");
  }

  function hiddenRestXML(duration) {
    const value = Number(duration);
    if (!Number.isFinite(value) || value <= 0) return "";
    return [
      "      <note print-object=\"no\">",
      "        <rest/>",
      "        <duration>" + value + "</duration>",
      "        <voice>1</voice>",
      "      </note>"
    ].join("\n");
  }

  function firstMeasureDirectionXML(score) {
    const tempoText = score.metadata && score.metadata.tempoText ? String(score.metadata.tempoText).trim() : "";
    if (!tempoText) return "";
    return [
      "      <direction placement=\"above\">",
      "        <direction-type>",
      "          <words>" + escapeXML(tempoText) + "</words>",
      "        </direction-type>",
      "      </direction>"
    ].join("\n");
  }

  function getLogicalSegments(score) {
    if (!score || !Array.isArray(score.notes)) return [];
    const beats = Number(score.time && score.time[0]) || 4;
    const beatType = Number(score.time && score.time[1]) || 4;
    const capacity = measureCapacity(beats, beatType);
    const pickupCapacity = (Number(score.pickupDuration) || 0) * (DIVISIONS / 8);
    const measures = splitIntoMeasures(score.notes, capacity, pickupCapacity);
    const counts = Object.create(null);
    const segments = [];

    measures.forEach(function (measure) {
      measure.entries.forEach(function (entry) {
        const sourceId = entry.sourceId || entry.id;
        if (!sourceId) return;
        const segmentIndex = counts[sourceId] || 0;
        counts[sourceId] = segmentIndex + 1;
        segments.push({ sourceId: sourceId, segmentIndex: segmentIndex, kind: entry.kind || "note" });
      });
    });

    return segments;
  }

  function getMeasureCount(score) {
    if (!score || !Array.isArray(score.notes)) return 0;

    const beats = Number(score.time && score.time[0]) || 4;
    const beatType = Number(score.time && score.time[1]) || 4;
    const capacity = measureCapacity(beats, beatType);
    const pickupCapacity =
      (Number(score.pickupDuration) || 0) * (DIVISIONS / 8);

    return splitIntoMeasures(
      score.notes,
      capacity,
      pickupCapacity
    ).length;
  }


  function customBarlineType(score, boundaryIndex) {
    const list = score && Array.isArray(score.barlines) ? score.barlines : [];
    const index = Math.round(Number(boundaryIndex));
    const item = list.find(function (barline) {
      return barline && Math.round(Number(barline.boundaryIndex)) === index;
    });
    return item ? String(item.type || "normal") : null;
  }

  function barlineXML(location, style, repeatDirection) {
    const parts = [
      '      <barline location="' + location + '">',
      '        <bar-style>' + style + '</bar-style>'
    ];
    if (repeatDirection) {
      parts.push('        <repeat direction="' + repeatDirection + '"/>');
    }
    parts.push('      </barline>');
    return parts.join("\n");
  }

  function leftBoundaryXML(score, boundaryIndex, measureCount) {
    const custom = customBarlineType(score, boundaryIndex);
    const type = custom || "normal";

    if (type === "repeat-start" || type === "repeat-both") {
      return barlineXML("left", "heavy-light", "forward");
    }

    // Ensimmäisen tahdin vasemmassa reunassa sallitaan kaikki tyypit.
    if (boundaryIndex !== 0 || !custom) return "";
    if (type === "double") return barlineXML("left", "light-light", "");
    if (type === "final") return barlineXML("left", "light-heavy", "");
    if (type === "repeat-end") return barlineXML("left", "light-heavy", "backward");
    return barlineXML("left", "regular", "");
  }

  function rightBoundaryXML(score, boundaryIndex, measureCount) {
    const custom = customBarlineType(score, boundaryIndex);
    const isLast = measureCount > 0 && boundaryIndex === measureCount;
    const type = custom || (isLast ? "final" : "normal");

    if (!custom && !isLast) return "";
    if (type === "normal") return barlineXML("right", "regular", "");
    if (type === "double") return barlineXML("right", "light-light", "");
    if (type === "final") return barlineXML("right", "light-heavy", "");
    if (type === "repeat-end" || type === "repeat-both") {
      return barlineXML("right", "light-heavy", "backward");
    }

    // Kertauksen alku kuuluu normaalisti seuraavan tahdin vasempaan reunaan.
    // Jos se valitaan kappaleen aivan viimeiselle rajalle, piirretään se silti
    // näkyviin oikealle, jotta valinta ei katoa.
    if (type === "repeat-start" && isLast) {
      return barlineXML("right", "heavy-light", "forward");
    }
    return "";
  }

  function createMusicXML(score) {
    if (!score || !Array.isArray(score.notes)) {
      throw new Error("Score Model puuttuu tai on virheellinen.");
    }

    const beats = Number(score.time && score.time[0]) || 4;
    const beatType = Number(score.time && score.time[1]) || 4;
    const fifths = Number.isInteger(score.key) ? score.key : 0;
    const title = score.metadata && score.metadata.title ? score.metadata.title : "Pikakirjoitin 3";
    const partName = score.metadata && score.metadata.partName ? score.metadata.partName : "Huilu";
    const composer = score.metadata && score.metadata.composer ? score.metadata.composer : "";
    const capacity = measureCapacity(beats, beatType);
    const pickupCapacity = (Number(score.pickupDuration) || 0) * (DIVISIONS / 8);
    const slurMarkers = buildSlurMarkers(score);
    const manualTieMarkers = buildManualTieMarkers(score);
    const systemBreaks = new Set(
      score.layout && Array.isArray(score.layout.systemBreaks)
        ? score.layout.systemBreaks
        : []
    );

    const measures = annotateMultipleRests(
      annotateBeams(
        splitIntoMeasures(
          score.notes,
          capacity,
          pickupCapacity,
          slurMarkers,
          manualTieMarkers
        ),
        score,
        beats,
        beatType
      )
    );

    const measureCount = measures.length;

    const measuresXML = measures.map(function (measure, index) {
      const implicit = measure.implicit ? ' implicit="yes"' : "";
      const parts = ["    <measure number=\"" + (index + 1) + "\"" + implicit + ">"];

      const leftBarline = leftBoundaryXML(score, index, measureCount);
      if (leftBarline) parts.push(leftBarline);

      if (index > 0 && systemBreaks.has(index)) {
        parts.push('      <print new-system="yes"/>');
      }

      if (index === 0) {
        parts.push(attributesToXML(score, beats, beatType, fifths, measure.multipleRestCount || 0));
      } else if (measure.multipleRestCount >= 2) {
        parts.push(measureStyleAttributesXML(measure.multipleRestCount));
      }

      let directionXML = "";
      if (index === 0) {
        directionXML = firstMeasureDirectionXML(score);
        if (directionXML) parts.push(directionXML);
      }

      if (measure.entries.length) {
        parts.push(measure.entries.map(function (entry) {
          return entryToXML(entry, { measureRest: measure.explicitMeasureRest, measureCapacity: capacity });
        }).join("\n"));
      } else if (index === 0 && directionXML) {
        parts.push(hiddenRestXML(measure.capacity || capacity));
      }

      const rightBarline = rightBoundaryXML(score, index + 1, measureCount);
      if (rightBarline) parts.push(rightBarline);

      parts.push("    </measure>");
      return parts.join("\n");
    }).join("\n");

    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<score-partwise version="3.1">
  <work>
    <work-title>${escapeXML(title)}</work-title>
  </work>
  <identification>
${composer ? `    <creator type="composer">${escapeXML(composer)}</creator>
` : ""}    <encoding>
      <software>Pikakirjoitin 3 0.17.6.12</software>
    </encoding>
  </identification>
  <defaults>
    <page-layout>
      <page-height>1697.1429</page-height>
      <page-width>1200</page-width>
    </page-layout>
    <system-layout>
      <top-system-distance>160</top-system-distance>
    </system-layout>
  </defaults>
${title ? `  <credit page="1">
    <credit-type>title</credit-type>
    <credit-words justify="center" valign="top" default-x="600" default-y="1650">${escapeXML(title)}</credit-words>
  </credit>
` : ""}${partName ? `  <credit page="1">
    <credit-type>other</credit-type>
    <credit-words justify="left" valign="top" default-x="25" default-y="1615">${escapeXML(partName)}</credit-words>
  </credit>
` : ""}  <part-list>
    <score-part id="P1">
      <part-name print-object="no">${escapeXML(partName)}</part-name>
      <score-instrument id="P1-I1">
        <instrument-name>${escapeXML(partName)}</instrument-name>
      </score-instrument>
    </score-part>
  </part-list>
  <part id="P1">
${measuresXML}
  </part>
</score-partwise>`;
  }

  window.PikakirjoitinMusicXML = {
    createMusicXML: createMusicXML,
    getLogicalSegments: getLogicalSegments,
    getMeasureCount: getMeasureCount
  };
})();
