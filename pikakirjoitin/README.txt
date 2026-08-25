Pikakirjoitin 3 · BASE 0.18.5 · Vanha monisormikone siirretty

Lähtöpiste:
- käyttäjän toimiva Pikakirjoitin_3_BASE_0.17.0_Tie_Peukalopakki(1).zip
- Tie-, Slur-, nuottimalli-, OSMD-, koskettimisto- ja rivieditorit on jätetty ennalleen

Monisormi:
- toteutus perustuu suoraan käyttäjän samalla iPadilla toimivaksi testaamaan
  Pikakirjoitin_1.1.59_Nuotinvalinta_Vakautettu(1).zip-versioon
- Touch Events lukitsevat Safarin scroll/pinchin 2+ sormella
- Pointer Events tekevät varsinaisen tilakoneen
- ensimmäinen pointer kaapataan heti score-cardille kuten vanhassa versiossa
- 2 sormea -> Undo heti
- 3 sormea -> 2-sormen väliaikainen Undo palautetaan Redolla ja avataan Kappaleen tiedot
- P3:n yhden sormen ScoreSelection perutaan hallitusti, kun toinen sormi tulee

Vanhan toimivan version kosketusympäristö on myös siirretty:
- html/body overscroll-behavior:none
- html/body touch-action:manipulation
- body position:fixed + inset:0
- app-shell position:fixed + inset:0 + touch-action:manipulation
- score-card säilyy touch-action:pan-y ja -webkit-overflow-scrolling:touch

Undo:
- palauttaa koko Score Model -tilan ja kappaleasetukset
- historia kattaa nuotin kirjoituksen/muokkauksen, enharmonisen vaihdon, tauoksi muuttamisen,
  poiston, Slurin, rivinvaihdon, viimeisen rivin venytyksen ja kappaleen tietojen muutokset
- ALOITA UUSI tallennetaan Undo-historiaan, joten vanha kappale voidaan palauttaa 2-sormen Undolla

Kappaleen tiedot:
- 3 sormea avaa nykyiset tiedot
- PÄIVITÄ TIEDOT säilyttää nuotit
- ALOITA UUSI tyhjentää kappaleen mutta on Undo-palautettava
- × sulkee muuttamatta mitään

Välimuistin varmistus:
- CSS- ja JS-resursseihin on lisätty ?v=0.18.5, jotta iPad/Safari ei käyttäisi vahingossa
  saman URL-polun vanhaa app.js/score-selection.js-versiota.
