Pikakirjoitin 2 Core 0.26 – Etumerkkieditointi

Pohja: Core 0.25 Nuottieditointi korkeus + aika.

Lisätty valitun nuotin ♭/♯-painikkeisiin kaksitoiminen logiikka:
- diatoninen/naturaali nuotti + ♯ = sama kirjain ylennettynä, soiva korkeus +1/2 askelta
- diatoninen/naturaali nuotti + ♭ = sama kirjain alennettuna, soiva korkeus -1/2 askelta
- vastakkaisella etumerkillä kirjoitettu nuotti vaihtuu enharmonisesti ilman soivan korkeuden muutosta
  esim. Ges -> ♯ -> Fis ja Fis -> ♭ -> Ges
- jo samalla etumerkillä oleva nuotti ei muutu
- kaksoisylennyksiä ja kaksoisalennuksia ei luoda
- tarkka kirjoitusasu (esim. Cb, Fb, B#, E#) säilytetään MusicXML:ään asti
- ↑/↓ ja koskettimella tehtävä uusi korkeus palauttavat kirjoitusasun sävellajin normaaliin logiikkaan
- Undo/Redo käsittelee jokaisen etumerkkimuutoksen yhtenä editointina

Muut 0.25:n ominaisuudet säilyvät.


Core 0.27: Aluevalinnan Kopioi loppuun ja manuaalinen Palkita yhteen.
