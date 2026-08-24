(function () {
  "use strict";

  const TEST_SCORE_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work>
    <work-title>Pikakirjoitin 3 · OSMD 2.1.2 -testi</work-title>
  </work>
  <identification>
    <encoding>
      <software>Pikakirjoitin 3 BASE 0.1</software>
    </encoding>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>Huilu</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key>
          <fifths>0</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
      <note>
        <pitch><step>C</step><octave>5</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>D</step><octave>5</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>E</step><octave>5</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>F</step><octave>5</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
    </measure>
  </part>
</score-partwise>`;

  async function start() {
    const status = document.getElementById("status");

    try {
      await window.PikakirjoitinRenderer.renderMusicXML(TEST_SCORE_XML, "osmd-container");
      status.textContent = "OK · C–D–E–F, 4/4, G-avain · OSMD 2.1.2 renderöi paikallisesti.";
      status.className = "status ok";
    } catch (error) {
      console.error(error);
      status.textContent = "Virhe: " + (error && error.message ? error.message : String(error));
      status.className = "status error";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
