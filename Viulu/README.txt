VIULUKIELET DEV 1.1

DEV 0.3:n toiminta säilytetty.

Uutta DEV 0.4:ssa:
- Kehittäjäpaneeli ei enää aukea viulun/kielten päälle.
- Pienellä ruudulla paneeli telakoituu viulun alle.
- Isommalla ruudulla paneeli asettuu viulun oikealle puolelle.
- Viulunäkymä skaalautuu automaattisesti sekä ikkunan leveyden että korkeuden mukaan.
- Kehittäjäpaneelin ollessa auki viulu pienenee niin, että värähtelevä kieli pysyy näkyvissä säätämisen aikana.

Kehittäjäpaneelissa jokaiselle värähtelevälle kieliviivalle (G/D/A/E) voi säätää erikseen:
- pituus
- kulma
- X-sijainti
- Y-sijainti

JSON:
- Vie JSON: tallentaa kaikkien neljän kielen säädöt tiedostoon
- Tuo JSON: palauttaa asetukset JSON-tiedostosta

Tuonnissa arvot rajataan automaattisesti sliderien sallittuihin rajoihin.
Asetukset tallentuvat myös selaimen localStorageen automaattisesti.

Tunnistettavat kielet:
G3 196.00 Hz = karhukieli = #3FAE5A
D4 293.66 Hz = isäkieli  = #E84B4B
A4 440.00 Hz = äitikieli = #3F82D7
E5 659.26 Hz = lintukieli = #F4C542

Huom: mikrofonikäyttö vaatii HTTPS-yhteyden tai localhostin.

DEV 0.5: Taustakuva skaalautuu nyt vapaasti selainikkunan mukaan ilman 560 px maksimileveyttä. Kuva säilyttää alkuperäisen 1075:1463-kuvasuhteen, eikä sitä rajata (object-fit: contain). SVG-kielet skaalautuvat täsmälleen kuvan mukana.

DEV 0.6: Poistettu aktiivisen kielihahmon ympärille piirtyvät värilliset ympyrät. Kun kieli soi, vain itse värähtelevä kieliviiva korostuu. Muut DEV 0.5 -toiminnot säilytetty ennallaan.

DEV 0.7: Uudet käyttäjän hyväksymät värähtelyasetukset on asetettu oletuksiksi: G 81% / -0.3° / X 11 / Y 6; D 81% / 0.3° / X 13 / Y 7; A 82% / 0.5° / X 14 / Y 8; E 82% / 0.8° / X 12 / Y 9. Muu DEV 0.6 -toiminta säilytetty ennallaan.

DEV 0.8: Aktiivinen kieli värähtelee nyt suhteessa tunnistettuun sävelkorkeuteen. Koska näytön virkistystaajuus ei voi näyttää 196–659 fyysistä värähdystä sekunnissa, animaatio hidastetaan suhteessa 1:50: G noin 3.92 visuaalista sykliä/s, D noin 5.87, A noin 8.80 ja E noin 13.19. Mikrofonikäytössä nopeus seuraa mitattua todellista Hz-arvoa, joten myös pienet vire-erot muuttavat värähtelyn nopeutta. Kehittäjäpaneelin esikatselussa käytetään kunkin avoimen kielen nimellistaajuutta. Muut DEV 0.7 -toiminnot ja hyväksytyt kieliasetukset säilyvät ennallaan.


DEV 0.9: Värähtelymalli muutettu luonnollisemmaksi. Koko kieliviiva ei enää liiku jäykkänä sivusuunnassa, vaan kielen päät pysyvät paikoillaan ja keskiosa taipuu fundamental-moodin mukaisesti. Sivuttaisliikettä on pienennetty DEV 0.8:sta: G noin 3.8 SVG-yksikköä, D 3.3, A 2.8 ja E 2.4. Värähtelyn nopeus seuraa edelleen tunnistettua Hz-arvoa suhteessa 1:50. Muut DEV 0.8 -toiminnot ja hyväksytyt kieliasetukset säilyvät ennallaan.


DEV 1.0: Värähtelylle lisätty kehittäjäsäädöt. Valitulle G/D/A/E-kielelle voi säätää amplitudin eli sivuttaisliikkeen määrän erikseen. Lisäksi kaikille kielille yhteisesti voi säätää visuaalisen värähtelyn nopeutta prosentteina, hienoliikkeen määrää sekä mikrofonista tulevan Hz-arvon seurannan nopeutta. Aiemmat oletukset säilyvät: G 3.8, D 3.3, A 2.8, E 2.4 SVG-yksikköä; nopeus 100 %, hienoliike 10 % ja Hz-seuranta 24 %. JSON-vienti sisältää nyt myös nämä motion-asetukset, ja JSON-tuonti ymmärtää sekä uudet että vanhat asetustiedostot.


DEV 1.1: Käyttäjän DEV 1.0 JSONissa hyväksymät värähtelyn oletusarvot asetettu pohjaksi: amplitudi G 0.5, D 0.7, A 1.0, E 2.6; nopeus 200 %, hienoliike 10 % ja Hz-seuranta 5 %. Kielten geometria säilyy: G 81/-0.3/11/6, D 81/0.3/13/7, A 82/0.5/14/8, E 82/0.8/12/9. Motion-localStoragelle uusi 1.1-avain, jotta nämä uudet oletukset tulevat varmasti käyttöön ensi käynnistyksellä.


DEV 1.6: Taustakuva vaihdettu käyttäjän toimittamaan uuteen 1075×1463 PNG-kuvaan. Muu sovelluslogiikka, kielten animaatiot, kehittäjäasetukset ja hyväksytyt säädöt säilytetty ennallaan. Service worker -välimuistin tunniste päivitetty, jotta uusi kuva latautuu varmasti.

DEV 2.0: Oikealle lisätty pystysuuntainen viritysmittari. A4-referenssi 440 Hz oletuksena. Kehittäjätilassa A4 Hz, mittarin X/Y, korkeus, leveys, vireessä-alue ja reagointi. Viritysmittari näyttää ylhäällä korkean, alhaalla matalan ja keskellä vireessä olevan sävelen.


DEV 2.3: Viulun taustakuva päivitetty käyttämään realistisempia mittasuhteita käyttäjän referenssin pohjalta.

DEV 2.4: Viulutausta korjattu paremmin vastaamaan käyttäjän referenssiviulun mittasuhteita.

DEV 2.5: Korjattu viulukuva vaihdettu sovelluksen assets/viulu.png-tiedostoksi vanhan kuvan tilalle.

DEV 2.6: käyttäjän DEV 2.5 JSON-säädöt asetettu uusiksi oletusarvoiksi.
