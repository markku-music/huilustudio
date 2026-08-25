Pikakirjoitin 3 · BASE 0.15.0 · Portrait-nuottikoko lukittu

Pohja:
- BASE 0.14.9 A4 landscape koko leveys

Vertailupohja:
- Pikakirjoitin_2_Core_0.22.7.5_Portrait_Nuottikoko_Lukittu

Siirretty P2:n toimivasta mekanismista:
- OSMD autoResize = false
- portrait on nuottikoon referenssi
- portraitissa Zoom = 1
- landscapessa Zoom kasvaa paperin leveyden suhteessa portraitiin
- zoom rajataan P2:n tavoin välille 1...1.6
- suoraan landscapeen avattaessa portrait-leveys arvioidaan viewportin lyhyemmästä sivusta
- ResizeObserver tekee uuden renderin paperin leveyden muuttuessa
- resize-render on debouncattu 80 ms

P3-sovitus:
- P3:ssa referenssileveys otetaan .a4-paper-elementistä
- landscape-paperi täyttää edelleen koko leveyden kuten 0.14.9:ssä
- OSMD:n nuottikuva suurenee nyt paperin mukana
- valinnan geometria päivitetään resize-renderin jälkeen

Säilytetty ennallaan:
- 0.14.9:n CSS ja scrollaus
- score-model
- slurit ja slurien poisto
- peukalopakki
- koskettimisto
- OSMD 2.1.2 vendor
- käyttäjän slur.svg
