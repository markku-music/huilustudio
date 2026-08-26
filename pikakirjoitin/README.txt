VERSION 0.17.6.18 — varren suunta ja slurin sijoitus

Uutta tässä versiossa:
- Kelluvaan nuottivalinnan palkkiin lisätty varren suunnan valitsin.
- Varren suunta: Auto / ylös / alas.
- Toimii yhdelle tai usealle valitulle nuotille, joilla on varsi.
- Kelluvaan palkkiin lisätty slurin sijoituksen valitsin.
- Slurin sijoitus: Auto / yllä / alla.
- Slurin suunta on käytettävissä, kun valinta osoittaa yksiselitteisesti yhteen sluriin.
- Yhden nuotin valinnalla suuntaa voi muuttaa, jos nuotin kohdalla on täsmälleen yksi slur.
- Usean nuotin valinnalla suuntaa voi muuttaa, kun valinnan ensimmäisen ja viimeisen nuotin välillä on täsmälleen kyseinen slur.
- MusicXML kirjoittaa pakotetun varren <stem>up/down</stem>-elementtinä.
- MusicXML kirjoittaa pakotetun slurin suunnan placement="above/below" -attribuuttina.
- Auto-tilassa näitä pakotuksia ei kirjoiteta, joten OSMD päättää suunnan normaalisti.
- Undo/redo ja projektitallennus säilyttävät asetukset.

Pohja: 0.17.6.17 Editointitila sulkeutuu nuottisivulta.
Kaikki aiemmat palkitus-, tahtiviiva-, rivinvaihto-, scroll-valinta- ja viimeisen rivin venytystoiminnot on säilytetty.
