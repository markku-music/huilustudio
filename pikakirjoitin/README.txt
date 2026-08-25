Pikakirjoitin 3 · BASE 0.14.9 · A4 landscape koko leveys

Pohja:
- toimiva BASE 0.14.7 A4-paperi lukittu
- rikkinäistä 0.14.8-versiota EI ole käytetty pohjana

Muutos on tarkoituksella hyvin pieni.

1. Portrait
- täysin sama A4-mitoitus kuin BASE 0.14.7:ssä
- score-card, scrollaus ja kosketuselelogiikka ennallaan

2. Landscape
- A4-paperi käyttää score-cardin koko sisäleveyden
- score-cardin alkuperäiset 12 px sivupaddingit säilyvät
- A4-suhde 210:297 säilyy
- paperi kasvaa samalla korkeammaksi ja sitä scrollataan pystysuunnassa
- score-cardin scrollausmekanismiin ei ole koskettu

3. Paperin päällä näkyneet omat reunat
- OSMD-kontin, sen välittömän divin ja SVG:n HTML/CSS-tausta asetetaan läpinäkyväksi
- niiltä poistetaan CSS-border, outline ja box-shadow
- varsinainen .a4-paper säilyy ainoana paperipintana
- OSMD:n nuotinnuslogiikkaan ei kosketa

Turvallisuus:
- app.js muuttumaton
- score-selection.js muuttumaton
- selection-editor.js muuttumaton
- score-model.js muuttumaton
- thumb-rail.js muuttumaton
- OSMD vendor muuttumaton
- slur-kuvake muuttumaton

Ainoa JS-tiedoston muutos on musicxml.js:n ohjelmistoversion tekstissä 0.14.7 -> 0.14.9.
