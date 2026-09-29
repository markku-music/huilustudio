ASTEIKKOSPURTTI – KOKOSÄÄDÖT JA PIKSELIHIRVIÖ, versio 2, 29.9.2026

Pohja: toimivaksi vahvistettu Asteikkospurtti_REAKTIOT_1.zip.

Asetuksissa on uusi Hahmojen koko -osio:
- Juoksija ja haamu: 50–180 %, askel 5 %.
- Hirviö: oma 50–180 % säätö, askel 5 %.
- Palauta 100 % palauttaa molemmat alkuperäiseen kokoon.
Säädöt vaikuttavat heti, myös kesken kierroksen ja reaktioanimaatioiden aikana.
Koot tallentuvat selaimeen ja sisältyvät asetusten JSONiin: runnerScale ja
monsterScale (0,5–1,8). Vanhat JSON-asetukset toimivat edelleen.
Pienellä näytöllä hahmot sovitetaan tilaan, jotta molemmat radat pysyvät näkyvissä.
Puhekuplien teksti säilyy luettavan kokoisena.

Hirviö on nyt selvästi pikselitaidetta: 20 ruutua, 64 × 64 pikselin ruudukko
ruutua kohti, rajattu 24 värin paletti ja nelinkertainen lähimmän naapurin
suurennos. Väri, hahmo ja kaikki viisi animaatiota säilyvät: odotus, juoksu,
kurottaminen, hyppy ja läähätys. Uusi kuva on assets/monster-pixel-sheet.png.
Kokosäädöt muuttavat vain ulkoasua, eivät vauhtia tai kiinnioton ajoitusta.

PÄIVITYS
Pura ZIP ja vie Asteikkospurtti_KOKOSAADOT_2-kansion KOKO SISÄLTÖ nykyisen
pelin kansioon. Mukaan tarvitaan myös assets-kansio, character-sizes.js
ja päivitetty sw.js. Paina pelin ↻-päivityspainiketta. Tarvittaessa sulje
peli-ikkunat ja avaa peli uudelleen. Offline-versio: v11-sizes-pixel.


AIEMMAN VERSION OHJEET

ASTEIKKOSPURTTI – JUOKSIJAN REAKTIOT, 29.9.2026

Pohja: käyttäjän lähettämä Arkisto(20260929-171942).zip.

UUTTA
- Hirviön kiinniotto: Soita, soita! -puhekupla ja 0,5 sekuntia paikallaan
  juoksua. Sama kiinniotto ei laukea jatkuvasti uudelleen. Uusi kiinniotto
  tulee mahdolliseksi, kun juoksija on ensin päässyt selvästi karkuun.
- Ensimmäinen väärä sävel: kaatuminen ja ylösnousu yhteensä 0,5 sekuntia.
  Tämän jälkeen juoksija odottaa oikeaa säveltä.
- Seuraava uusi väärä sävel ennen oikeaa: juoksija kääntyy soittajaan päin
  ja levittää kädet. Odotusasento säilyy oikeaan säveleen asti.
- Saman väärän äänen pitäminen ei toista reaktiota. Uusi sävel tai
  selkeän hiljaisuuden jälkeinen uusi väärä ääni voi tuoda uuden reaktion.
- Juuri hyväksytyn sävelen pitäminen on edelleen sallittu.
- Oikeat sävelet kuunnellaan myös animaation aikana. Kaatuminen tai kiinnioton
  puolen sekunnin pysähdys näytetään loppuun; käsienlevityksestä pääsee heti
  pois oikealla sävelellä. Eteneminen palaa pehmeästi, ilman paikan hyppäystä.
- Ajanotto jatkuu reaktioiden ajan. Sävelkohtaiset ajat, ennätykset ja haamun
  sävelajoitus käyttävät alkuperäistä logiikkaa. Haamu ei toista virhe-eleitä.

TUNNISTUS
ResonatorEngine on tavuntarkasti sama kuin lähtöpaketissa. Oikean sävelen
hyväksymisen 10 ms:n varmistusta ei muutettu. Väärästä asteikon sävelestä
vaaditaan 80 ms:n yhtenäinen tunnistus, jotta lyhyet vaihtoäänet eivät kaada.
Asteikon ulkopuolinen sävel voi käynnistää reaktion moottorin olemassa olevan
sävelkorkeusmittauksen kautta, kun tunnistus pysyy varmana vähintään 100 ms.
Tämäkin toimii moottorin tunnistusalueen puitteissa: hiljaisuutta, kohinaa tai
säveltä jota moottori ei tunnista varmasti ei tulkita vääräksi säveleksi.

PÄIVITYS
Pura ZIP. Vie Asteikkospurtti_REAKTIOT-kansion KOKO SISÄLTÖ nykyisen pelin
kansioon, myös assets-kansio ja uudet runner-reactions.js sekä
assets/runner-reactions.png. Paina pelin oikean alakulman ↻-päivityspainiketta.
Jos vanha versio jää näkyviin, sulje peli-ikkunat ja avaa peli uudelleen.
PWA:n välimuistiversio on v10-reactions; uudet kuvat kuuluvat offline-pakettiin.

KOKEILU
Asetuksista Hiiri / näppäimet. F-duuri, ylöspäin:
1 = aloita f1. Paina 4 = väärä sävel ja kaatuminen. Paina 5 = uusi väärä
sävel ja käsienlevitys. Paina 2 = oikea g1, matka jatkuu.
Kiinnioton näet soittamalla ensimmäisen sävelen ja odottamalla hirviötä.
Mikrofonissa samaa väärää säveltä pitämällä ei tule lisää kaatumisia.


AIEMMAT OHJEET JA VERSIOMERKINNÄT

Asteikkospurtti – PWA, 29.9.2026

Pura paketti ja vie kansion sisältö GitHub Pages -sivullesi.
Avaa HTTPS-osoite. Aloita pyytää mikrofoniluvan; ole hiljaa 1,5 sekuntia.
Koko näytön toiminto on poistettu. Asetukset löytyvät rattaasta.

Asennus: Chrome/Edge: osoiterivin asennustoiminto.
iPad/iPhone: Safari > Jaa > Lisää Koti-valikkoon.
Asennettu sovellus käyttää omaa ikkunaa (standalone), ei fullscreen-tilaa.
Ensimmäinen lataus vaatii verkkoyhteyden. Sen jälkeen välimuistiin
ladatut nuotit, moottori ja kuvat toimivat myös offline-tilassa.
Mikrofoni tarvitsee selaimen käyttöluvan myös asennetussa sovelluksessa.
Älä käynnistä index.html:ää suoraan tiedostona.

Korjaukset:
- Äänijärjestelmän resume ja mikrofonilupapyyntö käynnistyvät samasta
  painalluksesta rinnakkain, ilman fullscreen-pyyntöä.
- Avauksella ja kalibroinnilla yhteinen 20 sekunnin aikaraja.
- Virhe avaa asetukset ja antaa mahdollisuuden uuteen yritykseen.
- Perutun/vanhentuneen pyynnön myöhemmin saama mikrofoni suljetaan.
- Sävelentunnistuksen algoritmia ja pelin asetuksia ei muutettu.

Takaa-ajaja (29.9.2026):
Hirviö odottaa ensimmäistä säveltä ja lähestyy tasaisesti.
Asetuksissa on päälle/pois-valinta ja nopeus 10–100 (oletus 35).
Kiinni jääminen ei katkaise harjoitusta. Hirviö pomppii vierellä.
Maalissa hirviö pysähtyy läähättämään. Myös alas- ja meno-paluusuunta toimivat.
Asetukset tallentuvat selaimeen. Muuttaminen valmistaa uuden kierroksen.
Päivityksen jälkeen sulje kaikki apin välilehdet/ikkunat ja avaa uudelleen,
jotta uusi offline-versio aktivoituu.

Vaikeustasot ja BPM (29.9.2026)
Pelin alareunassa: Unikeko, Tallustelija, Vipeltäjä ja Turbotassu.
Oletustempot ovat 30, 45, 60 ja 90 BPM. Ensimmäinen taso on Unikeko.
BPM-arvot näkyvät vain asetuksissa; jokaista voi muuttaa välillä 10–240.
Taso ja tempot tallentuvat selaimeen. Tason valinta ottaa hirviön mukaan.
Tason/tempon muuttaminen valmistelee uuden kierroksen.
Yksi isku = yksi sävelväli (120 radan yksikköä). Hirviö etenee
tasavauhtisesti valitun BPM:n mukaan ensimmäisestä sävelestä alkaen. Se pitää
oman temponsa soittajan pysähtyessäkin, mutta ei ohita juoksijaa.
Kiinni jäädessä se pomppii vieressä. Maalissa hirviö pysähtyy.
Juoksijan liike, sävelentunnistus ja pelikentän mitat ovat ennallaan.

Päivitä peli: oikean alakulman ↻-painike tarkistaa uuden version,
hakee pelin tiedostot uudelleen verkosta ja käynnistää pelin alusta.
Keskeneräinen kierros alkaa uudelleen. Asetukset ja ennätykset säilyvät.
Päivitys tarvitsee verkkoyhteyden ja HTTPS-osoitteen (tai localhostin).
Jos lataus epäonnistuu, nykyinen peli jää käyttöön ja voit yrittää uudelleen.
Ensimmäistä tätä painiketta sisältävää versiota varten sulje tarvittaessa
vanhat peli-ikkunat ja avaa peli uudelleen. Myöhemmät päivitykset voi hakea napilla.

HERKKYYS JA dB-NÄYTTÖ (29.9.2026)
Kiinteä RMS-vähimmäiskynnys on nyt -80 dBFS (0,0001), aiemmin noin -53 dBFS.
Tunnistuskynnys = suurempi arvoista: -80 dBFS tai pohjakohina + kohinaraja.
Kohinaraja on edelleen 4–10 dB, oletus 8 dB. Säätö vaikuttaa heti.
Kalibroinnin aikana näet päivittyvän pohjakohinan dBFS-lukeman.
Asetuksissa näkyvät pohjakohina ja todellinen tunnistuskynnys mittauksen jälkeen.
Erittäin hiljaisessa ympäristössä näytetään, jos -80 dBFS:n vähimmäiskynnys rajoittaa säätöä.
Lukemat kuvaavat digitaalisen mikrofonisignaalin tasoa, eivät huoneen äänenpainetta.
Kalibrointi kestää edelleen 1,5 s; sävelvertailu, toleranssi ja pelin liikkeet ovat ennallaan.
