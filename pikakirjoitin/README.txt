Pikakirjoitin 3 BASE 0.17.3 · FI / EN · H / B

Pohja:
Pikakirjoitin_3_BASE_0.17.2_Oikea_Tyokalupalkki

Tässä versiossa:
- FI / EN -kielivalinta aloitusikkunassa.
- Sama FI / EN -valinta myös pääikkunan yläreunassa, joten kielen voi vaihtaa kesken työskentelyn.
- Valittu kieli muistetaan localStoragessa.
- Ensimmäisellä käyttökerralla suomenkielinen selain valitsee suomen, muut englannin.
- Suomenkielinen nimi: Pikakirjoitin 3.
- Englanninkielinen nimi: SwipeScore.
- Tavalliset käyttöliittymätekstit, työkalujen aria-labelit/tooltipit, aloitusikkuna, tempo-ryhmät ja väriteemojen nimet vaihtuvat kielen mukana.
- Sävellajit vaihtuvat suomalaisen ja englanninkielisen nimeämisen välillä.
  Esim. FI: H-duuri / B-duuri / h-molli / b-molli.
        EN: B major / B-flat major / B minor / B-flat minor.
- Kvinttiympyrän nimet vaihtuvat vastaavasti.
- Koskettimiston valkoisen B/H-sävelen nimi vaihtuu:
  FI = H, EN = B.
- Sisäinen Score Model ja MusicXML käyttävät edelleen samaa sävelkorkeusdataa. Kielenvaihto ei muuta musiikkia.
- Oikean reunan työkalupalkki (refresh, Undo, Redo, Save, PDF, Print) säilyy.

Tekninen rakenne:
- uusi js/i18n.js hoitaa käyttöliittymän kielitilan ja käännökset.
- kielivalinta tallennetaan avaimella pikakirjoitin3.language.
- DEMO/lisenssivesileimaa ei ole tässä versiossa eikä sitä pidä myöhemmin sijoittaa tavalliseen i18n-kielitiedostoon.

Muuttamattomina 0.17.2:sta säilyivät mm.:
score-model.js, musicxml.js, renderer.js, audio-engine.js, score-selection.js,
thumb-rail.js, OSMD 2.1.2 sekä tie/slur-assetit.


BASE 0.17.5 · Artikulaatiot
- Aloitusikkunan UUSI NUOTTI / AVAA PROJEKTI -yläpainikkeet poistettu.
- ALOITA on suoraan uuden nuotin käynnistys.
- Aloitusikkunan alaosassa Avaa projekti -pudotuslista.
- Lista sisältää enintään 50 viimeisintä paikallisesti tallennettua projektia.
- Jokaisen recent-projektin voi poistaa erikseen ×-painikkeella.
- Listan lopussa Avaa tiedostosta… vanhojen .pikakirjoitin.json-tiedostojen avaamista varten.
- Oikean reunan Save tallentaa projektin appin omaan Recent-varastoon (IndexedDB, localStorage fallback), ei enää lataa projektitiedostoa automaattisesti.
- Saman projektin uudelleentallennus päivittää samaa recent-riviä ja siirtää sen uusimmaksi.
- 51. eri projekti pudottaa vanhimman pois automaattisesti.
- Tiedostosta avattu projekti lisätään automaattisesti Recent-listaan.
- FI/EN-kielituki säilyy.


BASE 0.17.5 · ARTIKULAATIOT
- Kelluvaan valintapalkkiin lisätty Accent (>), Staccato (•), Marcato (^) ja Tenuto (—).
- Artikulaatioita voi lisätä tai poistaa yhdeltä tai usealta valitulta nuotilta.
- Jos valinnassa on taukoja, artikulaatio kohdistuu valinnan nuotteihin; tauot ohitetaan.
- Aktiivinen artikulaatio näkyy sinisenä painikkeena, kun se on kaikilla valituilla nuoteilla.
- MusicXML: accent, staccato, strong-accent (marcato) ja tenuto välitetään OSMD 2.1.2:lle.
- Tahdin yli jakautuvan sidotun nuotin artikulaatio annetaan vain ensimmäiselle renderöidylle osalle.
- Undo/Redo käsittelee artikulaatiomuutoksen yhtenä askeleena.


0.17.5.1: PDF-tallennuksen tiedostonimi tulee nyt kappaleen otsikosta (score.metadata.title / settings.title). Otsikko siistitään tiedostonimeksi kuten ennenkin.


BASE 0.17.6.1
- Aloita alusta / refresh siirretty oikeasta pikapalkista yläpalkin vasempaan reunaan.
- Oikean pikapalkin järjestys: Undo, Redo, Save, PDF, Tulosta, Asettelu.
- Asettelu avaa kelluvan paneelin, jossa säädetään nuottikokoa sekä ylä-, ala-, vasenta ja oikeaa OSMD-marginaalia reaaliaikaisesti.
- Nuottikoko 75–120 %, marginaalit 0–12 OSMD-yksikköä, oletus 5.
- Asettelu tallentuu projektiin ja kuuluu Undo/Redo-historiaan.
- Palauta oletukset palauttaa nuottikoon 100 % ja marginaalit arvoon 5.


BASE 0.17.6.1
- PDF ei lisää enää omia 62/70 px kiinteitä marginaaleja.
- PDF sijoittaa OSMD:n SVG:n A4-sivulle saman suhteellisen .a4-paper-geometrian mukaan kuin ruudulla.
- Käyttäjän OSMD PageMargins -säädöt näkyvät näin PDF:ssä samassa suhteessa kuin näytöllä.
- Nuottikoon maksimi on nyt 120 %.


BASE 0.17.6.2 – soitinnimi, riviväli ja marginaalien uudet oletukset
- Aloitusikkunassa on vapaa Soitin / Instrument -kenttä. Oletus on FI: Huilu, EN: Flute.
- Soitinnimi tallennetaan Score Modelin metadataan ja MusicXML:n <part-name>-kenttään. Tässä 0.17.6.2-versiossa OSMD näyttää sen vielä systeemin vasemmalla puolella.
- Asettelu-paneeliin lisätty Riviväli / System spacing 50–300 %, oletus 100 %.
- Riviväli käyttää OSMD 2.1.2:n MinimumDistanceBetweenSystems- ja MinSkyBottomDistBetweenSystems-sääntöjä, ei CSS-skaalausta.
- Vasen ja oikea sivumarginaali ovat uusissa projekteissa oletuksena 2.5. Ylä- ja alamarginaali säilyvät oletuksena 5.
- Nuottikoon maksimi säilyy 120 %:ssa.
- Vanhat projektit säilyttävät niihin tallennetut layout-arvot.


BASE 0.17.6.4 – credit-soitin korkeammalle, ensirivin sisennys pois
- Soitinnimi ei näy ensimmäisen systeemin vasemmassa reunassa part-name-labelina.
- MusicXML säilyttää part-name-tiedon print-object="no" -muodossa ja antaa näkyvän soitinnimen vasemmalle tasattuna credit-tekstinä.
- Käsin asetettu OSMD:n sisäinen soitinnimivarmistus on poistettu: credit on nyt ainoa näkyvän soitinnimen lähde.
- OSMD 2.1.2 käsittelee vasemman sivu-creditin omana credit-labelinaan; sitä nostetaan ylemmäs OSMD:n SystemLyricistDistance-arvolla 6.5.
- Ensimmäisen rivin sisennys -säädin ja kaikki siihen liittyvä layout-logiikka on poistettu, koska se ei toiminut luotettavasti.
- Vasen/oikea marginaali 2.5, riviväli ja nuottikoko 75–120 % säilyvät ennallaan.


BASE 0.17.6.5 – soitinnimen korkeussäädin
- Asettelu-paneeliin lisätty Soitinnimen korkeus / Instrument name height.
- Säätö ohjaa OSMD 2.1.2:n SystemLyricistDistance-arvoa, jota OSMD käyttää vasemmalle tasatun credit-soitinnimen pystysijoitteluun.
- Säätöalue 2–14, askel 0.5, oletus 6.5. Suurempi arvo nostaa soitinnimeä ylemmäs.
- Arvo tallentuu score.layout.instrumentCreditDistance-kenttään, joten se säilyy projektissa ja Recent-kopiossa.
- Säätö kuuluu Asettelu-paneelin Undo/Redo-historiaan ja Palauta oletukset palauttaa arvon 6.5:een.
- Vanhat projektit ilman kenttää saavat oletusarvon 6.5.
