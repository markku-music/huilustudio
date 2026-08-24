Pikakirjoitin 3 · BASE 0.3 · Ensimmäinen kosketin · OSMD 2.1.2

Tarkoitus:
- ensimmäinen oikea syöttö Pikakirjoitin 3:ssa
- yksi C-kosketin
- jokainen painallus lisää C4-neljäsosanuotin Score Modeliin
- Score Model tuottaa MusicXML:n
- renderer antaa MusicXML:n OSMD 2.1.2:lle
- OSMD piirtää päivittyvän nuottikuvan
- 4/4-tahtiin syntyy automaattisesti uusi tahti neljän neljäsosanuotin jälkeen

Tietovirta:
C-kosketin -> Score Model -> MusicXML -> renderer -> OSMD 2.1.2 -> SVG-nuottikuva

Rakenne:
- index.html
- css/app.css
- js/score-model.js
- js/musicxml.js
- js/renderer.js
- js/app.js
- vendor/opensheetmusicdisplay.min.js

Score Model:
- clef: G
- key: 0
- time: 4/4
- lähtötilanne: notes = []
- koskettimen lisäämä nuotti: C4, quarter

BASE 0.3:ssa EI vielä ole:
- muita säveliä
- muita aika-arvoja
- taukoja
- eleitä
- undo/redo-toimintoja
- valintaa tai editointia
- automaattista sidotusta yli tahtiviivan

OSMD:
- version: 2.1.2-release
- sama vendor/opensheetmusicdisplay.min.js kuin BASE 0.2:ssa

Seuraava luonteva askel:
BASE 0.4: laajennetaan koskettimisto useaan säveleen, mutta pidetään aika-arvo vielä neljäsosana.
