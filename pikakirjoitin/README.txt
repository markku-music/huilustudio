Pikakirjoitin 2 Core 0.29 – Sävelasun valitsin

Pohja: Core 0.28 Palkin katkaisu.

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

0.28: Yksittäisen nuotin editoriin lisätty palkin katkaisu ennen valittua nuottia. Katkaisu on Undo/Redo-tallennettava ja voittaa automaattisen, tupletti- ja manuaalisen palkituksen kyseisessä rajassa.


0.29: Yksittäisen nuotin työkalupaneelista poistettu ylös/alas-nuolet. Erilliset ♭/♯-napit korvattu yhdellä sävelasun valitsimella: naturaali sävel tarjoaa saman kirjainnimen ♭ / naturaali / ♯ -vaihtoehdot, muunnettu sävel saman soivan korkeuden tavalliset enharmoniset kirjoitusasut. Palkin katkaisu ja roskis säilyvät.
