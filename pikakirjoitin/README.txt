Pikakirjoitin 3 · BASE 0.9.1 · Explicit MusicXML Multirest

Pohja:
- Pikakirjoitin 3 BASE 0.9
- peukalopalkin Tauko
- kaikki kuusi aika-arvoelettä
- OSMD 2.1.2
- OSMD:n autoBeam

Korjaus:
OSMD:n automaattista multirest-arvausta ei enää käytetä.

Kun Score Modelissa on:
- 1 peräkkäinen kokotahdin tauko -> tavallinen kokotauko
- 2 peräkkäistä kokotahdin taukoa -> MusicXML: <multiple-rest>2</multiple-rest>
- 3 peräkkäistä kokotahdin taukoa -> MusicXML: <multiple-rest>3</multiple-rest>
- jne.

MusicXML-rakenne kirjoitetaan ryhmän ENSIMMÄISEN tahdin attributes-osaan:

<attributes>
  ...
  <measure-style>
    <multiple-rest>N</multiple-rest>
  </measure-style>
</attributes>

Jos multirest alkaa myöhemmästä tahdista, ensimmäiseen ryhmän tahtiin lisätään oma
attributes/measure-style-rakenne.

Tärkeää:
- kaikki alkuperäiset tahdit säilyvät MusicXML:ssä
- jokainen kokotahdin tauko on edelleen <rest measure="yes"/>
- Pikakirjoitin päättää vain, mitkä peräkkäiset kokotahdin tauot kuuluvat samaan ryhmään
- OSMD 2.1.2 piirtää varsinaisen multirestin
- autoGenerateMultipleRestMeasuresFromRestMeasures = false
- autoBeam = true säilyy

Tavoite:
Myös kappaleen alussa olevat 2, 3, 4... peräkkäiset kokotahdin tauot
muodostuvat yhdeksi multirestiksi ensimmäisestä tahdista lähtien.
