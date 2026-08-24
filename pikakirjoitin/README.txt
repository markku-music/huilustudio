Pikakirjoitin 3 · BASE 0.2 · Score Model · OSMD 2.1.2

Tarkoitus:
- toinen puhdas lähtöpiste Pikakirjoitin 3:lle
- nuottidata ei enää asu valmiina MusicXML-merkkijonossa
- oma Score Model tuottaa MusicXML:n
- MusicXML annetaan rendererille ja OSMD 2.1.2 piirtää nuottikuvan
- ruudulla näkyy edelleen sama testitahti: C–D–E–F neljäsosina, 4/4, G-avain, C-duuri
- generoitu Score Model ja MusicXML tulostetaan selaimen konsoliin kehitystä varten

Tietovirta:
Score Model -> MusicXML -> renderer -> OSMD 2.1.2 -> SVG-nuottikuva

Rakenne:
- index.html
- css/app.css
- js/score-model.js
- js/musicxml.js
- js/renderer.js
- js/app.js
- vendor/opensheetmusicdisplay.min.js

Score Modelin testidata:
- clef: G
- key: 0
- time: 4/4
- notes: C5, D5, E5, F5
- duration: quarter

OSMD:
- version: 2.1.2-release
- SHA-256: aebc98218f52a2530251935b9ab7cffa30502bff32f06877cbc79e433b4374b1

Seuraava suunniteltu askel:
BASE 0.3: ensimmäinen kosketin -> lisää nuotti Score Modeliin -> MusicXML -> OSMD.
