LENTOKONE 6.4.1

Huilun suukappaleäänellä ohjattava peli. Version 6.4.0 korjaukset ovat
mukana. Aloitusvalikko käyttää nyt kolmea kuvapainiketta. Pelin äänet,
pisteytys, tunnistuksen hyväksymisrajat ja lentoliike on säilytetty.

KÄYTTÖ
Pura ZIP. index.html, sw.js ja app-kansio kuuluvat samaan hakemistoon.
Julkaise hakemisto HTTPS-palvelimella. Paikallisesti voit käynnistää
hakemistossa komennon python3 -m http.server 8000 ja avata
http://localhost:8000. Mikrofonia varten käytä HTTPS:ää tai localhostia.
Peli on suunniteltu vaakasuuntaan.

Suukappaleen kuva: aloittaa pelin alkuperäisellä oletusäänellä.
Opeta / 1 ääni: kolme puhallusta opettaa yhden oman äänen.
Opeta / 2 ääntä: kolme puhallusta kumpaankin suuntaan.
Jokainen näistä kolmesta valinnasta tyhjentää edellisen yhden ja kahden
äänen opetuksen käyttömuistista ja selaimen tallennuksesta heti aluksi.
Tämä tapahtuu myös silloin, jos mikrofonilupa evätään tai opetus perutaan.
Onnistunut aloitusvalikon opetus käynnistää pelin suoraan uudella äänellä.
Uudestaan aloittaa uuden kierroksen samalla ohjaustavalla ja samoilla
opetetuilla äänillä. Alkuun palauttaa aloitusvalikkoon; opetus tyhjenee
vasta seuraavasta valikkovalinnasta. Sivun uudelleenavaus alkaa oletuksella.

Kierros kestää 90 sekuntia ensimmäisestä osumasta alkaen.
Yksi uusi hyväksytty puhallus vaihtaa lentokorkeutta yhden äänen tilassa.
Kahden äänen tilassa YLÖS-ääni valitsee yläreitin ja ALAS-ääni alareitin.
Laatubonus ja kestobonus antavat kumpikin yhden pisteen vanhoilla ehdoilla.

MIKROFONI
Mikrofoni avataan vain pelin tai opetuksen käynnistämisestä.
Se suljetaan kierroksen päättyessä ja opetuksen keskeytyessä.
Onnistuneesta valikko-opetuksesta jatketaan samalla mikrofonilla peliin.
Uudestaan avaa mikrofonin ja kalibroi huoneen kohinan uudelleen.
Myös Alkuun varmistaa mikrofonin ja äänikontekstin sulkemisen.
Mikrofonin ääntä ei lähetetä verkkopalveluun eikä tallenneta äänitiedostoksi.

MITÄ ÄÄNEN OPETUS TALLENTAA
Yhden äänen peliohjaus perustuu opetettuun sävelkorkeuteen. Hyväksyttyjä
ovat lähimpään MIDI-säveleen pyöristetty opetettu sävel ja sitä seuraava
ylempi puolisävelaskel, kuten versiossa 6.3.9. Sointiprofiili auttaa
opetuksen näytteiden vertailussa; sitä ei käytetä pelin ohjausrajana
ja sitä ei enää tallenneta tarpeettomasti.

Vanhan version referenssit luetaan yhteensopivuuden vuoksi, mutta uusi
aloitusvalikon valinta poistaa ne. Uusi opetus tallentuu seuraavaan
valintaan asti. Tyhjennys ei muuta laatubonuksen asetusta tai muiden
sovellusten tallennuksia. Oletusäänen f0 on 837.8248546223447 Hz.
Kahden äänen Resonator-asetus on 30 senttiä, ja opetettujen äänten
vähimmäisero on 75 senttiä. Tunnistusalgoritmia ei ole muutettu.

MUUTOKSET 6.4.1
- Kolme kuvapainiketta yhdessä WebP-kuvassa. Oletuspainikkeessa on
  käyrä suukappale ilman tekstiä. Opeta esiintyy vain kerran.
- Lentokoneet ovat samalla korkeudella; nuolet ovat nokkien edessä.
- Yhteinen pyöristetty Opeta-otsikkopalkki yhdistää kaksi opetusnappia.
- Kuvan päällä on kolme oikeaa HTML-painiketta: kosketus, näppäimistö,
  ruudunlukijan nimet ja näkyvä kohdistus toimivat ilman kuvan tekstiä.
- Edellinen opetus tyhjenee jokaisesta aloitusvalikon valinnasta.
- Onnistunut opetus siirtyy suoraan peliin ilman uutta käynnistyspainallusta.
- Uudestaan säilyttää opetuksen myös useilla peräkkäisillä kierroksilla.
- Lopetusnäkymän Valmis-painike on nimetty Alkuun-painikkeeksi.
- Vanhat valikkokuvat ja niiden käyttämättömät tyylit on poistettu.
- Service workerin versio on vaihdettu, jotta uusi valikko latautuu.

KORJAUKSET 6.4.0
- Välimuistin nimi sisältää pelin oman URL-polun. Automaattinen siivous
  ja päivityspainike käsittelevät vain tämän asennuksen välimuisteja.
- Päivityspainike tarkistaa vain tämän pelin service workerin.
- Offline-haku lukee oman välimuistin, ei saman sivuston kaikkia välimuisteja.
- Vanhoja yhteisiä välimuisteja ei poisteta sokkona: ne voivat sisältää
  myös muiden peliasennusten tietoja.
- Kerätyt kolikot, timantit ja arkut poistuvat animaation päätyttyä
  sekä näkymästä että pelin objektitaulukosta.
- Kivitörmäyksen lukitsema kahden äänen ohjauskomento yritetään uudelleen
  lukituksen päätyttyä. Jatkuva ääni voi palauttaa koneen pyydetylle reitille.
- Mikrofonin, analyysiajastimen ja äänisolmujen sulkeminen on yhtenäistetty.
- Uudestaan rakentaa uuden mikrofoniyhteyden ja ääniketjun tarvittaessa.
- Peruuttaminen tai mikrofoniluvan epääminen ei jätä äänikontekstia auki.
- Käynnistys ja opetus eivät voi käynnistyä päällekkäin.
- Asetuksista tehtävän opetuksen onnistumis- ja virhetekstit säilyvät.
- Manuaalista kohinakalibrointia ei käynnistetä useita kertoja rinnakkain.
- Vanhat both/high/low-ohjaushaarat ja niihin liittyvä käyttämätön laskenta
  on poistettu.
- ResonatorSession-testipenkki ja käyttämätön näyttösuojaluokka on poistettu.
  Pelissä ei lasketa erillistä sävelkorkeusnäyttöä, jonka tuloksia ei käytetä.
- Poistettu piilotettu vanha ohjenäkymä, sen PNG-kuva, käyttämätön huilukuva
  sekä vanhojen näkymien CSS-säännöt. Macin metatiedostoja ei ole paketissa.

TARKISTUKSET
Aja projektin juuressa: node tests/regression.cjs
Testit tarvitsevat Node.js 20:n tai uudemman. Ne eivät tarvitse pakettien
asennusta, verkkoyhteyttä tai mikrofonia. Mukana on 32 regressiotestiä:
objektien poisto, ohjauslukko, mikin sulkeminen/uudelleenavaaminen,
peruutus ja virhetilanteet, tallennettujen asetusten yhteensopivuus,
välimuistien eristys, offline-varatoiminto, tiedostoviitteet sekä valintojen
tyhjennys, siirtyminen uudesta opetuksesta peliin ja opetuksen säilyminen
uusintakierroksilla sekä paluu aloitusvalikkoon.

Version 6.4.0 yhteydessä tehtiin myös 14 synteettisen
äänisyötteen vertailu alkuperäiseen Resonatoriin (44,1 ja 48 kHz).
Tunnistuksen input-tapahtumat olivat samoja. Varsinaista iPhonen/iPadin
selain- tai mikrofonitestiä ei tehty tässä ympäristössä.
