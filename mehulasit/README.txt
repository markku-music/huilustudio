MEHULASIT 1.5.2

Pura koko ZIP ja avaa Mehulasit/index.html tai siirrä Mehulasit-kansion
sisältö verkkopalvelimelle. Verkkokäytössä mikrofoni vaatii HTTPS:n
(tai localhost-palvelimen). Säilytä tiedostot ja alikansiot yhdessä.

UUTTA
- Lähetetyn Resonator Selkeä UI 1.6 -paketin ResonatorEngine 0.7.2.
  Tunnistin ja sävelvaihtosuoja on säilytetty muuttamattomina.
  Käyttämätön ResonatorSession-testipenkkiosa on poistettu paketista.
  Peli käyttää moottoria ja sen sävelvaihtosuojaa omilla kohdesävelillään:
  G1, A1, H1, C2, D2; A = 440 Hz, toleranssiasetus 40 senttiä.
  Testipenkin F-duurin kohdekarttaa ei käytetä pelissä.
- Lähetetty Lamppu-ääni soi kerran jokaisen lasin täyttyessä.
  Ääni on muunnettu yhteensopivaan 16-bittiseen WAV-muotoon ja tallennettu
  audio-data.js:ssä, joten äänen lataaminen ei vaadi fetch-kutsua.
- Tulostaulussa jokaisen sävelen alla näkyy lasiin tarvittu puhallusmäärä.
- Lentokone3:n kalibrointirengas, äänenvoimakkuuteen reagoiva pulssi,
  dB-lukema, vihreä valmistuminen ja häivytys.
  Rengas seuraa kulunutta aikaa: 250 ms lämmittely + 1,5 s kohinamittaus.
  Kohinakynnys lasketaan lentokonepelin tavoin live-mittausten mediaanista.

PUHALLUSTEN LASKENTA
Puhallus lasketaan, kun hyväksytty sävel todella täyttää keskeneräistä
lasia. Vähintään 160 ms:n hiljainen tauko aloittaa uuden puhalluksen.
Lyhyt tunnistuskatkos tai väärä sävel ilman hiljaisuutta ei yksin lisää
laskuria. Sama yhtenäinen puhallus lasketaan kullekin täyttämälleen
lasille kerran, vaikka säveleen palaisi legatossa. Täyteen lasiin ei
lisätä puhalluksia. Tyhjennä ja Pelaa uudestaan nollaavat myös laskurit.
Määrä on mikrofonisignaalista tehty arvio, ei hengityksen suora mittaus.

ÄÄNIEFEKTIN AIKAINEN TAUKO
Täyttymisäänen ja 120 ms:n jälkisuojan aikana täyttäminen on tauolla,
jotta kaiuttimesta mikrofoniin palaava ääni ei täytä toista lasia.
Tauko kestää noin 1,06 sekuntia, eikä sitä lasketa suoritusaikaan.

SÄILYTETTY
Lasit, etiketit, mehu ja kuplat, vaakasuuntainen näkymä, säädettävä
täyttönopeus, lasi- ja etikettikoot, tulostaulun aikapalkit ja JSON-asetukset.
Aiemman version tallennetut koko- ja nopeusasetukset säilyvät samassa
selaimessa ja samassa osoitteessa. Service workeria ei rekisteröidä,
kuten versioissa 1.4.3 ja 1.5. Käyttämätön sw.js on poistettu.

TARKISTUS
Tunnistus tarkistettu synteettisillä äänillä näytetaajuuksilla 44,1 ja 48 kHz:
G, A, H, C ja D tunnistuvat; B ja ylempi G hylätään näissä kokeissa.
Puhallusten katkokset, legatopaluu, laskurien nollaus, täyttymisen
kertaluonteisuus, efektin aikainen suoja ja tulosmäärät tarkistettu
ohjelmallisesti. Käytännön huilu-, mikrofoni- ja laitetesti tarvitaan vielä.

SIIVOUS 1.5.1
Poistettu vanha kalibrointitausta, neljä käyttämätöntä kuvaketta,
äänitiedoston erillinen kaksoiskappale ja käyttämätön sw.js.
Poistettu testipenkin käyttämätön ResonatorSession sekä vanhojen
piilotettujen tulostekstien, korostusten ja muuttujien jäänteet.
Aiemman version omat asetukset latautuvat edelleen samalla avaimella.
Muiden vanhojen peliversioiden asetuksia ei enää poisteta käynnistyksessä.

KALIBROINNIN AJOITUSKORJAUS 1.5.2
Kalibrointi käyttää lentokonepelin ajastusta ja mittaustapaa.
Mikrofonin avauksen ajan Aloita-painikkeessa lukee Avataan mikrofonia.
Rengas käynnistyy vasta, kun mikrofoni ja äänen lataus ovat valmiit.
250 ms lämmittely näkyy renkaassa mutta ei kuulu kohinamittaukseen.
Sen jälkeen kohinaa mitataan 1,5 s, 33 ms välein. Mittausten mediaaniin
lisätään 10 dB ja kynnys rajataan välille -70…-20 dB, kuten lentokoneessa.
Valmis rengas on vihreä 300 ms ja häipyy 150 ms:ssa. Tunnistus pysyy
pysäytettynä koko kalibroinnin ajan. Sama toiminta uudelleenkalibroinnissa.
Resonatorin tunnistuskoodia ei muutettu.
