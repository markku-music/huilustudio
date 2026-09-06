LEO LENTÄJÄ – 3.83 ÄÄNI KUULTU -SIGNAALI

Pohja: 3.79 Lentolupakirja XY.

Uusi muutos:
- Lentopelissä näkyy neutraali vaalea pulssirengas aina, kun mikrofonitaso ylittää pelin nykyisen äänikynnyksen.
- Oletuskynnys on -70 dB, kuten 3.79-versiossa.
- Pulssi ei tarkoita onnistunutta tunnistusta, vaan ainoastaan että ääntä kuuluu.
- Pulssi toimii täysin rinnakkain KORKEA/MATALA-tunnistuksen kanssa.
- YIN-, yläsävel-, hyväksymis- ja lentokorkeuslogiikkaa ei ole muutettu.
- Ilmapallon poksahduksen hetkellä vain uusi visuaalinen pulssi estetään 350 ms ajaksi.
- Mikrofonia tai varsinaista tunnistusmoottoria ei sammuteta poksahduksen aikana.

Lupakirjan XY-säädöt ja muu 3.79-version toiminta on säilytetty.


TESTIMUUTOS: pelin JavaScript-grafiikka/fysiikka on rajattu 30 fps:ään. Mikrofoni- ja yläsävelanalyysi on jätetty ennalleen. CSS-animaatioita ei ole muutettu.


MIKROFONI RAW -TESTI:
- Grafiikan 30 fps -rajoitus ennallaan.
- echoCancellation=false, noiseSuppression=false ja autoGainControl=false olivat jo pohjaversiossa.
- Testissä poistetaan lisäksi voiceIsolation, jos selain tukee sitä.
- Mikrofoni-tilariville tulostetaan selaimen track.getSettings()-arvot (EC/NS/AGC/VI), jotta nähdään, toteutuivatko pyydetyt asetukset Samsungissa.
- YIN-, yläsävel-, kynnys- ja pelilogiikkaa ei muutettu.


DB-VERTAILUTESTI:
Avaa asetukset (ratas), käynnistä mikrofoni ja paina "Aloita 3 s mittaus". Puhalla samalla tavalla iPadilla ja Samsungilla. Vertaa 3 s keskiarvoa ja huippua. Mittaus ei muuta tunnistuslogiikkaa tai dB-kynnystä.
