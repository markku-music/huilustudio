F0 ENGINE BASE 2.0 + OSMD NUOTTINÄYTTÖ

Tiedostot:
- index.html
- f0-engine.js
- opensheetmusicdisplay.min.js

Rakenne:
f0-engine.js -> pitch event -> MIDI -> MusicXML -> OSMD -> 1/4-nuotti

Tärkeää:
- F0-moottori on oma erillinen tiedostonsa.
- Moottorin koodia ei ole kopioitu HTML:ään.
- f0-engine.js on byte-for-byte sama tiedosto kuin F0 ENGINE BASE 2.0:ssa.
- OSMD on käyttäjän toimittama paikallinen opensheetmusicdisplay.min.js.

Käyttö:
1. Avaa index.html HTTPS-palvelimelta tai localhostista.
2. Paina Käynnistä.
3. Ole hiljaa kalibroinnin ajan.
4. Soita.
5. Hyväksytty sävel piirretään 1/4-nuottina OSMD:llä.
