F0 ENGINE · OSMD + PYSTYSUUNTAINEN VIRITYSMITTARI + PIANOÄÄNI

Rakenne
- f0-engine.js: F0/YIN/tunnistus
- instrument-controller.js: soitinvire, transponointi, valitut sävelet ja profiili
- audio-engine.js: Pikakirjoittimen koskettimistoääni
- opensheetmusicdisplay.min.js: OSMD
- index.html: UI

Tämän version muutokset
- Viritysmittari on pystysuuntainen ja OSMD:n oikealla puolella.
- +50 cent on ylhäällä, 0 keskellä, -50 cent alhaalla.
- OSMD:n oletuskoko pysyy 330 %.
- OSMD:n clipping-korjaus säilyy.
- 3 oktaavin koskettimisto c–c³ säilyy apin alareunassa.
- Kosketinta painettaessa kuuluu Pikakirjoittimen audio-engine.js:n ääni.
- Ääni käyttää valitun soitinvireen mukaista SOIVAA MIDI-säveltä.
  Esimerkiksi B♭-soittimen kirjoitettu C soi B♭:nä.
- Koskettimen klikkaus valitsee/poistaa sävelen kuten ennenkin.

Tärkeää
- f0-engine.js on säilytetty tavutasolla muuttamattomana.
- instrument-controller.js on säilytetty tavutasolla muuttamattomana.
- audio-engine.js on kopioitu tavutasolla Pikakirjoitin-paketista.
