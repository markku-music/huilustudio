# Nuottipaja – yhteyskokeilu 0.1.0

Aloituskuva, kaksi tehtävää, kuusinumeroinen huonekoodi, enintään kaksi pelaajaa ja yhteinen G-neljäsosan testitapahtuma. Ei mikrofonia eikä varsinaista nuottikirjoitusta tässä ensimmäisessä versiossa.

## Firebase

Puhallinstartin nykyinen web-konfiguraatio; Cloud Firestore collection `nuottipajaRoomsV1`; Firebase Auth anonyymi SESSION-istunto. Ei nimiä eikä äänen tallennusta. Huonevaraaminen ja kaikki muutokset tehdään transaktioilla. Kierrosnumero estää vanhan vastauksen siirtymisen nollauksen jälkeen uuteen nuottiin.

Pilven nykyiset säännöt estävät uuden kokoelman. Käytä `firebase/nuottipaja.rules.fragment.txt` additive-only -katkelmaa projektin NYKYISTEN sääntöjen lisäksi. `firebase/firestore.rules` on vanhasta ZIP-paketista yhdistetty vertailutiedosto; sitä ei saa ottaa käyttöön tarkistamatta nykyisiä pilvisääntöjä. Käyttöönotto-ohje myös `dist/kayttoonotto.html`. Sääntöjä ei ole julkaistu: Firebase Consolen avaamiseen ei saatu selaimen lupaa.

## Käyttö

Valitse tehtävä, luo uusi peli ja kerro koodi parille. Pari valitsee toisen tehtävän ja liittyy koodilla. Tehtäväristiriita tarjoaa vaihtamisen. Lähetä G ja neljäsosa; molemmat näkevät yhdistelmän. Nollaa painikkeella Kokeile uudelleen. Omistajan Poistu huoneesta sulkee koko huoneen, vieraan poistuminen vapauttaa tämän paikan.

Välilehden päivitys palauttaa istunnon. Pelkkä välilehden sulkeminen ei takaa paikan vapautumista; käytä poistumispainiketta. Huone vanhenee 24h jälkeen. Tämä ensimmäinen versio ei tee automaattista Firestore TTL -poistoa.

## Validointi

`node --test tests/room-state.test.mjs`: 19/19 tilansiirtotestiä läpäisty. JavaScriptin syntaksitarkistukset läpäisty.

Paikallinen Firestore Emulator 1.19.8 / Firebase CLI 13.35.1: 35/35 sääntötarkistusta läpäisty. Mukana oikea kahden transaktion samanaikainen liittymiskilpailu, roolien käyttöoikeudet, kolmannen pelaajan esto, vanhan kierroksen torjunta, nollaus, poistuminen, tehtävän vaihto ja vanheneminen. Vanhan tulostaulun luonti- ja päivityssäännöt toimivat ennallaan. Toisto-ohje: `tests/FIRESTORE_TESTS.txt`.

Anonyymi pilviauth todennettu ja väliaikainen testitunnus poistettu; uuden huonekokoelman pilviluku palautti PERMISSION_DENIED odotetusti ennen sääntölisäystä. Selaimen visuaalista käyttöä ja oikeaa iPadin kahden laitteen yhteyttä ei ole tarkistettu tässä ympäristössä. Kahden laitteen koe jää sääntöjen julkaisun jälkeiseen kokeiluun.
