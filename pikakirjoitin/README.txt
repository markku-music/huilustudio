Pikakirjoitin 3 · BASE 0.17.0 · Tie peukalopakissa

Pohja:
- BASE 0.16.2 Älytauot yksitellen

Uusi Tie / sidekaari:
- peukalopakissa Slur-napin ja ↵ Rivien muokkaus -napin välissä
- käytössä täsmälleen käyttäjän lähettämä tie(1).svg
- kuvake on sama kuin aiemmassa Pikakirjoitin 2:ssa

Käyttö:
1. kirjoita ensimmäinen nuotti
2. napauta Tie-nappia kerran
3. nappi muuttuu siniseksi ja jää odottamaan
4. kirjoita seuraava tapahtuma
5. Tie kulutetaan heti ja nappi sammuu automaattisesti

Tie syntyy vain, kun:
- edellinen tapahtuma on nuotti
- uusi tapahtuma on nuotti
- tapahtumat ovat välittömästi peräkkäisiä
- sävelkorkeus on sama

Jos seuraava tapahtuma on:
- eri sävel -> Tie ei synny ja nappi sammuu
- tauko -> Tie ei synny ja nappi sammuu
- ensimmäinen nuotti ilman edeltäjää -> Tie ei synny ja nappi sammuu

Enharmoninen sama sävel:
- esim. C#4 ja Db4 tunnistetaan samaksi soivaksi sävelkorkeudeksi

Tietomalli:
- manuaaliset tiet tallennetaan score.ties-taulukkoon
- tie on suhde kahden loogisen nuotti-id:n välillä
- poistaminen tai sävelkorkeuden muuttaminen siivoaa kelvottoman tien
- tie ei siirry vahingossa toiseen nuottipariin, jos toinen pää poistetaan

MusicXML / OSMD:
- manuaalinen tie muunnetaan tavallisiksi <tie> ja <tied> -merkinnöiksi
- OSMD 2.1.2 piirtää sidekaaren
- olemassa oleva automaattinen tie tahtiviivan yli säilyy
- manuaalinen tie ja automaattinen tahdinylitystie voivat muodostaa saman
  yhtenäisen tie-ketjun ilman erillistä SVG-piirtoa

Slur:
- Slurin nykyinen paina-ja-pidä-logiikka on jätetty ennalleen
- Slur ja Tie voivat olla samalla nuottiparilla yhtä aikaa MusicXML:n
  omilla erillisillä notaatioilla

Muu BASE 0.16.2:n toiminta on jätetty ennalleen.
