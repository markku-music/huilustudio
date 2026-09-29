/*
 * OSMD-asteikkonäyttö ResonatorEnginelle.
 * DEV-versio: OSMD:n asteikkoladonnan asetukset voidaan säätää käyttöliittymästä
 * ja viedä JSON-muodossa. Sävelentunnistus säilyy erillisessä resonator-engine.js-tiedostossa.
 */
(() => {
  'use strict';

  const clamp = (value, min, max, fallback) => {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
  };

  const DEFAULTS = Object.freeze({
    zoom: 1.6,
    renderWidth: 640,
    drawingParameters: 'compacttight',
    stretchLastSystemLine: false,
    musicColor: '#000000',
    staffLineColor: '#000000',
    ledgerLineColor: '#000000',
    colorStemsLikeNoteheads: true,
    renderClef: true,
    renderKeySignatures: true,
    snapStafflinesToCrispPixels: true,
    accidentalMode: 'individual',
    stemDirection: 'auto',
    endGapPercent: 50,
    clefGapPercent: 48,
    accidentalGapPercent: 62,
    leadingSpacerBeats: 1,
    trailingSpacerBeats: 1,
    preserveAlign: 'xMidYMid',
    preserveFit: 'meet',
    cropLeftPct: 0,
    cropRightPct: 0,
    cropTopPct: 0,
    cropBottomPct: 0,
    rules: {
      PageLeftMargin: 5,
      PageRightMargin: 5,
      PageTopMargin: 5,
      PageBottomMargin: 5,
      SystemLeftMargin: 0,
      SystemRightMargin: 0,
      MeasureLeftMargin: 0.7,
      MeasureRightMargin: 0,
      ClefLeftMargin: 0.5,
      ClefRightMargin: 0.75,
      KeyRightMargin: 0.75,
      BetweenKeySymbolsDistance: 0.2,
      MinNoteDistance: 2,
      VoiceSpacingMultiplierVexflow: 1.5,
      VoiceSpacingAddendVexflow: 3,
      LastSystemMaxScalingFactor: 1.4,
      VexFlowDefaultNotationFontScale: 39,
      StaffHeight: 4,
      BetweenStaffLinesDistance: 1,
      StaffLineWidth: 0.1,
      StemWidth: 0.15,
      IdealStemLength: 3,
      StemMinLength: 2.5,
      StemMaxLength: 4.5,
      LedgerLineWidth: 1,
      NoteHelperLinesOffset: 0.25,
      FixedMeasureWidth: false,
      FixedMeasureWidthFixedValue: 50
    },
    extraRules: {}
  });

  const cloneDefaults = () => JSON.parse(JSON.stringify(DEFAULTS));

  class ResonatorScoreDisplay {
    constructor(container) {
      this.container = container;
      this.frames = new Map();
      this.spacingFrames = new WeakMap();
      this.wanted = '';
      this.current = null;
      this.scales = [];
      this.settings = cloneDefaults();
      this.renderToken = 0;
      this.osmdVersion = '';
      this.activeNoteId = '';
      this.noteArrow = document.createElement('span');
      this.noteArrow.className = 'score-note-arrow';
      this.noteArrow.setAttribute('aria-hidden', 'true');
      this.noteArrow.hidden = true;
    }

    normalizeSettings(input = {}) {
      const d = cloneDefaults();
      const out = {...d, ...input};
      out.zoom = clamp(out.zoom, 0.4, 5, d.zoom);
      out.renderWidth = clamp(out.renderWidth, 220, 2200, d.renderWidth);
      const allowedDrawing = ['allon','compact','compacttight','default','leadsheet','preview','thumbnail'];
      if (!allowedDrawing.includes(out.drawingParameters)) out.drawingParameters = d.drawingParameters;
      out.stretchLastSystemLine = !!out.stretchLastSystemLine;
      out.colorStemsLikeNoteheads = !!out.colorStemsLikeNoteheads;
      out.renderClef = out.renderClef !== false;
      out.renderKeySignatures = out.renderKeySignatures !== false;
      out.snapStafflinesToCrispPixels = out.snapStafflinesToCrispPixels !== false;
      out.accidentalMode = out.accidentalMode === 'key-signature' ? 'key-signature' : 'individual';
      out.stemDirection = ['auto','up','down'].includes(out.stemDirection) ? out.stemDirection : 'auto';
      out.endGapPercent = clamp(out.endGapPercent, 0, 200, 50);
      out.clefGapPercent = clamp(out.clefGapPercent, 0, 200, 100);
      out.accidentalGapPercent = clamp(out.accidentalGapPercent, 0, 200, 100);
      out.leadingSpacerBeats = Math.round(clamp(out.leadingSpacerBeats, 0, 6, d.leadingSpacerBeats));
      out.trailingSpacerBeats = Math.round(clamp(out.trailingSpacerBeats, 0, 6, d.trailingSpacerBeats));
      out.preserveAlign = ['xMinYMin','xMidYMin','xMaxYMin','xMinYMid','xMidYMid','xMaxYMid','xMinYMax','xMidYMax','xMaxYMax'].includes(out.preserveAlign) ? out.preserveAlign : d.preserveAlign;
      out.preserveFit = out.preserveFit === 'slice' ? 'slice' : 'meet';
      out.cropLeftPct = clamp(out.cropLeftPct, 0, 40, 0);
      out.cropRightPct = clamp(out.cropRightPct, 0, 40, 0);
      out.cropTopPct = clamp(out.cropTopPct, 0, 40, 0);
      out.cropBottomPct = clamp(out.cropBottomPct, 0, 40, 0);
      out.musicColor = /^#[0-9a-f]{6}$/i.test(out.musicColor || '') ? out.musicColor : d.musicColor;
      out.staffLineColor = /^#[0-9a-f]{6}$/i.test(out.staffLineColor || '') ? out.staffLineColor : d.staffLineColor;
      out.ledgerLineColor = /^#[0-9a-f]{6}$/i.test(out.ledgerLineColor || '') ? out.ledgerLineColor : d.ledgerLineColor;

      out.rules = {...d.rules, ...(input.rules || {})};
      const ranges = {
        PageLeftMargin:[0,30], PageRightMargin:[0,30], PageTopMargin:[0,30], PageBottomMargin:[0,30],
        SystemLeftMargin:[0,30], SystemRightMargin:[0,30], MeasureLeftMargin:[0,8], MeasureRightMargin:[0,8],
        ClefLeftMargin:[0,8], ClefRightMargin:[0,8], KeyRightMargin:[0,8], BetweenKeySymbolsDistance:[0,4],
        MinNoteDistance:[0.2,12], VoiceSpacingMultiplierVexflow:[0.1,3], VoiceSpacingAddendVexflow:[0,15],
        LastSystemMaxScalingFactor:[0.2,5], VexFlowDefaultNotationFontScale:[15,100], StaffHeight:[1,12],
        BetweenStaffLinesDistance:[0.3,3], StaffLineWidth:[0.02,0.8], StemWidth:[0.02,1], IdealStemLength:[0.5,12],
        StemMinLength:[0.5,12], StemMaxLength:[1,16], LedgerLineWidth:[0.1,4], NoteHelperLinesOffset:[0,2],
        FixedMeasureWidthFixedValue:[5,200]
      };
      for (const [key, [min,max]] of Object.entries(ranges)) {
        out.rules[key] = clamp(out.rules[key], min, max, d.rules[key]);
      }
      out.rules.FixedMeasureWidth = !!out.rules.FixedMeasureWidth;
      out.extraRules = (input.extraRules && typeof input.extraRules === 'object' && !Array.isArray(input.extraRules)) ? {...input.extraRules} : {};
      return out;
    }

    accidentalXML(note, settings) {
      if (settings.accidentalMode === 'key-signature') return '';
      if (note.alter === 1) return '<accidental>sharp</accidental>';
      if (note.alter === -1) return '<accidental>flat</accidental>';
      return '';
    }

    noteXML(note, settings) {
      const alterXML = note.alter === 0 ? '' : `<alter>${note.alter}</alter>`;
      const stemXML = settings.stemDirection === 'auto' ? '' : `<stem>${settings.stemDirection}</stem>`;
      return `<note color="${settings.musicColor}">
      <pitch><step>${note.musicStep}</step>${alterXML}<octave>${note.oct}</octave></pitch>
      <duration>1</duration><type>quarter</type>${this.accidentalXML(note, settings)}${stemXML}
    </note>`;
    }

    spacerXML(count) {
      return Array.from({length: count}, () => '<note print-object="no" print-spacing="yes"><rest/><duration>1</duration><type>quarter</type></note>').join('\n    ');
    }

    fifthsForScale(scale) {
      const map = {B:-2,F:-1,C:0,G:1,D1:2,D2:2};
      return Number.isFinite(scale.fifths) ? scale.fifths : (map[scale.id] ?? 0);
    }

    musicXML(scale, settings) {
      const notes = scale.notes || [];
      const body = notes.map(note => this.noteXML(note, settings)).join('\n    ');
      const lead = this.spacerXML(settings.leadingSpacerBeats);
      const trail = this.spacerXML(settings.trailingSpacerBeats);
      const beats = Math.max(1, notes.length + settings.leadingSpacerBeats + settings.trailingSpacerBeats);
      const fifths = settings.accidentalMode === 'key-signature' ? this.fifthsForScale(scale) : 0;
      return `<?xml version="1.0" encoding="utf-8"?>
<score-partwise version="3.1">
  <part-list><score-part id="P1"><part-name></part-name></score-part></part-list>
  <part id="P1"><measure number="1">
    <attributes><divisions>1</divisions><key><fifths>${fifths}</fifths></key>
      <time print-object="no"><beats>${beats}</beats><beat-type>4</beat-type></time>
      <clef><sign>G</sign><line>2</line></clef></attributes>
    <barline location="left"><bar-style>none</bar-style></barline>
    ${lead}
    ${body}
    ${trail}
    <barline location="right"><bar-style>none</bar-style></barline>
  </measure></part>
</score-partwise>`;
    }

    applyRules(osmd, settings) {
      const rules = osmd.EngravingRules;
      if (!rules) return;
      for (const [key,value] of Object.entries(settings.rules)) {
        if (key in rules) rules[key] = value;
      }
      if ('StaffLineColor' in rules) rules.StaffLineColor = settings.staffLineColor;
      if ('LedgerLineColorDefault' in rules) rules.LedgerLineColorDefault = settings.ledgerLineColor;
      if ('ColorStemsLikeNoteheads' in rules) rules.ColorStemsLikeNoteheads = settings.colorStemsLikeNoteheads;
      if ('RenderClefsAtBeginningOfStaffline' in rules) rules.RenderClefsAtBeginningOfStaffline = settings.renderClef;
      if ('RenderKeySignatures' in rules) rules.RenderKeySignatures = settings.renderKeySignatures;
      if ('SnapStafflinesToCrispPixels' in rules) rules.SnapStafflinesToCrispPixels = settings.snapStafflinesToCrispPixels;
      for (const [key,value] of Object.entries(settings.extraRules || {})) {
        if (!(key in rules)) continue;
        if (['number','boolean','string'].includes(typeof value)) rules[key] = value;
      }
    }

    cropViewBox(frame, width, height, settings) {
      const l = width * settings.cropLeftPct / 100;
      const r = width * settings.cropRightPct / 100;
      const t = height * settings.cropTopPct / 100;
      const b = height * settings.cropBottomPct / 100;
      const w = Math.max(1, width - l - r);
      const h = Math.max(1, height - t - b);
      frame.setAttribute('viewBox', `${l} ${t} ${w} ${h}`);
    }

    captureNoteSpacing(source, frame, scale, settings) {
      // Read real glyph bounds while the original SVG is attached to staging.
      // Accidentals and stems are inside the note group. VexFlow draws ledger
      // lines in a separate sibling; capture and move those with their note.
      const clef=source.querySelector('.vf-clef');
      const start=settings.leadingSpacerBeats,count=scale.notes.length;
      const sourceNotes=[...source.querySelectorAll('.vf-stavenote')].slice(start,start+count);
      const targetNotes=[...frame.querySelectorAll('.vf-stavenote')].slice(start,start+count);
      if(!clef || sourceNotes.length!==count || targetNotes.length!==count)return;
      try {
        const clefBox=clef.getBBox();
        const notes=sourceNotes.map((node,i)=>{
          const b=node.getBBox();
          let left=b.x,right=b.x+b.width;
          const parts=[targetNotes[i]];
          const ledger=node.previousElementSibling;
          const targetLedger=targetNotes[i].previousElementSibling;
          if(ledger?.classList.contains('vf-ledgers') && targetLedger?.classList.contains('vf-ledgers')) {
            const lb=ledger.getBBox();left=Math.min(left,lb.x);right=Math.max(right,lb.x+lb.width);
            parts.push(targetLedger);
          }
          return {node:targetNotes[i],left,right,
            parts:parts.map(node=>({node,originalTransform:node.getAttribute('transform')||''})),
            accidental:settings.accidentalMode==='individual' && scale.notes[i].alter!==0};
        });
        const clefRight=clefBox.x+clefBox.width;
        if(!Number.isFinite(clefRight)||notes.some(n=>!Number.isFinite(n.left)||!Number.isFinite(n.right)||n.right<=n.left))return;
        // Match only the five direct, horizontal staff paths. Ledger lines
        // are nested in separate groups and are never shortened here.
        const staffLines=[];
        for(const node of frame.querySelector('.vf-measure')?.children||[]) {
          if(node.localName!=='path')continue;
          const originalD=node.getAttribute('d')||'';
          const coords=originalD.match(/^M\s*([-+\d.eE]+)[ ,]+([-+\d.eE]+)\s*L\s*([-+\d.eE]+)[ ,]+([-+\d.eE]+)\s*$/);
          if(!coords)continue;
          const [x,y,right,y2]=coords.slice(1).map(Number);
          if([x,y,right,y2].every(Number.isFinite)&&Math.abs(y-y2)<1e-6&&right>x)staffLines.push({node,originalD,x,y,right});
        }
        this.spacingFrames.set(frame,{clefLeft:clefBox.x,clefRight,notes,staffLines:staffLines.length===5?staffLines:[]});
      } catch(error) {
        console.warn('Nuottivälien mittaus ei onnistunut:',error);
      }
    }

    applyNoteSpacing(frame, settings) {
      const geometry=this.spacingFrames.get(frame);
      if(!geometry)return;
      const {notes,clefRight,staffLines}=geometry;
      let shift=0,left=geometry.clefLeft,right=clefRight;
      for(let i=0;i<notes.length;i++) {
        const note=notes[i];
        const percent=i===0?settings.clefGapPercent:note.accidental?settings.accidentalGapPercent:100;
        if(percent!==100) {
          const before=i===0?clefRight:notes[i-1].right;
          const gap=note.left-before;
          // Never tighten a gap already below the safety floor. 100% is exact
          // original geometry; changing sliders always recomputes from that.
          const minimum=Math.min(gap,8);
          shift+=Math.max(minimum,gap*percent/100)-gap;
        }
        left=Math.min(left,note.left+shift);right=Math.max(right,note.right+shift);
        for(const part of note.parts) {
          if(Math.abs(shift)<1e-9) {
            if(part.originalTransform)part.node.setAttribute('transform',part.originalTransform);
            else part.node.removeAttribute('transform');
          } else part.node.setAttribute('transform',`${part.originalTransform} translate(${shift},0)`.trim());
        }
      }
      const last=notes[notes.length-1];
      for(const line of staffLines) {
        const originalGap=line.right-last.right;
        const gap=Math.max(Math.min(originalGap,8),originalGap*settings.endGapPercent/100);
        // Follow the actual last-note position after the other gap controls.
        // Changing the tail must never move notes or change the SVG scale.
        const end=Math.max(line.x,last.right+shift+gap);
        left=Math.min(left,line.x);right=Math.max(right,end);
        line.node.setAttribute('d',Math.abs(end-line.right)<1e-9?line.originalD:`M${line.x} ${line.y}L${end} ${line.y}`);
      }
      geometry.visibleBounds={left,right};
    }

    contentCenterX(frame) {
      const bounds=this.spacingFrames.get(frame)?.visibleBounds;
      return bounds?(bounds.left+bounds.right)/2:null;
    }

    noteNodes(frame) {
      const scale=this.scales.find(item=>item.id===frame?.dataset.scale);
      if(!frame||!scale)return [];
      return [...frame.querySelectorAll('.vf-stavenote')]
        .slice(this.settings.leadingSpacerBeats,this.settings.leadingSpacerBeats+scale.notes.length);
    }

    contentScreenBounds(frame) {
      if(!frame)return null;
      const geometry=this.spacingFrames.get(frame);
      // Use rendered CSS-pixel rectangles, including nested SVG transforms and
      // the CSS zoom. This does not depend on Safari's SVG getScreenCTM mapping.
      const nodes=geometry
        ?[frame.querySelector('.vf-clef'),...geometry.notes.flatMap(note=>note.parts.map(part=>part.node)),...geometry.staffLines.map(line=>line.node)]
        :[frame.querySelector('.vf-measure')];
      let left=Infinity,right=-Infinity;
      for(const node of nodes){
        if(!node)continue;
        const rect=node.getBoundingClientRect();
        if(!Number.isFinite(rect.left)||!Number.isFinite(rect.right)||rect.width<=0)continue;
        left=Math.min(left,rect.left);right=Math.max(right,rect.right);
      }
      return Number.isFinite(left)&&right>left?{left,right}:null;
    }

    setActiveNote(id) {
      this.activeNoteId=typeof id==='string'?id:'';
      this.updateActiveNote();
    }

    updateActiveNote() {
      this.noteArrow.hidden=true;
      const frame=this.frames.get(this.current);
      const scale=this.scales.find(item=>item.id===this.current);
      const index=scale?.notes.findIndex(note=>note.id===this.activeNoteId)??-1;
      if(!frame||index<0||!frame.isConnected)return;
      const note=this.noteNodes(frame)[index];
      const head=note?.querySelector('.vf-notehead');
      if(!head)return;
      const headRect=head.getBoundingClientRect();
      const noteRect=note.getBoundingClientRect();
      const canvasRect=this.container.getBoundingClientRect();
      if(!(headRect.width>0&&canvasRect.width>0&&canvasRect.height>0))return;
      // Position an HTML overlay in CSS pixels. Its size stays readable when
      // the score zoom or crop changes, and its center follows the notehead.
      const x=headRect.left+headRect.width/2-canvasRect.left;
      const noteTop=Math.min(headRect.top,noteRect.top)-canvasRect.top;
      const y=Math.max(4,noteTop-39);
      if(!Number.isFinite(x)||!Number.isFinite(y))return;
      this.noteArrow.style.left=`${x}px`;
      this.noteArrow.style.top=`${y}px`;
      this.noteArrow.hidden=false;
    }

    async renderAll(settingsInput = {}) {
      const OSMD = window.opensheetmusicdisplay?.OpenSheetMusicDisplay;
      if (!OSMD) throw new Error('OSMD-kirjastoa ei löytynyt.');
      const token = ++this.renderToken;
      const settings = this.normalizeSettings(settingsInput);
      const staging = document.createElement('div');
      staging.className = 'osmd-staging';
      staging.style.width = `${settings.renderWidth}px`;
      staging.setAttribute('aria-hidden', 'true');
      document.body.appendChild(staging);
      const newFrames = new Map();
      try {
        const osmd = new OSMD(staging, {
          backend: 'svg', autoResize: false, drawingParameters: settings.drawingParameters,
          drawTitle: false, drawSubtitle: false, drawComposer: false,
          drawLyricist: false, drawCredits: false, drawPartNames: false,
          drawPartAbbreviations: false, drawMeasureNumbers: false,
          drawTimeSignatures: false, drawHiddenNotes: false, disableCursor: true,
          stretchLastSystemLine: settings.stretchLastSystemLine,
          defaultColorMusic: settings.musicColor,
          colorStemsLikeNoteheads: settings.colorStemsLikeNoteheads
        });
        osmd.Zoom = settings.zoom;
        this.applyRules(osmd, settings);
        this.osmdVersion = osmd.Version || '';
        this.container.dataset.osmdVersion = this.osmdVersion;

        for (const scale of this.scales) {
          if (token !== this.renderToken) return false;
          await osmd.load(this.musicXML(scale, settings));
          this.applyRules(osmd, settings);
          osmd.render();
          const svg = staging.querySelector('svg');
          if (!svg) throw new Error('OSMD ei tuottanut nuottikuvaa.');
          const frame = svg.cloneNode(true);
          this.captureNoteSpacing(svg,frame,scale,settings);
          this.applyNoteSpacing(frame,settings);
          const width = parseFloat(svg.getAttribute('width'));
          const height = parseFloat(svg.getAttribute('height'));
          if (!(width > 0 && height > 0)) throw new Error('Virheellinen nuottikuvan koko.');
          frame.dataset.sourceWidth=String(width);
          frame.dataset.sourceHeight=String(height);
          this.cropViewBox(frame, width, height, settings);
          frame.removeAttribute('width');
          frame.removeAttribute('height');
          frame.setAttribute('preserveAspectRatio', `${settings.preserveAlign} ${settings.preserveFit}`);
          frame.setAttribute('aria-hidden', 'true');
          frame.setAttribute('focusable', 'false');
          frame.dataset.scale = scale.id;
          frame.dataset.label = `${scale.label}, kahdeksan nuottia G-avaimella`;
          newFrames.set(scale.id, frame);
          await new Promise(resolve => requestAnimationFrame(resolve));
        }
        if (token !== this.renderToken) return false;
        this.settings = settings;
        this.frames = newFrames;
        this.current = null;
        this.show(this.wanted || this.scales[0]?.id || '');
        return true;
      } finally {
        staging.remove();
      }
    }

    async init(scales, settings = {}) {
      this.scales = Array.isArray(scales) ? scales : [];
      return this.renderAll(settings);
    }

    // Cropping only changes the existing SVG viewport; no OSMD layout needed.
    updateViewport(settingsInput) {
      const settings=this.normalizeSettings(settingsInput);
      for(const frame of this.frames.values()) {
        this.cropViewBox(frame,Number(frame.dataset.sourceWidth),Number(frame.dataset.sourceHeight),settings);
        this.applyNoteSpacing(frame,settings);
      }
      for(const key of ['cropLeftPct','cropRightPct','cropTopPct','cropBottomPct','clefGapPercent','accidentalGapPercent','endGapPercent'])this.settings[key]=settings[key];
      this.updateActiveNote();
    }

    async applySettings(settings) {
      return this.renderAll(settings);
    }

    show(scaleId) {
      this.wanted = scaleId;
      if (this.current === scaleId) { this.updateActiveNote(); return; }
      const frame = this.frames.get(scaleId);
      if (!frame) return;
      this.container.replaceChildren(frame,this.noteArrow);
      this.container.setAttribute('aria-label', frame.dataset.label);
      this.container.dataset.scale = scaleId;
      this.current = scaleId;
      this.updateActiveNote();
    }

    getSettings() {
      return JSON.parse(JSON.stringify(this.settings));
    }

    static defaults() {
      return cloneDefaults();
    }
  }

  window.RESONATOR_SCORE_DEFAULTS = cloneDefaults();
  window.ResonatorScoreDisplay = ResonatorScoreDisplay;
})();
