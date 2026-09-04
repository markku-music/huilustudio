LEO LENTÄJÄ – 3.73 LENTOLUPAKIRJA WEBP

Pohja: 3.72 Lentolupakirja.

Ulkoasumuutos lupakirjatestiin:
- lupakirjan staattinen ulkoasu on WebP-kuva: lentolupakirja.webp
- 5 korkean äänen ja 5 matalan äänen ruksia piirretään dynaamisesti kuvan päälle
- alareunan statuskenttä on dynaaminen:
  KORKEA ÄÄNI x/5 • MATALA ÄÄNI x/5
- 10/10 jälkeen status vaihtuu muotoon “LUPAKIRJA HYVÄKSYTTY”
- “Minulla on jo lupakirja” -ohitus säilyy
- hyväksytyn testin jälkeen näkyy Lentoon-painike

Tunnistuslogiikkaa EI ole muutettu 3.72-versiosta:
- 5 hyväksyttyä korkeaa ääntä
- 5 hyväksyttyä matalaa ääntä
- yksi yhtäjaksoinen puhallus voi lisätä enintään yhden ruksin
- väärä / epävarma ääni ei vähennä tulosta eikä lisää ruksia
- ensin korkeat, sitten matalat

Varsinaisen lentopelin lentokone-, sää-, pallo-, ääni- ja törmäyslogiikkaa ei ole muutettu.
