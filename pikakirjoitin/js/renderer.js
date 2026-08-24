(function () {
  "use strict";

  let osmd = null;

  async function renderMusicXML(musicXML, containerId) {
    if (!window.opensheetmusicdisplay || !window.opensheetmusicdisplay.OpenSheetMusicDisplay) {
      throw new Error("OSMD-kirjastoa ei löytynyt.");
    }

    if (!osmd) {
      osmd = new window.opensheetmusicdisplay.OpenSheetMusicDisplay(containerId, {
        autoResize: true,
        backend: "svg",
        drawingParameters: "compacttight",
        autoBeam: true,
        autoGenerateMultipleRestMeasuresFromRestMeasures: true
      });
    }

    await osmd.load(musicXML);
    osmd.render();
    return osmd;
  }

  window.PikakirjoitinRenderer = {
    renderMusicXML
  };
})();
