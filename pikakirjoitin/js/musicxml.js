(function () {
  "use strict";

  const DIVISIONS = 32;
  const DURATION_VALUES = {
    whole: 128,
    half: 64,
    quarter: 32,
    eighth: 16,
    sixteenth: 8,
    "thirty-second": 4
  };

  const MUSICXML_TYPES = {
    sixteenth: "16th",
    "thirty-second": "32nd"
  };

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

    const parts = [
      "      <note>",
      "        <pitch><step>" + pitch.step + "</step>" + alterXML + "<octave>" + pitch.octave + "</octave></pitch>",
      "        <duration>" + value + "</duration>",
      "        <voice>1</voice>",
      "        <type>" + escapeXML(xmlType(entry.duration)) + "</type>"
    ];

    parts.push.apply(parts, dotsToXML(entry.dots));
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

  function splitIntoMeasures(entries, capacity, pickupCapacity) {
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

    const measures = [
      makeMeasure(hasPickup ? Number(pickupCapacity) : capacity, hasPickup)
    ];

    entries.forEach(function (entry) {
      let current = measures[measures.length - 1];

      if (isMeasureRestEntry(entry)) {
        // Kokotahdin tauko on aina täysi tahti.
        // Jos kohotahti on vielä täysin tyhjä, sitä ei jätetä erilliseksi
        // tyhjäksi tahdiksi ennen ensimmäistä kokotaukoa.
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

      const value = durationValue(entry);

      if (value > capacity) {
        throw new Error("Aika-arvo ei mahdu yhteen tahtiin tässä BASE-versiossa.");
      }

      // Jos ensimmäinen tapahtuma ei mahdu valittuun kohotahtiin,
      // käytä tavallista ensimmäistä tahtia tyhjän kohotahdin sijasta.
      if (
        current.implicit &&
        current.entries.length === 0 &&
        value > current.capacity
      ) {
        current.capacity = capacity;
        current.implicit = false;
      }

      if (current.used > 0 && current.used + value > current.capacity) {
        current = makeMeasure(capacity, false);
        measures.push(current);
      }

      current.entries.push(entry);
      current.used += value;

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

      if (index === 0) {
        const directionXML = firstMeasureDirectionXML(score);
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
      <software>Pikakirjoitin 3 BASE 0.11</software>
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
