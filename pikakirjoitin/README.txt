Pikakirjoitin 2 Core 0.22.1 – Yhden nuotin editointi

Pikakirjoitin 2 Core 0.19 – Sidekaari

Lisätty vasemman reunan peukalopalkki, jossa on aluksi pisteellinen ja tauko.
Painikkeet toimivat momentary-modifioijina: toiminto on aktiivinen vain niin kauan kuin nappia pidetään pohjassa.
Samaa pohjassa olevaa nappia voi vetää pystysuunnassa, jolloin koko palkki siirtyy; paikka tallentuu selaimen localStorageen.
Piste toimii myös 1/32-ajalla: MusicXML-divisions on nostettu 16:een, mutta Pikakirjoittimen sisäinen rytmiasteikko on säilytetty ennallaan.
Tauko käyttää koskettimiston normaalia aika-arvoelettä, mutta ei soita ääntä.

0.19: Peukalopalkkiin lisätty vanhan Pikakirjoittimen kertakäyttöinen sidekaari. Napauta sidekaari aktiiviseksi; seuraava saman sävelen nuotti sidotaan edelliseen ja tila sammuu. Tauko/eri sävel kuluttaa tilan ilman sidettä. Sidekaaripainikkeesta voi edelleen siirtää palkkia pystysuunnassa vetämällä.

0.20: Kokotauko palautettu tahditauoksi (measure rest). Useat perakkaiset kokotauot muodostavat kukin oman tahdin vakaasti.

0.21: Sävellajin mukainen enharmoninen kirjoitusasu.
Alennusmerkkisissä sävellajeissa mustat koskettimet kirjoitetaan alennuksina,
ylennysmerkkisissä ylennyksinä. Mollin korotettu johtosävel käsitellään erikseen.

0.22: Tauko + koskettimen pitkä painallus luo aina täyden tahdin kokotauon. Peräkkäiset kokotauot muodostavat eksplisiittisen MusicXML-multirestin (2, 3, 4...), ja OSMD:n oma automaattinen multirest-arvaus on pois käytöstä.

0.22.1: Yhden nuotin valinta avaa kompaktin enharmonia+roskis-palkin. Valitun nuotin kosketinele muuttaa yhtä aikaa sävelkorkeuden (kosketin) ja aika-arvon (ele).

0.22.2: Yhden nuotin enharmonisen vaihdon painike käyttää käyttäjän toimittamaa assets/Enharmoninen.svg-kuvaketta. Toimintalogiikka ennallaan.


0.22.3: Enharmonisen vaihdon nappi piilotetaan kokonaan, jos valitulla nuotilla ei ole enharmonista vaihtoehtoa.


0.22.4: Yhden nuotin työkalupalkki säilyy näkyvissä koskettimella tehdyn korkeus-/aika-arvomuutoksen ja OSMD-uudelleenrenderöinnin yli.


0.22.6: Koskettimella tehtävän nuottieditoinnin aikana sama looginen nuotti pidetään valittuna renderöintien yli, mutta kun kosketinele päättyy, valinta puretaan automaattisesti. Työkalupalkki ja valintakohdistin katoavat ja koskettimisto palaa uuden nuotin kirjoitustilaan.


0.22.7: Enharmoninen nappi piilotetaan, kun valitun nuotin nykyinen kirjoitusasu on sävellajin normaali diatoninen asu (esim. Es Es-duurissa, Fis D-duurissa). Poikkeava enharmoninen kirjoitusasu voi edelleen näyttää napin.

0.22.7.3: Valitun nuotin kosketineditointi huomioi peukalopalkin piste- ja taukomodifikaattorit. Piste + ele tekee pisteellisen aika-arvon; Tauko + ele muuttaa valitun nuotin tauoksi; Piste + Tauko toimii yhdessä. Tauko + pitkä painallus ilman pistettä säilyttää kokotahdin tauko / multirest -logiikan. Valinta poistuu kosketineleen valmistuttua kuten 0.22.7:ssa.

0.22.7.4: Nuottialueen vaakavalinta lukitaan saman kosketuseleen ajaksi heti, kun valinnassa on vähintään kaksi loogista tapahtumaa. Tämän jälkeen iPad/Safarin pystyscrollaus ei saa ottaa elettä haltuun, vaikka sormi karkaisi alaviistoon tai viivaston ulkopuolelle. Yhden tapahtuman/pending-vaiheen normaali pystyscrollaus säilyy ennallaan.

0.22.7.5: Portrait määrittää OSMD:n nuottikoon. Landscape käyttää portrait-sisältöleveyteen suhteutettua zoomia. OSMD autoResize poistettu; sovelluksen ResizeObserver hoitaa orientaation vaihdon.

0.22.7.6: Oikeaan reunaan lisätty pystysuuntainen OSMD-rivivälisäädin. Se säätää EngravingRules.MinimumDistanceBetweenSystems-arvoa välillä 5.0–15.0 staff spacea, askel 0.5, oletus 9.0. Ylös = väljempi, alas = tiiviimpi. Arvo näkyy vedon aikana ja tallentuu localStorageen. Muutos renderöidään reaaliaikaisesti.

0.22.7.7: Oikean reunan rivivälisäädin tehty kaksinkertaisen korkeaksi. Suunta käännetty: ylös = tiiviimpi riviväli, alas = väljempi. Myös nuolinäppäinten suunta vastaa tätä logiikkaa.

0.22.7.8: Rivivälisäätimen alapuolinen turha ikoni-/paneelialue poistettu kokonaan. Paneeli on nyt vain varsinaisen pystykiskon korkuinen. Riviväliarvon localStorage-tallennus säilyy ennallaan.

0.22.7.9: Rivivälisäätimen arvoa ei enää tallenneta localStorageen. Jokainen uusi sivun lataus/käynnistys alkaa aina oletusarvosta 9.0 staff spacea. Muut sovelluksen muistettavat asetukset säilyvät ennallaan.

0.22.7.10: Lisätty väliaikainen pystysäädin otsikon ja ensimmäisen nuottirivin välin hakemiseen. Säädin muuttaa suoraan OSMD EngravingRules.TitleBottomDistance -arvoa välillä 0.0–8.0 staff spacea, askel 0.5, oletus 1.0. Arvo ei tallennu muistiin.

0.22.7.11: Lisätty väliaikainen O-säädin otsikon pystysijainnille. Se muuttaa suoraan OSMD EngravingRules.TitleTopDistance -arvoa välillä 2.0–12.0 staff spacea, askel 0.5, oletus 5.0. Nykyiset 15 mm sivumarginaalit, TitleBottomDistance-säädin ja rivivälisäädin säilyvät ennallaan. Arvo ei tallennu muistiin.
