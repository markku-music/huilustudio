VIULUKIELET · RESONATORENGINE 0.2.4 PWA

Viulukielet_MOUSE_TEST-pohjaan yhdistetty hyväksytty ResonatorEngine BASE,
nyt asennettavana Progressive Web App -sovelluksena.

Versiossa 0.2.4 herkkyys oppii soittajalta. Taustakohinan kalibrointi kestää
edelleen 1,5 sekuntia ja pysyy muuttumattomana koko mikrofonisession ajan.
Ensimmäiset kolme vakaasti tunnistettua säveltä muodostavat soittajan oman
4–10 dB:n aktivointirajan. Raja ei palaudu sävelten välissä, vaan tarkentuu
myöhemmistä sävelistä vähitellen. Myös selvästi hiljaisempi uusi sävel voidaan
oppia nykyisen rajan alapuolelta ilman uutta taustakohinan mittausta.

Oikean reunan graafinen asteikko näyttää ensin oppimisen etenemisen ja sen
jälkeen opitun dB-rajan hehkuvana pisteenä. Oppiminen alkaa alusta vasta, kun
mikrofoni avataan uudelleen.

RAKENNE

mikrofoni → ResonatorEngine → note-stability → herkkyysoppija → kielianimaatio

- resonator-engine.js perustuu hyväksyttyyn ResonatorEngine BASEen. Versiossa
  0.2.3 moottori ilmoittaa tunnistetun sävelen voimakkuuden taustaan nähden ja
  löytää myös nykyisen rajan alapuolisen, vahvasti resonoivan viulusävelen.
- note-stability.js on erillinen suojakerros lyhyitä äänen lopun virhehyppyjä
  varten.
- sensitivity-learner.js oppii ja säilyttää soittajan 4–10 dB:n rajan.
- index.html sisältää viulunäkymän, käyttöliittymän ja moottorin
  tapahtumakytkennät sekä PWA-rekisteröinnin.
- manifest.webmanifest määrittää sovelluksen nimen, värit ja kuvakkeet.
- sw.js tallentaa sovelluksen paikalliseen välimuistiin offline-käyttöä varten.
- icons-kansio sisältää asennuskuvakkeet.
- Vanhaa YIN-äänianalyysiä ei ole mukana.

TUNNISTETTAVAT AVOIMET KIELET

G3  196,00 Hz
D4  293,66 Hz
A4  440,00 Hz
E5  659,26 Hz

KÄYTTÖ

1. Pura koko ZIP-paketti.
2. Avaa kansio HTTPS-osoitteesta tai localhost-palvelimelta.
3. Paina oikean alakulman mikrofonipainiketta.
4. Ole 1,5 sekunnin taustakohinan kalibroinnin ajan hiljaa.
5. Soita vähintään kolme vakaata avointa kieltä. Oikean reunan asteikko näyttää
   oppimisen etenemisen ja syttyy opitun 4–10 dB:n rajan kohdalle.
6. Jatka soittamista. Raja säilyy sävelten välissä ja tarkentuu soittosi mukaan.
   Tunnistettu kieli alkaa värähdellä ja sen
   hahmo tulee näkyviin.
7. Sulje mikrofoni painamalla samaa painiketta uudelleen.

Kieliä voi kokeilla ilman mikrofonia myös napauttamalla niitä tai näppäimillä
G, D, A ja E. Escape tyhjentää näkymän.

PWA-ASENNUS

- Androidissa ja työpöytäselaimissa avaa selaimen valikosta Asenna sovellus.
- iPhonessa ja iPadissa avaa Safarin Jaa-valikko ja valitse Lisää Koti-valikkoon.
- Offline-käyttö aktivoituu, kun sovellus on avattu kerran verkkoyhteydellä.

Mikrofoni ja PWA-asennus vaativat HTTPS-yhteyden tai localhostin. Pelkkä
index.html-tiedoston avaaminen file://-osoitteesta ei käynnistä service workeria.
Paikallisen palvelimen voi käynnistää kansion sisältä esimerkiksi komennolla:

python3 -m http.server 8000

Avaa sitten selaimessa http://localhost:8000
