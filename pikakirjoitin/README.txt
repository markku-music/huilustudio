Pikakirjoitin 3 · BASE 0.11.3 · OSMD oletus + otsikko/säveltäjä

Pohja:
- BASE 0.11.2 Koskettimisto alareunassa

Muutos rendererissä:
- drawingParameters: "compacttight" -> "default"
- drawTitle: true
- drawComposer: true

Tämän jälkeen OSMD käyttää normaalia default-piirto-/kaiverruspresettiään.
Otsikko ja säveltäjä tulevat edelleen MusicXML:stä, ja OSMD piirtää ne.

Pikakirjoittimen toiminnalliset poikkeukset OSMD:n puhtaista oletuksista
säilytetään tarkoituksella:
- autoBeam: true
  Pikakirjoitin käyttää OSMD:n automaattista palkitusta.
  OSMD 2.1.2:n puhdas oletus tälle olisi false.
- autoGenerateMultipleRestMeasuresFromRestMeasures: false
  Pikakirjoitin muodostaa multirestit eksplisiittisesti MusicXML:ään.
  OSMD 2.1.2:n puhdas oletus tälle olisi true.

Lisäksi:
- autoResize: true
- backend: "svg"

Muut toiminnot ovat 0.11.2:sta ennallaan:
- P2 Core -aloitusikkuna
- ääni
- tempoteksti OSMD:n kautta
- nimi ja säveltäjä MusicXML:ssä
- sävellaji, tahtilaji, kohotahti, viritys ja avain
- pisteflyout
- tauot ja explicit multirestit
- koskettimisto alareunassa
- Score Model -> MusicXML -> OSMD 2.1.2
