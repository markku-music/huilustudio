Pikakirjoitin 3 · BASE 0.15.1 · Landscape-valinta korjattu

Pohja:
- BASE 0.15.0 Portrait-nuottikoko lukittu

Korjaus:
- Pikakirjoitin 2:n toimivassa portrait-nuottikoko-lukitussa versiossa
  OSMD-kontilla oli pointer-events:none
- Pikakirjoitin 3:ssa tämä puuttui
- zoomattu OSMD/SVG pystyi siksi iPadin landscape-tilassa jäämään
  kosketuksen vastaanottavaksi kerrokseksi score-cardin päälle

Nyt:
- #osmd-container ja sen kaikki lapset ovat pointer-events:none
- kosketukset menevät aina .score-cardille
- ScoreRangeSelection laskee nuottiosumat edelleen getBoundingClientRect-
  geometriasta, joten nuottien napautus ja vaakavalinta toimivat normaalisti
- OSMD:n nuottikuva säilyy täysin näkyvänä, vain sen oma hit-testing poistuu

Säilytetty ennallaan:
- BASE 0.15.0:n portrait/landscape nuottikoon lukitus
- A4-paperi ja scrollaus
- renderer.js
- score-selection.js
- score-model
- slurit
- peukalopakki
- koskettimisto
- OSMD 2.1.2 vendor
- käyttäjän slur.svg

Ainoa toiminnallinen muutos on OSMD-kerroksen pointer-eventtien poistaminen.
