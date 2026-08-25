Pikakirjoitin 3 · BASE 0.16.2 · Älytauot yksitellen

Pohja:
- BASE 0.16.1 Landscape-rivinvaihtomerkit kohdistettu

Muutos:
- kun yksi nuotti muutetaan Tauko-toiminnolla tauoksi ja sen vieressä
  on jo tavallisia taukoja, koko yhtenäinen paikallinen taukojakso
  kirjoitetaan uudelleen järkevinä taukoina.

Esimerkkejä 4/4:
- kaksi peräkkäistä 1/8-nuottia yksitellen tauoksi -> tarvittaessa 1/4-tauko
- kaksi peräkkäistä 1/4-nuottia tahdin alussa -> tarvittaessa 1/2-tauko
- koko tyhjäksi muodostuva tahti -> kokotahdin tauko

Metrinen rakenne säilyy:
- taukoa ei yhdistetä tahdin yli yhdeksi vääränlaiseksi symboliksi
- 4/4:n isku- ja puolikasrajat huomioidaan
- 6/8, 9/8 ja 12/8 käyttävät edelleen olemassa olevaa
  kolmen kahdeksasosan ryhmittelyä
- käytössä on sama buildSmartRests()-logiikka kuin monivalinnan
  Tauko-toiminnossa

Turvarajaus:
- automaattinen paikallinen yhdistäminen ei ylitä jo olemassa olevan
  eksplisiittisen kokotahdin tauon (measureRest) rajaa.
- näin aikaisempi kokotauko- ja multirest-logiikka säilyy koskemattomana.

Jos uuden tauon vieressä ei ole taukoa:
- toiminta säilyy täsmälleen ennallaan
- sama tapahtuma-id säilyy
- esim. 3/4:ssa yksittäisen kokonaisen nuotin muuttaminen tauoksi
  ei muutu vahingossa kokotahdin tauoksi

Muu BASE 0.16.1:n toiminta on jätetty ennalleen.
