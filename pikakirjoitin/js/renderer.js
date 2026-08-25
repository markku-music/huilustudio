(function () {
  "use strict";

  let osmd = null;

  const DEFAULT_ENGRAVING_SETTINGS = Object.freeze({
    titleTopDistance: 5,
    composerDistance: 2,
    tempoYSpacing: 0.5
  });

  let engravingSettings = Object.assign({}, DEFAULT_ENGRAVING_SETTINGS);

  function finiteOr(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function setEngravingSettings(nextSettings) {
    nextSettings = nextSettings || {};

    engravingSettings = {
      titleTopDistance: finiteOr(
        nextSettings.titleTopDistance,
        engravingSettings.titleTopDistance
      ),
      composerDistance: finiteOr(
        nextSettings.composerDistance,
        engravingSettings.composerDistance
      ),
      tempoYSpacing: finiteOr(
        nextSettings.tempoYSpacing,
        engravingSettings.tempoYSpacing
      )
    };

    applyEngravingSettings();
    return getEngravingSettings();
  }

  function getEngravingSettings() {
    return Object.assign({}, engravingSettings);
  }

  function applyEngravingSettings() {
    if (!osmd || !osmd.EngravingRules) return;

    osmd.EngravingRules.TitleTopDistance =
      engravingSettings.titleTopDistance;

    osmd.EngravingRules.SystemComposerDistance =
      engravingSettings.composerDistance;

    osmd.EngravingRules.TempoYSpacing =
      engravingSettings.tempoYSpacing;
  }

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

    // Pidetään kaikki muu OSMD:n "default"-presetissä.
    // Vain nämä kolme käyttäjän säätämää kaiverrussääntöä ylikirjoitetaan.
    applyEngravingSettings();

    await osmd.load(musicXML);

    // Varmistetaan arvot myös loadin jälkeen ennen layoutia/renderiä.
    applyEngravingSettings();

    osmd.render();
    return osmd;
  }

  window.PikakirjoitinRenderer = {
    renderMusicXML,
    setEngravingSettings,
    getEngravingSettings,
    DEFAULT_ENGRAVING_SETTINGS
  };
})();
