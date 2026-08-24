Pikakirjoitin 3 · BASE 0.10 · Peukalopalkin pisteet

Pohja:
- BASE 0.9.1 Explicit Multirest
- OSMD 2.1.2
- Score Model -> MusicXML -> OSMD
- OSMD autoBeam
- eksplisiittinen MusicXML multirest

Uutta peukalopalkissa:
- Tauko
- ● = yksi piste
- ●● = kaksi pistettä

Käyttö:
- pidä ● pohjassa ja tee koskettimella normaali aika-arvoele
- pidä ●● pohjassa ja tee koskettimella normaali aika-arvoele
- Tauko + ● toimii yhtä aikaa
- Tauko + ●● toimii yhtä aikaa

Esimerkkejä:
- ● + napautus = pisteellinen 1/4-nuotti
- ● + alas = pisteellinen 1/8-nuotti
- ●● + napautus = kaksipisteinen 1/4-nuotti
- Tauko + ● + alas = pisteellinen 1/8-tauko
- Tauko + ●● + oikealle = kaksipisteinen 1/16-tauko

Score Model:
- jokaisella note/rest-tapahtumalla on dots: 0, 1 tai 2

MusicXML:
- yksi piste -> <dot/>
- kaksi pistettä -> <dot/><dot/>
- OSMD piirtää pisteet, Pikakirjoitin ei piirrä niitä itse

DIVISIONS:
- muutettu 8 -> 32
- tämä mahdollistaa myös kaksipisteisen 1/32-arvon kokonaislukuna
- 1/32 = 4
- pisteellinen 1/32 = 6
- kaksipisteinen 1/32 = 7

Kokotahdin tauko / multirest:
- pisteetön pitkä + Tauko = edelleen oikea kokotahdin tauko
- peräkkäiset kokotahdin tauot muodostavat edelleen MusicXML multiple-rest -ryhmän
- pisteellinen pitkä tauko EI ole kokotahdin tauko
- 4/4:ssa yli tahdin meneviä pisteellisiä pitkiä arvoja ei vielä sidota automaattisesti yli tahtiviivan

OSMD:
- autoBeam = true
- autoGenerateMultipleRestMeasuresFromRestMeasures = false
- OSMD 2.1.2 -vendor-tiedostoa ei muutettu
