MEHULASIT 1.9 — PELIMAAILMAN TULOSTAULU

Tämä peli käyttää viereisen yhteiset/-kansion yhteistä tulospalvelua.
Pidä Mehulasit/, yhteiset/ ja tulokset/ samassa emohakemistossa.
Käyttöönotto: ../ALOITA_TASTA.txt. Pelin mikrofoni vaatii HTTPS:n tai localhostin.

MUUTOKSET 1.9
- Tulokset tallennetaan uuteen yhteiseen Pelimaailma-projektiin käyttöönoton jälkeen.
- Pelin tulostaulusta pääsee kaikkien pelien yhteiselle tulossivulle.
- Moottori, kalibrointi, pistekaava, täyttö ja ääniefekti ovat ennallaan.
- Projektin pelimaailma-a667b asetukset on lisätty. Julkaise vielä Firestoren
  säännöt ja luo indeksi ALOITA_TASTA.txt-tiedoston ohjeilla.
- Firebase-yhteys alkaa vasta tulostaulun avaamisesta tai tallennuksesta.

PELAAJAN TULOS
Tallenna-painike avaa nimimerkin ja soittimen valinnan. Tallennus on vapaaehtoinen.
Tuloksissa näkyvät pisteet, aika ja lasikohtaisten puhallusten summa.
Kierros tallentuu kerran myös uudelleenyrityksissä. Vahvistus tulee palvelimelta.
Sulkeminen tai uusi kierros hävittää vielä tallentamattoman tuloksen.
Tunnistusääntä ei lähetetä tietokantaan. Nimimerkki ja tulos ovat julkisia.

PELIHALLI-PAINIKE
Kopioi pelihalli.css ja pelihalli-icon.svg toiseen peliin. Lisää stylesheet-linkki
ja a-elementti luokalla pelihalli-button. Esimerkki löytyy index.html:stä.
Linkin osoite on https://markku-music.github.io/huilustudio/.
Muissa peleissä kytke mukaan niiden oma mikrofonin sulkeminen.

TESTIPENKISSÄ TOIMIVAKSI TODETTU MOOTTORI
Resonator on korvattu Mehulasit-testipenkin 1.2 YIN-moottorilla.
engine.js on tavuilleen sama tiedosto kuin testipenkissä 1.2. Myös sen
vertailuhaara ja synteettisen signaalin apufunktio on jätetty tiedostoon,
jotta toimivaa moottoria ei tarvitse muuttaa tätä peliä varten. Peli
käyttää ainoastaan moottorin experiment-haaran tunnistusta ja nopeutta.

Samat asetukset kuin testipenkissä 1.2:
- YIN-hyväksyntäraja 0,35 ja paikallisen laakson tarkennus.
- Sävelhistorian mediaani: 6 havaintoa. Säveltoleranssi: ±55 senttiä.
- Hitaan täytön jaksollisuusraja 99,60 %; täyden nopeuden raja 99,95 %.
- Oikeaksi tunnistetun sävelen pienin täyttönopeus 15 % enimmäisnopeudesta.
- Hiljaisuus, tunnistamaton ääni ja väärä sävel eivät täytä lasia.
- 8192 näytteen äänipuskuri; YIN käyttää ensimmäiset 4096 näytettä.
- Analyysi 16 ms välein; yksittäisen päivityksen täyttöaika enintään 80 ms.
- Mikrofonin kohinaraja mitataan kalibroinnissa.

G/A/H/C/D käyttävät testipenkin alkuperäisiä mitattuja vertailutaajuuksia:
G 390,9783096102657 Hz
A 435,9136184358308 Hz
H 493,27278117625264 Hz
C 521,7425815931465 Hz
D 590,9565023710167 Hz

Lasin täyttö = asetettu enimmäisnopeus × moottorin nopeuskerroin × aika.
Oletus 20 %/s täyttää lasin viidessä sekunnissa, kun kerroin on 100 %.
Minimikertoimella 15 % nopeus on silloin 3 %/s. Täyttö säilyy tauon ajan.
Enimmäisnopeus on nyt kiinteä 20 %/s. Asetuspaneeli, molemmat rattaat,
säätimet sekä asetusten JSON-tuonti ja -vienti on poistettu. Aiemmin
selaimeen tallennetut asetukset eivät vaikuta tähän versioon.
Lasien koko on 250 % ja etikettien koko 50 %, kuten version 1.6 oletuksissa.

Jaksollisuus mittaa signaalin toistuvuutta. Se ei ole yleispätevä huilun
soinnin arvosana. Mukana on testipenkin nykyinen, käyttäjän toimivaksi
toteama laskenta myös sen sävel- ja näytetaajuuskohtaisine vaihteluineen.

KALIBROINTI
Kalibroinnin HTML, CSS, animaatio, mikrofonin avaus ja mittaus on säilytetty
versiosta 1.5.4. Ne on tarkistettu suoraan lentokone3:n lähdekoodia vasten.
- Ei erillistä mikrofonin avaustekstiä.
- AudioContext ilman lisäasetuksia; kaiunpoisto, kohinanvaimennus ja
  automaattivahvistus pois. VoiceIsolation pois, jos selain tukee sitä.
- Analyser: fftSize 8192, smoothingTimeConstant .08,
  minDecibels -110 ja maxDecibels -10.
- 250 ms lämmittely, 1500 ms mittaus, päivitys 33 ms välein.
- Kohinatason mediaani +10 dB, kynnys rajattu välille -70…-20 dB.
- 300 ms vihreä valmistumisvaihe ja 150 ms häivytys.
- Ääniefekti valmistellaan kalibroinnin jälkeen.
Vain tunnistuksen pysäytys- ja jatkamiskohdat kytkeytyvät pelin moottoriin.
Uudelleenkalibrointi säilyttää täyttömäärät ja puhalluslaskurit.

ÄÄNIEFEKTI JA PUHALLUKSET
Lamppu-ääni soi kerran kunkin lasin täyttyessä. Ääni on mukana
audio-data.js:ssä. Efekti ei keskeytä tunnistusta, täyttöä tai ajanottoa,
eikä sen perään lisätä odotusaikaa. Tyhjennys, uusi kierros ja pelihalliin
siirtyminen pysäyttävät kaikki vielä soivat efektit.

Tulostaulu näyttää puhallusmäärän jokaisen lasin kohdalla. Vähintään
160 ms:n havaittu hiljaisuus aloittaa uuden puhalluksen. Pelkkä sävelen
tunnistuksen katkos ei lisää laskuria. Sama yhtäjaksoinen puhallus
lasketaan kullekin täyttämälleen lasille kerran. Täysi lasi ei kerää uusia
puhalluksia. Tyhjennä ja Pelaa uudestaan nollaavat tulokset ja laskurit.
Puhallusten määrä on mikrofonisignaalista tehty arvio.

TULOKSET JA PISTEET
Tuloksessa näkyvät yhteispisteet, kokonaisaika ja viisi pientä
mehulasia. Jokaisen lasin alla on sävel ja sen täyttämiseen tarvittu
puhallusmäärä. Vanha aikapalkkikaavio on korvattu tällä näkymällä.

Aikapisteet = min(100, 100 × 25 / kokonaisaika sekunteina).
Puhalluspisteet = min(100, 100 × 5 / lasikohtaisten puhallusten summa).
Yhteispisteet = (aikapisteet + puhalluspisteet) / 2.
Vasta yhteispisteet pyöristetään lähimpään kokonaislukuun (0–100).
Aikapisteissä käytetään tarkkaa mitattua aikaa, vaikka ruudulla aika
näkyy yhden desimaalin tarkkuudella.

Esimerkkejä:
25 s, 5 lasikohtaista puhallusta: 100 pistettä.
30 s, 5 lasikohtaista puhallusta: 92 pistettä.
30 s, 6 lasikohtaista puhallusta: 83 pistettä.
40 s, 8 lasikohtaista puhallusta: 63 pistettä.
34,2 s, 7 lasikohtaista puhallusta: 72 pistettä.

Kunkin lasin tavoite on yksi puhallus. Jos sama puhallus täyttää kahta
lasia, kummankin lasin yhden puhalluksen tavoite täyttyy. Viiden lasin
puhallussumma ei siis tarkoita erillisten uloshengitysten kokonaismäärää.

Ajanotto alkaa ensimmäisen hyväksytyn täyttöjakson alusta ja päättyy
viimeisen lasin täyttymiseen. Hengitystauot ja muut pelaajan tauot
kuuluvat aikaan. Ajanotto jatkuu myös täyttymisäänten aikana.
Tulos lukitaan ennen viimeistä ääniefektiä: tulosnäkymän piirtoviive tai
viimeisen efektin kesto ei muuta pistemäärää. Uusi kierros nollaa tuloksen.
Pisteitä lasketaan vasta kaikkien viiden lasin täytyttyä.

