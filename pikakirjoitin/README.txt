Pikakirjoitin 3 · BASE 0.18.1
Kappaleen tiedot / Aloita uusi

Pohja:
- BASE 0.18.0
- 2 sormen Undo ja 3 sormen Kappaleen tiedot -ele säilyvät

3 SORMEN ELE

Kolmen sormen lyhyt napautus nuottipaperilla avaa nykyisen
Kappaleen tiedot -ikkunan nykyisillä arvoilla valmiiksi täytettynä.

Ikkunassa on nyt kolme mahdollista poistumistapaa:

1. PÄIVITÄ TIEDOT
- ensisijainen sininen nappi
- päivittää nykyisen kappaleen tiedot
- nuotteja ja taukoja ei tyhjennetä
- Tie-suhteet säilyvät
- Slurit säilyvät
- rivinvaihdot säilyvät siltä osin kuin ne ovat uuden tahtirakenteen
  jälkeen edelleen olemassa
- viimeisen rivin venytys säilyy
- koko päivitys on yksi Undo-askel

Päivitettäviä tietoja ovat nykyisen aloitusikkunan kentät:
- nimi
- säveltäjä
- tempoteksti
- sävellaji
- tahtilaji
- kohotahti
- transponointi / viritys
- nuottiavain
- värimaailma

Jos tahtilaji tai kohotahti muuttaa tahtien määrää:
- vain uuden kappalerakenteen ulkopuolelle jääneet pakotetut
  rivinvaihdot siivotaan pois
- muuten layout säilyy

2. ALOITA UUSI
- erillinen reunustettu nappi
- tyhjentää score-sisällön vasta napautettaessa
- aloittaa uuden kappaleen ikkunassa olevilla tiedoilla
- toiminto on yksi Undo-askel
- 2 sormen Undo voi siis palauttaa edellisen kappaleen

3. ×
- sulkee ikkunan
- ei muuta nykyistä kappaletta lainkaan

Kun sovellus avataan ensimmäisen kerran:
- aloitusikkuna toimii kuten ennen
- näkyy vain ALOITA
- PÄIVITÄ TIEDOT / ALOITA UUSI -kaksikko näkyy vain,
  kun ikkuna avataan uudelleen 3 sormen eleellä

2 SORMEN ELE
- Undo säilyy ennallaan

Muu BASE 0.18.0:n toiminta on jätetty ennalleen.
