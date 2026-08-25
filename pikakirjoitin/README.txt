Pikakirjoitin 3 · BASE 0.16.1 · Landscape-rivinvaihtomerkit kohdistettu

Pohja:
- BASE 0.16.0 Rivien muokkaus

Korjattu:
- ↵-rivinvaihtomerkit olivat portraitissa oikein mutta landscapessa
  väärissä x-kohdissa.

Syy:
- 0.16.0 muutti OSMD:n sisäisiä nuottikoordinaatteja ruutukoordinaateiksi
  laskennallisella zoom + SVG -skaalauskaavalla.
- landscape-tilassa OSMD:n zoomattu SVG voi saada vielä oman todellisen
  DOM-skaalansa, joten laskennallinen x-koordinaatti ei aina vastannut
  näkyvää tahtiviivaa.

Uusi ratkaisu:
- näkyvien viivastojen paikat tunnistetaan suoraan renderöidyn SVG:n
  getBoundingClientRect()-geometriasta
- käytössä on sama geometrinen viivastotunnistusperiaate kuin toimivassa
  nuottien valinnassa
- kunkin tahdin suhteellinen paikka otetaan VexFlow-staven x/width-arvoista
- suhteellinen paikka muunnetaan suoraan näkyvän viivaston todelliseen
  DOM-leveyteen

Tämän ansiosta:
- ↵ kohdistuu samaan tahtiviivaan portraitissa ja landscapessa
- OSMD Zoom, CSS-skaala ja iPadin orientaation vaihto eivät enää tarvitse
  erillistä x-korjauskerrointa
- myös viimeisen rivin ↔-kahva käyttää samaa korjattua rivigeometriaa

Muu BASE 0.16.0:n toiminta on jätetty ennalleen.
