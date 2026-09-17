Lentokone – GAME AUDIO ENGINE 1.1 INTEGROITU

Tämä versio perustuu Lentokone_HIIRI_GAMEPLAY_BASE_1_0:aan.
Hiiri- ja kosketusohjaus säilyvät aina rinnalla.

OHJAUSTAVAT

1) HIIRI
- Klikkaa/napauta ruudun yläpuoliskoa: KORKEA.
- Klikkaa/napauta ruudun alapuoliskoa: MATALA.
- Mikrofonia ei avata.

2) TARKKA SÄVEL · F0 ENGINE
- Valitse aloitusruudulla erikseen Ylös- ja Alas-sävel.
- Oletukset: G4 = KORKEA, A4 = MATALA.
- Aloita avaa mikrofonin, tekee taustakohinan kalibroinnin ja käynnistää pelin.
- GAME AUDIO ENGINE hyväksyy vain valitut kaksi säveltä.
- Hiiri/kosketus toimii samalla koko ajan varakontrollina.

3) JOUSTAVA ÄÄNI · PLANE ENGINE
- Valitse 1 sävel tai 2 säveltä.

Yksi sävel:
- Paina Opeta sävel.
- Mikrofoni avataan ja kalibroidaan.
- Puhalla sama sävel kolme kertaa, pienet tauot välissä.
- Pelissä jokainen uusi hyväksytty ääni antaa TOGGLE-komennon eli vaihtaa lentosuuntaa.

Kaksi säveltä:
- Paina Opeta sävel 1 ja puhalla se kolme kertaa.
- Paina Opeta sävel 2 ja puhalla se kolme kertaa.
- Sävel 1 = KORKEA.
- Sävel 2 = MATALA.

RAKENNE

app/js/audio-engine/f0-engine.js
app/js/audio-engine/plane-engine.js
app/js/audio-engine/plane-engine-adapter.js
app/js/audio-engine/game-audio-engine.js

Itse pelin fysiikkaa ei ole siirretty äänimoottoriin.
GAME AUDIO ENGINE kutsuu samoja setRoute()- ja toggleSingleSoundRoute()-toimintoja kuin pelin muut ohjaimet.

PWA
- Kaikki neljä GAME AUDIO ENGINE -tiedostoa ovat service workerin APP_SHELL-välimuistissa.
- Cache-versio: lentokone-game-audio-engine-1.1-integrated-1.0
