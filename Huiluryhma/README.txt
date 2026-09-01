HUILURYHMÄ – V1.3 SUOJATTU OPETTAJANÄKYMÄ
===========================================

Mitä muuttui V1.2.1:stä
- Pelaajan index.html, app.js ja microphone-engine.js ovat ennallaan.
- teacher.html käyttää nyt Firebase Email/Password -kirjautumista.
- teacher.js ei kirjaudu enää anonyymisti.
- Opettajan oikeus tarkistetaan Firestore-dokumentista teachers/{UID}.
- Opettaja näkee kaikki ryhmät ja voi hallita kaikkia niiden pelaajia.
- Firestore Rules estää anonyymiä käyttäjää listaamasta ryhmiä tai jäseniä.
- Pelaajan eläin + 3 sävelen kirjautuminen toimii edelleen yksittäisellä document get -haulla.

FIREBASE-KÄYTTÖÖNOTTO
1. Authentication -> Sign-in method -> Email/Password -> Enable.
2. Authentication -> Users -> Add user. Luo opettajalle sähköposti + salasana.
3. Kopioi luodun käyttäjän UID.
4. Firestore Database -> Data -> luo kokoelma "teachers".
5. Luo dokumentti, jonka Document ID on täsmälleen opettajan UID.
   Dokumenttiin voi lisätä esimerkiksi kentän role = "teacher". Kenttää ei käytetä oikeuden tarkistukseen; dokumentin olemassaolo riittää.
6. Firestore Database -> Rules -> korvaa säännöt tämän paketin firestore.rules-tiedostolla ja Publish.
7. Vie teacher.html ja teacher.js GitHubiin Huiluryhma-kansioon. Voit viedä myös firestore.rules-version talteen repoon.

TURVALLISUUS
- Salasanaa ei ole eikä pidä olla JavaScript-tiedostoissa.
- teachers-kokoelmaa ei voi muuttaa selaimesta Firestore Rulesien läpi.
- Oppilaat käyttävät edelleen Anonymous Authenticationia.
- Anonyymi käyttäjä ei voi tehdä collection-listauksia ryhmistä tai pelaajista.
- Pelaajan kirjautumistunnus on tarkoituksella kevyt (ryhmä + eläin + 3 sävelen koodi), joten Firestoreen kannattaa tallentaa vain ei-arkaluonteista oppilasdataa, esimerkiksi etunimi/lempinimi ja pelituloksia.
