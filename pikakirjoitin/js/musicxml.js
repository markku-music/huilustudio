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

  // Vain MusicXML-renderöintiin käytettävät mahdolliset palat.
  // 64th/128th syntyvät vain poikkeuksellisen tarkassa tahtiviivan rajassa.
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

  function tieElementsToXML(entry) {
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

    const tieXML = tieElementsToXML(entry);

    const parts = [
      "      <note>",
      "        <pitch><step>" + pitch.step + "</step>" + alterXML + "<octave>" + pitch.octave + "</octave></pitch>",
      "        <duration>" + value + "</duration>"
    ];

    parts.push.apply(parts, tieXML.ties);

    parts.push(
      "        <voice>1</voice>",
      "        <type>" + escapeXML(xmlType(entry.duration)) + "</type>"
    );

    parts.push.apply(parts, dotsToXML(entry.dots));

    if (tieXML.notations.length) {
      parts.push("        <notations>");
      parts.push.apply(parts, tieXML.notations);
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
    return entry &&
      entry.kind === "rest" &&
      entry.duration === "whole" &&
      normalizeDots(entry.dots) === 0;
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
      throw new Error(
        "Rytmikestoa " + target + " ei voitu jakaa nuottiarvoiksi."
      );
    }

    return best[target]
      .slice()
      .sort(function (a, b) {
        return b.value - a.value;
      });
  }

  function makeRenderPiece(entry, choice, tieStop, tieStart) {
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
    }

    return piece;
  }

  function splitIntoMeasures(entries, capacity, pickupCapacity) {
    const hasPickup =
      Number(pickupCapacity) > 0 &&
      Number(pickupCapacity) < capacity;

    function makeMeasure(measureCapacity, implicit) {
      return {
        entries: [],
        used: 0,
        capacity: measureCapacity,
        implicit: Boolean(implicit),
        explicitMeasureRest: false
      };
    }

    const measures = [
      makeMeasure(
        hasPickup ? Number(pickupCapacity) : capacity,
        hasPickup
      )
    ];

    function currentMeasure() {
      return measures[measures.length - 1];
    }

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
        // Kokotahdin tauko säilyttää vanhan erityismerkityksensä.
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

      while (remaining > 0) {
        current = ensureWritableMeasure();

        const available = current.capacity - current.used;
        const chunkValue = Math.min(remaining, available);
        const choices = decomposeRenderValue(chunkValue);

        choices.forEach(function (choice) {
          const remainingAfterPiece = remaining - choice.value;

          const tieStop =
            entry.kind !== "rest" &&
            consumed > 0;

          const tieStart =
            entry.kind !== "rest" &&
            remainingAfterPiece > 0;

          current.entries.push(
            makeRenderPiece(
              entry,
              choice,
              tieStop,
              tieStart
            )
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

    if (
      measures.length > 1 &&
      measures[measures.length - 1].entries.length === 0
    ) {
      measures.pop();
    }

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
      while (
        end < measures.length &&
        measures[end].explicitMeasureRest
      ) {
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

    return [
      "      <attributes>",
      style,
      "      </attributes>"
    ].join("\n");
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
    const tempoText = score.metadata && score.metadata.tempoText
      ? String(score.metadata.tempoText).trim()
      : "";

    if (!tempoText) return "";

    return [
      "      <direction placement=\"above\">",
      "        <direction-type>",
      "          <words>" + escapeXML(tempoText) + "</words>",
      "        </direction-type>",
      "      </direction>"
    ].join("\n");
  }

  function createMusicXML(score) {
    if (!score || !Array.isArray(score.notes)) {
      throw new Error("Score Model puuttuu tai on virheellinen.");
    }

    const beats = Number(score.time && score.time[0]) || 4;
    const beatType = Number(score.time && score.time[1]) || 4;
    const fifths = Number.isInteger(score.key) ? score.key : 0;
    const title = score.metadata && score.metadata.title
      ? score.metadata.title
      : "Pikakirjoitin 3";
    const partName = score.metadata && score.metadata.partName
      ? score.metadata.partName
      : "Huilu";
    const composer = score.metadata && score.metadata.composer
      ? score.metadata.composer
      : "";
    const capacity = measureCapacity(beats, beatType);

    // StartScreenin pickupDuration käyttää samaa vanhan Coren yksikköä,
    // jossa kokonainen = 32. Nykyisessä XML:ssä kokonainen = 4*DIVISIONS.
    const pickupCapacity = (Number(score.pickupDuration) || 0) * (DIVISIONS / 8);

    const measures = annotateMultipleRests(
      splitIntoMeasures(score.notes, capacity, pickupCapacity)
    );

    const measuresXML = measures.map(function (measure, index) {
      const implicit = measure.implicit ? ' implicit="yes"' : "";
      const parts = ["    <measure number=\"" + (index + 1) + "\"" + implicit + ">"];

      if (index === 0) {
        parts.push(
          attributesToXML(
            score,
            beats,
            beatType,
            fifths,
            measure.multipleRestCount || 0
          )
        );
      } else if (measure.multipleRestCount >= 2) {
        parts.push(
          measureStyleAttributesXML(measure.multipleRestCount)
        );
      }

      let directionXML = "";
      if (index === 0) {
        directionXML = firstMeasureDirectionXML(score);
        if (directionXML) parts.push(directionXML);
      }

      if (measure.entries.length) {
        parts.push(
          measure.entries.map(function (entry) {
            return entryToXML(entry, {
              measureRest: measure.explicitMeasureRest,
              measureCapacity: capacity
            });
          }).join("\n")
        );
      } else if (index === 0 && directionXML) {
        // OSMD 2.1.2 tarvitsee ensimmäiseen tahtiin rytmisen aikapisteen,
        // kun siinä on direction/words mutta ei vielä yhtään näkyvää nuottia.
        // Sama ratkaisu on käytössä toimivassa Pikakirjoitin 2 Coressa:
        // näkymätön tauko täyttää tyhjän tahdin, mutta ei näy nuottikuvassa.
        parts.push(hiddenRestXML(measure.capacity || capacity));
      }

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
      <software>Pikakirjoitin 3 BASE 0.12</software>
    </encoding>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>${escapeXML(partName)}</part-name>
    </score-part>
  </part-list>
  <part id="P1">
${measuresXML}
  </part>
</score-partwise>`;
  }

  window.PikakirjoitinMusicXML = { createMusicXML: createMusicXML };
})();
