HENGITYSAPPI – VAAKA + METRONOMI 0.6 OUTPUT TIMESTAMP

Metronomin ääni ja visuaalinen pulssi käyttävät nyt samaa audiokelloa ilman
käsin arvattua millisekuntikorjausta.

Toteutus:
- WAV puretaan Web Audio API:n AudioBufferiksi.
- Jokainen isku ajastetaan AudioContext-ajassa.
- WAV alkaa jokaisella iskulla sample 0:sta.
- Visuaalijono säilyttää saman AudioContext-iskuajan.
- Jokaisella requestAnimationFrame-kierroksella audioaika muunnetaan
  performance-aikaan AudioContext.getOutputTimestamp()-tiedolla.
- Näin selain itse kertoo AudioContext- ja käyttöliittymäkellojen suhteen.
- Ei 35 ms, 20 ms tms. käsin asetettua synkkakorjausta.
- Jos getOutputTimestamp() ei ole selaimessa käytettävissä, fallback käyttää
  suoraan AudioContext.currentTime/performance.now()-suhdetta ilman arvausta.
- Näytön päivitys voi luonnollisesti osua lähimmälle 60/120 Hz ruudulle.

Metronomi:
- 40–180 BPM
- oletus 75 BPM

Avaa index.html selaimessa.
