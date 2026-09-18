VIULUKIELET · RESONATORENGINE 0.2.1 PWA

Viulukielet_MOUSE_TEST-pohjaan yhdistetty hyväksytty ResonatorEngine BASE,
nyt asennettavana Progressive Web App -sovelluksena.

Versiossa 0.2.1 sovelluskuvake on vaihdettu aidomman näköiseen viuluun.

RAKENNE

mikrofoni → ResonatorEngine → note-stability → viulun kielianimaatio

- resonator-engine.js on kopioitu hyväksytystä ResonatorEngine BASEsta
  muuttamattomana.
- note-stability.js on erillinen suojakerros lyhyitä äänen lopun virhehyppyjä
  varten.
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
4. Ole lyhyen taustakohinan kalibroinnin ajan hiljaa.
5. Soita viulun avointa kieltä. Tunnistettu kieli alkaa värähdellä ja sen
   hahmo tulee näkyviin.
6. Sulje mikrofoni painamalla samaa painiketta uudelleen.

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
