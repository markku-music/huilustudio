Pikakirjoitin 3 · BASE 0.13 · Nuottien editointi + älytauot

Pohja:
- BASE 0.12.3 Tempot aakkosjärjestykseen
- 0.12.4:n OSMD-tyhjätahtikokeilu EI ole mukana

Nuotin/tauon valinta:
- Pikakirjoitin 2 Core 0.22.7.8:n hyväksi havaittu valintaperiaate tuotu P3:een
- napautus nuottiin/taukoon valitsee sen
- nuotin pää/taukosymboli korostuu
- pieni kohdistin näkyy viivaston yläpuolella
- tyhjään paperiin napautus poistaa valinnan
- pystysuuntainen veto jää scrollaukseksi
- vaakasuuntainen veto viivastolla tekee aluevalinnan
- valinta seuraa sourceId:tä myös silloin, kun yksi Score Model -nuotti
  näkyy tahtiviivan ylityksen vuoksi useana sidottuna nuottina

Kelluva editoripalkki:
- ilmestyy heti valinnan viereen
- Enharmoninen
- Tauko, täsmälleen sama assets/rest.svg kuin peukalopakissa
- Poista
- Enharmoninen näkyy vain yhdelle nuotille, jolla on yksinkertainen
  #/b-vaihtoehto

Yhden nuotin muuttaminen tauoksi:
- säilyttää täsmälleen saman aika-arvon ja pisteet
- Score Modelin sama id säilyy
- jos nuotti ylittää tahtiviivan, tauko jakautuu renderöinnissä
  automaattisesti ilman tie-kaarta
- kokotahdin tauko syntyy vain, jos valittu nuotti todella täyttää
  kokonaisen täyden tahdin

Usean tapahtuman muuttaminen tauoiksi:
- tapahtumia EI muuteta yksi kerrallaan
- valitun alueen kokonaiskesto lasketaan
- vanhat tapahtumarajat poistetaan
- tilalle muodostetaan metrisesti järkevä taukorakenne
- koko täysi tahti -> kokotahdin tauko
- 6/8, 9/8 ja 12/8 -> pisteellisen neljäsosan 3/8-ryhmiä ensisijaisesti
- tavallisissa tahtilajeissa käytetään suurimpia selkeästi iskuille
  asettuvia taukoja
- harvinaiset tarkat rajat voidaan esittää sisäisesti 1/64- tai 1/128-tauolla

Koskettimella editointi:
- yksi valittu nuotti muokataan suoraan pianokoskettimelta
- kosketin määrää sävelkorkeuden
- tuttu ele määrää aika-arvon
- peukalopakin piste/tauko toimii myös editoinnin aikana
- valinta jää editoinnin jälkeen päälle

Measure rest -semantiikka:
- kokotahdin tauko on nyt Score Modelissa eksplisiittinen measureRest:true
- tavallinen 1/1-tauko ei automaattisesti muutu kokotahdin tauoksi
- tämä on tärkeää esim. 3/4-tahtilajissa ja tahtiviivan ylityksissä

Muu 0.12.3:n toiminta säilyy:
- automaattinen tie yli tahtiviivan
- tempot aakkosjärjestyksessä
- OSMD-automaattipalkitus
- pisteet
- explicit multirestit
- aloitusikkuna ja ääni
- koskettimisto alareunassa
- OSMD 2.1.2 vendor muuttumattomana
