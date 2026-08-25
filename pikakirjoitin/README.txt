Pikakirjoitin 3 · BASE 0.11.4 · OSMD tekstiasetukset

Pohja:
- käyttäjän palauttama BASE 0.11.3 OSMD Oletus Otsikko Säveltäjä

Uutta:
Pikakirjoittimen yläreunassa on pieni ratas.
Rattaan takana on kolme pientä pudotusvalikkoa:

1. Otsikko
   -> OSMD EngravingRules.TitleTopDistance
   -> OSMD 2.1.2 oletus 5.0

2. Säveltäjä
   -> OSMD EngravingRules.SystemComposerDistance
   -> OSMD 2.1.2 oletus 2.0

3. Tempo
   -> OSMD EngravingRules.TempoYSpacing
   -> OSMD 2.1.2 oletus 0.5

Asetukset:
- vaikuttavat heti nykyiseen nuottikuvaan
- tallentuvat selaimen localStorageen
- palautuvat seuraavalla avauskerralla
- "Palauta oletukset" palauttaa 5.0 / 2.0 / 0.5

OSMD:
- drawingParameters: "default"
- drawTitle: true
- drawComposer: true
- autoBeam: true
- autoGenerateMultipleRestMeasuresFromRestMeasures: false
- vain nämä kolme tekstien kaiverrussääntöä ylikirjoitetaan käyttäjän valinnoilla
- vendor/opensheetmusicdisplay.min.js on täysin muuttumaton

Muu Pikakirjoittimen toiminta on 0.11.3:sta ennallaan.
