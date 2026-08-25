Pikakirjoitin 3 · BASE 0.14.5 · Slurien poisto

Pohja:
- BASE 0.14.4 Valinta + slur-korvaus

Yhden nuotin valinnassa kelluvan palkin Slur toimii poistotyökaluna.

Jos nuotin kohdalla ei kulje sluria:
- Slur-painike on passiivinen.

Jos nuotin kohdalla kulkee täsmälleen yksi slur:
- Slur-painike näkyy aktiivisena.
- Napautus poistaa kyseisen slurin.

Jos nuotin kohdalla kulkee useita slurreja:
- Slur-painike näkyy aktiivisena.
- Napautus avaa flyoutin.
- Flyout näyttää slurit niiden alku- ja loppusävelen nimillä, esimerkiksi C4–F4.
- Valittu slur poistetaan, muut säilyvät.

Nuotti lasketaan slurin kohdalla olevaksi myös silloin, kun se on pitkän slurin
sisällä eikä vain slurin alku- tai loppunuottina.

Useamman nuotin valinta toimii edelleen kuten BASE 0.14.4:
- valinnan sisäiset vanhat slurit korvataan yhdellä uudella slurilla
- jos valinnalla on jo täsmälleen sama yksi slur, toggle poistaa sen

Muu BASE 0.14.4:n toiminta säilyy ennallaan.
