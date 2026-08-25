Pikakirjoitin 3 · BASE 0.11.4 · Ryhmitelty tempovalikko

Pohja:
- käyttäjän palauttama BASE 0.11.3 OSMD Oletus Otsikko Säveltäjä

Muutos:
- VAIN aloitusikkunan Tempoteksti-kenttä muutettiin tavalliseksi HTML <select> -valikoksi.
- Ei lisätty omaa popupia.
- Ei lisätty uusia JavaScript-eventtejä.
- Tahtilajivalitsinta ei muutettu lainkaan.
- start-screen.js on täysin sama kuin 0.11.3:ssa.

Valikko:
- Ei tempotekstiä
- Hyvin hitaat
- Hitaat
- Kävelyvauhti ja keskitempo
- Nopeat
- Hyvin nopeat
- Tempon muutokset

Teknisesti:
- selectin id on edelleen tempoInput
- nykyinen start-screen.js lukee edelleen tempoInput.value.trim()
- valittu teksti kulkee samaa vanhaa reittiä:
  aloitusikkuna -> Score Model -> MusicXML <words> -> OSMD

Muu Pikakirjoitin on muuttumaton.
