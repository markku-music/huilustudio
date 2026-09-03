LEO LENTÄJÄ – 3.71 CLEAN + OPTIMIZED

Tämä versio perustuu 3.70-versioon. Pelin toimivaa tunnistus-, lento-, sää-, ääni- ja pelilogiikkaa ei ole tarkoituksellisesti muutettu.

Siivous ja optimointi:
- poistettu käyttämättömät vanhat PNG-lentokoneet, plane_realistic.webp ja test_storm.html
- poistettu käyttämättömät JavaScript-viittaukset ja vanha commandFlash-elementti
- poistettu käytöstä jäänyt vaakasuuntainen turbulenssitila; koneen sääliike on edelleen vain pystysuuntainen
- staattiset pilvielementit välimuistitetaan kerran DOM-haun sijaan
- 16 ms analyysipolun live-näytön DOM-viittaukset välimuistitetaan
- YIN-tunnistuksen työbufferit käytetään uudelleen, jolloin jokaisella analyysikierroksella ei luoda uusia Float32Array-taulukoita
- usein käytetty documentElement.style on välimuistissa
- poistettu käyttämätön weather-rain-luokkaviittaus

Nykyiset oletukset säilyvät, mukaan lukien:
- äänikynnys -70 dB
- minimipituus 0 ms
- analyysiväli 16 ms
- JSON-oletusasetusten lataaminen käynnistyksessä
- Pause
- iPad/Web Audio -poksahdukset ja ukkoset
