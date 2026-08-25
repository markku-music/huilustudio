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

        // OSMD:n normaali piirto-/kaiverruspresetti.
        // Tässä presetissä otsikko ja säveltäjä ovat oletuksena näkyvissä.
        drawingParameters: "default",
        drawTitle: true,
        drawComposer: true,

        // Nämä kaksi ovat Pikakirjoittimen toiminnallisia valintoja,
        // eivät ulkoasun tiivistyksiä:
        // - OSMD palkittaa kirjoitetut lyhyet nuotit automaattisesti.
        // - multirestit tulevat jo MusicXML:stä eksplisiittisesti.
        autoBeam: true,
        autoGenerateMultipleRestMeasuresFromRestMeasures: false
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
