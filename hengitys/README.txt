HENGITYSAPPI + RESONATORENGINE · G-DUURI g1–g2 · 0.7

Tässä versiossa Hengitysappi 0.6:n puhallus-/hengitysmittari ja audiokelloon
synkronoitu metronomi on yhdistetty ResonatorEngineen ja OSMD-nuottinäyttöön.

HYVÄKSYTYT SÄVELET
- g1  392,0 Hz
- a1  440,0 Hz
- h1  493,9 Hz
- c2  523,3 Hz
- d2  587,3 Hz
- e2  659,3 Hz
- fis2 740,0 Hz
- g2  784,0 Hz

Moottori vertaa ääntä vain näihin kahdeksaan kohdesäveleen. Asteikon
ulkopuolista ääntä ei näytetä uutena nuottina. Viimeisin hyväksytty nuotti jää
näkyviin äänen loppuessa tai muun äänen hylkäämisen jälkeen. Vakiintuneen
sävelen lopun lyhyitä ja hiipuvia virhetunnistuksia suodatetaan.

KÄYTTÖ
1. Pura koko ZIP-paketti niin, että kansiorakenne säilyy.
2. Avaa index.html HTTPS-osoitteesta tai paikalliselta palvelimelta.
3. Paina Avaa mikrofoni ja ole lyhyen kalibroinnin ajan hiljaa.
4. Soita jokin G-duuriasteikon sävelistä g1–g2.
5. Nuotti ja suomalainen sävelnimi näkyvät appin yläosassa.
6. Puhallus-/hengitysmittari toimii edelleen pitämällä mittaria painettuna
   puhalluksen ajan ja vapauttamalla sen sisäänhengityksen alkaessa.

MIKROFONI
Mikrofoni tarvitsee HTTPS-osoitteen tai localhost-palvelimen. Pelkkä
index.html-tiedoston kaksoisnapsautus ei takaa mikrofonin toimintaa kaikissa
selaimissa. Paikallisen palvelimen voi käynnistää tämän kansion sisältä:

python3 -m http.server 8000

Avaa sen jälkeen http://localhost:8000

METRONOMI
- 40–180 BPM
- oletus 75 BPM
- ääni ja visuaalinen pulssi käyttävät samaa AudioContext-aikaa
- getOutputTimestamp() sitoo audiokellon selaimen näyttöaikaan ilman käsin
  asetettua millisekuntikorjausta

TIEDOSTOT
- index.html: yhdistetty käyttöliittymä ja kahdeksan kohdesäveltä
- resonator-engine.js: itsenäinen ResonatorEngine
- note-stability.js: sävelenvaihdon ja äänen lopun näytön suoja
- score-display.js: OSMD-nuottinäyttö
- vendor/osmd/: paikallinen OSMD-kirjasto ja sen lisenssi
- tausta.jpg: käyttöliittymän taustakuva
- metronomi.wav: alkuperäinen metronomiääni
