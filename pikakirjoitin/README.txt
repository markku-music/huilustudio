Pikakirjoitin 3 · BASE 0.14.4 · Valinta + slur-korvaus

Pohja:
- BASE 0.14.3 Slur klikkaus eteen, kirjoitus taakse

1. ENSIMMÄISEN / HARVAN NUOTIN VALINTA PARANNETTU
- valinnan hit-alue ei perustu enää vain nuotinpään pieneen laatikkoon
- hit-alue käyttää koko VexFlow-nuottiryhmää (nuotinpää, varsi jne.)
- nuotinpään väritys säilyy silti ennallaan
- osuma-alueen paddingia kasvatettu maltillisesti
- lisäksi viivaston sisällä on rajattu lähimmän nuotin fallback:
  jos napautus osuu hieman harvan yksittäisen nuotin sivuun, lähin nuotti
  voidaan silti valita
- tyhjään nuottipaperiin napautus säilyy edelleen valinnan poistona silloin,
  kun mitään nuottia ei ole riittävän lähellä

Tämä korjaa erityisesti tilanteen, jossa ensimmäisessä tahdissa on vain yksi
nuotti ja siihen osuminen oli ajoittain epävarmaa.

2. KELLUVAN PALKIN SLUR KORVAA VANHAT SISÄISET SLURIT
- valitse vähintään kaksi nuottia
- jos valinta-alueen sisällä on jo yksi tai useampia slurreja, ne poistetaan
- niiden tilalle tehdään yksi uusi slur ensimmäisestä viimeiseen valittuun nuottiin
- valinnan ulkopuolelle jatkuvia slurreja ei poisteta
- jos valinta-alueella on jo täsmälleen yksi sama slur eikä muita sisäisiä slurreja,
  painike säilyttää aiemman toggle-käytöksen ja poistaa sen

Esimerkki:
B-C slur + C-D slur
valitse B C D
paina kelluvan palkin Slur
=> vanhat B-C ja C-D poistuvat, tilalle yksi B-D slur

Muu BASE 0.14.3:n toiminta säilyy ennallaan:
- kirjoittaessa Slur pohjassa uusi nuotti kytkeytyy edelliseen
- olemassa olevaa nuottia klikatessa Slur pohjassa valittu kytkeytyy seuraavaan
- älytauot, enharmoninen, poisto ja valinnan muu logiikka ennallaan
