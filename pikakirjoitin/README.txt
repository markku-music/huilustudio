Pikakirjoitin 3 · BASE 0.11.4 · Aloitusikkunan tempovalikko

Pohja:
- käyttäjän palauttama BASE 0.11.3 OSMD Oletus Otsikko Säveltäjä

Muutos:
Aloitusikkunan vapaa tempotekstikenttä on korvattu ryhmitellyllä tempovalikolla.

Käyttö:
- napauta Tempo-kenttää
- avautuu popup-valikko
- yläreunassa on hakukenttä
- listassa ovat kaikki OSMD 2.1.2:n tunnistamat tempo-/tempomuutos-tekstit,
  ryhmiteltynä kuuteen ryhmään
- napauttamalla vaihtoehtoa tempoteksti valitaan
- "Ei tempoa" tyhjentää valinnan

Ryhmät:
- Hyvin hitaat
- Hitaat
- Kävelyvauhti ja keskitempo
- Nopeat
- Hyvin nopeat
- Tempon muutokset

Tekninen toteutus:
- valinta tallennetaan edelleen tempoInput-arvoksi
- app.js ja MusicXML-logiikka pysyvät ennallaan
- Score Modeliin menee valittu tempoText
- MusicXML:ään kirjoitetaan edelleen <direction><words>...</words></direction>
- OSMD 2.1.2 piirtää tekstin kuten ennenkin

Muu toiminta säilyy ennallaan:
- aloitusikkuna
- ääni
- otsikko ja säveltäjä OSMD:n kautta
- sävellaji, tahtilaji, kohotahti, viritys ja avain
- pisteflyout
- kokotahdin tauot ja explicit multirestit
- koskettimisto alareunassa
- OSMD vendor muuttumattomana
