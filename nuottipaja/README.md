# Nuottipaja – yhteyskokeilu 0.1.1
Oma Firebase-projekti: nuottipaja-502d3. Ei riippuvuutta Puhallinstartista.
Peli: dist/index.html, käyttöönotto: dist/kayttoonotto.html ja firebase/KAYTTOONOTTO.txt.
Sävel- ja aika-arvopelaaja liittyvät kuusinumeroisella koodilla; huoneessa on kaksi eri roolia. G ja neljäsosa annetaan painikkeilla. Ei mikrofonia eikä nimiä.
Käytä HTTPS-palvelinta tai paikallisesti dist-kansiossa python3 -m http.server 8000 ja http://localhost:8000. Pelkkä tiedoston kaksoisklikkaus ei riitä.
Firebase-hallinnassa on otettava anonyymi kirjautuminen ja Firestore käyttöön ja julkaistava firebase/firestore.rules kokonaisena.
Huone vanhenee 24 tunnissa. Päivitys palauttaa istunnon; käytä poistumispainiketta paikan vapauttamiseen.
Huonelogiikka 19/19 testiä ja aiemmat huonesäännöt 35/35 paikallista emulaattoritestiä. Uuden projektin pilviyhteyttä ei vielä ole testattu. Tämän version kokoelmakiellon testit: tests/FIRESTORE_TESTS.txt.
