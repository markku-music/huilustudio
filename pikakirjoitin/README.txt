Pikakirjoitin 3 · BASE 0.6 · Aika-arvoeleet

Pohja:
- Pikakirjoitin 3 BASE 0.5
- Pikakirjoitin 2:n kaltainen laaja pianokoskettimisto
- Score Model → MusicXML → OSMD 2.1.2

Tässä versiossa lisätään ensimmäinen rytmielelogiikka:

- napautus = 1/4
- veto alas = 1/8
- veto ylös = 1/2
- pitkä painallus = 1/1

Elelogiikan perusparametrit on otettu Pikakirjoitin 2:n toimivasta koskettimistosta:
- pitkä painallus 500 ms
- pitkä painallus peruuntuu, jos sormi liikkuu yli 14 px
- pystyeleen kynnys skaalautuu koskettimiston korkeuden mukaan, min 24 px / max 48 px

Tärkeä rakenteellinen muutos:
- Nuotti lisätään Score Modeliin heti pointerdownissa neljäsosana.
- Jos ele vaihtaa aika-arvon, samaa nuottiobjektia päivitetään ID:n avulla.
- MusicXML generoidaan uudestaan muutoksen jälkeen.
- Tahtijako huomioi nyt 1/8-, 1/4-, 1/2- ja 1/1-arvot.

Ei vielä tässä versiossa:
- 1/16
- 1/32
- pisteellinen nuotti
- tauko
- peukalopalkki
- undo/redo
- äänimoottori
