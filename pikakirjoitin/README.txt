Pikakirjoitin 3 · BASE 0.11.2 · Koskettimisto alareunassa

Pohja:
- BASE 0.11.1 Tempoteksti korjattu

Muutos:
Käyttöliittymän pystyrakenne on muutettu Pikakirjoitin 2 Coren periaatteeseen:

- koko appi täyttää yhden selain-/PWA-näkymän
- koskettimisto on aina näkymän alareunassa
- koskettimisto EI kellu nuottipaperin päällä
- nuottialue käyttää kaiken koskettimiston yläpuolelle jäävän tilan
- nuottialue vierii pystysuunnassa itsenäisesti
- koskettimisto ei liiku nuottia vieritettäessä
- iOS safe-area huomioidaan ylä- ja alareunassa

Koskettimiston korkeus:
- normaalisti clamp(230px, 31dvh, 360px)
- matalassa näkymässä (max-height 620px) 220px
- scroll-kahva 44px
- pianokoskettimet käyttävät jäljelle jäävän tilan
- aika-arvo-ohje pysyy koskettimiston alareunassa

Säilytetty:
- P2 Core -aloitusikkuna
- ääni
- tempotekstin 0.11.1-korjaus
- pisteflyout
- tauot ja multirestit
- Score Model -> MusicXML -> OSMD
- OSMD 2.1.2 vendor muuttumattomana
