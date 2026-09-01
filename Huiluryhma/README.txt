Huiluryhmän Firebase-prototyyppi V1.5

Uutta tässä versiossa:
- Pelaaja luodaan heti nimen + eläimen perusteella ja saa vapaan ainutlaatuisen sävelkoodin.
- Sävelkoodin soittaminen pelaajan luonnin jälkeen on vapaaehtoinen kokeilu eikä muuta tai vahvista koodia.
- Kolmen sävelen koodi tulkitaan ensimmäisen soitetun äänen ankkurista: sekä 2. että 3. ääni verrataan aina ensimmäiseen.
- Sama korkeustaso = ±49 cent ensimmäisestä äänestä; sen yläpuoli tulkitaan korkeammaksi ja alapuoli matalammaksi.
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
