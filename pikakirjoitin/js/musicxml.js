(function () {
  "use strict";

  const DIVISIONS = 4;
  const DURATION_VALUES = {
    whole: 16,
    half: 8,
    quarter: 4,
    eighth: 2,
    "16th": 1
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
    if (!match) {
      throw new Error("Virheellinen sävel: " + pitch);
    }

    return {
      step: match[1],
      alter: match[2] === "#" ? 1 : match[2] === "b" ? -1 : 0,
      octave: Number(match[3])
    };
  }

  function durationValue(duration) {
    const value = DURATION_VALUES[duration];
    if (!value) {
      throw new Error("Tuntematon aika-arvo: " + duration);
    }
    return value;
  }

  function noteToXML(note) {
    const pitch = parsePitch(note.pitch);
    const value = durationValue(note.duration);
    const alterXML = pitch.alter !== 0
      ? "<alter>" + pitch.alter + "</alter>"
      : "";

    return [
      "      <note>",
      "        <pitch><step>" + pitch.step + "</step>" + alterXML + "<octave>" + pitch.octave + "</octave></pitch>",
      "        <duration>" + value + "</duration>",
      "        <type>" + escapeXML(note.duration) + "</type>",
      "      </note>"
    ].join("\n");
  }

  function clefToXML(clef) {
    if (clef === "F") {
      return "<sign>F</sign><line>4</line>";
    }
    if (clef === "C") {
      return "<sign>C</sign><line>3</line>";
    }
    return "<sign>G</sign><line>2</line>";
  }

  function measureCapacity(beats, beatType) {
    return beats * DIVISIONS * (4 / beatType);
  }

  function splitIntoMeasures(notes, capacity) {
    const measures = [[]];
    let used = 0;

    notes.forEach(function (note) {
      const value = durationValue(note.duration);

      if (value > capacity) {
        throw new Error("Nuotin aika-arvo ei mahdu yhteen tahtiin tässä BASE-versiossa.");
      }

      if (used > 0 && used + value > capacity) {
        measures.push([]);
        used = 0;
      }

      measures[measures.length - 1].push(note);
      used += value;

      if (used === capacity) {
        measures.push([]);
        used = 0;
      }
    });

    if (measures.length > 1 && measures[measures.length - 1].length === 0) {
      measures.pop();
    }

    return measures;
  }

  function attributesToXML(score, beats, beatType, fifths) {
    return [
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
      "        </clef>",
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
    const measures = splitIntoMeasures(score.notes, capacity);

    const measuresXML = measures.map(function (notes, index) {
      const parts = ["    <measure number=\"" + (index + 1) + "\">"];
      if (index === 0) {
        parts.push(attributesToXML(score, beats, beatType, fifths));
      }
      if (notes.length) {
        parts.push(notes.map(noteToXML).join("\n"));
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
      <software>Pikakirjoitin 3 BASE 0.4</software>
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

  window.PikakirjoitinMusicXML = {
    createMusicXML: createMusicXML
  };
})();
