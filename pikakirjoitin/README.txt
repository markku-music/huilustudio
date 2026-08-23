Pikakirjoitin 2 Core 0.14 – Kosketusvalinta

Pikakirjoitin 2 Core 0.8 – 15 mm marginaalit

Lisätty A4-nuottipaperille 15 mm marginaalit kaikille neljälle reunalle. Marginaalit ovat oma layout-asetus js/page-layout.js-tiedostossa ja muunnetaan OSMD:n sisäisiin yksiköihin sivun todellisen leveyden perusteella.

Pikakirjoitin 2 Core 0.7 – Automaattinen tie

Pohja: Core 0.6 Vanha aloitusikkuna.

Uutta:
- jos nuotin aika-arvo ei mahdu tahdin loppuun, nuotti jatkuu automaattisesti seuraavaan tahtiin
- jatko merkitään MusicXML:n tie/tied-rakenteella, jonka OSMD piirtää tie-kaareksi
- toimii myös kohotahdissa ja kaikissa aloitusikkunan tahtilajeissa
- pitkä nuotti voi jatkua tarvittaessa useamman tahtirajan yli
- tahtiin sijoittelu on erotettu omaan js/measure-layout.js-moduuliin

Muu Core 0.6:n toiminta on säilytetty.


Core 0.9: Nuottipaperin ulkopuolinen vasen/oikea tila pienennetty 12 px:iin ja 860 px maksimileveys poistettu. Paperin sisäiset 15 mm marginaalit ennallaan.


Core 0.10
---------
- Nuottipaperin pystysuuntainen yhden sormen veto on edelleen selaimen natiivi scrollaus.
- Vain viivaston alueelta alkava selkeä vaakasuuntainen veto valitsee nuottijakson.
- Valinta toimii kumpaankin vaakasuuntaan samalla viivastorivillä.
- Vain valittujen nuottien nuotinpäät vaihtavat teemaväriin.
- Tahdin yli tie-kaarella jaetun saman loogisen nuotin kaikki nuotinpäät värittyvät yhdessä.

Core 0.11
---------
- Tyhjään nuottipaperin kohtaan napauttaminen poistaa nykyisen aluevalinnan.
- Nuotin ympärillä on 44+ px:n näkymätön osuma-alue, joten nuottiin osunutta napautusta ei tulkita tyhjäksi.
- Vaakavalinnan aloitus ei enää käytä raakaa sormen x-koordinaattia.
- Kun vaakaveto lukittuu valinnaksi, aloitus napsahtaa saman viivaston lähimpään nuotinpäähän.
- Myös vedon loppu napsahtaa lähimpään nuotinpäähän, joten valinta laajenee nuotti kerrallaan eikä pikseli kerrallaan.
- Pystysuuntainen veto säilyy selaimen natiivina scrollauksena.


Core 0.12
---------
- Eleiden suunnantunnistus on nyt epäsymmetrinen.
- Selvä pystyscrollaus tunnistetaan herkästi: 7 px ja y-liike yli 1,5 × x-liike.
- Vaakavalinta käynnistyy 12 px kokonaisliikkeestä, jos elettä ei ole jo tunnistettu selväksi pystyscrollaukseksi.
- Vaakavalinnan saa siis tehdä selvästi vinossa; 45 asteen veto ja monet sitä pystymmäksi kallistuvat vedot hyväksytään valinnaksi.
- Kun ele on kerran päätetty scrollaukseksi tai valinnaksi, tulkintaa ei vaihdeta kesken kosketuksen.

0.13: Vaakavalinnan aikana viivaston yläpuolella näkyy pieni kolmio+pystyviiva-kohdistin. Kohdistin napsahtaa viimeisimpään valittuun nuottiin, seuraa valintaa nuotti kerrallaan ja katoaa sormen nostossa.


Core 0.14
---------
- Ensimmäinen kosketus nuottiin valitsee nuotin heti pointerdownissa ja näyttää kohdistimen.
- Sama valintarakenne tukee myös näkyviä taukoja: tauolla itse taukosymboli vaihtaa väriä.
- Jos kosketus muuttuu selväksi pystyscrollaukseksi, hetkellinen valinta perutaan ja edellinen valinta palautetaan.
- Vaakavedossa juuri kosketettu tapahtuma toimii tarkkana ankkurina; tyhjästä viivastokohdasta aloitettaessa käytetään lähintä tapahtumaa.
- Valintakohdistin jää näkyviin valinnan viimeisen tapahtuman kohdalle myös sormen nostamisen jälkeen.
- Tyhjään paperiin napautus poistaa sekä valinnan että kohdistimen.
