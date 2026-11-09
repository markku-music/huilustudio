MEHULASIT 1.5.4

Pura koko ZIP omaan kansioonsa. Avaa Mehulasit/index.html tai siirrä kansion
sisältö verkkopalvelimelle. Verkkokäytössä mikrofoni vaatii HTTPS:n tai
localhost-palvelimen. Säilytä kaikki tiedostot ja alikansiot yhdessä.

KALIBROINTI
Kalibrointi on siirretty käyttäjän lentokone3.zip-paketista.
- Sama HTML, CSS, dB-näyttö ja pulssin/progressin päivitysfunktio.
- Kerros kattaa koko selainikkunan ja on pelin skaalauksen ulkopuolella.
- Sama mikrofonin avaus: AudioContext ilman lisäasetuksia, kaiunpoisto,
  kohinanvaimennus ja automaattivahvistus pois; myös voiceIsolation pois,
  kun selain ilmoittaa tukevansa sitä. Ei erillistä avaustekstiä.
- Sama Analyser: fftSize 8192, smoothingTimeConstant .08,
  minDecibels -110 ja maxDecibels -10.
- Sama 250 ms lämmittely, 1500 ms mittaus ja 33 ms päivitysväli.
- Sama mediaanipohjainen kohinakynnys: +10 dB, rajat -70…-20 dB.
- Sama valmistumishetken dB-lukema, 300 ms vihreä vaihe ja 150 ms häivytys.
- Ei lisättyjä näytönpäivitysten odotuksia.
- Lamppu-ääni valmistellaan vasta kalibroinnin jälkeen, kuten lentokoneessa.

Kalibrointifunktion pelikohdat on liitetty Mehulasien tunnistukseen:
mittauksen alussa tunnistus pysäytetään ja sen päätyttyä jatketaan.
Lentokoneen YIN-päivitysajastinta ei käynnistetä Mehulasissa, joka käyttää
Resonatoria. Mittaus- ja animaatiokoodi näiden liitoskohtien välissä on
sama. Mikrofonin avauskoodista on jätetty pois vain käyttämättömän
spektritaulukon varaus. Näillä ei lisätä animaatioon odotuksia.

PELI
ResonatorEngine 0.7.2 ja ResonatorNoteStability ovat käyttäjän lähettämästä
Resonator Selkeä UI 1.6 -paketista. Näiden luokkien koodia ei ole muutettu.
Kohdesävelet ovat G1, A1, H1, C2, D2; A=440 Hz. Toleranssiasetus on 40
senttiä. Täyttönopeus ja ulkoasun asetukset löytyvät rattaasta.

Lamppu-ääni soi kerran lasin täyttyessä. Ääni on mukana audio-data.js:ssä
16-bittisenä WAV-datana. Efektin ja 120 ms:n jälkisuojan ajan täyttäminen
ja ajanotto ovat tauolla, jotta kaiuttimesta palaava ääni ei täytä laseja.
Tauko kestää noin 1,06 sekuntia.

PUHALLUSTEN LASKENTA
Tulostaulu näyttää puhallusmäärän jokaisen lasin kohdalla.
Vähintään 160 ms:n hiljainen tauko aloittaa uuden puhalluksen. Lyhyt
sävelentunnistuksen katkos ei yksin lisää laskuria. Sama yhtenäinen
puhallus lasketaan kullekin täyttämälleen lasille kerran. Täysi lasi ei
kerää uusia puhalluksia. Tyhjennä ja Pelaa uudestaan nollaavat laskurit.
Määrä on mikrofonisignaalista tehty arvio.

TIEDOSTOT JA ASETUKSET
Paketti sisältää vain käytetyt tiedostot. Vanha kalibrointitausta,
kaksoiskappaleet ja käyttämätön testipenkkikoodi on poistettu.
Aiemmat koko- ja nopeusasetukset säilyvät samassa selaimessa ja osoitteessa.
Service workeria ei rekisteröidä, kuten versioissa 1.4.3 ja 1.5.

TARKISTUKSET
Kalibroinnin HTML, CSS, visualisointifunktio ja mikrofonin avauskoodi
verrattu suoraan lentokone3:n lähdekoodiin. Kalibrointifunktion erot
rajoittuvat tunnistuksen pysäytyksen ja jatkamisen liitoskohtiin.
Molempia kalibrointeja ajettu samalla simuloidulla äänisyötteellä ja
ajastuksella: etenemä, dB-arvot, kynnys ja häivytys vastasivat toisiaan
myös epätasaisilla ajastinväleillä ja keskeytyksissä.

Ohjelmallisesti tarkistettu koko sovelluksen käynnistys simuloidulla
mikrofonilla, kalibroinnin ja efektin valmistelun järjestys, puhallusten
laskenta, uudelleenkalibrointi, lasin täyttyminen, kertaluonteinen ääni,
mikrofonin sulkeminen sekä mikrofoniluvan epäämisestä palautuminen.
Resonator tunnisti synteettiset G/A/H/C/D-signaalit 44,1 ja 48 kHz:llä;
B ja ylempi G hylättiin. Tarkistus ei korvaa fyysistä mikrofoni- ja
huilutestiä käyttäjän laitteella.
