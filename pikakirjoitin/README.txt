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
