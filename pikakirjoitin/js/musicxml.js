(function () {
  "use strict";

  const DIVISIONS = 8;
  const DURATION_VALUES = {
    whole: 32,
    half: 16,
    quarter: 8,
    eighth: 4,
    sixteenth: 2,
    "thirty-second": 1
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

  function durationValue(duration) {
    const value = DURATION_VALUES[duration];
    if (!value) throw new Error("Tuntematon aika-arvo: " + duration);
    return value;
  }

  function xmlType(duration) {
    return MUSICXML_TYPES[duration] || duration;
  }

  function entryToXML(entry, options) {
    const config = options || {};
    const isMeasureRest = Boolean(config.measureRest);

    if (entry.kind === "rest") {
      const value = isMeasureRest
        ? Number(config.measureCapacity)
        : durationValue(entry.duration);

      return [
        "      <note>",
        isMeasureRest ? "        <rest measure=\"yes\"/>" : "        <rest/>",
        "        <duration>" + value + "</duration>",
        "        <voice>1</voice>",
        "        <type>" + (isMeasureRest ? "whole" : escapeXML(xmlType(entry.duration))) + "</type>",
        "      </note>"
      ].join("\n");
    }

    const pitch = parsePitch(entry.pitch);
    const value = durationValue(entry.duration);
    const alterXML = pitch.alter !== 0
      ? "<alter>" + pitch.alter + "</alter>"
      : "";

    return [
      "      <note>",
      "        <pitch><step>" + pitch.step + "</step>" + alterXML + "<octave>" + pitch.octave + "</octave></pitch>",
      "        <duration>" + value + "</duration>",
      "        <voice>1</voice>",
      "        <type>" + escapeXML(xmlType(entry.duration)) + "</type>",
      "      </note>"
    ].join("\n");
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
    return entry && entry.kind === "rest" && entry.duration === "whole";
  }

  function splitIntoMeasures(entries, capacity) {
    const measures = [{ entries: [], used: 0, explicitMeasureRest: false }];

    entries.forEach(function (entry) {
      let current = measures[measures.length - 1];

      // Pitkä + Tauko = kokotahdin tauko. Se saa oman tahdin.
      if (isMeasureRestEntry(entry)) {
        if (current.used > 0 || current.entries.length > 0) {
          current = { entries: [], used: 0, explicitMeasureRest: false };
          measures.push(current);
        }

        current.entries.push(entry);
        current.used = capacity;
        current.explicitMeasureRest = true;
        measures.push({ entries: [], used: 0, explicitMeasureRest: false });
        return;
      }

      const value = durationValue(entry.duration);

      if (value > capacity) {
        throw new Error("Aika-arvo ei mahdu yhteen tahtiin tässä BASE-versiossa.");
      }

      if (current.used > 0 && current.used + value > capacity) {
        current = { entries: [], used: 0, explicitMeasureRest: false };
        measures.push(current);
      }

      current.entries.push(entry);
      current.used += value;

      if (current.used === capacity) {
        measures.push({ entries: [], used: 0, explicitMeasureRest: false });
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

      // Yksi kokotahdin tauko pysyy tavallisena kokotaukona.
      // Kahdesta alkaen MusicXML kertoo OSMD:lle ryhmän eksplisiittisesti.
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
    const parts = [
      "      <attributes>",
      "        <divisions>" + DIVISIONS + "</divisions>",
      "        <key>",
      "          <fifths>" + fifths + "</fifths>",
      "        </key>",
      "        <time>",
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
    const capacity = measureCapacity(beats, beatType);
    const measures = annotateMultipleRests(
      splitIntoMeasures(score.notes, capacity)
    );

    const measuresXML = measures.map(function (measure, index) {
      const parts = ["    <measure number=\"" + (index + 1) + "\">"];

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
    <encoding>
      <software>Pikakirjoitin 3 BASE 0.9.1</software>
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
