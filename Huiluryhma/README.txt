Huiluryhmän Firebase-prototyyppi V1.6

Uutta tässä versiossa:
- Pelaaja luodaan heti nimen + eläimen perusteella ja saa vapaan ainutlaatuisen sävelkoodin.
- Sävelkoodin soittaminen pelaajan luonnin jälkeen on vapaaehtoinen kokeilu eikä muuta tai vahvista koodia.
- Harjoittelussa arvottu koodi tunnetaan etukäteen: vain H/L-parit tarkistetaan vähintään 49 centin erolla. Saman kirjaimen säveliä ei verrata keskenään.
- Kirjautumisessa koodi päätellään kolmesta äänestä jakamalla ne kahteen korkeustasoon suurimman välin kohdalta.
- 49 cent on selkeän korkeuseron raja, ei vaatimus saman kirjaimen sävelten yhtäsuuruudelle.
- Jos kaksi ensimmäistä säveltä muodostavat selvän H/L-parin, kolmas verrataan ensimmäiseen. Esim. HLL: viimeinen L ei vertaudu edelliseen L:ään.
- LHL: viimeisen L:n ei tarvitse olla ±49 centin sisällä ensimmäisestä L:stä; sen pitää vain olla luokittelussa matala suhteessa ensimmäisen ja toisen sävelen muodostamaan suuntaan.
- Käytössä ovat kuusi kaksitasoista koodia: LLH, LHL, LHH, HLL, HLH, HHL.
- Yhteinen tabletti: eläin + sävelkoodi tekee kirjautumispyynnön opettajanäkymään.
- Opettajanäkymä näyttää reaaliaikaisesti esim. "Aino?" ja Hyväksy/Hylkää.
- Oma tabletti: ensimmäisellä käyttökerralla tarvitaan pysyvä 8-merkkinen kotikoodi.
- Onnistunut kotikoodi rekisteröi selaimeen satunnaisen laitesalaisuuden. Seuraavilla kerroilla kotikoodia ei kysytä.
- Opettaja voi luoda, näyttää ja vaihtaa pelaajan kotikoodin teacher.html-sivulta.
- microphone-engine.js on säilytetty ennallaan; vain app.js:n koodin tulkintalogiikka muuttui.

KÄYTTÖÖNOTTO
1. Korvaa GitHubin Huiluryhma-kansion tiedostot tämän paketin tiedostoilla.
2. Firebase Console -> Firestore Database -> Rules: korvaa säännöt tämän paketin firestore.rules-sisällöllä ja Publish.
3. Avaa teacher.html ja kirjaudu opettajana.
4. Pelaajan kohdalla paina "Luo kotikoodi" ja anna koodi oppilaalle/huoltajalle.
5. Yhteisellä tabletilla valitse "Yhteinen tabletti". Oppilaan onnistunut sävelkoodi jää odottamaan opettajan hyväksyntää.
6. Kotona valitse "Oma tabletti". Ensimmäisellä kerralla syötä kotikoodi.

HUOMIO
- Kotikoodi pysyy samana, kunnes opettaja valitsee "Uusi koodi".
- Kotikoodin vaihto estää vanhan koodin käytön uusien laitteiden käyttöönotossa. Jo aiemmin hyväksytyt laitteet pysyvät tässä V1.4-versiossa hyväksyttyinä.
- Jos selaimen sivustotiedot/localStorage tyhjennetään, oma laite tarvitsee kotikoodin uudelleen.
- Älä tallenna tulevia arkaluonteisia oppilastietoja groups/.../slots-dokumenttiin, koska oppilassovellus tarvitsee siitä yksittäisen get-haun säveltunnistuksen jälkeen.

V1.6 korjaus:
- Koodin harjoittelussa tiedetään arvottu tavoitekoodi. Tällöin verrataan vain H/L-parien keskinäistä järjestystä vähintään 49 centin erolla. Saman kirjaimen sävelten ei tarvitse osua keskenään samaan korkeuteen.
- Esimerkiksi LHL hyväksytään, kun keskimmäinen H on vähintään 49 c molempia L-säveliä korkeampi. Kahden L:n keskinäisellä korkeuserolla ei ole väliä.
- Kirjautumisessa, jossa koodia ei vielä tiedetä, kolme säveltä ryhmitellään kahdeksi tasoksi suurimman korkeuseron perusteella; vähimmäisraja on 49 c.

V1.7 – Äänikynnys
- Lisätty säädettävä mikrofonin äänenvoimakkuusraja (-70...-25 dB).
- Oletus -45 dB.
- Reaaliaikaisessa voimakkuusmittarissa näkyy punainen kynnysmerkki.
- Oikealle siirtäminen vähentää herkkyyttä: puheen on vaikeampi käynnistää sävelentunnistus.
- Asetus tallentuu selaimen localStorageen tällä laitteella.
- 49 centin H/L-sävelkoodilogiikkaa ei muutettu.
