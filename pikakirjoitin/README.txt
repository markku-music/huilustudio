Pikakirjoitin 3 · BASE 0.11 · Aloitusikkuna + ääni

Pohja:
- BASE 0.10.1 Piste Flyout
- Score Model -> MusicXML -> OSMD 2.1.2
- Tauko, kokotahdin tauko, explicit multirest
- yksi piste + oikealle avautuva kahden pisteen flyout
- OSMD autoBeam

Uutta:
1. Pikakirjoitin 2 Core 0.22.7.8:n aloitusikkuna on tuotu Pikakirjoitin 3:een.
2. Pikakirjoitin 2 Core 0.22.7.8:n AudioEngine on tuotu Pikakirjoitin 3:een.
3. ALOITA-painike avaa AudioContextin ennen varsinaista käyttöä.
4. Kosketin soi heti pointerdownissa ja sammuu pointerupissa.
5. Taukoa kirjoitettaessa koskettimesta ei lähde ääntä.

AudioEngine, sama perusratkaisu kuin P2 Coressa:
- yksi jatkuva triangle-oskillaattori
- NOTE_GAIN 0.16
- attack 0.012 s
- release 0.06 s
- latencyHint: interactive

Aloitusikkunasta kytketty toimintaan:
- Nimi -> Score Model / MusicXML work-title
- Säveltäjä -> MusicXML creator
- Tempoteksti -> MusicXML direction/words
- Sävellaji -> Score Model key / MusicXML fifths
- Tahtilaji -> Score Model time / MusicXML time
- C -> MusicXML common time
- Cut C -> MusicXML cut time
- Kohotahti -> ensimmäisen tahdin pickup-kapasiteetti / implicit measure
- Viritys C, Bb, Eb, F -> äänen transponointi kuten P2 Coressa
- Nuottiavain -> G / C / F
- Nuottiavaimen mukaan koskettimiston aloituskohta
- Värimaailma -> aloitusikkunan P2 Core -teemalogiikka

Äänen transponointi kuten P2 Coressa:
- C: 0
- Bb: -2
- Eb: -9
- F: -7

Säilytetty muuttumattomana:
- OSMD 2.1.2 vendor-tiedosto
- pisteiden MusicXML-logiikka
- explicit multirest
- nykyinen peukalopalkin pisteflyout
- koskettimen aika-arvoeleet
