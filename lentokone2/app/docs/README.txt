Lentokone – PWA BASE 1.5 – siivottu kohteeseen tähtäävä versio

Tämä versio on BASE 1.4:n toiminnallisesti sama, siivottu jatkoversio.
Siivouksessa ei muutettu äänentunnistuksen matematiikkaa eikä reittiliikkeen toimintaa.

Pelin toiminta
- KORKEA ääni valitsee yläreitin.
- MATALA ääni valitsee alareitin.
- Äänen loputtua kone jää viimeiselle valitulle reitille.
- Reittivaihto tähtää valitun reitin seuraavaan edessä olevaan objektiin.
- Kun komento annetaan ajoissa, pystysiirtymä ajoitetaan objektin saapumishetkeen.
- Myöhäinen komento ei saa epärealistista nopeusboostia.
- Osuma ratkaistaan koneen todellisen Y-korkeuden perusteella.
- Osumatoleranssi on 5,5 %-yksikköä.
- Vakausmittausta, vakausheiluntaa tai äänen pituuteen sidottua audio-ease-inia ei ole.

Reittiliike
- Yläreitti: 31 %
- Alareitti: 69 %
- Keskiasento: 50 %
- Normaali täyden reittivaihdon vertailuaika: 780 ms
- Liike lähtee heti liikkeelle ja pehmenee loppua kohti Cubic Hermite -käyrällä.
- Nokan kallistus seuraa pystysuuntaista reittiliikettä.

Äänimoottori
- FFT: 8192
- YIN-analyysi: 4096 näytettä
- analyysiväli: 16 ms
- harmoniset: H1–H8 lasketaan, profiilivertailussa käytetään H2–H8
- LOW/HIGH-painotus: 42 % sävelkorkeus, 58 % harmoninen fingerprint
- hyväksymisraja: 50 %
- LOW/HIGH-erotteluraja: 7 prosenttiyksikköä
- mikrofonin automaattikynnys: mitattu pohjataso + 10 dB
- epävarman tunnistuksen näyttöviive: 180 ms
- tunnistuksen smoothing: 6 näytettä

Pilvet
- Käytössä ovat pilvi_levea.webp, pilvi_keski.webp ja pilvi_iso.webp.
- Pilvien koko, määrä, korkeus ja välistys mukautuvat viewportiin.
- Usvaa ei käytetä.

Kehittäjätila
- dBFS
- mikrofonikynnys
- F0
- LOW/HIGH
- BEST
- GAP
- tunnistus
- puhalluksen pituus
- propelli X/Y/koko/sivukääntö/idle-nopeus/aktiivinen nopeus
- nokan kallistus
- JSON-vienti ja -tuonti

Oletusasetukset
- propelli X: 91.4
- propelli Y: 50.7
- propellin koko: 40
- sivukääntö: 78°
- idle: 180 ms
- aktiivinen: 55 ms
- nokan kallistus: 20°

JSON-asetukset
- propeller.x
- propeller.y
- propeller.size
- propeller.sideTilt
- propeller.idleMs
- propeller.activeMs
- flight.noseTiltDeg

PWA
- Sovelluksen nimi: Lentokone
- Käyttö on lukittu vaakasuuntaan manifestissa.
- Mikrofonin käyttö vaatii HTTPS:n tai localhostin.
- Service worker välimuistittaa staattiset tiedostot offline-käyttöä varten.
- Navigointi on network-first ja staattiset assetit cache-first.
- Yläreunan päivitysnappi tyhjentää välimuistit, tarkistaa service workerin ja lataa pelin uudelleen.

Tiedostot
- index.html
- manifest.webmanifest
- sw.js
- lentokone_sivu.webp
- lentokone_asetukset_DEFAULT.json
- pilvi_levea.webp
- pilvi_keski.webp
- pilvi_iso.webp
- icons/icon-192.png
- icons/icon-512.png
- icons/icon-maskable-512.png
- icons/apple-touch-icon.png

BASE 1.5 -siivous
- poistettu käyttämätön soundActive-tila
- poistettu käyttämätön clearClouds-funktio
- reittivihjeen timeout siirretty eksplisiittiseen routeHintTimer-muuttujaan
- routeTransitionDurationMs käyttää suoraan ROUTE_TRANSITION_MS-oletusta
- README kirjoitettu uudelleen vastaamaan nykyistä toteutusta ilman vanhoja ristiriitaisia versionhistorioita
- pelin toiminnallista logiikkaa ei muutettu

BASE 1.6
- Kaikki kehittäjäasetusten sliderit poistettu.
- Mikrofonin Kalibroi-painike siirretty Refresh-painikkeen viereen.
- Nollaa pisteet -painike poistettu asetuksista.
- JSON-tuonti, JSON-vienti ja oletus-JSON-tiedosto poistettu.
- Propellin ja nokan nykyiset toimivat arvot on lukittu suoraan appiin.

BASE 1.7
- Kalibrointi-ikkuna vaihdettu visuaaliseen lentomittaripaneeliin.
- SVG-neula näyttää reaaliaikaisen melutason kalibroinnin aikana.
- dB-lukema päivittyy livenä.
- Vaakasuora palkki näyttää kalibroinnin etenemisen.
- Kalibrointi sulkeutuu automaattisesti valmistuttuaan.

BASE 1.8
- Kalibrointimittarin asteikko muutettu alueelle -90 dB ... -30 dB.
- Kalibrointinäkymän live-otsikko "Kalibroi mikrofoni" poistettu.
- Taustakuvasta siivottu pois staattiset dB-tekstit ja staattinen aikapalkki, koska live-SVG piirtää ne nyt itse.

BASE 1.9
- Kalibrointitaustasta poistettu kokonaan vanha staattinen aikapalkki.
- Live-SVG-aikapalkki pelkistetty: ei reunusta eikä sisäpaddingia.
- Täyttö alkaa samasta kohdasta kuin palkin tausta ja käyttää koko leveyden.

BASE 1.10
- Kalibrointi-ikkuna feidautuu pehmeästi pois kalibroinnin valmistuttua.

BASE 1.13
- Aloitusikkunasta poistettu lentokonekuva ja kaikki tekstit.
- Aloitusikkunassa on vain Aloita peli -nappi.
- Aloitusikkuna poistuu heti napin painalluksesta ennen mikrofonin kalibrointia.

BASE 1.14
- YLÄREITTI- ja ALAREITTI-tekstit poistettu.
- Ylä- ja alareitin katkoviivat poistettu.
- Myös reittivaihdon hetkellinen YLÄREITTI/ALAREITTI-vihjeteksti poistettu.
- Reittien varsinainen pelilogiikka ja Y-koordinaatit säilyvät ennallaan.

BASE 1.15
- Käännä vaakatasoon -ikkunasta poistettu alempi selitysteksti. Jäljellä vain kääntöikoni ja teksti "Käännä vaakatasoon".

BASE 1.16
- Aloitusnapin ympäriltä poistettu valkoinen kortti, varjo ja padding.
- Kalibrointi-ikkunan koko pienennetty 80 %:iin aiemmasta.

BASE 2.0
- Tämä versio on hyväksytty uudeksi viralliseksi lähtöpisteeksi.
- Pelin toimintaan, ulkoasuun tai asetuksiin ei tehty muutoksia BASE 1.16 -versioon nähden.

BASE 2.1
- Tähdet korvattu webp-kerättävinä aarteina.
- Kultakolikko = 1 piste, timantti = 2 pistettä, aarrearkku = 5 pistettä.
- Kerättävien esiintyvyys: kolikko 78 %, timantti 18 %, aarrearkku 4 %.
- Pistevälähdys näyttää nyt kerätyn esineen pistearvon.

BASE 2.2
- Kultakolikko korvattu tyylitellyllä eurokolikko-assetilla.
- Timantti (2 p) ja aarrearkku (5 p) säilyvät ennallaan.

BASE 3.0
- Tämä BASE 2.2 EUROKOLIKKO -versio on hyväksytty uudeksi viralliseksi lähtöpisteeksi.
- Pelin toimintaan, ulkoasuun, pisteisiin, assetteihin tai asetuksiin ei tehty muutoksia.

BASE 3.0 cow+rock -lisäys:
- Lentävä lehmä: osuma vähentää 1 pisteen (ei alle nollan) ja lehmä kieppuu kaartuen pois ruudulta.
- Kivi: osuma ponnauttaa koneen vastakkaiselle lentokorkeudelle ja lukitsee korkeusohjauksen hyvin lyhyesti, jotta isku näkyy.
- Esteet eivät muuta äänentunnistusmoottorin referenssejä tai analyysilogiikkaa.


BASE 4.1 – PYÖRRE / YLÖSALAISIN
- Lisätty este_pyorre.webp käyttäjän hyväksymästä turkoosista pyörrekuvasta.
- Pyörteeseen osuminen kieräyttää lentokoneen pehmeästi 180°.
- Ohjaus vaihtuu päinvastaiseksi vasta kierähdyksen valmistuttua.
- Ylösalaisin lennettäessä positiiviset kerättävät pisteet ovat kaksinkertaiset.
- Ylösalaisin-tila kestää 15 sekuntia, minkä jälkeen kone oikaisee automaattisesti.
- Jos ylösalaisin oleva kone osuu toiseen pyörteeseen ennen ajan loppua, oikaisu alkaa heti.
- Lehmä- ja kivirangaistukset eivät tuplaannu.
- Äänentunnistusmoottorin analyysilogiikkaa ei muutettu.

4.2 PYÖRRE ROLL MATKAN MUKAAN
- Pyörteeseen osuminen aloittaa pitkittäisakselin rollin, nokka pysyy menosuuntaan.
- Roll valmistuu seuraavan peliobjektin kohdalla, ei kiinteällä aikakestolla.
- Ohjaus vaihtuu vasta kun kone on täysin ylösalaisin.
- Ylösalaisin ×2-pisteet 15 s; toinen pyörre tai 15 s käynnistää paluurullauksen seuraavaan objektiin mennessä.

BASE 4.12 – LATAUSPALKKI
- Lisätty pelin käynnistykseen latausnäkymä, jossa prosenttipalkki etenee 0–100 %.
- Prosentti perustuu pelissä tarvittavien grafiikkaresurssien todellisiin tiedostokokoihin.
- Latausnäkymä poistuu automaattisesti, kun pelin grafiikat ovat valmiina.
- Äänentunnistus-, kalibrointi- ja pelilogiikkaa ei muutettu.

BASE 4.13 – KOODI SIIVOTTU
- Ei pelilogiikan muutoksia.
- CSS ja JavaScript erotettu omiin tiedostoihinsa.
- Base64-äänidata erotettu pelilogiikasta omaan audio-data.js-tiedostoon.
- Kuvat, ikonit, manifesti ja dokumentaatio järjestetty app/-kansioon.
- sw.js jätetty juureen PWA-scopea varten.

BASE 4.14 – PUHALTIMET-TYYLINEN POHJAKOHINAMITTAUS
- Pohjakohinan kalibroinnin UI vaihdettu Puhaltimet-appin 180 px rengasnäkymään.
- Keskellä reaaliaikainen dB-lukema ja äänenvoimakkuuden mukaan elävä pulssi.
- Edistyminen näkyy kiertävänä renkaana; valmis tila vihreä.
- Varsinainen pohjakohinan laskenta, 250 ms warmup, 1500 ms mittaus ja +10 dB marginaali ennallaan.


BASE 4.15 – PEHMEÄ SUUNNANVAIHTO
- Reittivaihto perii koneen hetkellisen pystynopeuden.
- Vastakkaiseen suuntaan annettu uusi ääni jarruttaa liikkeen pehmeästi nollaan ennen suunnan vaihtoa.
- Nokan kallistus seuraa todellista pystynopeutta ja kulkee suunnanvaihdossa pehmeästi vaakatason kautta.
- Muu pelilogiikka ja 4.14:n Puhaltimet-tyylinen pohjakohinamittaus ennallaan.


BASE 4.16
- Pyörre reitittyy kuten kerättävät kohteet, mutta kone tähtää WebP-kuvan todelliseen imuaukkoon.
- Pyörre 50 % suurempi kuin 4.15:ssa (1.18x -> 1.77x).
- Imun lopussa etenemisvauhti kiihtyy pehmeästi enintään 28 % ja palautuu pehmeästi.
- Timantin ääniefektin gain puolitetty (1.08 -> 0.54).


BASE 4.17 – EI IMUKIIHDYTYSTÄ / KIVI −2
- Poistettu 4.16:ssa lisätty pyörteen imeytymiskiihdytys ja osuman jälkeinen palautusliike.
- Pyörre säilyy 50 % suurempana ja kone reitittyy edelleen sen todelliseen suuaukkoon kuten kerättäviin kohteisiin.
- Kiveen osuminen vähentää nyt 2 pistettä (ei alle nollan).
- Timantin ääniefektin 50 % vaimennus säilyy.


BASE 4.17.1 – RESPONSIIVISET SOITINKUVAKKEET
- Huilu- ja pasuunakortit skaalautuvat nyt sekä viewportin leveyden että korkeuden mukaan.
- Poistettu 90 px pakotettu minimileveys.
- Soitinkuvien oma kuvasuhde säilyy; pasuunaa ei enää pakoteta neliöön.
- Myös info-painike, teksti, padding ja kortin kulmat skaalautuvat maltillisesti.
- Pelilogiikkaan ei muutoksia.


BASE 4.17.2 – SOITINKUVAKKEET SEURAAVAT IKKUNAN KOKOA
- Poistettu aiempi 170 px kortin ja 155 px kuvan yläraja.
- Soitinkortti skaalautuu nyt aidosti viewportin pienemmän mitan mukaan (46vmin), max 500 px.
- Iso Safari-ikkuna kasvattaa kortit ja kuvat selvästi suuremmiksi; pieni ikkuna pienentää ne automaattisesti.
- Muu pelilogiikka ennallaan.


BASE 5.0
- BASE 4.17.2 hyväksytty uudeksi viralliseksi lähtöpisteeksi.
- Ei toiminnallisia muutoksia 4.17.2-versioon nähden.
- Soitinkuvakkeet skaalautuvat ikkunan koon mukaan.


BASE 5.1 – KEHITTÄJÄTILA POISTETTU
- Kehittäjätilan hammasratas, diagnostiikkapaneeli, sliderit ja JSON-tuonti/vienti poistettu.
- Pelin aiemmat säätöarvot jäivät kiinteiksi oletusarvoiksi: objektit 70 %, keinunta 0,7° / 1,1 px / 58 %, moottori 18 %, lehmä 25 %, kivi 20 %.
- Kalibroi- ja Päivitä-painikkeet säilyvät.
- Pelilogiikkaa ei muutettu.


BASE 5.2 – HUILU / OHJAUSASETUKSET
- Pasuunaprofiili, pasuunakuvat ja pasuunaohje poistettu kokonaan.
- Oletusohjaus: huilun koulutettu ylempi ääni toimii yhden äänen vaihtokytkimenä.
- Oikean yläkulman asetusratas: Ylempi ääni, Alempi ääni, Molemmat äänet, Oma ääni.
- Ylempi/Alempi/Oma ääni vaihtavat lentokorkeutta yhden hyväksytyn puhalluksen kerrallaan; uusi vaihto vapautuu 300 ms hiljaisuuden jälkeen.
- Molemmat äänet käyttää alkuperäistä LOW -> alas / HIGH -> ylös -logiikkaa.
- Oma ääni koulutetaan kolmella automaattisesti tunnistetulla näytteellä Puhaltimet-tyyppisesti (YIN + H1-H8, mediaani-F0, keskiarvoprofiili, 62 % oman profiilin tarkistus).
- Valittu ohjaustapa ja koulutettu oma ääni tallennetaan selaimen localStorageen.


============================================================
BASE 5.3 HARMONIC OHJAUS + ÄÄNENLAATUBONUS DEV
============================================================

Pohja: BASE 5.2 HUILU OHJAUSASETUKSET.

Uusi ohjaus:
- Pelin näkyvä ohjaustapa on nyt Avoin suukappaleääni.
- Ensimmäisellä pelikerralla avoin suukappaleääni koulutetaan automaattisesti kolmella puhalluksella.
- Koulutettu referenssi tallennetaan selaimeen kuten ennen.
- Pelin aikainen tunnistus EI enää käytä custom-tilassa vanhaa YIN + H2–H8 similarity -päätöstä.
- Pelin aikainen tunnistus käyttää Subharmonic / Harmonic Summation -moottoria.
- Tunnistettu sävel hyväksytään, kun se on koulutettu avoin sävel TAI yksi puolisävelaskel sen yläpuolella.
  Tämä sallii tuhnuiseen/huonosti muodostuneeseen avoimeen ääneen liittyvän +1/2-sävelaskelen ilmiön.

Ohjauskäytös:
- Jokainen UUSI hyväksytty puhallus vaihtaa lentokorkeuden.
- Jos kone on ylhäällä, uusi ääni ohjaa alas.
- Jos kone on alhaalla, uusi ääni ohjaa ylös.
- Pitkä yhtenäinen ääni antaa vain yhden suunnanvaihdon.
- Triggeri virittyy uudelleen, kun äänen välissä on nykyisen BASE-logiikan mukainen hiljaisuus.
- Lentokoneen reittiliike, pehmeä suunnanvaihto, nokan kallistus, törmäykset ja muu pelilogiikka on jätetty ennalleen.

Äänenlaatubonus:
- Jokainen hyväksytty ohjausääni antaa aina vähintään +1 pisteen.
- Harmonic Concentration mittaa, kuinka suuri osa spektrienergiasta keskittyy F0:n harmonisten ympärille.
- Pisteet / puhallus:
    alle 35 %  -> +1
    35–49 %    -> +2
    50–64 %    -> +3
    65–79 %    -> +4
    80 % tai yli -> +5
- Äänenlaatu EI koskaan estä ohjausta eikä vähennä pisteitä.
- Pyörteen PISTEET ×2 -tila kaksinkertaistaa myös äänenlaatupisteet.
- Pistepopup näyttää esim. "+3 ÄÄNI".

Harmonic Summation:
- analyysi noin 80 ms välein custom-ohjauksessa
- F0-alue 80–2200 Hz
- 8 harmonista
- harmoninen analyysialue 80–8000 Hz
- peak gate -56 dB suhteessa spektrin huippuun
- ehdokkaat muodostetaan spektripiikkien subharmonisista
- hyväksyntä: vähintään 2 harmonista ja support >= 10 %

Harmonic Concentration:
- alue 80–8000 Hz
- harmonisten ympäristö noin ±28 cent
- vähintään ±1.5 FFT-biniä per harmoninen kaista
- concentration = harmonisten kaistojen energia / koko analyysialueen energia

Ei Käynnistä.command-tiedostoa.

HUOM: BASE 5.3:n yllä oleva osio korvaa toiminnallisesti README:n aiemmat BASE 5.2 -ohjaustapahuomiot. Uusi localStorage-avain pakottaa uuden avoimen suukappaleäänen koulutuksen ensimmäisellä käyttökerralla.


============================================================
BASE 5.4 HARMONIC BONUS DEV
============================================================

Pohja:
- BASE 5.3 HARMONIC OHJAUS + BONUS DEV.
- Harmonic summation -tunnistus ennallaan.
- Harmonic concentration -laskenta ennallaan.
- Avoimen suukappaleäänen koulutus ennallaan.
- Jokainen uusi hyväksytty ääni vaihtaa ylä-/alareittiä kuten ennen.

MUUTOS: ÄÄNENLAATUPISTEET
- Äänen laadusta on nyt vain kolme tasoa:
  0 pistettä
  1 piste
  2 pistettä
- Huono/heikko mutta hyväksytty ääni ohjaa lentokonetta normaalisti,
  mutta voi antaa 0 laatupistettä.
- Pyörteen ×2-pistebonus EI kerro äänenlaatupisteitä.
  Äänen laadusta tulee siis aina kirjaimellisesti vain 0, 1 tai 2 pistettä.

OLETUSRAJAT
- +1 piste alkaa 65 % Harmonic concentrationista.
- +2 pistettä alkaa 80 % Harmonic concentrationista.

KEHITTÄJÄTILA
Ohjausasetuksiin lisätty Kehittäjätila:
- slider: +1 pisteen raja
- slider: +2 pisteen raja
- rajat tallentuvat localStorageen

TESTAUS ILMAN PUHALLUSTA
- Harmonic concentration -testislideri 0–100 %
- näyttää heti nykyisillä rajoilla tuloksen:
  0 / 1 / 2 laatupistettä
- "Testaa pisteytys" animoi tuloksen paneelissa
- testaus EI muuta oikeaa pelipistemäärää

Tavoite:
Rajojen nopea säätäminen oppilailla testaamista varten ilman,
että harmonic summation- tai concentration-moottoria tarvitsee muuttaa.


============================================================
BASE 5.5 TÄHTIPALAUTE DEV
============================================================

Pohja:
- BASE 5.4 HARMONIC BONUS DEV.
- Harmonic summation -tunnistus ennallaan.
- Harmonic concentration -laskenta ennallaan.
- Äänenlaatupisteet edelleen vain 0 / 1 / 2.
- Kehittäjätilan pistekynnykset ennallaan.

UUSI NÄKYVÄ ÄÄNENLAATUPALAUTE

1) ALAREUNAN TÄHTILASKURI
- Muodossa: 4 × ⭐
- Jokainen äänen laadusta saatu lisäpiste = yksi tähti.
- Tähtimäärä on siis samalla äänenlaadusta saatujen lisäpisteiden määrä.
- Uuden pelin alussa tähtilaskuri palautuu nollaan.

2) KONEEN ULKONÄKÖ
- 0 laatupistettä:
  ei erikoisefektiä.
- +1 laatupiste:
  kevyt kultainen hohde koneen ympärillä.
- +2 laatupistettä:
  voimakkaampi kultainen hohde + pieni kimallusefekti.

3) TÄHDEN LENTO
- +1: yksi tähti syntyy koneen läheltä ja lentää tähtilaskuriin.
- +2: kaksi tähteä lentää peräkkäin tähtilaskuriin.
- Tähtilaskuri sykkii tähden saapuessa.

4) KEHITTÄJÄTILAN TESTI
- "Testaa pisteytys" näyttää nyt myös koneen hohteen ja tähtien lennon.
- Kehittäjätesti EI muuta oikeaa pistemäärää.
- Kehittäjätesti EI muuta oikeaa tähtilaskuria.

PISTELOGIIKKA
- 1 tähti = 1 lisäpiste kokonaispisteisiin.
- 0 laatupistettä = 0 tähteä.
- 1 laatupiste = 1 tähti.
- 2 laatupistettä = 2 tähteä.


============================================================
BASE 5.6 YKSI LAATUBONUS DEV
============================================================

MUUTOS BASE 5.5:stä:
- Äänen laadusta saa nyt vain joko 0 tai 1 lisäpisteen.
- Kahden laatupisteen taso poistettu kokonaan.
- Hyväksytty ääni ohjaa lentokonetta aina kuten ennen.

KEHITTÄJÄTILA:
- Vain yksi säädettävä raja: "Laatubonus alkaa".
- Oletusraja 70 % Harmonic concentration.
- Testislideri näyttää vain:
  0 lisäpistettä / 1 lisäpiste.
- Testaa pisteytys näyttää saman yhden tähden visuaalisen palkinnon,
  mutta ei muuta oikeita pisteitä eikä tähtilaskuria.

TÄHTIPALAUTE:
- 0 lisäpistettä = ei tähteä eikä hohdetta.
- 1 lisäpiste = yksi kultainen hohde + yksi tähti lentää laskuriin.
- 1 tähti = 1 lisäpiste.


============================================================
BASE 5.7 VAKAA LAATUBONUS DEV
============================================================

Pohja:
- BASE 5.6 YKSI LAATUBONUS DEV.
- Harmonic summation -tunnistus ennallaan.
- Harmonic concentration -laskenta ennallaan.
- Ohjauslogiikka ennallaan.
- Bonus edelleen vain 0 tai 1 lisäpiste.

OHJAUS:
- Ensimmäinen hyväksytty avoin suukappaleääni vaihtaa lentokorkeuden HETI.
- Ohjausta ei hidastettu laatumittauksen vuoksi.

UUSI LAATUBONUS:
- Bonus EI enää tule ensimmäisestä concentration-mittauksesta.
- Ensimmäinen hyväksytty ääni käynnistää 300 ms laatumittausikkunan.
- Harmonic concentration mitataan noin 80 ms välein.
- Ensimmäinen tunnistushetki on mukana mittauksessa.
- Arviointi vaatii vähintään 4 mittausta.

TÄHTI / +1 PISTE ANNETAAN VAIN JOS:
1) 300 ms ikkuna täyttyy
2) concentration-mittausten mediaani >= kehittäjätilan bonusraja
3) vähintään 70 % kaikista mittauksista >= sama bonusraja

EPÄVAKAA ÄÄNI:
- Jos harmonic summation ei hyväksy ääntä jossain laatumittauksessa,
  kyseinen mittaus kirjataan arvoksi 0.
- Yksi satunnainen hyvä concentration-piikki ei siis riitä.

LIIAN LYHYT ÄÄNI:
- Jos ääni loppuu ennen 300 ms arviointi-ikkunan täyttymistä,
  laatubonus perutaan.
- Lentokone on silti jo reagoinut ääneen normaalisti.

KEHITTÄJÄTILA:
- "Laatubonus alkaa" -raja toimii kuten ennen.
- Testislideri testaa vakiona pysyvää concentration-arvoa suhteessa rajaan.
- Kehittäjätesti ei muuta oikeita pisteitä tai tähtilaskuria.

TULOS:
- ohjaus = nopea
- laatupalkinto = tarkoituksella vaativampi ja viivästetty


============================================================
BASE 5.8 KESKELTÄ + AIKA ENSIMMÄISESTÄ OSUMASTA
============================================================

Pohja:
- BASE 5.7 VAKAA LAATUBONUS DEV.
- Harmonic summation, Harmonic concentration, 300 ms vakaa laatubonus,
  tähtipalaute ja kaikki äänenohjaus säilyvät ennallaan.

MUUTOS 1: LENTOKONEEN ALKUPAIKKA
- Lentokone aloittaa nyt aina pystysuunnassa keskeltä.
- currentRoute = center
- planeY = 50
- Ensimmäinen hyväksytty uusi ääni vie koneen yläreitille.
- Seuraava ääni vie alareitille, sitten taas ylös jne.

MUUTOS 2: PELIAIKA ALKAA ENSIMMÄISESTÄ OBJEKTIOSUMASTA
- Ajastin näyttää aluksi 1:30 mutta ei laske.
- Objektit liikkuvat ja peliä voi ohjata normaalisti ennen ajan käynnistymistä.
- Ensimmäinen osuma mihin tahansa peliobjektiin käynnistää 90 s kellon:
  kolikko, timantti, aarrearkku, lehmä, kivi tai pyörre.
- Vasta tästä hetkestä alkaa gameStartedAt / gameEndsAt.
- Taattu pyörreaikataulu alkaa myös ensimmäisestä objektiosumasta.
- Seuraavat osumat eivät nollaa tai käynnistä kelloa uudelleen.

Muu pelilogiikka ennallaan.


============================================================
BASE 5.9 VALMIS HIGH-REFERENSSI
============================================================

Pohja:
- BASE 5.8 KESKELTÄ + AIKA ENSIMMÄISESTÄ OSUMASTA.
- Kaikki BASE 5.8:n ohjaus-, ajastus-, Harmonic Summation-,
  Harmonic concentration-, laatubonus- ja tähtitoiminnot säilyvät.

MUUTOS: KOULUTUSTA EI TARVITA ENNEN PELAAMISTA

Pelin valmis oletusreferenssi:
- Lähde: vanhan lentokone-appin HIGH-koulutusdata
- F0: 837.8248546223447 Hz
- Mukana myös alkuperäinen HIGH H2-H8-fingerprint
- Uudessa Harmonic Summation -ohjauksessa hyväksyntä käyttää
  ensisijaisesti referenssin F0:sta johdettua MIDI-säveltä.
- Kuten aiemmin, hyväksytään tavoitesävel sekä +1 puolisävelaskel.

KÄYNNISTYS:
- Huilupelin käynnistäminen EI enää avaa koulutusnäkymää.
- Mikrofoni käynnistyy ja peli voidaan aloittaa suoraan.
- Jos henkilökohtaista koulutusta ei ole, HIGH-referenssi otetaan
  automaattisesti käyttöön.

OMA KOULUTUS:
- Asetuksissa "Kouluta avoin ääni uudelleen" säilyy.
- Jos käyttäjä kouluttaa oman äänen, se korvaa valmiin HIGH-referenssin.
- Oma koulutus tallentuu localStorageen ja sitä käytetään seuraavilla
  käynnistyksillä.
- Tälle versiolle käytetään uutta tallennusavainta:
  lentokone-flute-harmonic-control-v3
  jotta aiempien kehitysversioiden testidata ei sotke lähtötilaa.

ASETUSNÄKYMÄ:
- "Avoin suukappaleääni ✓ valmis" = käytössä sisäänrakennettu HIGH-referenssi.
- "Avoin suukappaleääni ✓ oma" = käytössä käyttäjän itse kouluttama referenssi.


============================================================
BASE 6.0.1 ALOITA KORJATTU
============================================================

Korjaus BASE 6.0:n latausjumiin:
- Edellinen muutos poisti vahingossa startOverlayn mukana myös
  helpOverlay- ja settingsOverlay-rakenteita.
- Tämä aiheutti runtime-virheen heti käynnistyksessä.
- Tämä versio on rakennettu uudelleen toimivasta BASE 5.9:stä.

ALOITUSNÄKYMÄ:
- Näkyvissä vain yksi suuri "Aloita" -nappi.
- Soitinkuva, otsikko, ohjausteksti ja info-painike eivät näy.
- Teknisesti JS:n tarvitsemat instrumentFluteInfoBtn ja controlModeLabel
  säilyvät DOMissa piilotettuina, joten vanhaa toimivaa logiikkaa ei rikota.

ENNALLAAN:
- valmis HIGH-referenssi
- asetukset
- henkilökohtainen koulutus
- Harmonic Summation
- Harmonic concentration
- 300 ms vakaa laatubonus
- tähtipalaute
- aloitus keskeltä
- ajastin alkaa ensimmäisestä objektiosumasta


============================================================
BASE 6.1 AUTOMAATTINEN ALKUKORKEUS
============================================================

Pohja:
- BASE 6.0.1 ALOITA KORJATTU.

UUSI ALOITUSTOIMINTO:
- Lentokone aloittaa edelleen ruudun keskeltä.
- Ennen ajan käynnistymistä peli etsii ensimmäisen palkitsevan objektin.
- Kelpaavat ensimmäiseksi automaattikohteeksi:
  kolikko, timantti, aarrearkku tai pyörre.
- Lehmä ja kivi eivät vaikuta aloituskorkeuteen.
- Kun ensimmäinen kelpaava objekti syntyy, kone alkaa automaattisesti
  hakeutua sen korkeudelle.
- Liike ajoitetaan pehmeästi objektin saapumiseen koneen kohdalle.
- Kolikko/timantti/arkku käyttävät oman kaistansa korkeutta.
- Pyörre käyttää edelleen oikean imuaukon tarkkaa Y-korkeutta.
- Automaattinen alkukohde valitaan vain kerran per pelikerta.
- Normaali äänenohjaus säilyy ennallaan.
- Peliaika alkaa edelleen vasta ensimmäisestä objektiosumasta.

Kaikki BASE 6.0.1:n muut toiminnot säilyvät ennallaan.


============================================================
BASE 6.1.1 ALKUKORKEUS VASTA ÄÄNESTÄ
============================================================

Korjaus BASE 6.1:n aloituskäytökseen.

OIKEA LOGIIKKA:
- Kone aloittaa keskeltä.
- Ensimmäinen sopiva palkitseva objekti muistetaan:
  kolikko, timantti, aarrearkku tai pyörre.
- Objektin ilmestyminen EI liikuta konetta.
- Kone pysyy keskellä, kunnes suukappaleesta tulee ensimmäinen
  onnistunut hyväksytty ääni.
- Ensimmäinen onnistunut ääni antaa lähtöluvan ja kone hakeutuu
  pehmeästi ensimmäisen muistettuun objektin korkeudelle.
- Sama ensimmäinen ääni EI lisäksi tee normaalia ylös/alas-vaihtoa.
- Tämän jälkeen seuraavat onnistuneet äänet käyttävät normaalia
  ylös/alas-ohjausta.

Jos onnistunut ääni tulee ennen ensimmäisen sopivan objektin syntymistä:
- lähtölupa muistetaan
- kone pysyy keskellä
- kun ensimmäinen sopiva objekti syntyy, kone hakeutuu sen korkeudelle

Lehmä ja kivi eivät edelleenkään kelpaa alkukohteeksi.
Ajastin alkaa edelleen ensimmäisestä objektiosumasta.
Laatubonuksen 300 ms arviointi ja tähtipalaute säilyvät ennallaan.


============================================================
BASE 6.2 700 MS KESTOBONUS
============================================================

Pohja:
- BASE 6.1.1 ALKUKORKEUS VASTA ÄÄNESTÄ.

UUSI KESTOBONUS:
- Ensimmäinen hyväksytty suukappaleääni käynnistää 700 ms kestoarvioinnin.
- Jos sama suukappaleääni pysyy yhtäjaksoisesti Harmonic Summation
  -tunnistuksen hyväksymänä vähintään 700 ms, oppilas saa:
  +1 pisteen
  +1 tähden
- Kestobonus ei vaadi Harmonic concentration -laaturajan ylittämistä.
- Jos tunnistus katkeaa ennen 700 ms rajaa, kestobonusta ei tule.
- Jos puhallus loppuu ennen 700 ms rajaa, kestobonusta ei tule.
- Yhdestä puhalluksesta voi saada enintään:
  1 tähti 300 ms laatubonuksesta
  + 1 tähti 700 ms kestobonuksesta
  = yhteensä 2 tähteä.

VISUAALINEN PALAUTE:
- Kestobonuksen täyttyessä koneen perään syttyy hetkeksi kultainen vana.
- Yksi tähti lentää koneesta alareunan tähtilaskuriin.

ENNALLAAN:
- Ohjaus reagoi heti hyväksyttyyn ääneen.
- Ensimmäinen onnistunut ääni käynnistää alkukohteeseen hakeutumisen.
- 300 ms laatubonus säilyy täysin erillisenä.
- Ajastin alkaa ensimmäisestä objektiosumasta.


============================================================
BASE 6.3 TÄHTI + TIIMALASI
============================================================

Pohja:
- BASE 6.2 700 MS KESTOBONUS.

ALARIVIN PALKINNOT:
- Äänen laatu ja äänen pituus näytetään nyt erillisinä laskureina.
- Vasemmalla:
  N × ⭐ = äänen laadusta ansaitut bonuspisteet.
- Oikealla:
  N × ⏳ = äänen pituudesta ansaitut bonuspisteet.

PISTELOGIIKKA:
- 300 ms laatubonus:
  +1 kokonaispiste
  +1 tähtilaskuriin
- 700 ms kestobonus:
  +1 kokonaispiste
  +1 tiimalasilaskuriin
- Kestobonus ei enää kasvata tähtilaskuria.

VISUAALINEN PALAUTE:
- Laatubonuksesta tähti lentää tähtilaskuriin kuten ennen.
- Kestobonuksesta koneen takana näkyy kultainen vana.
- Kestobonuksesta tiimalasi lentää oikeanpuoleiseen ⏳-laskuriin.
- Kestobonus ei käytä laatutähteä.

Muu pelilogiikka ennallaan.


============================================================
BASE 6.3.1 PWA IKONIT
============================================================

Pohja:
- BASE 6.3 TÄHTI + TIIMALASI.

MUUTOS:
- Pelin PWA-kuvakkeet vaihdettu uuteen selkeään lentokoneikoniin.
- Päivitetyt tiedostot:
  app/assets/icons/icon-192.png
  app/assets/icons/icon-512.png
  app/assets/icons/icon-maskable-512.png
  app/assets/icons/apple-touch-icon.png

Manifesti oli jo valmiiksi kunnossa, joten ikonipolkuja ei tarvinnut muuttaa.
Service workerin cache-nimi päivitettiin, jotta uudet ikonit latautuvat helpommin.
