/*
 * OSMD-nuottinäyttö ResonatorEnginelle.
 * Sävelentunnistus säilyy erillisessä resonator-engine.js-tiedostossa.
 * Nuotit ladotaan kerran sivua avattaessa. Äänitapahtuma vaihtaa vain
 * valmiin SVG:n: ei MusicXML-jäsennystä tai OSMD-renderöintiä soiton aikana.
 */
(() => {
  'use strict';

  class ResonatorScoreDisplay {
    constructor(container) {
      this.container = container;
      this.frames = new Map();
      this.wanted = '';
      this.current = null;
    }

    musicXML(note) {
      const step = note?.id === 'H4' ? 'B' : note?.id.charAt(0) || 'G';
      const sharp = note?.id === 'Fis5';
      const octave = note?.oct || '4';
      // Invisible rests reserve equal space on both sides of the note.
      // No key signature: F-sharp is explicit next to the displayed note.
      return `<?xml version="1.0" encoding="utf-8"?>
<score-partwise version="3.1">
  <part-list><score-part id="P1"><part-name></part-name></score-part></part-list>
  <part id="P1"><measure number="1">
    <attributes><divisions>1</divisions><key><fifths>0</fifths></key>
      <time print-object="no"><beats>3</beats><beat-type>4</beat-type></time>
      <clef><sign>G</sign><line>2</line></clef></attributes>
    <barline location="left"><bar-style>none</bar-style></barline>
    <note print-object="no" print-spacing="yes"><rest/><duration>1</duration><type>quarter</type></note>
    <note${note ? ' color="#2d789f"' : ' print-object="no" print-spacing="yes"'}>
      <pitch><step>${step}</step>${sharp ? '<alter>1</alter>' : ''}<octave>${octave}</octave></pitch>
      <duration>1</duration><type>quarter</type>${sharp ? '<accidental>sharp</accidental>' : ''}
    </note>
    <note print-object="no" print-spacing="yes"><rest/><duration>1</duration><type>quarter</type></note>
    <barline location="right"><bar-style>none</bar-style></barline>
  </measure></part>
</score-partwise>`;
    }

    async init(notes) {
      const OSMD = window.opensheetmusicdisplay?.OpenSheetMusicDisplay;
      if (!OSMD) throw new Error('OSMD-kirjastoa ei löytynyt.');
      const staging = document.createElement('div');
      staging.className = 'osmd-staging';
      staging.setAttribute('aria-hidden', 'true');
      document.body.appendChild(staging);
      try {
        const osmd = new OSMD(staging, {
          backend: 'svg', autoResize: false, drawingParameters: 'compacttight',
          drawTitle: false, drawSubtitle: false, drawComposer: false,
          drawLyricist: false, drawCredits: false, drawPartNames: false,
          drawPartAbbreviations: false, drawMeasureNumbers: false,
          drawTimeSignatures: false, drawHiddenNotes: false, disableCursor: true,
          stretchLastSystemLine: true, defaultColorMusic: '#29495b',
          colorStemsLikeNoteheads: true
        });
        osmd.Zoom = 1.6;
        this.container.dataset.osmdVersion = osmd.Version || '';
        for (const note of [null, ...notes]) {
          await osmd.load(this.musicXML(note));
          osmd.render();
          const svg = staging.querySelector('svg');
          if (!svg) throw new Error('OSMD ei tuottanut nuottikuvaa.');
          const frame = svg.cloneNode(true);
          const width = parseFloat(svg.getAttribute('width'));
          const height = parseFloat(svg.getAttribute('height'));
          if (!(width > 0 && height > 0)) throw new Error('Virheellinen nuottikuvan koko.');
          frame.setAttribute('viewBox', `0 0 ${width} ${height}`);
          frame.removeAttribute('width');
          frame.removeAttribute('height');
          frame.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          frame.setAttribute('aria-hidden', 'true');
          frame.setAttribute('focusable', 'false');
          frame.dataset.note = note?.id || '';
          frame.dataset.label = note ? `${note.display || `${note.label}${note.oct}`} G-avaimella` : 'G-avain ja tyhjä nuottiviivasto';
          this.frames.set(note?.id || '', frame);
          // Let the page paint between preparation steps, especially on iPad.
          await new Promise(resolve => requestAnimationFrame(resolve));
        }
        this.show(this.wanted);
      } finally {
        staging.remove();
      }
    }

    show(id) {
      this.wanted = id;
      if (this.current === id) return;
      const frame = this.frames.get(id);
      if (!frame) return;
      this.container.replaceChildren(frame);
      this.container.setAttribute('aria-label', frame.dataset.label);
      this.container.dataset.note = id;
      this.current = id;
    }
  }
  window.ResonatorScoreDisplay = ResonatorScoreDisplay;
})();
