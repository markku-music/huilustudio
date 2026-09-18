VIULUKIELET · RESONATORENGINE 0.1

Viulukielet_MOUSE_TEST-pohjaan yhdistetty hyväksytty ResonatorEngine BASE.

RAKENNE

mikrofoni → ResonatorEngine → note-stability → viulun kielianimaatio

- resonator-engine.js on kopioitu hyväksytystä ResonatorEngine BASEsta
  muuttamattomana.
- note-stability.js on erillinen suojakerros lyhyitä äänen lopun virhehyppyjä
  varten.
- index.html sisältää viulunäkymän, käyttöliittymän ja moottorin
  tapahtumakytkennät.
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

Mikrofonikäyttö vaatii HTTPS-yhteyden tai localhostin. Paikallisen palvelimen
voi käynnistää kansion sisältä esimerkiksi komennolla:

python3 -m http.server 8000

Avaa sitten selaimessa http://localhost:8000
