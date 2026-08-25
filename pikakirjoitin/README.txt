Pikakirjoitin 3 · BASE 0.18.4 · DocumentTouch monisormi

LÄHTÖPISTE
- käyttäjän uudelleen lähettämä toimiva BASE 0.17.0 Tie peukalopakissa
- epäonnistuneita 0.18.x-versioita EI käytetty ScoreSelection-pohjana

MIKÄ ON TÄSSÄ OIKEASTI ERI
- 0.18.0-0.18.3 yrittivät havaita monisormen ScoreSelectionin / score-cardin
  omista eventeistä
- 0.18.4 kuuntelee iPadin natiiveja touchstart/touchmove/touchend-eventtejä
  document-tasolla CAPTURE-vaiheessa
- näin A4-paperi, OSMD, overlayt tai ScoreSelectionin omat pointer-kuuntelijat
  eivät voi estää touchstart-havaintoa ennen koordinaattoria
- Pointer Eventsejä EI käytetä monisormen lukumäärän tunnistamiseen

ELEET
2 sormea nuottipaperille:
- Undo tehdään heti, kun toinen score-touch ilmestyy

3 sormea nuottipaperille:
- 2-sormen hetkellinen Undo palautetaan Redolla
- Kappaleen tiedot avautuu
- PÄIVITÄ TIEDOT = nykyisen kappaleen tiedot vaihtuvat, score säilyy
- ALOITA UUSI = uusi tyhjä score
- × = peruuta

MONISORMEN AIKANA
- ensimmäisen sormen mahdollinen ScoreSelection-ele perutaan julkisella
  cancelActiveGesture()-metodilla
- score-cardin scrollTop/scrollLeft lukitaan
- touchmove preventDefault
- gesturestart/gesturechange/gestureend preventDefault

UNDO-HISTORIA
- käytössä snapshot-historia kuten aiemmassa 0.18.3-kokeessa
- kirjoitus, muokkaus, poisto, tauot, enharmoninen, slur, rivinvaihto ja
  viimeisen rivin venytys ovat Undo-askeleita
- Uusi nuotti on yksi Undo-askel

Muu BASE 0.17.0:n toiminta säilytetty.
