Asteikkospurtti – PWA, 29.9.2026

Pura paketti ja vie kansion sisältö GitHub Pages -sivullesi.
Avaa HTTPS-osoite. Aloita pyytää mikrofoniluvan; ole hiljaa 1,5 sekuntia.
Koko näytön toiminto on poistettu. Asetukset löytyvät rattaasta.

Asennus: Chrome/Edge: osoiterivin asennustoiminto.
iPad/iPhone: Safari > Jaa > Lisää Koti-valikkoon.
Asennettu sovellus käyttää omaa ikkunaa (standalone), ei fullscreen-tilaa.
Ensimmäinen lataus vaatii verkkoyhteyden. Sen jälkeen välimuistiin
ladatut nuotit, moottori ja kuvat toimivat myös offline-tilassa.
Mikrofoni tarvitsee selaimen käyttöluvan myös asennetussa sovelluksessa.
Älä käynnistä index.html:ää suoraan tiedostona.

Korjaukset:
- Äänijärjestelmän resume ja mikrofonilupapyyntö käynnistyvät samasta
  painalluksesta rinnakkain, ilman fullscreen-pyyntöä.
- Avauksella ja kalibroinnilla yhteinen 20 sekunnin aikaraja.
- Virhe avaa asetukset ja antaa mahdollisuuden uuteen yritykseen.
- Perutun/vanhentuneen pyynnön myöhemmin saama mikrofoni suljetaan.
- Sävelentunnistuksen algoritmia ja pelin asetuksia ei muutettu.

Takaa-ajaja (29.9.2026):
Hirviö odottaa ensimmäistä säveltä ja lähestyy tasaisesti.
Asetuksissa on päälle/pois-valinta ja nopeus 10–100 (oletus 35).
Kiinni jääminen ei katkaise harjoitusta. Hirviö pomppii vierellä.
Maalissa hirviö pysähtyy läähättämään. Myös alas- ja meno-paluusuunta toimivat.
Asetukset tallentuvat selaimeen. Muuttaminen valmistaa uuden kierroksen.
Päivityksen jälkeen sulje kaikki apin välilehdet/ikkunat ja avaa uudelleen,
jotta uusi offline-versio aktivoituu.

Vaikeustasot ja BPM (29.9.2026)
Pelin alareunassa: Unikeko, Tallustelija, Vipeltäjä ja Turbotassu.
Oletustempot ovat 30, 45, 60 ja 90 BPM. Ensimmäinen taso on Unikeko.
BPM-arvot näkyvät vain asetuksissa; jokaista voi muuttaa välillä 10–240.
Taso ja tempot tallentuvat selaimeen. Tason valinta ottaa hirviön mukaan.
Tason/tempon muuttaminen valmistelee uuden kierroksen.
Yksi isku = yksi sävelväli (120 radan yksikköä). Hirviö etenee
tasavauhtisesti valitun BPM:n mukaan ensimmäisestä sävelestä alkaen. Se pitää
oman temponsa soittajan pysähtyessäkin, mutta ei ohita juoksijaa.
Kiinni jäädessä se pomppii vieressä. Maalissa hirviö pysähtyy.
Juoksijan liike, sävelentunnistus ja pelikentän mitat ovat ennallaan.

Päivitä peli: oikean alakulman ↻-painike tarkistaa uuden version,
hakee pelin tiedostot uudelleen verkosta ja käynnistää pelin alusta.
Keskeneräinen kierros alkaa uudelleen. Asetukset ja ennätykset säilyvät.
Päivitys tarvitsee verkkoyhteyden ja HTTPS-osoitteen (tai localhostin).
Jos lataus epäonnistuu, nykyinen peli jää käyttöön ja voit yrittää uudelleen.
Ensimmäistä tätä painiketta sisältävää versiota varten sulje tarvittaessa
vanhat peli-ikkunat ja avaa peli uudelleen. Myöhemmät päivitykset voi hakea napilla.
