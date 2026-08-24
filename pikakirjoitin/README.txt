Pikakirjoitin 3 · BASE 0.7 · Täydet aika-arvoeleet

Pohja:
- Pikakirjoitin 3 BASE 0.6
- Pikakirjoitin 2:n kaltainen laaja pianokoskettimisto
- Score Model → MusicXML → OSMD 2.1.2

Täysi kosketinelelogiikka on nyt sama kuin Pikakirjoitin 2 Core 0.22.7.8:ssa:

- napautus = 1/4
- veto alas = 1/8
- veto ylös = 1/2
- veto oikealle = 1/16
- veto vasemmalle = 1/32
- pitkä painallus = 1/1

Eleparametrit säilyvät Pikakirjoitin 2:n mukaisina:
- pitkä painallus 500 ms
- pitkä painallus peruuntuu, kun liike ylittää 14 px
- eleen suunta määräytyy sen mukaan, onko |dx| vai |dy| suurempi
- pääsuunnan liikkeen pitää ylittää koskettimiston korkeudesta skaalautuva kynnys
  (12 %, vähintään 24 px, enintään 48 px)

MusicXML:
- sisäinen sixteenth muunnetaan MusicXML-tyypiksi 16th
- sisäinen thirty-second muunnetaan MusicXML-tyypiksi 32nd
- divisions nostettu arvoon 8, jotta 1/32 voidaan esittää kokonaislukuna
- 4/4-tahtijako osaa nyt 1/1, 1/2, 1/4, 1/8, 1/16 ja 1/32

Ei vielä tässä versiossa:
- palkituslogiikka
- pisteellinen nuotti
- tauko
- peukalopalkki
- undo/redo
- äänimoottori
