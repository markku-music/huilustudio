Leo Lentäjä – mobiilipeli / prototyyppi 2.2

Pelin toiminta
- KORKEA ääni vie yläreitille.
- MATALA ääni vie alareitille.
- Tähti oikealla reitillä -> +1 piste.
- Vakaus vaikuttaa koneen väpätykseen.
- Äänen loputtua kone jää viimeiselle valitulle reitille.
- Korkeuden vaihto käyttää 780 ms pehmeää smootherstep-siirtymää.

Pilvet 2.2
- Käytössä ovat kolme käyttäjän toimittamaa pilvikuvaa.
- Pilvien Y-sijainti reagoi nyt näkymän korkeuteen ja ikkunan aspect ration muutoksiin.
- Ikkunan koon muuttuessa pilvet skaalataan ja järjestetään uudelleen nykyiseen viewportiin.
- Pilvivirralla on minimi- ja maksimiväli, joten pilvet eivät kasaannu ryppäiksi eivätkä jätä pitkiä tyhjiä jaksoja.
- Vasemmalta poistuva pilvi siirtyy oikeanpuoleisimman pilven perään hallitulla välillä.
- Pilvien nopeuksissa ja korkeuksissa on edelleen vaihtelua.
- Usvaominaisuus on poistettu kokonaan. Koneen blur/opacity ei enää reagoi pilviin.

Kehittäjätila
- dBFS, mikrofonikynnys, F0, vakaus, LOW/HIGH, BEST, GAP, tunnistus ja puhalluksen pituus
- propelli X/Y/koko/sivukääntö/idle-nopeus/aktiivinen nopeus
- nokan kallistus
- JSON vienti/tuonti

Oletusasetukset
- propelli X 91.4
- propelli Y 50.7
- koko 40
- sivukääntö 78°
- idle 180 ms
- aktiivinen 55 ms
- nokan kallistus 20°

JSON
- propeller.x
- propeller.y
- propeller.size
- propeller.sideTilt
- propeller.idleMs
- propeller.activeMs
- flight.noseTiltDeg
- usvaan liittyviä asetuksia ei enää ole

Äänimoottori on ennallaan
- FFT 8192
- YIN 4096
- analyysi 16 ms
- 8 harmonista
- hyväksymisraja 50 %
- LOW/HIGH-erotteluraja 7 pp
- autokalibrointi = pohjataso + 10 dB
- vakaus = 200 ms attack-ohitus + 400 ms raaka F0 -ikkuna centeissä

Tiedostot
- index.html
- lentokone_sivu.webp
- leo_lentaja_asetukset_DEFAULT.json
- pilvi_levea.webp
- pilvi_keski.webp
- pilvi_iso.webp
- README.txt
