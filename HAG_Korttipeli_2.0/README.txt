H–A–G-korttipeli 2.0 – Firebase High Score
===========================================

Uutta versiossa 2.0
- Oppilas voi sanoa tai kirjoittaa pelinimensä.
- Nimi vahvistetaan nimikentässä ennen pelin alkua.
- Kierroksesta lasketaan pistemäärä suoritusajan perusteella.
- Tulos tallennetaan Firebase Cloud Firestoreen.
- Pelissä näkyy reaaliaikainen HAG Top 10.
- Top 10 näyttää vain kunkin pelinimen parhaan tuloksen.
- Jos verkkoyhteys puuttuu, tulos jonotetaan selaimen localStorageen ja lähetetään myöhemmin.
- Pelaajan voi vaihtaa kierroksen jälkeen.

Käyttö
1. Julkaise koko kansio GitHub Pagesiin tai muulle HTTPS-palvelimelle.
2. Avaa index.html julkaistusta osoitteesta.
3. Anna selaimelle mikrofonilupa.

Huomioita
- Nimen puheentunnistus käyttää selaimen SpeechRecognition-toimintoa. Kirjoittaminen toimii aina varavaihtoehtona.
- Firebase ja yhteinen pistetaulukko tarvitsevat internet-yhteyden.
- Huilun säveltunnistus toimii edelleen alkuperäisellä Nuottikompassi Microphone Enginellä.
- Firebase-projekti: pelitulokset
- Firestore-kokoelma: scores
- Pelitunniste: hag-korttipeli

Firestore-säännöissä sallitaan scores-kokoelmaan kentät:
playerName, score, gameId, createdAt
