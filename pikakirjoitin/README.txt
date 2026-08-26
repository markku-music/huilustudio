Pikakirjoitin 3 BASE 0.17.3 · FI / EN · H / B

Pohja:
Pikakirjoitin_3_BASE_0.17.2_Oikea_Tyokalupalkki

Tässä versiossa:
- FI / EN -kielivalinta aloitusikkunassa.
- Sama FI / EN -valinta myös pääikkunan yläreunassa, joten kielen voi vaihtaa kesken työskentelyn.
- Valittu kieli muistetaan localStoragessa.
- Ensimmäisellä käyttökerralla suomenkielinen selain valitsee suomen, muut englannin.
- Suomenkielinen nimi: Pikakirjoitin 3.
- Englanninkielinen nimi: SwipeScore.
- Tavalliset käyttöliittymätekstit, työkalujen aria-labelit/tooltipit, aloitusikkuna, tempo-ryhmät ja väriteemojen nimet vaihtuvat kielen mukana.
- Sävellajit vaihtuvat suomalaisen ja englanninkielisen nimeämisen välillä.
  Esim. FI: H-duuri / B-duuri / h-molli / b-molli.
        EN: B major / B-flat major / B minor / B-flat minor.
- Kvinttiympyrän nimet vaihtuvat vastaavasti.
- Koskettimiston valkoisen B/H-sävelen nimi vaihtuu:
  FI = H, EN = B.
- Sisäinen Score Model ja MusicXML käyttävät edelleen samaa sävelkorkeusdataa. Kielenvaihto ei muuta musiikkia.
- Oikean reunan työkalupalkki (refresh, Undo, Redo, Save, PDF, Print) säilyy.

Tekninen rakenne:
- uusi js/i18n.js hoitaa käyttöliittymän kielitilan ja käännökset.
- kielivalinta tallennetaan avaimella pikakirjoitin3.language.
- DEMO/lisenssivesileimaa ei ole tässä versiossa eikä sitä pidä myöhemmin sijoittaa tavalliseen i18n-kielitiedostoon.

Muuttamattomina 0.17.2:sta säilyivät mm.:
score-model.js, musicxml.js, renderer.js, audio-engine.js, score-selection.js,
thumb-rail.js, OSMD 2.1.2 sekä tie/slur-assetit.


BASE 0.17.5 · Artikulaatiot
- Aloitusikkunan UUSI NUOTTI / AVAA PROJEKTI -yläpainikkeet poistettu.
- ALOITA on suoraan uuden nuotin käynnistys.
- Aloitusikkunan alaosassa Avaa projekti -pudotuslista.
- Lista sisältää enintään 50 viimeisintä paikallisesti tallennettua projektia.
- Jokaisen recent-projektin voi poistaa erikseen ×-painikkeella.
- Listan lopussa Avaa tiedostosta… vanhojen .pikakirjoitin.json-tiedostojen avaamista varten.
- Oikean reunan Save tallentaa projektin appin omaan Recent-varastoon (IndexedDB, localStorage fallback), ei enää lataa projektitiedostoa automaattisesti.
- Saman projektin uudelleentallennus päivittää samaa recent-riviä ja siirtää sen uusimmaksi.
- 51. eri projekti pudottaa vanhimman pois automaattisesti.
- Tiedostosta avattu projekti lisätään automaattisesti Recent-listaan.
- FI/EN-kielituki säilyy.


BASE 0.17.5 · ARTIKULAATIOT
- Kelluvaan valintapalkkiin lisätty Accent (>), Staccato (•), Marcato (^) ja Tenuto (—).
- Artikulaatioita voi lisätä tai poistaa yhdeltä tai usealta valitulta nuotilta.
- Jos valinnassa on taukoja, artikulaatio kohdistuu valinnan nuotteihin; tauot ohitetaan.
- Aktiivinen artikulaatio näkyy sinisenä painikkeena, kun se on kaikilla valituilla nuoteilla.
- MusicXML: accent, staccato, strong-accent (marcato) ja tenuto välitetään OSMD 2.1.2:lle.
- Tahdin yli jakautuvan sidotun nuotin artikulaatio annetaan vain ensimmäiselle renderöidylle osalle.
- Undo/Redo käsittelee artikulaatiomuutoksen yhtenä askeleena.


0.17.5.1: PDF-tallennuksen tiedostonimi tulee nyt kappaleen otsikosta (score.metadata.title / settings.title). Otsikko siistitään tiedostonimeksi kuten ennenkin.
