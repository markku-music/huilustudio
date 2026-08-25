Pikakirjoitin 3 · BASE 0.14.1 · Slur valitusta seuraavaan

Pohja:
- BASE 0.14 Slur editoriin ja peukalopakkiin

Uusi peukalopakin Slur-toiminto:
- pidä peukalopakin Slur-painiketta pohjassa
- napauta/valitse yksi olemassa oleva nuotti
- kun sormi nousee nuotista, Pikakirjoitin lisää slurin automaattisesti
  valitusta nuotista seuraavaan nuottiin
- "seuraava nuotti" tarkoittaa seuraavaa oikeaa nuottia Score Modelissa;
  mahdolliset välissä olevat tauot ohitetaan

Jos valittu nuotti on kappaleen viimeinen nuotti:
- siitä tulee slurin odottava alku
- seuraava myöhemmin kirjoitettu nuotti sulkee slurin
- tämä käyttää samaa pending-slur-logiikkaa kuin 0.14:n
  "Slur pohjassa uutta nuottia kirjoitettaessa" -toiminto

Turvallisuus:
- toiminto käynnistyy vasta valinnan valmistuttua pointerupissa,
  ei heti pointerdownissa
- peukalopakin Slur toimii tässä add-only-modifierina:
  jos slur valitusta seuraavaan on jo olemassa, sitä ei poisteta
- kelluvan editoripalkin Slur-nappi säilyy edelleen toggle-toimintona
  useamman nuotin valinnalle

Muu 0.14:n toiminta säilyy ennallaan.
