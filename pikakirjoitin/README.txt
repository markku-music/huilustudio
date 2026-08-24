Pikakirjoitin 3 · BASE 0.4 · Kahdeksan säveltä

Tämän version tarkoitus:
- Testata ensimmäistä oikeaa 8-sävelistä syöttöä.
- Sävelet: C4, D4, E4, F4, G4, A4, B4 (suomalainen H) ja C5.
- Jokainen kosketus lisää Score Modeliin yhden neljäsosanuotin.
- Score Model muutetaan MusicXML:ksi.
- OSMD 2.1.2 renderöi MusicXML:n.
- 4/4-tahtijako syntyy edelleen automaattisesti.

Tietovirta:
Kosketin → Score Model → MusicXML → OSMD 2.1.2 → nuottikuva

Huom:
MusicXML käyttää sävelnimeä B luonnolliselle h-sävelelle.
Käyttöliittymässä näytetään suomalaisen käytännön mukaisesti H.

Tässä BASE-versiossa ei vielä ole:
- mustia koskettimia / muunnesäveliä
- aika-arvoeleitä
- taukoja
- valintaa tai editointia
- undo/redo-toimintoa

Tavoite on pitää jokainen kehitysaskel mahdollisimman pieni ja testattava.
