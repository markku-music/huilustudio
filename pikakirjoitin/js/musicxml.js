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

  function noteToXML(note) {
    const pitch = parsePitch(note.pitch);
    const durationValue = DURATION_VALUES[note.duration];

    if (!durationValue) {
      throw new Error("Tuntematon aika-arvo: " + note.duration);
    }

    const alterXML = pitch.alter !== 0
      ? "<alter>" + pitch.alter + "</alter>"
      : "";

    return [
      "      <note>",
      "        <pitch><step>" + pitch.step + "</step>" + alterXML + "<octave>" + pitch.octave + "</octave></pitch>",
      "        <duration>" + durationValue + "</duration>",
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
    const notesXML = score.notes.map(noteToXML).join("\n");

    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<score-partwise version="3.1">
  <work>
    <work-title>${escapeXML(title)}</work-title>
  </work>
  <identification>
    <encoding>
      <software>Pikakirjoitin 3 BASE 0.2</software>
    </encoding>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>${escapeXML(partName)}</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>${DIVISIONS}</divisions>
        <key>
          <fifths>${fifths}</fifths>
        </key>
        <time>
          <beats>${beats}</beats>
          <beat-type>${beatType}</beat-type>
        </time>
        <clef>
          ${clefToXML(score.clef)}
        </clef>
      </attributes>
${notesXML}
    </measure>
  </part>
</score-partwise>`;
  }

  window.PikakirjoitinMusicXML = {
    createMusicXML: createMusicXML
  };
})();
