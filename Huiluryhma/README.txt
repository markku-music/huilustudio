HUILURYHMÄ – FIREBASE + ELÄIN + 3 SÄVELEN KOODI – V1
=====================================================

IDEA
- Ryhmän sisällä tunnus = eläin + kolmen sävelen suhteellinen koodi.
- Kuusi mahdollista koodia / eläin: LLH, LHL, LHH, HLL, HLH, HHL.
- Absoluuttisia sävelkorkeuksia ei tallenneta eikä lähetetä verkkoon.
- Sävelkojun microphone-engine.js tunnistaa sävelen paikallisesti tabletissa.
- Firestorelle lähetetään vain ryhmä, eläin ja abstrakti L/H-koodi.

FIREBASE-KÄYTTÖÖNOTTO
1. Luo Firebase-projekti: https://console.firebase.google.com/
2. Lisää Web App (</>), kopioi firebaseConfig ja liitä se firebase-config.js-tiedostoon.
3. Firestore Database → Create database.
4. Authentication → Sign-in method → ota Anonymous käyttöön.
5. Firestore → Rules → kopioi tämän paketin firestore.rules ja Publish.
6. Vie nämä tiedostot HTTPS-palvelimelle, esimerkiksi GitHub Pagesiin.

FIRESTORE-RAKENNE
/groups/{RYHMA}/slots/{ELAIN}_{KOODI}
  name: "Aino"
  animal: "fox"
  code: "LHL"
  verified: true/false
  ownerUid: "..."
  createdAt: server timestamp
  verifiedAt: server timestamp

Uniikkius
- Dokumentin tunnus on esimerkiksi fox_LHL.
- Firestore-transaktio tarkistaa kaikki kuusi eläimen koodipaikkaa ja varaa vain vapaan.
- Kaksi tablettia eivät voi onnistuneesti varata samaa eläin+koodi-yhdistelmää samaan ryhmään.

HUOM.
- Tämä on prototyyppi. Käytä lapsille mieluiten etunimeä tai lempinimeä.
- Tuotantoversiossa käyttöoikeuksia kannattaa vielä tiukentaa opettajan/ryhmän hallintamallilla.

OPETTAJANÄKYMÄ V1.2
-------------------
- teacher.html = ryhmien ja pelaajien hallinta.
- teacher.js = opettajanäkymän Firebase-logiikka.
- Nykyiseen app.js- tai microphone-engine.js-logiikkaan ei ole tehty muutoksia.
- index.html:ään lisättiin vain pieni Opettaja-linkki.
- Opettajanäkymä käyttää tässä ensimmäisessä versiossa selaimen Anonymous Auth -UID:tä.
  Siksi se voi muokata/poistaa vain samalla UID:llä luotuja pelaajia.
- Mukana oleva firestore.rules sallii ryhmän poistamisen vain sen luoneelle UID:lle.
  Julkaise uusi sääntötiedosto Firebase Consolen Rules-välilehdellä, jos haluat käyttää ryhmän poistamista.
