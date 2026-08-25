Pikakirjoitin 3 · BASE 0.14.3 · Slur klikkaus eteen, kirjoitus taakse

Korjattu peukalopakin Slur-logiikka kahdeksi eri tilanteeksi:

1. UUTTA NUOTTIA KIRJOITETTAESSA
- kirjoita ensimmäinen nuotti normaalisti
- pidä Slur pohjassa ja kirjoita seuraava nuotti
- juuri kirjoitettu nuotti kytkeytyy slurilla EDELLISEEN nuottiin

Esimerkki:
C normaalisti
Slur pohjassa + D
=> slur C-D

2. OLEMASSA OLEVAA NUOTTIA KLIKATTAESSA / VALITTAESSA
- pidä Slur pohjassa
- napauta yhtä olemassa olevaa nuottia
- valittu nuotti kytkeytyy slurilla SEURAAVAAN nuottiin

Esimerkki:
nuotit C D E ovat jo olemassa
Slur pohjassa + klikkaa D
=> slur D-E

Jos klikattu nuotti on kappaleen viimeinen:
- se jää odottamaan seuraavaa myöhemmin kirjoitettavaa nuottia
- seuraava kirjoitettu nuotti sulkee slurin

Tauot ohitetaan sekä edellistä että seuraavaa nuottia etsittäessä.

Kelluvan editoripalkin Slur säilyy ennallaan:
- vähintään kahden nuotin valinta
- yksi slur ensimmäisestä viimeiseen valittuun
- toggle lisää/poistaa saman slurin

Muu BASE 0.14.2:n toiminta säilyy ennallaan.
