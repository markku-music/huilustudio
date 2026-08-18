SÄVELKORTTI PWA 1.0

Käyttö:
- Avaa index.html palvelimen kautta tai julkaise kansio GitHub Pagesiin.
- Napauta korttia tai Uusi sävel -painiketta.
- PWA voidaan asentaa puhelimen/tabletin kotinäytölle.
- Service worker välimuistittaa sovelluksen offline-käyttöön.

Tiedostot:
index.html
style.css
app.js
manifest.webmanifest
service-worker.js
icon-192.png
icon-512.png


Versio 1.1:
- Korjattu PWA:n vaakasuunnan käynnistyksen viewport-mitoitus.
- Koko tarkistetaan käynnistyksessä, orientaation vaihtuessa ja palattaessa appiin.


Versio 1.2:
- Estetty vääränkokoisen ensimmäisen ruudun näkyminen vaakatasossa.
- Sovellus paljastetaan vasta, kun viewport on mitattu kahden animaatiokehyksen ajan.
- Poistaa vasempaan yläkulmaan ankkuroituvan suuren alkuvälähdyksen.
