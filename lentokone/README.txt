Lentokone – PWA 1.5 – ilman vakautta

Uutta 1.1
- Pystyasennon ohjeteksti on nyt "Käännä vaakatasoon".
- iPhone-kokoinen näkymä säilyy ennallaan.
- Visuaalinen mittakaava on nyt täysin dynaaminen eikä sidottu tiettyyn laitetyyppiin.
- Skaala lasketaan nykyisen viewportin leveydestä ja korkeudesta, ja päivittyy myös ikkunan kokoa muutettaessa.
- iPhone 15:n vaakakoko toimii vertailutasona 1.0. Suuremmilla näytöillä lentokone, tähdet, pilvet ja käyttöliittymän pääelementit kasvavat portaattomasti.
- Skaala rajataan noin 1.75-kertaiseksi, jotta hyvin suuret näytöt eivät tee elementeistä kohtuuttoman suuria.
- Pilvien koko ja määrä mukautuvat samaan viewport-skaalaan.
- Service workerin cache-versio on päivitetty, jotta PWA ei jää käyttämään vanhaa näkymää.

Muutos 1.4
- Vakaustoiminto on poistettu kokonaan.
- Vakauslaskentaa ei enää tehdä.
- Kehittäjäpaneelin vakausmittari on poistettu.
- Koneen vakauteen perustuva väpätys on poistettu.
- LOW/HIGH-tunnistus ja muu äänimoottori on jätetty ennalleen.

Uutta 1.5
- UFO 🛸 keinuu kevyesti noin ±4° hitaalla 1,45 s rytmillä.
- Keinunta on eristetty UFO-emojin sisäelementtiin, joten kerättävän etenemisliike ja pelisilmukka pysyvät ennallaan.

Pelin toiminta
- KORKEA ääni vie yläreitille.
- MATALA ääni vie alareitille.
- ★ tähti oikealla reitillä -> +1 piste.
- 🛸 UFO -> +2 pistettä, noin 7 % kerättävistä.
- 🚀 raketti -> +10 pistettä, noin 1 % kerättävistä.
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
- dBFS, mikrofonikynnys, F0, LOW/HIGH, BEST, GAP, tunnistus ja puhalluksen pituus
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

Tiedostot
- index.html
- lentokone_sivu.webp
- lentokone_asetukset_DEFAULT.json
- pilvi_levea.webp
- pilvi_keski.webp
- pilvi_iso.webp
- README.txt


PWA
- Sovelluksen nimi: Lentokone
- manifest.webmanifest määrittää asennettavan sovelluksen nimen, kuvakkeet ja vaakasuuntaisen käytön.
- sw.js välimuistittaa pelin staattiset tiedostot offline-käyttöä varten.
- Mikrofonin käyttö vaatii selaimessa suojatun ympäristön: HTTPS tai localhost.
- Kun peli on kerran ladattu palvelimelta, PWA:n staattinen käyttöliittymä voidaan avata myös ilman verkkoyhteyttä.
- Mikrofoniohjaus toimii laitteessa normaalisti, kun selaimelle/PWA:lle on annettu mikrofonilupa.

PWA-tiedostot
- manifest.webmanifest
- sw.js
- icons/icon-192.png
- icons/icon-512.png
- icons/icon-maskable-512.png
- icons/apple-touch-icon.png

PWA-päivitys
- Yläreunassa on ↻-nappi pelin päivittämiseen.
- Päivitysnappi tyhjentää PWA-välimuistin, tarkistaa service worker -päivityksen ja lataa pelin uudelleen verkosta.
- HTML-navigointi on network-first, joten uusi index.html haetaan verkosta aina kun yhteys toimii.
- Offline-tilassa käytetään edelleen välimuistissa olevaa versiota.
