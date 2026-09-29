ASTEIKKOSPURTTI – ASTEIKKO JA SUUNTA YLÄREUNASSA

Pohja: Asteikkospurtti_OSMD_MOBIILI. Tämä on erillinen versio.

Asteikko ja suunta valitaan pelikentän yläreunasta vasemmalta.
AIKA ja PARAS näkyvät oikealla. Valikot ovat käytettävissä myös ennen Aloita-
painallusta. Kapeassa pystynäkymässä ajat siirtyvät valikoiden alle.
Valinnan muuttaminen valmistelee uuden kierroksen ja säilyttää mikrofonin auki.
Muut asetukset löytyvät rattaasta. Pelilogiikkaa ja äänentunnistusta ei muutettu.
Tässä päivityksessä muutettiin vain index.html, responsive.css ja tämä ohje.
Valikoiden tunnisteet, vaihtoehtojen arvot ja tapahtumankäsittelijät säilyivät.
Varsinainen laitetestaus on edelleen tekemättä.

KÄYTTÖ
Pura koko ZIP, myös assets- ja vendor-kansiot. Aloitussivu on index.html.
Mikrofoni tarvitsee HTTPS-osoitteen (esimerkiksi GitHub Pages) tai localhostin.
OSMD-kirjasto ja kuvat ovat mukana paketissa. Hiiritesti toimii myös paikallisesti.

Käännä puhelin tai tabletti vaakatasoon. Paina Aloita ja hyväksy mikrofonilupa.
Ole 1,5 sekuntia hiljaa kalibroinnin ajan. Peli pyytää samalla koko näytön tilaa.
Jos selain ei tue koko näytön tilaa, peli toimii selainikkunassa.

MUKAUTUVA ASETTELU
Nuotit pysyvät ylhäällä. Maisema täyttää jäljelle jäävän tilan rajautuen näytön
muodon mukaan. Sävelpisteet ja nuotit ovat edelleen pystysuunnassa kohdakkain.
Nuotteja tai juoksijan mittasuhteita ei venytetä. Juoksijan kokoa ja rivien
korkeutta sovitetaan käytettävissä olevaan tilaan.

AIKA ja PARAS näkyvät yläreunassa. Asetukset avataan vasemman alakulman
rattaasta. Puhelimessa paneeli käyttää lähes koko näytön ja vierii pystysuunnassa;
Sulje-painike pysyy ylhäällä. Kameralovet ja alareunan turva-alueet huomioidaan.

Pystyasennossa näkyy kääntökehotus. Aloitus ja asetukset toimivat myös silloin.
Kääntäminen tai näytön koon muuttuminen ei aloita uutta kierrosta eikä pysäytä
ajanottoa. Uusi kierros aloitetaan asetuksista tarvittaessa.

Loppuaikakupla näkyy vasta juoksijan saavuttua maaliin. Matalassa selainikkunassa
se sijoitetaan juoksijan viereen, jotta nuotit säilyvät näkyvissä. Tavallisessa
vaakanäkymässä kupla on juoksijan yläpuolella. Uusi ennätys saa saman animaation
kuin aiemmin. Valmis kupla siirtyy oikein myös näyttöä käännettäessä.

ASTEIKOT JA PELI
F-duuri f¹–f², G-duuri g¹–g², D-duuri d¹–d² tai d²–d³,
B-duuri b¹–b² (kaksi alennusta) ja C-duuri c²–c³.
Suunnat: ylöspäin, alaspäin ja molempiin suuntiin. Oletus: F-duuri ylöspäin.
Edestakaisessa asteikossa huippusävel soitetaan kerran.

Juoksutavat: Vauhti kantaa ja Juokse soittaessa. Jälkimmäisessä äänen
loppuminen jarruttaa myös keskeneräistä spurttia. Ajanotto jatkuu hiljaisuudessa.
Jokaisella asteikolla, suunnalla, juoksutavalla ja ohjaustavalla on oma paras aika.
Paras-juoksija toistaa parhaan kierroksen. Nollaa haamu oppilaan vaihtuessa.
Ennätykset ovat selainkohtaisia; ne eivät siirry automaattisesti laitteesta toiseen.

Hiiritesti: sävelpainikkeet tai näppäimet 1–8. Alaspäin järjestys on 8–1,
molempiin suuntiin 1–8–1. Juokse soittaessa -tilassa pidä sävelpainiketta
painettuna äänen keston ajan. Hiiritila valitaan asetuksista.

Liikesäädöt, ohje ja JSON löytyvät asetusten avattavasta osiosta.
Oletukset: ease-in 1, ease-out 1, spurtti 440 ms, kantama 5000 ms,
kohinaraja 8 dB, pysähtymisen pehmeys 180 ms, animaationopeus 1 ×.

MUUTOS JA TARKISTUKSET
Mobiiliasettelu on responsive.css- ja responsive.js-tiedostoissa.
index.html sisältää asettelukerrokset ja kääntökehotuksen.
finish-bubble.js sovittaa aikakuplan uuteen asetteluun.

Pelin game.js, resonator-engine.js, asteikot, OSMD-ladonta, fullscreen.js,
perusasetukset ja kaikki grafiikkatiedostot ovat tavutasolla samat kuin pohjassa.
Äänentunnistus, säveljärjestys, ajat, liike ja ennätysten tallennus eivät muuttuneet.

Ohjelmallisesti tarkistettu kahdeksan näyttökokoa, myös matalat selainikkunat:
568×320, 667×375, 844×390, 844×280, 667×260, 1024×768, 1366×1024 ja 1920×1080.
Tarkistukset kattoivat turva-alueiden vähentämisen asettelusta, hahmojen
mittasuhteet, rivien ja kuplan mahtumisen, molemmat maalit, normaalin tuloksen
ja ennätyksen, kuplan oikean ilmestymishetken sekä koonmuutokset maalissa.
SVG-asettelusta tarkistettiin myös staattiset esikatselut.

Tämä ympäristö ei sisältänyt toimivaa graafista selainta. Varsinaista mobiilin
selainnäkymää, OSMD:n latausta tässä asettelussa, kosketusta, mikrofonia ja
koko näytön tilaa ei ole kokeiltu oikealla puhelimella tai tabletilla.
Ensimmäisellä laitekokeilulla tarkista myös korkean D-duurin apuviivat,
asetuspaneelin vieritys ja kuplan sijainti molemmissa maaleissa.

OSMD-lisenssi: vendor/osmd/LICENSE.
