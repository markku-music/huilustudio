Pikakirjoitin 2 Core 0.4 — Audio esilämmitys

Muutos 0.3 -> 0.4:
- AudioContext + oscillator + gain rakennetaan valmiiksi sovelluksen käynnistyessä.
- Oscillator käynnistetään hiljaisena heti; iOS saa jättää AudioContextin suspended-tilaan.
- Ensimmäisen koskettimen pointerdown kutsuu AudioEngine.noteOn() ENNEN ScoreModel/OSMD-työtä.
- Ensimmäinen käyttäjäele tekee context.resume()-kutsun mahdollisimman aikaisin.
- Ensimmäisen nuotin gain avataan, kun context on running.
- Muu kirjoitus-, OSMD- ja scrollauslogiikka on ennallaan.
