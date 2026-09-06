Lentokone – PWA 1.8 – kohteeseen sovitettu lento – välitön lentoreaktio

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

Uutta 1.6
- Korkeudenvaihdon alun nollanopeus on poistettu.
- Kone alkaa nousta tai laskea heti, kun KORKEA/MATALA tunnistetaan.
- 780 ms kokonaiskesto säilyy.
- Loppu hidastuu edelleen pehmeästi reitille.
- Äänentunnistukseen ei ole tehty muutoksia.

Kohteeseen sovitettu lento 1.7
- Kun pelaaja vaihtaa reittiä, kone hakee seuraavan näkyvän kerättävän valitulta reitiltä.
- Kone laskee kerättävän vaakasijainnista ajan kohtaamiseen ja sovittaa nousun/laskun keston siihen.
- Ajoissa annetulla komennolla kone saavuttaa reittikorkeuden kohteen kohdalla.
- Koneen suurinta korkeudenvaihtonopeutta ei ylitetä: täysi reittivaihto voi nopeimmillaan kestää 780 ms.
- Jos komento tulee liian myöhään, kone lähtee silti heti mutta kerättävä ehtii näkyvästi ohi ennen kuin kone saavuttaa oikean korkeuden.
- Piste annetaan nyt todellisen korkeuden perusteella, ei pelkän valitun reitin perusteella.
- Jos valitulla reitillä ei ole vielä näkyvää kerättävää, kone siirtyy reitille normaalilla suurimmalla nopeudella.
- Äänentunnistus ja kerättävien vaakaliike ovat ennallaan.

Vaikeustaso 1.8
- Vaikeus kasvaa jatkuvasti ensimmäisten 3 minuutin aikana.
- Kerättävien vaakanopeus kasvaa portaattomasti 1.0x -> 1.5x.
- Kerättävät eivät enää synny tasavälein. Jokaisen uuden kohteen syntymisväli arvotaan erikseen.
- Alussa syntymisväli vaihtelee noin 1.70-2.20 s.
- Maksimivaikeudella väli vaihtelee noin 0.85-1.55 s.
- Satunnaisuudessa on aina minimiväli, joten kohteet eivät synny kiinni toisiinsa.
- Kohdeohjattu lento käyttää aina senhetkistä objektinopeutta, joten ajoituslogiikka säilyy oikeana vaikeuden kasvaessa.

Pelin toiminta
- KORKEA ääni vie yläreitille.
- MATALA ääni vie alareitille.
- ★ tähti oikealla reitillä -> +1 piste.
- 🛸 UFO -> +2 pistettä, noin 7 % kerättävistä.
- 🚀 raketti -> +10 pistettä, noin 1 % kerättävistä.
- Äänen loputtua kone jää viimeiselle valitulle reitille.
- Korkeuden vaihto alkaa heti ja hidastuu pehmeästi reitille 780 ms aikana.

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
