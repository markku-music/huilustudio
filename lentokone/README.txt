Lentokone – PWA BASE 1.5 – siivottu kohteeseen tähtäävä versio

Tämä versio on BASE 1.4:n toiminnallisesti sama, siivottu jatkoversio.
Siivouksessa ei muutettu äänentunnistuksen matematiikkaa eikä reittiliikkeen toimintaa.

Pelin toiminta
- KORKEA ääni valitsee yläreitin.
- MATALA ääni valitsee alareitin.
- Äänen loputtua kone jää viimeiselle valitulle reitille.
- Reittivaihto tähtää valitun reitin seuraavaan edessä olevaan objektiin.
- Kun komento annetaan ajoissa, pystysiirtymä ajoitetaan objektin saapumishetkeen.
- Myöhäinen komento ei saa epärealistista nopeusboostia.
- Osuma ratkaistaan koneen todellisen Y-korkeuden perusteella.
- Osumatoleranssi on 5,5 %-yksikköä.
- Vakausmittausta, vakausheiluntaa tai äänen pituuteen sidottua audio-ease-inia ei ole.

Reittiliike
- Yläreitti: 31 %
- Alareitti: 69 %
- Keskiasento: 50 %
- Normaali täyden reittivaihdon vertailuaika: 780 ms
- Liike lähtee heti liikkeelle ja pehmenee loppua kohti Cubic Hermite -käyrällä.
- Nokan kallistus seuraa pystysuuntaista reittiliikettä.

Äänimoottori
- FFT: 8192
- YIN-analyysi: 4096 näytettä
- analyysiväli: 16 ms
- harmoniset: H1–H8 lasketaan, profiilivertailussa käytetään H2–H8
- LOW/HIGH-painotus: 42 % sävelkorkeus, 58 % harmoninen fingerprint
- hyväksymisraja: 50 %
- LOW/HIGH-erotteluraja: 7 prosenttiyksikköä
- mikrofonin automaattikynnys: mitattu pohjataso + 10 dB
- epävarman tunnistuksen näyttöviive: 180 ms
- tunnistuksen smoothing: 6 näytettä

Pilvet
- Käytössä ovat pilvi_levea.webp, pilvi_keski.webp ja pilvi_iso.webp.
- Pilvien koko, määrä, korkeus ja välistys mukautuvat viewportiin.
- Usvaa ei käytetä.

Kehittäjätila
- dBFS
- mikrofonikynnys
- F0
- LOW/HIGH
- BEST
- GAP
- tunnistus
- puhalluksen pituus
- propelli X/Y/koko/sivukääntö/idle-nopeus/aktiivinen nopeus
- nokan kallistus
- JSON-vienti ja -tuonti

Oletusasetukset
- propelli X: 91.4
- propelli Y: 50.7
- propellin koko: 40
- sivukääntö: 78°
- idle: 180 ms
- aktiivinen: 55 ms
- nokan kallistus: 20°

JSON-asetukset
- propeller.x
- propeller.y
- propeller.size
- propeller.sideTilt
- propeller.idleMs
- propeller.activeMs
- flight.noseTiltDeg

PWA
- Sovelluksen nimi: Lentokone
- Käyttö on lukittu vaakasuuntaan manifestissa.
- Mikrofonin käyttö vaatii HTTPS:n tai localhostin.
- Service worker välimuistittaa staattiset tiedostot offline-käyttöä varten.
- Navigointi on network-first ja staattiset assetit cache-first.
- Yläreunan päivitysnappi tyhjentää välimuistit, tarkistaa service workerin ja lataa pelin uudelleen.

Tiedostot
- index.html
- manifest.webmanifest
- sw.js
- lentokone_sivu.webp
- lentokone_asetukset_DEFAULT.json
- pilvi_levea.webp
- pilvi_keski.webp
- pilvi_iso.webp
- icons/icon-192.png
- icons/icon-512.png
- icons/icon-maskable-512.png
- icons/apple-touch-icon.png

BASE 1.5 -siivous
- poistettu käyttämätön soundActive-tila
- poistettu käyttämätön clearClouds-funktio
- reittivihjeen timeout siirretty eksplisiittiseen routeHintTimer-muuttujaan
- routeTransitionDurationMs käyttää suoraan ROUTE_TRANSITION_MS-oletusta
- README kirjoitettu uudelleen vastaamaan nykyistä toteutusta ilman vanhoja ristiriitaisia versionhistorioita
- pelin toiminnallista logiikkaa ei muutettu

BASE 1.6
- Kaikki kehittäjäasetusten sliderit poistettu.
- Mikrofonin Kalibroi-painike siirretty Refresh-painikkeen viereen.
- Nollaa pisteet -painike poistettu asetuksista.
- JSON-tuonti, JSON-vienti ja oletus-JSON-tiedosto poistettu.
- Propellin ja nokan nykyiset toimivat arvot on lukittu suoraan appiin.

BASE 1.7
- Kalibrointi-ikkuna vaihdettu visuaaliseen lentomittaripaneeliin.
- SVG-neula näyttää reaaliaikaisen melutason kalibroinnin aikana.
- dB-lukema päivittyy livenä.
- Vaakasuora palkki näyttää kalibroinnin etenemisen.
- Kalibrointi sulkeutuu automaattisesti valmistuttuaan.

BASE 1.8
- Kalibrointimittarin asteikko muutettu alueelle -90 dB ... -30 dB.
- Kalibrointinäkymän live-otsikko "Kalibroi mikrofoni" poistettu.
- Taustakuvasta siivottu pois staattiset dB-tekstit ja staattinen aikapalkki, koska live-SVG piirtää ne nyt itse.

BASE 1.9
- Kalibrointitaustasta poistettu kokonaan vanha staattinen aikapalkki.
- Live-SVG-aikapalkki pelkistetty: ei reunusta eikä sisäpaddingia.
- Täyttö alkaa samasta kohdasta kuin palkin tausta ja käyttää koko leveyden.

BASE 1.10
- Kalibrointi-ikkuna feidautuu pehmeästi pois kalibroinnin valmistuttua.

BASE 1.13
- Aloitusikkunasta poistettu lentokonekuva ja kaikki tekstit.
- Aloitusikkunassa on vain Aloita peli -nappi.
- Aloitusikkuna poistuu heti napin painalluksesta ennen mikrofonin kalibrointia.

BASE 1.14
- YLÄREITTI- ja ALAREITTI-tekstit poistettu.
- Ylä- ja alareitin katkoviivat poistettu.
- Myös reittivaihdon hetkellinen YLÄREITTI/ALAREITTI-vihjeteksti poistettu.
- Reittien varsinainen pelilogiikka ja Y-koordinaatit säilyvät ennallaan.

BASE 1.15
- Käännä vaakatasoon -ikkunasta poistettu alempi selitysteksti. Jäljellä vain kääntöikoni ja teksti "Käännä vaakatasoon".

BASE 1.16
- Aloitusnapin ympäriltä poistettu valkoinen kortti, varjo ja padding.
- Kalibrointi-ikkunan koko pienennetty 80 %:iin aiemmasta.

BASE 2.0
- Tämä versio on hyväksytty uudeksi viralliseksi lähtöpisteeksi.
- Pelin toimintaan, ulkoasuun tai asetuksiin ei tehty muutoksia BASE 1.16 -versioon nähden.

BASE 2.1
- Tähdet korvattu webp-kerättävinä aarteina.
- Kultakolikko = 1 piste, timantti = 2 pistettä, aarrearkku = 5 pistettä.
- Kerättävien esiintyvyys: kolikko 78 %, timantti 18 %, aarrearkku 4 %.
- Pistevälähdys näyttää nyt kerätyn esineen pistearvon.

BASE 2.2
- Kultakolikko korvattu tyylitellyllä eurokolikko-assetilla.
- Timantti (2 p) ja aarrearkku (5 p) säilyvät ennallaan.
