Pikakirjoitin 2 Core 0.5 – Aloitusruutu ja audio unlock

Pikakirjoitin 2 Core 0.2
========================

Tarkoitus
---------
Puhdas kirjoitusydin, jossa on vain:
- OSMD-nuottipaperi
- viiden oktaavin koskettimisto
- koskettimiston vaakasiirto
- perusnuottien syöttö
- iPad-yhteensopiva jatkuva Web Audio -ääni

Ääni
----
Ensimmäinen koskettimen pointerdown:
- luo AudioContextin
- luo yhden pysyvän triangle-oskillaattorin ja gain-solmun
- käynnistää oscillatorin kerran
- kutsuu AudioContext.resume() samassa käyttäjäeleessä
- soittaa jo ensimmäisen painetun sävelen

Seuraavilla sävelillä oskillaattoria ei luoda uudelleen. Vain sen taajuutta ja
gainia muutetaan. Äänimoottori on omassa js/audio-engine.js-moduulissaan.

Koskettimiston eleet
--------------------
- napautus: neljäsosanuotti
- veto alas: kahdeksasosanuotti
- veto ylös: puolinuotti
- pitkä painallus: kokonuotti

Nuottipaperi
------------
Nuottipaperilla ei ole JavaScript-eleitä. Yhden sormen pystysuuntainen vieritys
on kokonaan selaimen/iPadOS:n natiivia scrollausta.
