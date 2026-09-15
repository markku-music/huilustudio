# F0 ENGINE BASE 2.0 · PROFILE FAST 1

KOKEILUHAARA. BASE 2.0 pysyy koskemattomana.

## Mitä muuttui

YIN, 75–1300 Hz -alue, 6 raakaa F0-arvoa ja niiden mediaani sekä alkuperäinen TRANSITION 1 -portti ovat ennallaan.

Lisättiin vapaaehtoinen peliprofiili. Profiili voi nimetä pelissä sallitut MIDI-sävelet. PROFILE FAST 1 tarkkailee raakaa YIN-F0:aa vain transition-vaiheessa / transitionin avaamiseksi:

1. raw F0 osuu profiilissa sallittuun UUTEEN säveleen
2. poikkeama sävelen keskuksesta on enintään ±30 cent
3. sama sallittu sävel toteutuu 2 peräkkäisessä framessa
4. uusi sävel hyväksytään heti

Jos nämä ehdot eivät täyty, mitään ei pakoteta. Normaali BASE 2.0 TRANSITION -logiikka hoitaa vaihdon kuten ennenkin.

## Tiedostot

- `f0-engine.js` = BASE 2.0 + PROFILE FAST 1
- `profiles.js` = esimerkkiprofiilit
- `index.html` = testinäkymä
- `example.js` = BASE-esimerkki

## Esimerkkiprofiili

```js
F0_PROFILES.fluteBeginner5 = {
  name: 'Huilu · g¹ a¹ h¹ c² d²',
  minHz: 350,
  maxHz: 650,
  allowedMidi: [67, 69, 71, 72, 74],
  fastAccept: {
    enabled: true,
    frames: 2,
    toleranceCents: 30
  }
}
```

Profiili voidaan antaa konstruktorissa:

```js
const engine = new F0Engine({ profile: F0_PROFILES.fluteBeginner5 });
```

tai vaihtaa myöhemmin:

```js
engine.setProfile(F0_PROFILES.fluteBeginner5);
engine.setProfile(null); // PROFILE FAST pois, normaali BASE 2.0
```

## Uudet tapahtumat

- `profilecandidate`
- `profilefastaccept`
- `profilechange`

Tarkoitus on mitata käytännössä, lyheneekö legaton reagointiviive ilman uusia välisävel- tai oktaavivirheitä.
