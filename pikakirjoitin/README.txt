Pikakirjoitin 3 · BASE 0.14.7 · A4-paperi lukittu

Pohja:
- BASE 0.14.6 Uusi slur-kuvake

Uutta:
- nuottialueella on heti kokonainen A4-suhteinen paperi (210:297)
- paperi on valkoinen sivu harmaan vieritysalueen sisällä
- tyhjäkin kappale näyttää koko A4-sivun korkeuden
- A4-paperia voi vierittää pystysuunnassa
- koskettimisto pysyy edelleen alareunassa

Portrait / landscape:
- paperin leveys perustuu CSS:n vmin-mittaan
- portraitissa se vastaa käytännössä näytön leveyttä
- landscapessa se vastaa saman laitteen lyhyempää sivua
- tästä seuraa, ettei paperi eikä OSMD-nuottikuva veny landscape-näkymän
  koko leveydelle
- nuotin koko ja suhde paperiin pysyvät käytännössä samana kuin portraitissa

Portrait-geometria:
- tabletilla paperin leveys vastaa vanhaa score-card-leveyttä (viewport - 24 px)
- paperin 18 px sisämarginaali säilyttää OSMD:n käytettävissä olevan leveyden
  samana kuin ennen muutosta
- pienillä näytöillä säilytetään vastaavasti vanha mobiiligeometria
  (viewport - 16 px, 12 px sisämarginaalit)

Huomio:
- tämä versio tekee ensimmäisestä sivusta aidon A4-mittoisen työpinnan.
- Jos nuottisisältö myöhemmin kasvaa A4-korkeutta pidemmäksi, nykyinen DOM
  voi kasvattaa sivua. Varsinainen automaattinen monisivutus voidaan tehdä
  seuraavana erillisenä vaiheena.

Muu BASE 0.14.6:n toiminta säilyy ennallaan.
