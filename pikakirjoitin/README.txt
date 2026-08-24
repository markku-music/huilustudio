Pikakirjoitin 3 · BASE 0.10.1 · Pisteen liukuflyout

Pohja:
- BASE 0.10 Pisteet
- OSMD 2.1.2
- Score Model -> MusicXML -> OSMD
- explicit MusicXML multirest
- DIVISIONS 32

Peukalopalkin pistekäyttö:
- yhden pisteen nappi on aina näkyvissä
- nappikuvana käytetään 1_4_dot.svg-tiedostoa
- kun yhden pisteen nappia painetaan, kahden pisteen nappi ilmestyy sen oikealle puolelle
- kahden pisteen nappikuvana käytetään 1_4_double_dot.svg-tiedostoa
- saman peukalon liuku oikealle kahden pisteen napille muuttaa dots-arvon 1 -> 2
- liuku takaisin yhden pisteen alueelle muuttaa arvon takaisin 2 -> 1
- peukalon irrotus sulkee flyoutin ja poistaa pistemodifikaattorin
- Tauko voidaan pitää samaan aikaan pohjassa toisella sormella

Pystysiirto:
- peukalopalkkia voi edelleen siirtää pystysuunnassa Tauko-painikkeesta
- yhden pisteen painikkeen vaakaliuku on varattu 1 piste -> 2 pistettä -valintaan

OSMD:
- pisteet ovat edelleen MusicXML:n <dot/>-elementtejä
- OSMD piirtää pisteet
- vendor/opensheetmusicdisplay.min.js ei ole muuttunut
