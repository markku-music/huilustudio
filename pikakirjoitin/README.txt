Pikakirjoitin 3 · BASE 0.9 · Peukalopalkki + Tauko

Pohja:
- Pikakirjoitin 3 BASE 0.8
- OSMD 2.1.2
- OSMD:n automaattipalkitus
- täydet aika-arvoeleet

Uutta:
- Pikakirjoitin 2:n peukalopalkin mukainen vasemman reunan palkki
- tässä BASE-vaiheessa palkissa on vain Tauko
- Tauko on momentaarinen modifioija: pidä sitä pohjassa toisella sormella
- koskettimen ele määrää edelleen aika-arvon
- samaa taukonappia voi vetää pystysuunnassa peukalopalkin siirtämiseksi
- palkin pystysijainti tallennetaan localStorageen

Yhdistelmät:
- Tauko + napautus = 1/4-tauko
- Tauko + alas = 1/8-tauko
- Tauko + ylös = 1/2-tauko
- Tauko + oikealle = 1/16-tauko
- Tauko + vasemmalle = 1/32-tauko
- Tauko + pitkä painallus = kokotahdin tauko

OSMD-yhteistyö:
- tavallinen tauko kirjoitetaan MusicXML:ään <rest/>
- kokotahdin tauko kirjoitetaan <rest measure="yes"/>
- kokotahdin tauon kesto tulee tahtilajin todellisesta kapasiteetista
- OSMD piirtää taukosymbolit
- OSMD:n autoBeam pysyy käytössä
- autoGenerateMultipleRestMeasuresFromRestMeasures on kytketty päälle,
  jotta peräkkäiset kokotahdin tauot ovat valmiiksi OSMD-yhteensopivia

Ei vielä:
- piste/pisteet
- muut peukalopalkin napit
- undo/redo
- äänimoottori
