Pikakirjoitin 2 Core 0.19 – Sidekaari

Lisätty vasemman reunan peukalopalkki, jossa on aluksi pisteellinen ja tauko.
Painikkeet toimivat momentary-modifioijina: toiminto on aktiivinen vain niin kauan kuin nappia pidetään pohjassa.
Samaa pohjassa olevaa nappia voi vetää pystysuunnassa, jolloin koko palkki siirtyy; paikka tallentuu selaimen localStorageen.
Piste toimii myös 1/32-ajalla: MusicXML-divisions on nostettu 16:een, mutta Pikakirjoittimen sisäinen rytmiasteikko on säilytetty ennallaan.
Tauko käyttää koskettimiston normaalia aika-arvoelettä, mutta ei soita ääntä.

0.19: Peukalopalkkiin lisätty vanhan Pikakirjoittimen kertakäyttöinen sidekaari. Napauta sidekaari aktiiviseksi; seuraava saman sävelen nuotti sidotaan edelliseen ja tila sammuu. Tauko/eri sävel kuluttaa tilan ilman sidettä. Sidekaaripainikkeesta voi edelleen siirtää palkkia pystysuunnassa vetämällä.

0.20: Kokotauko palautettu tahditauoksi (measure rest). Useat perakkaiset kokotauot muodostavat kukin oman tahdin vakaasti.
