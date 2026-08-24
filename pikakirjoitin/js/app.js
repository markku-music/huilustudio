(function () {
  "use strict";

  async function start() {
    const status = document.getElementById("status");

    try {
      const score = window.PikakirjoitinScoreModel.createTestScore();
      const musicXML = window.PikakirjoitinMusicXML.createMusicXML(score);

      // Kehitystä varten: tästä näkee aina täsmälleen OSMD:lle syötetyn XML:n.
      console.log("Pikakirjoitin 3 Score Model:", score);
      console.log("Pikakirjoitin 3 generoitu MusicXML:\n", musicXML);

      await window.PikakirjoitinRenderer.renderMusicXML(musicXML, "osmd-container");
      status.textContent = "OK · Score Model → MusicXML → OSMD 2.1.2 · C–D–E–F näkyy edelleen samana.";
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
