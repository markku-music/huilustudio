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
