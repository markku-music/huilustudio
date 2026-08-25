Pikakirjoitin 3 · BASE 0.11.4 · Tempoteksti Y +5

Pohja:
- BASE 0.11.3 OSMD default + otsikko/säveltäjä

Muutos:
- tempotekstin MusicXML <words> -elementtiin lisätty relative-y="5"
- X-sijaintiin ei kosketa
- OSMD saa edelleen tehdä normaalin oletussijoittelunsa
- relative-y="5" nostaa tempotekstiä hieman OSMD:n oletuspaikasta

Esimerkki:
<words relative-y="5">Andante</words>

Muut toiminnot ovat ennallaan:
- OSMD drawingParameters: default
- drawTitle: true
- drawComposer: true
- autoBeam: true
- explicit multirest
- aloitusikkuna ja ääni
- koskettimisto alareunassa
- pisteflyout
- Score Model -> MusicXML -> OSMD 2.1.2
