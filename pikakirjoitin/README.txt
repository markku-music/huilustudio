Pikakirjoitin 3 · BASE 0.16.0 · Rivien muokkaus

Pohja:
- virallinen BASE 0.15.1

Peukalopakin alin nappi:
- ↵ Rivien muokkaus
- toggle, ei paina-ja-pidä
- aktiivisena sininen

Kun Rivien muokkaus on pois:
- ↵-merkkejä ei näy nuottipaperilla
- viimeisen rivin venytyskahvaa ei näy

Kun Rivien muokkaus on päällä:

Rivinvaihto
- mahdollisten tahtiviivojen yläpuolella näkyy haalea ↵
- haalea ↵ = ei pakotettua rivinvaihtoa
- napautus lisää rivinvaihdon
- aktiivinen ↵ muuttuu siniseksi
- sinisen ↵-merkin napautus poistaa rivinvaihdon
- viimeisen tahdin jälkeen ei näytetä ↵-merkkiä

Rivinvaihto tallennetaan Score Modeliin:
score.layout.systemBreaks

MusicXML:
- seuraavan tahdin alkuun tulee <print new-system="yes"/>

OSMD:
- newSystemFromXML:true
- OSMD tekee varsinaisen rivijaon

Viimeisen rivin venytys
- viimeisen nuottirivin lopussa näkyy ↔-vetokahva
- kahvaa vedetään vaakasuunnassa
- sormen nostossa OSMD renderöi viimeisen rivin uudelleen
- SVG:tä ei venytetä CSS:llä
- käytössä OSMD:n LastSystemMaxScalingFactor
- oletus 1.4 säilyttää BASE 0.15.1:n ulkoasun
- sallittu alue 1...6

Venytys tallennetaan Score Modeliin:
score.layout.lastSystemMaxScalingFactor

BASE 0.15.1:n muu toiminta säilyy:
- portrait/landscape nuottikoon lukitus
- landscape-valinta
- A4 ja scrollaus
- slurit ja slurien poisto
- älytauot
- enharmoninen
- peukalopakin Tauko, pisteet ja Slur
- koskettimisto
- OSMD 2.1.2 vendor muuttumattomana
