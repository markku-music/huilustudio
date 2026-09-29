PWA JA UUSI IKONI – 29.9.2026

Tämä paketti voidaan asentaa kotinäytölle omaksi Resonator-sovelluksekseen.
Uudessa ikonissa on valkoinen nuotti ja sininen ääniaalto.

ASENNUS GITHUB PAGESIIN
1. Pura ZIP. Vie kansion sisältö sovelluksen omaan GitHub Pages -kansioon.
   index.html, sw.js ja manifest.webmanifest ovat samalla tasolla.
   Säilytä icons- ja vendor-alikansiot.
2. Avaa julkaistu HTTPS-osoite verkossa ja anna sivun latautua loppuun.
3. iPad: avaa sivu Safarissa → Jaa → Lisää Koti-valikkoon.
4. Avaa Resonator uudesta kotinäytön kuvakkeesta. Salli mikrofoni pyydettäessä.

Onnistuneen ensilatauksen jälkeen sovelluksen käyttöliittymä, nuottikirjasto
ja tunnistusmoottori ovat käytettävissä myös ilman verkkoyhteyttä.
Mikrofonin käyttö tarvitsee edelleen selaimen mikrofoniluvan.

Jos vanha versio on jo kotinäytöllä, uusi ikoni ei välttämättä vaihdu siihen
heti. Avaa julkaisu ensin verkossa, sulje ja avaa sivu uudelleen. Jos ikoni
pysyy vanhana, poista vanha kotinäytön kuvake ja lisää päivitetty sivu uudelleen.

Paikallinen kokeilu tietokoneessa: python3 -m http.server 8000
Avaa samalla tietokoneella http://localhost:8000. iPadilla käytä HTTPS-julkaisua.
Pelkkä tiedoston avaaminen levyltä ei asenna PWA:ta.

TÄMÄN PWA-PÄIVITYKSEN MUUTOKSET
- Uusi ikoni: 192 px, 512 px, Androidin maskattava 512 px,
  iPadin/iPhonen 180 px sekä selaimen 32 px.
- Kotinäytön lyhyt nimi Resonator ja ikoneille uudet versio-osoitteet.
- Erillinen pwa.js rekisteröi offline-tuen.
- Välimuisti on rajattu sovelluksen omaan julkaisukansioon.
  Muiden samaan sivustoon kuuluvien sovellusten välimuisteja ei poisteta.
- Tiedostot tallennetaan asennuksessa yhtenä kokonaisuutena.
- Sävelmoottori, vaihtosuoja, OSMD ja liukurisäädöt ovat alkuperäiset.

Kehittäjälle: kun julkaiset myöhemmin uusia ohjelmatiedostoja, muuta sw.js:n
CACHE_NAME-version loppuosaa. Näin uusi kokonaisuus tallennetaan omaksi
välimuistiversiokseen. Uusi versio tulee käyttöön seuraavassa sivun avauksessa,
kun palvelutyöntekijän päivitys on valmistunut. Rekisteröinti ei lataa sivua
kesken soiton uudelleen.

Tarkistettu tiedostoviittaukset, ikonien mitat, alkuperäisten ydintiedostojen
säilyminen sekä offline-välimuistin toiminta simuloidussa palvelutyöntekijässä.
Kotinäyttöasennusta oikealla iPadilla ei ole testattu tässä ympäristössä.

Alla alkuperäisen sovelluksen käyttöohjeet ja aiempien versioiden tiedot.

HYVÄKSYTYT OLETUSASETUKSET – 26.9.2026
Markun hyväksymä 0.4-version asettelu on tämän paketin oletuksena:
- Automaattinen vaakakeskitys päällä.
- Koko 171 %, Y-siirto 51 px, nuottialueen korkeus 265 px.
- Nuottiavaimen jälkeinen väli 48 %.
- Etumerkillistä nuottia edeltävä väli 62 %.
- Viivaston loppuväli 50 %.
- Yleinen nuottiväli 1.5.
- Muut arvot käyttäjän toimittaman JSONin mukaan.

Palauta lähtöarvot palauttaa nämä hyväksytyt asetukset. Jos selaimessa on
vanhoja omia asetuksia, saat uuden oletusasettelun käyttöön tällä painikkeella.
Alkuperäinen hyväksytty JSON on mukana tiedostossa hyvaksytyt-asetukset.json.
Kehittäjäpaneeli, tunnistusmoottori ja vaihtosuoja säilyvät käytössä.
Tässä päivityksessä muutettiin vain oletusarvot ja version tiedot.

RESONATORENGINE 1.0.12 – ASTEIKON HYVÄKSYTTY ASETTELU 0.5

Pohja: ResonatorEngine_1.0.12_DYNAMIIKKA_KOE_0_2_KAYNNISTYSKORJAUS.zip

KÄYNNISTYS
Pura koko ZIP omaan kansioon ja avaa index.html. Kaikki riippuvuudet,
myös OSMD, ovat mukana. Nuotteja voi kokeilla hiirellä tai näppäimillä 1–8.
Jos selaimesi ei salli mikrofonia suoraan levyltä avatussa tiedostossa,
käynnistä kansiossa Python 3:lla: python3 -m http.server 8000
Avaa sitten http://localhost:8000. Verkkopalvelimella mikrofoni vaatii HTTPS:n.

ASTEIKON SÄÄDÖT
Avaa rataspainike. Paneelissa on 18 liukuria ja niiden numerokentät:
- Asteikon koko, nuottialueen korkeus sekä X- ja Y-sijainti.
- Nuottiavaimen jälkeinen väli, väli ennen etumerkillistä nuottia
  ja viivaston loppuväli.
- Yleinen nuottien väli, viivaston paksuus ja varsien paksuus.
- Rajaus vasemmalta, oikealta, ylhäältä ja alhaalta.
- Paneelin neljä reunatilaa.

Kaikki muutokset päivittyvät automaattisesti. Toteuta OSMD:llä -painiketta
ei enää ole. Koko, sijainti, korkeus, rajaukset ja reunatilat päivittyvät
suoraan valmiiseen nuottikuvaan. Nuottiväli ja paksuudet vaativat uuden
OSMD-ladonnan: muutokset yhdistetään 80 ms:n päivitysjonoon. Uusi työ odottaa
edellisen valmistumista. Asteikot päivittyvät myös liukuria vedettäessä.
OSMD-ladonnan kesto riippuu laitteesta; 80 ms ei ole kokonaisviive.

Numeroarvoa voi kirjoittaa käsin. Nuottien näppäinoikotiet eivät reagoi
silloin, kun kirjoitat säätimen numeroa tai JSONia.
Rajauksen suuret arvot voivat leikata nuotteja, ja suuri suurennus voi viedä
asteikon näkyvän alueen ulkopuolelle. Palauta lähtöarvot toimii heti.

AUTOMAATTINEN VAAKAKESKITYS – UUTTA 0.4-VERSIOSSA
Koko ja sijainti -ryhmän Keskitä vaakasuunnassa automaattisesti on oletuksena
päällä. Se keskittää näkyvän viivaston selaimen ikkunaan. Laskennassa otetaan
huomioon nuottiavain, nuotit ja apuviivat sekä lyhennetty viivaston loppu.
SVG-kuvan tyhjiä reunuksia ei käytetä keskityksen perusteena.

Keskitys päivittyy heti asteikon, välien, koon, korkeuden ja rajauksen
muuttuessa sekä ikkunan kokoa vaihdettaessa. Kehittäjäpaneelin ollessa auki
keskitys tehdään sille jäävän nuottipaneelin keskelle, jotta säätöpaneeli
voi olla vieressä. Sulkeminen keskittää jälleen ikkunaan.

Automaattikeskityksen aikana Sijainti X ja sen numerokenttä ovat pois käytöstä.
Poista valinta käyttääksesi käsisäätöä. Aiempi käsin asetettu X-arvo säilyy,
ja sitä käytetään taas, kun automaattikeskitys kytketään pois. Pystysijaintia
voi säätää myös automaattikeskityksen ollessa päällä. Valinta tallentuu JSONiin
ja selaimen muistiin. Palauta lähtöarvot kytkee automaattikeskityksen päälle.

VIIVASTON LOPPUVÄLI – UUTTA 0.3-VERSIOSSA
Nuotit ja viivat -ryhmän Viivaston loppuväli (%) säätää viiden viivastoviivan
päätepistettä viimeisen nuotin jälkeen. Oletus on 50 %, eli väli on puolet
OSMD:n alkuperäisestä, kuitenkin vähintään turvavälin verran.
100 % vastaa alkuperäistä loppuväliä, 0 % jättää pienimmän turvavälin.
Säätö ei siirrä nuotteja, muuta niiden kokoa eikä lyhennä apuviivoja.
Viivaston pää seuraa viimeistä nuottia myös muiden väliliukurien muuttuessa,
joten nuottien tiivistäminen ei enää kasvata loppuun jäävää tyhjää viivastoa.
Toiminto on välitön, toimii kaikkien kuuden sävelalueen välimuistikuvissa
ja sisältyy JSONiin sekä automaattiseen tallennukseen.

UUDET VÄLILIUKURIT
Nuottiavaimen jälkeinen väli (%) säätää G-avaimen ja ensimmäisen nuotin
väliä. Myös mahdollinen ensimmäisen nuotin etumerkki otetaan huomioon.
Väli ennen etumerkillistä nuottia (%) säätää edellisen nuotin ja seuraavan
nuotin etumerkin väliin jäävää tyhjää tilaa. Merkki ja nuotti pysyvät yhdessä.

100 % palauttaa täsmälleen OSMD:n alkuperäisen välin. Pienempi arvo tiivistää,
suurempi väljentää. 0 % jättää 8 SVG-mittayksikön turvavälin; jo valmiiksi
sitä pienempää väliä ei tiivistetä enempää. Mittayksikkö ei ole näytön pikseli,
sillä kuvan koko ja sovitus vaikuttavat lopulliseen kokoon.

Säädöt toimivat heti ilman OSMD:n uudelleenladontaa. Mitat luetaan oikeiden
nuotti- ja etumerkkikuvioiden rajoista. Apuviivat siirtyvät nuottiensa mukana.
Ensimmäisen nuotin omaa etumerkkiä säädetään ensimmäisellä liukurilla;
jälkimmäinen vaikuttaa muihin etumerkillisiin nuotteihin. C-duurissa ilman
etumerkkejä jälkimmäisellä liukurilla ei luonnollisesti ole vaikutusta.
Muut nuottivälit säilyvät. Viivaston pää seuraa tehtyjä tiivistyksiä, ja
loppuun jää loppuväliliukurin määräämä tila.
Uudet arvot tallentuvat selaimeen ja JSONiin kuten muutkin säädöt.

JSON JA MUISTI
- Kopioi JSON: kopioi nykyiset säätöarvot. Jos selaimen leikepöytälupa ei
  ole käytettävissä, JSON valitaan käsin kopioitavaksi.
- Lataa JSON kentästä: liitä JSON kenttään ja paina painiketta. Se otetaan
  heti käyttöön ilman erillistä toteutusvaihetta.
- Palauta lähtöarvot: palauttaa tämän version oletusarvot suoraan näkymään.
Asetukset tallentuvat automaattisesti tämän selaimen paikalliseen muistiin.
Vie JSON talteen, jos haluat siirtää asetukset toiseen selaimeen tai lähettää ne.

Vanhan JSONin ja selaintallennuksen tuetut säädöt siirtyvät tähän versioon.
Poistettujen säätöjen arvot ohitetaan, jotta piiloon jäänyt vanha asetus ei
voi kumota liukurin vaikutusta. Esimerkiksi vanha kiinteän tahdin leveyden
valinta ei estä uutta nuottivälin liukuria. JSONin selectedScale on tieto
vientivaiheen asteikosta; JSONin lataus ei vaihda soittamaasi asteikkoa.

MITÄ POISTETTIIN
Paneelista poistettiin sisäiset OSMD-zoomaus- ja ladontaleveydet,
ladontapresetit, päällekkäiset nuottivälin säännöt, ehdollinen kiinteä
tahdin leveys, tyhjät iskut, sivu-/järjestelmä-/avainmarginaalit,
etumerkkien lisäsäädöt, erilliset glyfi- ja viivastomittasuhteet,
varsien pituussäännöt, apuviivojen säädöt, väriasetukset sekä päällekkäiset
SVG:n leveys-, maksimileveys-, kohdistus- ja sovitusvalinnat. Yleinen
lisäsääntö-JSON poistettiin. Osa poistetuista asetuksista toimii muissa
käyttötapauksissa; tässä paneeli keskittyy sovittuihin asteikon säätöihin.

TIEDOSTOT
- index.html: sovellus ja paneelin kytkentä.
- score-editor.js: liukurit, numerokentät, reaaliaikainen päivitysjono ja JSON.
- score-editor.css: paneelin ulkoasu.
- score-display.js: OSMD-nuottikuvat ja nopea SVG-rajauksen päivitys.
- resonator-engine.js ja note-stability.js: tunnistus ja vaihtosuoja,
  tavuntarkasti samat kuin liitteenä toimitetussa pohjaversiossa.
- vendor/osmd/: paikallinen OSMD-kirjasto ja lisenssi.
- sw.js, manifest.webmanifest ja icons/: PWA ja offline-välimuisti.

TARKISTUKSET
Automaattikeskitys tarkistettiin kuudella asteikkoalueella, eri suurennuksilla,
rajauksilla, väleillä, loppupituuksilla ja kolmella ikkunaleveydellä. Lisäksi
varmistettiin kehittäjäpaneelin avaus/sulkeminen, käsisäädön palautuminen,
JSON, lähtöarvot ja keskitys uuden OSMD-ladonnan jälkeen. Testissä käytettiin
oikeiden OSMD-kuvioiden mittoja sekä simuloitua DOM- ja koordinaattimuunnosta;
varsinaista selaimen visuaalista testiä ei tehty.

Käyttöliittymätesti kattoi käynnistyksen, kaikki asteikot, D-oktaavin
vaihdon, nuottipainikkeet, säätöpaneelin, 18 liukuria, numerokentät,
suorat muunnokset ja rajaukset, JSON-viennin/tuonnin, virheellisen JSONin,
lähtöarvot, lukurajat, selaintallennuksen sekä rinnakkaisten ladontojen eston.

Paketin oikealla OSMD-kirjastolla varmistettiin lisäksi, että kaikki kolme
jäljelle jäävää ladontasääntöä muuttavat tuotettua SVG-nuottikuvaa.
Tämä suoritettiin Node-DOM-ympäristössä simuloiduilla tekstimitoilla.
Varsinainen visuaalinen selaintesti estyi ympäristön käyttöoikeusrajaan.
Uusien välisäätöjen testissä käytettiin kaikkien kuuden sävelalueen oikeita
OSMD-SVG-kuvia ja niiden Bezier-kuvioista laskettuja rajalaatikoita. Varmistettiin
turvavälit, apuviivojen mukana siirtyminen, toistuvan säädön muuttumaton
lähtögeometria, tarkka palautus 100 %:iin, JSON ja tavallisen ladonnan jälkeen
säilyvät säädöt. Lisäksi tarkistettiin kaikkien viiden viivaston päätepisteet
kaikilla kuudella sävelalueella: loppuvälin arvoilla 0–200 % nuotit ja
apuviivat säilyivät muuttumattomina, eikä lisäladontaa tehty. Mikrofonikoetta ja kokonaisviiveen mittausta ei tehty.

Tämä versio perustuu käyttäjän tähän muutokseen liittämään käynnistyskorjattuun
pakettiin. Se ei lisää erillisen Analyysi-kokeiluversion paneelia.
