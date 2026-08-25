Pikakirjoitin 3 · BASE 0.18.2
Toimiva monisormi · Kappaleen tiedot / Aloita uusi

POHJA
- rakennettu uudelleen toimivasta BASE 0.17.0 Tie peukalopakissa -versiosta
- Kappaleen tiedot / Aloita uusi -ikkuna ja Undo-snapshotit tuotu 0.18.1:stä
- 0.18.0/0.18.1:n viivästettyä monisormitap-tunnistinta EI käytetä

MONISORMIELEIDEN TUNNISTUS
Ratkaisu perustuu käyttäjän toimivaksi osoittamaan
Pikakirjoitin_1.1.59_Nuotinvalinta_Vakautettu -versioon.

Keskeinen logiikka:
- aktiiviset touch-pointerit pidetään Setissä
- 2. sormen pointerdown tekee Undon HETI
- ei odoteta sormien nostoa
- ei mitata napautuksen kestoa
- ei mitata liike-etäisyyttä

3. sormi:
- kolmas sormi kulkee ensin 2-sormen tilan kautta
- jos toinen sormi ehti tehdä Undon, kolmas sormi palauttaa tämän
  väliaikaisen Undon tarkalleen takaisin
- sama Undo-askel palautetaan Undo-historiaan
- vasta sen jälkeen avataan Kappaleen tiedot -ikkuna

2 SORMEA
- kosketa nuottipaperia kahdella sormella
- Undo tapahtuu heti toisen sormen osuessa
- sormia ei tarvitse nostaa tietyssä ajassa

3 SORMEA
- kosketa nuottipaperia kolmella sormella
- avaa Kappaleen tiedot -ikkunan
- nykyinen nuotti EI tyhjene eleestä

KAPPALEEN TIEDOT -IKKUNA
3 sormen kautta avattuna:

PÄIVITÄ TIEDOT
- päivittää nykyisen kappaleen tiedot
- nuotit/tauot säilyvät
- Tie-suhteet säilyvät
- Slurit säilyvät
- layout säilyy mahdollisuuksien mukaan
- päivitys on yksi Undo-askel

ALOITA UUSI
- tyhjentää kappaleen vasta napin painalluksessa
- aloittaa uuden kappaleen ikkunan tiedoilla
- koko toiminto on yksi Undo-askel
- 2 sormen Undo voi palauttaa edellisen kappaleen

×
- sulkee ikkunan muuttamatta mitään

SAFARI / IPAD TOUCH LOCK
Toimivan 1.1.59-version periaate on tuotu mukaan:
- touchstart/touchmove/touchend/touchcancel seuraavat sormia
- kun paperilla on 2+ sormea, paperin scrollTop/scrollLeft lukitaan
- preventDefault estää Safarin oman monisormiliikkeen sotkemasta elettä
- gesturestart/gesturechange estetään monisormieleen ajan
- yhden sormen normaali scrollaus ja nuottivalinta jäävät ennalleen
- kun toinen sormi tulee, jo alkanut yhden sormen valinta perutaan ja
  sitä edeltänyt valinta palautetaan

UNDO-HISTORIA
- snapshot-pohjainen, enintään 100 askelta
- kirjoitus
- koskettimella muokkaus
- enharmoninen
- Slur
- Tauoksi muuttaminen ja älytauot
- Poisto
- rivinvaihto
- viimeisen rivin venytys
- kappaleen tietojen päivitys
- Aloita uusi

SÄILYTETTY BASE 0.17.0:STA
- Tie peukalopakissa
- älytauot yksitellen
- rivinvaihdot
- landscape-rivinvaihtomerkkien kohdistus
- viimeisen rivin venytys
- slurit
- nuottivalinta
- portrait/landscape nuottikoon lukitus
- A4-paperi
- OSMD 2.1.2 vendor muuttumattomana
