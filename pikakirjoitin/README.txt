Pikakirjoitin 2 Core 0.22.7.7 – OSMD-asetukset

Tämä paketti on siivottu jatkokehityksen pohjaksi ilman toiminnallisia muutoksia.

Nykyiset keskeiset ominaisuudet
- Modulaarinen Core-rakenne: sovelluslogiikka js/-moduuleissa, OSMD renderöijänä.
- Aloitusikkuna: kappaleen tiedot, sävellaji, tahtilaji, kohotahti, viritys, avain ja teema.
- iPad-yhteensopiva AudioContextin avaus ALOITA-toiminnolla.
- Koskettimiston eleet: napautus 1/4, alas 1/8, ylös 1/2, oikealle 1/16, vasemmalle 1/32, pitkä 1/1.
- Peukalopalkki: piste, tauko ja kertakäyttöinen sidekaari; palkkia voi siirtää pystysuunnassa.
- Kokotahdin tauko ja eksplisiittinen multirest.
- Sävellajin mukainen enharmoninen kirjoitusasu.
- Yhden nuotin editointi: enharmoninen vaihto, poisto sekä korkeus/aika-arvo koskettimistolta.
- Valitun nuotin editointi huomioi piste- ja taukomodifikaattorit.
- Vaakasuuntainen nuottialueen valinta; kahden tapahtuman jälkeen ele lukittuu valinnaksi eikä Safari-scroll ota sitä haltuun.
- Undo/Redo tapahtumatasolla.
- Portrait määrittää OSMD:n nuottikoon; landscape käyttää portrait-sisältöleveyteen suhteutettua zoomia.
- OSMD autoResize on pois käytöstä; sovelluksen ResizeObserver hoitaa leveyden/orientaation muutokset.

Siivous tässä paketissa
- Poistettu kehityksen _measure_rest_test.html-testisivu.
- Poistettu tuotantoon jäänyt tapahtumakartoituksen console.warn-diagnostiikka.
- README päivitetty vastaamaan tämän paketin todellista nykytilaa.
- Sovelluksen toiminnallista logiikkaa, CSS-asettelua, assetteja tai OSMD-kirjastoa ei muutettu.


Muutos 0.22.7.6
- Otsikko käyttää MusicXML:n <work><work-title>-rakennetta ja OSMD piirtää sen.
- Säveltäjä käyttää <identification><creator type="composer">-rakennetta ja OSMD piirtää sen.
- Tempoteksti käyttää ensimmäisen tahdin <direction placement="above"><direction-type><words>... -rakennetta ja OSMD sijoittaa sen.
- Teksteille ei käytetä omia HTML/SVG-elementtejä, X/Y-siirtoja tai jälkikäsittelyä.
- OSMD:n drawingParameters muutettu compacttight -> compact, jotta erittäin tiukan presetin ylimääräiset systeemivälipakotukset eivät ohjaa tekstien ympärillä olevaa ladontaa.
- Ei rivivälisäädintä eikä muita uusia käyttöliittymäelementtejä.


Muutos 0.22.7.7
- Lisätty erillinen täysruutuinen OSMD-asetussivu kirjoitusnäkymän rataskuvakkeesta.
- Ladontatiloina default, compact ja compacttight. Oletus säilyy compact.
- Säädettävissä SheetTitleHeight, TitleTopDistance, TitleBottomDistance, SheetComposerHeight, SystemComposerDistance, SystemLyricistDistance, InstantaneousTempoTextHeight, ContinuousTempoTextHeight ja TempoYSpacing.
- Jokaisessa arvossa liukusäädin ja tarkka numeroarvo.
- Asetussivulla oma OSMD-esikatselu otsikolla, Allegro-tempolla, säveltäjällä, sanoittajalla ja kahdella systeemillä.
- Esikatselumuutokset eivät muuta varsinaista nuottia ennen Tallenna-painiketta.
- Tallennetut ladonta-asetukset säilyvät localStoragessa seuraaville käynnistyskerroille.
- Pikakirjoittimen oletukset palauttaa compact + nykyiset perusarvot. OSMD-oletukset palauttaa default + OSMD:n perusarvot.
- Varsinaiseen nuotinsyöttöön, valintaan, audioon, portrait/landscape-zoomaukseen tai MusicXML-tekstirakenteisiin ei tehty muutoksia.
