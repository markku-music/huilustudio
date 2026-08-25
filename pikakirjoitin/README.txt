Pikakirjoitin 3 · BASE 0.12 · Automaattinen tie yli tahtiviivan

Pohja:
- BASE 0.11.4 Ryhmitelty tempovalikko

Nuotti yli tahtiviivan:
- Score Modelissa käyttäjän nuotti säilyy yhtenä tapahtumana
- MusicXML-generaattori pilkkoo sen vain renderöintiä varten
- ensimmäinen pala saa tie-startin
- viimeinen pala saa tie-stopin
- useamman tahtiviivan ylityksessä keskimmäinen pala saa stop + start
- OSMD 2.1.2 piirtää sidekaaren

Tauko yli tahtiviivan:
- tauko pilkotaan oikeisiin tahtiin
- taukojen väliin ei tehdä sidekaarta

Kokotahdin tauko:
- pitkä painallus + Tauko säilyttää nykyisen erityistoiminnan
- explicit multirest säilyy

Rajatapaukset:
- generaattori hajottaa tarvittaessa tahtiviivan palan useammaksi
  nuottiarvoksi
- vain aivan tarkassa rajatapauksessa voidaan käyttää sisäisesti
  1/64- tai 1/128-palaa
- käyttäjän koskettimistoon ei lisätty uusia aika-arvoja

Muu toiminta on 0.11.4:stä ennallaan.
OSMD vendor on muuttumaton.
