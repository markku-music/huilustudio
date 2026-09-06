Lentokone – PWA 1.31 – Samsung fullscreen + HUD alareunassa

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


Uutta 1.9 – transparent arcade HUD
- Pohjana alkuperäinen 1.8-versio; äänentunnistuksen ja lentologiikan parametreihin ei ole koskettu.
- Alareunaan lisätty erittäin matala, täysin läpinäkyvä HUD ilman taustapaneelia.
- Vasemmalla on analoginen aikamittari valkoisilla ja punaisilla pykälillä sekä punaisella viisarilla. Viisari alkaa oikealta ja liikkuu kohti vasemman reunan punaista aluetta 3 minuutin aikana.
- Keskellä on analoginen korkeusmittari. Siinä on neljä pääpykälää: kiitorata, alareitti, välireitti ja yläreitti, ilman tekstejä. Peli alkaa välireitin viisariasennosta.
- Kiitoratapykälä on tässä versiossa varattu tulevaa loppulaskua varten; 1.8:n pelin päättymislogiikkaa ei muutettu.
- Oikealla näkyy vain pistemäärä ilman kehystä tai tekstiä.
- Mittarit ovat SVG-elementtejä, joten ne pysyvät terävinä ja skaalautuvat iPhone 15:n vaakaruudulta suuremmille näytöille.


Uutta 1.10
- Kun 3 minuutin peliaika päättyy, peli siirtyy automaattiseen loppulaskuun.
- Uusia kerättäviä ei enää synny eikä loppulaskun aikana voi saada pisteitä.
- LOW/HIGH-ohjaus ei vaikuta koneeseen loppulaskun aikana.
- Kiitorata saapuu oikealta ja kone laskeutuu pehmeästi sille noin 3,2 sekunnissa.
- Korkeusmittarin vasemmanpuoleinen varattu pykälä toimii nyt kiitorata-asentona.
- Mittareihin ei ole lisätty tekstejä.
- Touchdownin jälkeen peli pysähtyy ja lopullinen pistemäärä jää näkyviin.


Uutta 1.11
- Loppulaskun aikana pilvet liikkuvat nyt oikeaan suuntaan eli ylöspäin suhteessa koneen laskeutumiseen.
- Aiempi CSS-kiitorata on korvattu aidomman näköisellä WebP-kiitorata-assetilla.
- Loppulaskun muu logiikka sekä tekstittömät mittarit säilyvät ennallaan.


Uutta 1.12
- WebP-kiitoradan tyhjät transparent-marginaalit on rajattu pois, jotta itse kiitotie näkyy pelissä oikein.
- Kiitoradan ankkurointi ja koko on säädetty uudelleen, jotta touchdown osuu näkyvälle pinnalle eikä ruudun alapuolelle.
- Loppulaskun aikana pilvet jatkavat liikkumista ylöspäin.


Uutta 1.13
- Kiitorata ei enää tule ruutuun irrallisena palikkana. Se on koko näkymän yli jatkuva WebP-pinta, jonka päät eivät näy.
- Kiitoradan tekstuuri scrollaa loppulaskun aikana vaakasuunnassa, mutta itse maataso nousee pehmeästi alhaalta paikalleen.
- Loppulaskun taustalle tulee matala kaupunkisiluetti, joka nousee horisonttiin ennen touchdownia.
- Pilvet liikkuvat edelleen loppulaskun aikana ylöspäin.
- Kehittäjäpaneeliin on lisätty "Lasku nyt" -nappi, jolla loppulaskun voi käynnistää heti ilman kolmen minuutin odotusta.
- Mittareihin ei ole lisätty tekstejä.


Uutta 1.14
- Loppulaskussa pilvet nousevat nyt täsmällisesti samaa tahtia kuin kone laskeutuu ruudulla.
- Loppulaskun alkaessa ylä- ja alareitit sekä kaikki kerättävät objektit feidaavat pehmeästi pois.
- Kehittäjäversion Lasku nyt -nappi säilyy ennallaan.


Uutta 1.15
- Kun kone on laskeutunut, pilvet jatkavat taas omaa normaalia oikealta vasemmalle liikkuvaa animaatiotaan.
- Laskeutumisen taustalle on vaihdettu oikea WebP-kaupunkisiluetti aiemman SVG-ratkaisun sijaan.
- Kaupunkisiluetin ja kiitoradan välinen tyhjä rako on poistettu ankkuroimalla siluetin alareuna suoraan kiitoradan yläreunaan.


Uutta 1.16
- Korjattu bugi, jossa pilvien animaatio pysähtyi laskeutumisen valmistuessa. Pilvet jatkavat nyt normaalisti oikealta vasemmalle myös touchdownin jälkeen.
- Kaupungin siluetti on vaihdettu aidomman näköiseen WebP-assettiin.
- Siluetin transparent-reunat on rajattu tiiviiksi, jotta sen ja kiitoradan väliin ei jää tyhjää.


Uutta 1.17
- Touchdownin jälkeen varsinainen pelilooppi pysähtyy, mutta pilville käynnistyy oma erillinen animaatiosilmukka. Näin pilvet jatkavat varmasti oikealta vasemmalle myös koneen jo ollessa maassa.
- Kaupunkisiluetti on korvattu aidomman näköisellä WebP-kaupunkitaustalla, jossa näkyvät rakennusten julkisivut, valot, lentokenttäalue ja lennonjohtotorni.
- Kaupunkikerros on ankkuroitu hieman kiitoradan taakse päällekkäin, joten kaupungin ja kiitoradan väliin ei jää tyhjää rakoa.
- Mittareihin ei ole lisätty tekstejä.


Uutta 1.18
- Korjattu touchdownissa tapahtunut pilvien pystysuuntainen hyppy. Pilvet jäävät nyt laskeutumisen saavuttamaan korkeuteen ja jatkavat siitä vain vaakasuoraa oikealta vasemmalle liikettä.
- Kiitoradan vieritys pysähtyy nyt täysin touchdownissa eikä rata enää rullaa koneen jo ollessa maassa.
- Kaupunkitausta ja muu laskukohtaus säilyvät ennallaan.


Uutta 1.19
- Kaupunkitausta on lämmitetty aurinkoiseen suuntaan, jotta kaupunki näyttää kylpevän auringossa.
- Loppulaskussa kone liukuu nyt kiitoradan keskelle myös vaakasuunnassa.
- Kone oikenee loppulaskun loppuvaiheessa ja on touchdownissa vaakatasossa.


Uutta 1.20
- Laskeutumisen taustaksi on vaihdettu kokonaan uusi kesäisen lämmin maalaismaisema, jossa näkyy kylä, peltoja, puita ja kumpuilevia mäkiä.
- Kaupunkitausta on poistettu tästä laskeutumisnäkymästä.
- Loppulaskussa kone asettuu kiitoradan keskelle myös pystysuunnassa aiempaa selkeämmin.


Uutta 1.22
- Laskeutumistaustan kylämaisema on vaihdettu aurinkoiseen keskikesän keskipäivän versioon.
- Uuden taustan taivasosa on läpinäkyvä, jotta maisema blendautuu pelin oman taivasvärin kanssa siististi.
- Tausta on integroitu suoraan peliin tiedostona maalaiskyla_kesainen.webp.


Uutta 1.23
- Kylämaisema ja kiitorata on yhdistetty yhdeksi laskeutumismaisema.webp-tiedostoksi.
- Peli ei enää käytä erillistä kyläkuvaa ja erillistä kiitoratakuvaa.
- Yhdistelmäkuvan yläosa säilyy transparenttina ja blendautuu pelin omaan taivaaseen.
- Kylän ja kiitoradan välillä ei voi syntyä erillisten layerien rakoa.


Uutta 1.24
- Laskeutumismaisema on piirretty uudelleen niin, että kylän/maiseman ja kiitoradan välissä ei ole läpinäkyvää katkoa.
- Kiitorata on kuvattu enemmän sivuprofiilista, jotta perspektiivi vastaa paremmin sivulta nähtyä lentokonetta.
- Kylä ja kiitorata pysyvät edelleen yhtenä ainoana laskeutumismaisema.webp-kuvana.


Uutta 1.25
- Rakennettu käyttäjän lähettämän PWA 1.24 -paketin päälle samassa PWA-rakenteessa.
- laskeutumismaisema.webp on nyt yksi yhtenäinen kesäinen kylä + kiitorata -maisema.
- Kiitorata kuuluu samaan maisemaan ja on kuvattu sivuprofiilimaisemmin.
- Taivasalue on läpinäkyvä ja blendautuu pelin omaan taivaaseen.


Uutta 1.26
- Kehittäjäasetuksiin lisätty Laskeutumispaikka Y -slideri.
- Slideri säätää koneen touchdownin lopullista pystysijaintia välillä 72.0–96.0 %.
- Arvo päivittyy heti, jos kone on jo laskeutunut, joten touchdown-korkeutta voi hienosäätää suoraan ruudulta.
- Laskeutumispaikan Y-arvo tallentuu JSON-vientiin ja palautuu JSON-tuonnissa.


Uutta 1.28
- PWA käynnistyy manifestin fullscreen-tilassa (display: fullscreen).
- Aloita peli -painallus pyytää selaimelta Fullscreen API:n navigationUI: hide -tilaa.
- Android/Samsung Chrome -laitteilla peli yrittää samalla lukita näytön vaakasuuntaan.
- Fullscreen-pyynnön epäonnistuminen ei estä pelin käynnistymistä.


Uutta 1.29
- Poistettu Aloita peli -napin requestFullscreen()-kutsu, joka laukaisi Android/Chromen poistumisvihjeen.
- Koko näytön tila tulee nyt asennetun PWA:n manifestin display: fullscreen -asetuksesta.
- Vaakasuunnan orientation lock säilyy.

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

Uutta 1.21
- Tämä on varsinainen PWA-peli, ei erillinen taustakuva.
- Kesäinen kylämaisema on pelipaketin sisäinen WebP-assetti ja index.html käyttää sitä loppulaskun taustana.
- Vanhoja käyttämättömiä kaupunkitaustoja ja preview-tiedostoa on poistettu paketista.


Uutta 1.27
- Laskeutumispaikan Y-oletusarvo on nyt 83,3 %.
- Kehittäjäasetusten Y-slideri säilyy säädettävänä.
- Oletus-JSONin landingYPercent on 83.3.


Uutta 1.30
- Mittariosasto on ankkuroidu suoraan ruudun alareunaan.
- iPhonen safe-area-inset-bottom ei enää nosta HUDia Samsungia ylemmäs.

Uutta 1.31
- Samsung/Android PWA:n fullscreen-tila vahvistettu manifestissa ilman standalone-fallbackia.
- Lisätty Android mobile-web-app-capable -metatieto.
- requestFullscreen()-kutsua ei käytetä, joten poistumisvihjettä ei pitäisi tulla.
- HUD säilyy ankkuroituna ruudun alareunaan (bottom: 0).
