Pikakirjoitin 3 0.17.6.33 - iPad tulostaa PDF:n kautta

VERSION 0.17.6.19 — varren suunta ja slurin sijoitus

Uutta tässä versiossa:
- Kelluvaan nuottivalinnan palkkiin lisätty varren suunnan valitsin.
- Varren suunta: Auto / ylös / alas.
- Toimii yhdelle tai usealle valitulle nuotille, joilla on varsi.
- Kelluvaan palkkiin lisätty slurin sijoituksen valitsin.
- Slurin sijoitus: Auto / yllä / alla.
- Slurin suunta on käytettävissä, kun valinta osoittaa yksiselitteisesti yhteen sluriin.
- Yhden nuotin valinnalla suuntaa voi muuttaa, jos nuotin kohdalla on täsmälleen yksi slur.
- Usean nuotin valinnalla suuntaa voi muuttaa, kun valinnan ensimmäisen ja viimeisen nuotin välillä on täsmälleen kyseinen slur.
- MusicXML kirjoittaa pakotetun varren <stem>up/down</stem>-elementtinä.
- MusicXML kirjoittaa pakotetun slurin suunnan placement="above/below" -attribuuttina.
- Auto-tilassa näitä pakotuksia ei kirjoiteta, joten OSMD päättää suunnan normaalisti.
- Undo/redo ja projektitallennus säilyttävät asetukset.

Pohja: 0.17.6.17 Editointitila sulkeutuu nuottisivulta.
Kaikki aiemmat palkitus-, tahtiviiva-, rivinvaihto-, scroll-valinta- ja viimeisen rivin venytystoiminnot on säilytetty.

0.17.6.19: Varren suunta ja slurin sijoitus kiertävät yhdellä painikkeella ilman avautuvia lisäpainikkeita.


0.17.6.20
- Print preview käyttää ruudulla valmiiksi renderöidystä OSMD-SVG:stä tehtyä A4-snapshotia.
- Print previewn nuottigeometria vastaa PDF-tallennusta.
- ResizeObserver ei rerenderöi OSMD:tä print previewn aikana.
- Muu appi poistetaan print-layoutista display:none-menetelmällä, jotta tyhjää lisäsivua ei synny.


0.17.6.21
- Tallenna PDF avaa kosketuslaitteella ensisijaisesti natiivin jakovalikon, kun Web Share -tiedostojako on tuettu.
- Mac/desktop säilyttää tavallisen PDF-latauksen.
- Jos tiedoston jako ei ole tuettu, käytetään automaattisesti vanhaa latauspolkua.


0.17.6.22
- Lisätty Nuottiteline-painike oikean reunan pikatoimintoihin.
- Nuottitelineessä kaikki muu käyttöliittymä piilotetaan ja sama valmis A4-sivu skaalataan kokonaisena viewportiin.
- Paperin reunus, varjo ja taustakontrasti poistuvat, joten näkymässä näkyy vain nuotti valkoisella taustalla.
- Nuotin layout-leveyttä ei muuteta eikä OSMD:tä renderöidä telineeseen siirryttäessä uudelleen.
- Nuottitelineestä poistutaan napauttamalla nuottisivua tai Esc-näppäimellä.
- Nuottivalinta ja muut muokkaustilat ovat telineessä pois käytöstä.


0.17.6.25
- Valittu yksittäinen nuotti voidaan muokata suoraan koskettimiston sävel- ja aika-arvoeleillä.
- Valinta pysyy päällä muokkauksen jälkeen.

0.17.6.26: 50 viimeisimmän listasta avatun projektin jalkeen koskettimiston
pointer/touch-tila nollataan vasta projektimodaalin sulkeuduttua. Tavoite on
estaa iPad/Safarin tilanne, jossa pystysuuntaiset ylos/alas-eleet lakkaavat
toimimasta projektin avaamisen jalkeen.


0.17.6.27: 50-listasta avatessa iPad/Safarin kosketinalue aseistetaan uudelleen auto->none -touch-action -vaihdolla kahden animation framen yli. Keyboard-panel estaa natiivin pan-eleen.

0.17.6.28 – tallennetun projektin ID-laskurit
- Projektia avatessa note/rest-, slur- ja tie-ID-laskurit synkronoidaan olemassa oleviin tunnuksiin.
- Uusi nuotti ei voi saada samaa ID:tä kuin avatun kappaleen vanha nuotti.
- Korjaa tilanteen, jossa ylös/alas-eleen aika-arvomuutos osui väärään vanhaan nuottiin heti 50-listasta avaamisen jälkeen.


0.17.6.29
- iPad/Safari: print-snapshot mitataan vasta kun Nuottitelineen transformit on varmasti nollattu.
- Pakotetaan normaali layout ja odotetaan kaksi requestAnimationFrame-kierrosta ennen snapshotin mittausta.
- OSMD:tä ei renderöidä uudelleen tulostusta varten.


0.17.6.33
- iPad- ja Android/Galaxy-tableteilla Tallenna PDF ja Tulosta yhdistetty yhdeksi PDF / Tulosta -painikkeeksi.
- Yhteinen painike muodostaa saman A4-PDF:n ja avaa käyttöjärjestelmän jakovalikon.
- Desktop/Macissa Tallenna PDF ja Tulosta säilyvät erillisinä.


0.17.6.33: Tabletilla vain yksi kompakti PDF-painike. Erillinen Tulosta-painike piilotetaan display:none !important -luokalla, koska pelkkä hidden-attribuutti saattoi yliajautua .keyboard-tool-buttonin display:grid-säännöllä.


0.17.6.34
- Koskettimelta kirjoitetut sävelet nimetään automaattisesti valitun sävellajin mukaan.
- Alennusmerkkisissä sävellajeissa kromaattiset mustat koskettimet suosivat bemolleja, muissa ylennyksiä.
- Sävellajin diatoninen kirjoitusasu huomioidaan myös enharmonisesti (esim. Ges-duurin Cb).
- Jos edellisessä tahdissa on ollut sävellajiin kuulumaton muunnesävel, seuraavan tahdin ensimmäiseen vastaavaan sävellajin mukaiseen säveleen lisätään muistutusetumerkki.
- Sidotun nuotin jatkoon yli tahtiviivan ei lisätä muistutusetumerkkiä.
- Nuottikuvan uusi oletuskoko on 95 %.


0.17.6.36
- Kappaleen tiedot -painike yläpalkissa avaa aloitusikkunan uudelleen.
- Nykyiset tiedot esitäytetään ja Tallenna päivittää olemassa olevan kappaleen nollaamatta nuotteja.
- Editointi-ikkunan voi sulkea ×-painikkeesta tai Escillä.


0.17.6.37 Dorico-välistyskoe
-----------------------------
- Vaakasuuntainen rytminen välistys käyttää nyt Doricon kaltaista neliöjuurikäyrää.
- Neljäsosan ihanneväli 4.00 viivastoväliä, kahdeksasosan 2.83, 16-osan 2.00.
- 32-osista alaspäin ihanneväli ei mene alle 1.60 viivastovälin.
- VexFlow'n oma törmäyksiä estävä minimigeometria säilyy pohjalla.
- Muutos on rajattu renderer.js:ään; OSMD-vendor-tiedostoa ei ole muutettu.

0.17.6.37 Dorico-välistyskoe + Swipe yksi valinta
--------------------------------------------------
- Nuottiviivaston vaakaswipe käyttää nyt yhtä yhtenäistä X-aluevalintaa.
- Swipe voidaan aloittaa mistä tahansa saman viivaston alueelta; nuotinpään osumaa ei tarvita.
- Valintaan tulevat kaikki nuottitapahtumat, joiden vaakakeskipiste osuu vedon alku- ja loppukohdan väliin.
- Nuotin päältä ja tyhjästä viivastokohdasta aloitettu swipe muodostavat nyt täsmälleen saman valintajoukon.
- Kelluva nuottityökalupalkki, mukaan lukien palkitustyökalu, saa valinnan aina samasta selectedIds-joukosta.
- Yksittäisen nuotin napautusvalinta ja kahden tapahtuman jälkeen aktivoituva swipe-lukitus säilyvät ennallaan.
- Dorico-välistyskoe ja muu nuotinnuslogiikka on jätetty ennalleen.

0.17.6.38 Taukokoskettimisto:
- Peukalopakin Tauko-painikkeen pohjassa pitäminen vaihtaa pianokoskettimiston kuuden taukoarvon näppäimistöksi (1/1...1/32).
- Taukonäppäimen napautus kirjoittaa tavallisen tauon.
- Swaippi ylös samalla taukonäppäimellä tekee pisteellisen version samasta tauosta.
- Pianokoskettimiston nykyiseen nuottielelogiikkaan ei muutettu mitään.

0.17.6.39 Taukokoskettimiston rajaus:
- Taukokoskettimiston absoluuttinen kerros ankkuroidaan nyt keyboard-viewportiin, eli täsmälleen pianokoskettimiston alueelle.
- Taukonäppäimistö ei enää voi levitä nuottisivun päälle.
- Taukojen napautus- ja ylös-swaippi-logiikka sekä pianokoskettimiston nuottieleet jätettiin ennalleen.


0.17.6.40 Taukokoskettimisto 3 riviä:
- Taukonäppäimissä näkyvät vain taukosymbolit, ei aika-arvotekstejä.
- Alarivi: tavalliset tauot.
- Keskirivi: pisteelliset tauot.
- Ylärivi: kaksipisteelliset tauot.
- Koko- ja puolitauossa on lyhyt viivaston viiva, jotta symbolit erottuvat varmasti.
- Taukojen swipe-ele poistettu; pisteellisyys valitaan suoraan omasta näppäimestä.

0.17.6.41: Taukokoskettimisto rauhoitettu kuuteen perustaukoon. Napautus kirjoittaa tavallisen tauon ja ylös-swaippi pisteellisen. Kaksipisteelliset poistettu taukokoskettimistosta.


0.17.6.43: Taukomoodista poistuminen palauttaa pianokoskettimiston täsmälleen samaan vaakakohtaan, jossa se oli ennen taukonapin painamista.

0.17.6.44: Taukomoodi ei enää piilota pianoa layoutista; taukokoskettimisto peittää vain viewportin, jotta koskettimiston vaakasijainti säilyy.
