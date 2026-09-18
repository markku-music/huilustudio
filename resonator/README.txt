RESONATORENGINE · OSMD-NUOTTINÄYTTÖ 1.0.2 PWA

Näyttää ResonatorEnginen tunnistaman sävelen G-avaimellisella nuottiviivastolla.
Sävelet ovat samat kuin alkuperäisessä paketissa: G4 A4 H4 C5 D5 E5 F#5 G5.
Moottorin tiedostoa, tunnistusasetuksia tai kohdesävelten taajuuksia ei muutettu.
Versio 1.0.2 lisää vain PWA-asennuksen, offline-tuen ja sovelluskuvakkeet.

KÄYTTÖ
1. Pura koko ZIP-paketti ja pidä tiedostot samassa kansiorakenteessa.
2. Avaa index.html HTTPS-osoitteesta tai paikalliselta palvelimelta.
3. Paina Avaa mikrofoni ja ole kalibroinnin ajan hetki hiljaa.
4. Soita jokin kahdeksasta sävelestä. Tunnistettu nuotti ilmestyy viivastolle.
5. Viimeisin hyväksytty nuotti jää näkyviin, vaikka ääni loppuu tai uusi ääni
   hylätään. Nuotti ja sen väri säilyvät seuraavaan vahvistettuun säveleenvaihtoon
   asti. Vakiintuneen äänen lopun lyhyet tai hiipuvat hypyt suodatetaan.
6. Sulje mikrofoni samalla painikkeella. Mikrofonin sulkeminen tyhjentää
   näytön kuten ennenkin. Keskeneräisen avauksen voi perua.

Nuottinäyttöä voi kokeilla myös ilman mikrofonia napauttamalla sävelkortteja
tai näppäimillä 1–8. Sama sävel uudelleen tai Esc tyhjentää näytön.
Kortit ovat vain näytön kokeiluun; ne eivät soita ääntä.

F# näytetään ylennysmerkillä nuotin vieressä. Etumerkintää tai tahtilajia
ei näytetä. H4 on suomalaisen nimityksen mukainen H (MusicXML: B4).
Nuotti on aina neljäsosanuotin näköinen: sen aika-arvoa ei tunnisteta.

ÄÄNEN LOPUN SUOJA
Ensimmäinen hyväksytty sävel tauon jälkeen näytetään heti kuten ennenkin.
Kun sama sävel on pysynyt noin 120 ms, näyttö ottaa suojan käyttöön:
- Lyhyt käväisy toisessa sävelessä ei vaihda nuottia.
- Tavallisen sävelenvaihdon varmistus on noin 48 ms, oktaavinvaihdon 90 ms.
- Selvästi hiljaisemmalle uudelle sävelelle tarvitaan noin 160 ms.
- Jos uuden sävelen voimakkuus jatkaa hiipumista, edellinen nuotti säilyy.
- Vakaa, hiljaisempikin uusi sävel voidaan hyväksyä. Oikeat legatovaihdot
  eivät siksi lukitu pysyvästi aiempaan nuottiin.
- Hiljaisuus nollaa varmistuksen seuraavaa ääntä varten. Näkyvä nuotti säilyy.

Suoja koskee nuottinäyttöä ja sen lukemia. Varsinaisen enginen tunnistusta
ja tapahtumia ei muutettu. Varmistusajat eivät ole lisäystä uuden äänen
alkutunnistukseen, vaan koskevat yhtäjaksoisen äänen aikana tapahtuvia vaihtoja.

Tämä on lyhyiden ja hiipuvien loppuhyppyjen suoja. Pitkä ja vakaa toinen sävel
voi edelleen vaihtaa näyttöä, koska se voi olla myös tarkoituksellinen vaihto.
Asetukset on tarkistettu synteettisillä äänillä; huilulla ja käytettävällä
mikrofonilla tehtävä kokeilu kertoo, tarvitseeko suojaa vielä säätää.

TIEDOSTOT
- index.html: käyttöliittymä, kahdeksan kohdesäveltä, asetukset ja tapahtumakytkennät.
- resonator-engine.js: alkuperäinen itsenäinen ResonatorEngine, muuttamaton.
- score-display.js: erillinen OSMD-nuottinäyttö ja MusicXML-muodostus.
- note-stability.js: näytön sävelenvaihtojen varmistus ja äänen lopun suoja.
- vendor/osmd/opensheetmusicdisplay.min.js: mukana toimitettava OSMD-kirjasto.
- vendor/osmd/LICENSE: OSMD:n lisenssi.
- manifest.webmanifest: sovelluksen nimi, värit ja asennuskuvakkeet.
- sw.js: sovelluksen offline-välimuisti.
- icons-kansio: PWA- ja iPad-kuvakkeet.

OSMD on mukana paikallisena tiedostona. Sivun ei tarvitse ladata nuottikirjastoa
verkosta. OSMD latoo kahdeksan nuottikuvaa ja tyhjän viivaston sivua avattaessa.
Tunnistuksen aikana vaihdetaan valmista SVG-kuvaa vain sävelen vaihtuessa.
Nuottinäyttö skaalautuu tilaan ilman vaakavieritystä.

PWA-ASENNUS JA OFFLINE-KÄYTTÖ
- iPadissa avaa Safarin Jaa-valikko, valitse Lisää Koti-valikkoon ja pidä
  Avaa verkkosovelluksena käytössä.
- Androidissa ja työpöytäselaimissa valitse selaimen Asenna sovellus -toiminto.
- Offline-käyttö aktivoituu, kun sovellus on avattu kerran verkkoyhteydellä.

MIKROFONI
Mikrofonia varten käytä HTTPS-palvelinta tai oman tietokoneen localhost-palvelinta.
Paikallisen palvelimen voi käynnistää tämän kansion sisältä, jos Python 3 on
asennettu: python3 -m http.server 8000
Avaa sitten http://localhost:8000
Pelkkä tiedoston kaksoisnapsautus ei takaa mikrofonin toimivuutta kaikissa selaimissa.

ALKUVIIVE
Lukema kuvaa saapuvan äänen kohinakynnyksen ylityksestä ensimmäiseen hyväksyntään
kuluvaa enginen sisäistä aikaa. Se pysyy paikallaan äänen jatkuessa.
Tauottomassa sävelenvaihdossa lukee ”vaihto”. Mikrofonin, äänilaitteen,
selaimen jonojen ja nuottinäytön päivityksen viiveet eivät sisälly lukemaan.

TARKISTUKSET
Moottorin tavut ja tunnistusasetukset verrattu alkuperäiseen pakettiin.
JavaScriptin syntaksi, nuottien MusicXML-vastaavuudet ja käyttöliittymän
tapahtumakytkennät tarkistettu koodilla. Nuotin säilyminen hiljaisuudessa
ja hylätyllä äänellä sekä vaihtuminen seuraavaan säveleen tarkistettu
synteettisellä äänellä. Loppuhyppyjen suoja tarkistettu lyhyillä oktaavihypyillä,
hiipuvilla lopuilla sekä oikeilla, myös hiljaisilla, legatovaihdoilla.
Suojan aikaperuste tarkistettu näytteenottotaajuuksilla 44,1 ja 48 kHz.
Visuaalinen selaintesti ei ollut
käytettävissä tässä ympäristössä. Oikean mikrofonin ja soittimen yhteiskoe
tehdään käyttäjän laitteella.

OSMD:n dokumentaatio:
https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/wiki/Getting-Started
https://opensheetmusicdisplay.github.io/classdoc/interfaces/IOSMDOptions.html
