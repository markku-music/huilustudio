Pikakirjoitin 3 · BASE 0.18.3 · Monisormi ScoreSelectionissa

POHJA
- rakennettu suoraan käyttäjän lähettämästä toimivasta
  Pikakirjoitin_3_BASE_0.17.0_Tie_Peukalopakki(1).zip -versiosta
- epäonnistuneita 0.18.0-0.18.2 monisormirakenteita ei käytetty pohjana

MIKÄ MUUTTUI
Monisormiele ei ole enää app.js:n erillinen gesture listener.
Se kuuluu nyt samaan ScoreRangeSelection-elekoneistoon kuin yhden sormen:
- nuotin/tauon napautus
- vaakavalinta
- pystyscrollauksen luovutus Safarille

ELELOGIIKKA
- 1 sormi: nykyinen 0.17.0 valinta/scrollaus ennallaan
- 2. sormi tulee paperille: yhden sormen kesken ollut valinta perutaan ja Undo tehdään heti
- 3. sormi tulee: 2-sormen väliaikainen Undo tehdään heti takaisin Redolla ja Kappaleen tiedot avataan
- kun kaikki sormet irtoavat, monisormitila nollautuu

TUNNISTUS
- Pointer Events ja native Touch Events syöttävät SAMAA scoreGesture-tilakonetta
- tämä on tarkoituksellinen Safari-varmistus: jos toisen/kolmannen sormen pointerdown puuttuisi,
  touchstartin touches/changedTouches-määrä voi silti käynnistää saman tilasiirtymän
- scoreGesture 0 -> 2 -> 3 estää kaksoislaukaisun

SAFARI-LUKITUS
Vanhan toimivan Pikakirjoittimen periaate on tuotu ScoreSelectioniin:
- touchstart/touchmove/touchend/touchcancel passive:false capture:true
- vähintään kahdella sormella score-cardin scrollTop ja scrollLeft lukitaan
- gesturestart/gesturechange estetään monisormitilan aikana
- pk-score-multitouch-locked käyttää touch-action:none

2 SORMEA
- Undo
- snapshot-historia enintään 100 muutosta
- kirjoittamisen yksi kosketusele on yksi Undo-askel, myös mahdollinen Tie/Slur kuuluu samaan askeleeseen
- mukana myös Poisto, Tauoksi muuttaminen, Enharmoninen, Slur ja rivien muokkaus

3 SORMEA
- ei tyhjennä mitään suoraan
- avaa Kappaleen tiedot nykyisillä tiedoilla
- PÄIVITÄ TIEDOT: säilyttää nuotit, tauot, Tiet, Slurit ja layoutin
- ALOITA UUSI: aloittaa tyhjän kappaleen ja on yksi Undo-askel
- ×: sulkee muuttamatta mitään

UNDO/REDO KOLMELLE SORMELLE
- 3 sormen kosketus käy luonnollisesti 2 sormen vaiheen läpi
- siksi 2. sormi tekee Undon
- 3. sormi tekee saman actionin Redon ennen Kappaleen tiedot -ikkunaa
- tämä kopioi vanhan toimivan version perusidean, jossa 3 sormen toiminto ei jätä 2-sormen Undo-vaikutusta voimaan

MUU 0.17.0
- Tie peukalopakissa
- älytauot
- rivinvaihdot
- landscape-rivimerkkikohdistus
- viimeisen rivin venytys
- Slurit
- valinta
- portrait/landscape nuottikoko
- OSMD 2.1.2 vendor
on säilytetty.
