F0 ENGINE · OSMD + PYSTYSUUNTAINEN VIRITYSMITTARI + PIANOÄÄNI

Rakenne
- f0-engine.js: F0/YIN/tunnistus
- instrument-controller.js: soitinvire, transponointi, valitut sävelet ja profiili
- audio-engine.js: Pikakirjoittimen koskettimistoääni
- opensheetmusicdisplay.min.js: OSMD
- index.html: UI

Tämän version muutokset
- Viritysmittari on pystysuuntainen ja OSMD:n oikealla puolella.
- +50 cent on ylhäällä, 0 keskellä, -50 cent alhaalla.
- OSMD:n oletuskoko pysyy 330 %.
- OSMD:n clipping-korjaus säilyy.
- 3 oktaavin koskettimisto c–c³ säilyy apin alareunassa.
- Kosketinta painettaessa kuuluu Pikakirjoittimen audio-engine.js:n ääni.
- Ääni käyttää valitun soitinvireen mukaista SOIVAA MIDI-säveltä.
  Esimerkiksi B♭-soittimen kirjoitettu C soi B♭:nä.
- Koskettimen klikkaus valitsee/poistaa sävelen kuten ennenkin.

Tärkeää
- f0-engine.js on säilytetty tavutasolla muuttamattomana.
- instrument-controller.js on säilytetty tavutasolla muuttamattomana.
- audio-engine.js on kopioitu tavutasolla Pikakirjoitin-paketista.


PWA / asennettava web-app
- manifest.webmanifest lisätty
- service-worker.js lisätty
- icon-192.png ja icon-512.png lisätty
- toimii asennettavana PWA:na HTTPS-palvelimelta, esim. GitHub Pagesista
- service worker välimuistittaa appin rungon offline-käyttöä varten

Huom:
- file://-osoitteesta avattuna service worker ei käynnisty.
- Käytä paikallista HTTP-palvelinta tai HTTPS-julkaisua.

PROFILE 11 - KEY PRESS BLUE
- Pianokosketin muuttuu siniseksi heti pointerdown-hetkellä ja pysyy sinisenä painalluksen ajan.
- MIC GUARD ja muu toiminnallisuus ennallaan.

PROFILE 20 - SOITINKUVAVALINTA
- Soitinvalinta on siirretty appin ylimmäksi kahdelle viiden soittimen riville.
- Soitinkuvat toimivat nappeina; erillinen C/Bb/Eb/F-pudotusvalikko on poistettu näkyvistä.
- Ylärivi: Huilu (C), Oboe (C), Klarinetti (Bb), Alttosaksofoni (Eb), Fagotti (C).
- Alarivi: Käyrätorvi (F), Trumpetti (Bb), Alttotorvi (Eb), Pasuuna (C), Tuuba (C).
- Valittu soitin korostuu sinisellä kehyksellä ja sen nimi/vire näkyvät soitinrivien alla.
- Soitinvire kytkeytyy edelleen samaan InstrumentControlleriin; F0-engineä ei muutettu.
- PROFILE 13:n HARD MIC GUARD + reaaliaikainen MIC GUARD -näyttö säilyvät ennallaan.

Päivitys PROFILE 20: alttotorven ja fagotin soitinkuvakkeet vaihdettu uusiin kuviin.

Päivitys PROFILE 20: trumpetin soitinkuvake vaihdettu uuteen kuvaan.

Päivitys PROFILE 20: poistettu ylimääräiset UI-selitetekstit ja Valittu soitin -kenttä.

Päivitys PROFILE 20: nuottiavain valitaan automaattisesti soitinkuvan perusteella. G-avain: huilu, oboe, klarinetti, alttosaksofoni, käyrätorvi, trumpetti, alttotorvi. F-avain: fagotti, pasuuna, tuuba.

Päivitys PROFILE 20: tahtiosoitus, valittujen sävelten infokortti, viritysmittarin valintateksti sekä koskettimiston alapuoliset infotekstit poistettu.


PROFILE 23:
- väliaikainen Viivaston pituus -slideri (20–100 %)
- koskettimisto skaalautuu käytettävissä olevaan leveyteen ilman vaakavieritystä


PROFILE 24:
- viivaston pituusslideri käyttää nyt OSMD:n LastSystemMaxScalingFactor-arvoa
- HTML-kontin leveys pysyy paikallaan, joten viivasto ei vaella sivusuunnassa ennen lyhenemistä


PROFILE 25: Viivaston pituus -sliderin yläraja nostettu 100 % -> 400 %.


PROFILE 26:
- OSMD:n vaakakeskitys perustuu nyt renderöidyn nuottiviivaston todelliseen geometriaan
- viivaston pitkät vaakaviivat mitataan SVG:stä renderöinnin jälkeen
- keskitys päivittyy myös zoomissa, viivaston pituuden muutoksessa ja ikkunan koon vaihtuessa


PROFILE 27:
- OSMD-koko lukittu 600 %
- viivaston pituus lukittu 250 %
- Koko- ja Viivaston pituus -sliderit poistettu kokonaan
- PROFILE 26:n todellinen vaakakeskitys säilytetty


PROFILE 28:
- OSMD autoResize poistettu käytöstä
- nuottinäytön leveyttä seurataan ResizeObserverilla
- resize odottaa 180 ms ennen yhtä hallittua uudelleenrenderöintiä
- vaakakeskitys tehdään vasta uuden OSMD-renderöinnin jälkeen
- render-kierre estetään reagoimalla vain leveyden muutokseen


PROFILE 29:
- nuottinäytön vaakasuuntainen scrollbar poistettu
- OSMD SVG skaalautuu aina nuottikortin leveyteen
- OSMD:n tyhjät sivumarginaalit rajataan viewBoxista pois viivaston geometrian perusteella
- viivasto pysyy vaakasuunnassa keskellä
- ikkunan resize ei enää käynnistä OSMD:n uudelleenrenderöintiä; selain skaalaa SVG:n suoraan


PROFILE 30:
- 'Näytettävä sävel' -kenttä poistettu kokonaan käyttöliittymästä
- Taajuus- ja Soiva sävel -kentät säilytetty
- tunnistus-, nuottinäyttö- ja virelogiikka ennallaan


PROFILE 31:
- koko palaute-/readout-kortti poistettu
- Taajuus- ja Soiva sävel -kentät poistettu käyttöliittymästä
- tunnistus- ja nuottinäyttölogiikka säilytetty ennallaan
