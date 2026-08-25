Pikakirjoitin 3 · BASE 0.14.8 · A4 koko leveys, yksi paperi

Pohja:
- BASE 0.14.7 A4-paperi lukittu

Muutokset:

1. A4 täyttää koko näytön leveyden
- portraitissa A4 täyttää score-alueen koko leveyden
- landscapessa A4 täyttää myös koko leveämmän näytön leveyden
- paperia ei enää lukita portrait-leveyteen vmin-mitalla

2. A4-suhde säilyy
- paperin suhde on aina 210:297
- landscape-näkymässä paperi suurenee leveämmäksi ja samalla korkeammaksi
- paperia vieritetään pystysuunnassa

3. Nuotti pysyy samassa suhteessa paperiin
- OSMD-kontti skaalautuu paperin leveyden mukana
- paperin sisämarginaalit ovat prosentteina, eivät kiinteinä pikseleinä
- siksi marginaalit ja nuottikuva suurenevat yhdessä paperin kanssa

4. Vain yksi näkyvä paperi
- .a4-paper on ainoa valkoinen paperipinta
- OSMD-kontin ja SVG:n tausta, reunat, outline ja varjot on poistettu
- A4-paperin oma ylimääräinen reunus ja varjo on poistettu
- näin nuottipaperin päällä ei pitäisi näkyä toista laatikkoa tai omia reunoja

5. Koskettimisto ja vieritys
- koskettimisto pysyy alareunassa
- A4-paperia vieritetään score-alueessa pystysuunnassa

Muu BASE 0.14.7:n toiminta säilyy ennallaan.
