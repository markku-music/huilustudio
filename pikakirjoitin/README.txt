Pikakirjoitin 3 · BASE 0.8 · OSMD 2.1.2 automaattipalkitus

Pohja:
- Pikakirjoitin 3 BASE 0.7
- kaikki kuusi aika-arvoelettä säilyvät ennallaan
- Score Model → MusicXML → OSMD 2.1.2

Tämän version ainoa varsinainen toiminnallinen muutos:
- OSMD:n oma automaattipalkitus on kytketty päälle asetuksella:
  autoBeam: true

Tärkeää:
- Pikakirjoitin EI lisää MusicXML:ään <beam>-elementtejä.
- Palkituslogiikkaa EI ole kirjoitettu Pikakirjoittimeen.
- OSMD 2.1.2 saa nuottien aika-arvot ja päättää palkituksen itse.

Näin voidaan testata puhtaasti, riittääkö OSMD:n oma palkitus Pikakirjoitin 3:n tarpeisiin.

Hyviä testisarjoja:
- 8 x 1/8
- 16 x 1/16
- 1/8 + 1/16 + 1/16
- useita 1/32-nuotteja
- sekoituksia 1/8, 1/16 ja 1/32 saman tahdin sisällä

Jos OSMD:n oma palkitus käyttäytyy halutusti, omaa palkitusmoottoria ei tarvitse tehdä.
