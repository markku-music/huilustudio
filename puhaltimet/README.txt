Puhaltimet 0.3.9

Muutokset 0.3.8 -> 0.3.9:
- Automaattinen mikrofonikalibrointi tehdään vain mikrofonin ensimmäisellä käynnistyksellä.
- Profiilin vaihto ja uuden profiilin luonti eivät enää kalibroi uudelleen saman käynnistyksen aikana.
- Yksittäisen ääninäytteen poisto ei avaa selaimen confirm-ikkunaa.
- Näytteen poistamisen jälkeen Web Audio varmistetaan takaisin running-tilaan ja analyysilooppi jatkuu.
- Kalibroi-nappi: manuaalinen uudelleenkalibrointi ilman sivun lataamista.
- Refresh-nappi: lataa sovelluksen uudelleen; seuraavalla mikrofonin käynnistyksellä kalibrointi tehdään normaalisti.
- Lisätty iOS/iPadOS-turva, joka yrittää jatkaa AudioContextia sovellukseen palattaessa.

Äänimuisti-peli käyttää oppilaan omia tallennettuja ääninäytteitä referensseinä.
