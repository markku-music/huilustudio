Pikakirjoitin 3 · BASE 0.11.1 · Tempoteksti korjattu

Pohja:
- BASE 0.11 Aloitusikkuna + ääni

Korjaus:
Jos aloitusikkunassa oli tempoteksti ja nuottikuva oli vielä täysin tyhjä,
OSMD 2.1.2:n ensimmäiseen tahtiin tuli direction/words ilman yhtään rytmistä
tapahtumaa. Tämä aiheutti aloituksen epäonnistumisen.

Korjaus on samaa periaatetta kuin toimivassa Pikakirjoitin 2 Coressa:
- tempoteksti pysyy MusicXML:n <direction><words>...</words></direction>-rakenteena
- jos ensimmäisessä tahdissa ei ole vielä yhtään nuottia/taukoa,
  lisätään vain XML:ään näkymätön print-object="no" -tauko
- näkymätön tauko ei piirry nuottiin
- heti kun ensimmäinen oikea tapahtuma kirjoitetaan, näkymätöntä täyttötaukoa
  ei enää tarvita eikä generoida

Muut 0.11:n toiminnot säilyvät:
- P2 Core -aloitusikkuna
- AudioEngine
- nimi, säveltäjä, tempo, sävellaji, tahtilaji, kohotahti, viritys ja avain
- pisteflyout
- tauot, kokotahdin tauot ja explicit multirest
- OSMD autoBeam
- OSMD 2.1.2 vendor muuttumaton
