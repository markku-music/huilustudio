Ääninäyte DEV 0.3.46 – VIRITYSMITTARI

Muutos 0.3.45 -> 0.3.46:
- Lisätty oma viritysmittarikortti nuottikortin alle.
- Mittari käyttää suoraan nykyisen live-YIN-analyysin f0-arvoa; uutta mikrofonianalyysiä ei ajeta.
- Asteikko −50…+50 cent, keskialue ±5 cent = VIREESSÄ.
- Neula liikkuu pehmeästi; hiljaisuudessa se palaa keskelle ja himmenee.
- Näyttää lisäksi centtiluvun sekä MATALA / VIREESSÄ / KORKEA -palautteen.
- Viritysreferenssi on nykyisen freqToNote-logiikan mukainen A4 = 440 Hz.
- Äänimoottori, YIN, H1–H8, näytteenotto, transponointi ja OSMD-logiikka säilyvät ennallaan.

Ääninäyte DEV 0.3.45 – WEBP INSTRUMENTIT

Muutos 0.3.44 -> 0.3.45:
- Poistettu kehityksen aikainen dom_dump.html paketista.
- Kaikki 10 instruments-kansion PNG-kuvaa muunnettu häviöttömiksi WebP-kuviksi.
- Kuvien mitat, RGBA-pikselit ja läpinäkyvyys säilyvät identtisinä dekoodattuna.
- index.html ja service worker viittaavat WebP-kuviin.
- PWA-cache päivitetty 0.3.45-versioon.
- Äänianalyysi, tallennus, transponointi, OSMD ja UI-logiikka muuttumattomat 0.3.44:stä.

Ääninäyte DEV 0.3.44 – ENHARMONINEN PREFERENSSI

Muutos 0.3.43 -> 0.3.44:
- Lisätty pieni soitinkohtainen gis/as-preferenssi.
- Huilu ja alttosaksofoni näyttävät kyseisen sävelkorkeuden oletuksena muodossa gis.
- Klarinetti, oboe, fagotti, trumpetti, alttotorvi, käyrätorvi, pasuuna ja tuuba näyttävät sen oletuksena muodossa as.
- Preferenssi koskee vain gis/as-paria; muu diatoninen transponointi ja enharmoninen kirjoitusasu säilyvät ennallaan.
- Sama kirjoitusasu menee sekä tekstinäyttöön että OSMD-nuottiin.
- Äänianalyysi, YIN, H1–H8, kalibrointi ja näytteenoton tilakone ovat muuttumattomat 0.3.43:sta.

Ääninäyte DEV 0.3.43 – LIVE ANALYYSI

Muutos 0.3.42 -> 0.3.43:
- Live-analyysi on jatkuvasti aktiivinen mikrofonin ollessa käytössä.
- Sävelnimi, Hz, H1–H8 ja OSMD päivittyvät riippumatta näytteenoton tilasta.
- ALOITA NÄYTE aktivoi vain seuraavan kelvollisen äänen tallennuksen.
- Live-analyysi ja tallennus on erotettu omiin funktioihinsa (analyzeLiveFrame / handleCaptureFrame).
- YIN-, H1–H8-, transponointi-, kalibrointi- ja OSMD-algoritmeja ei muutettu.
