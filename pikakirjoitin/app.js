const osmdContainer = document.getElementById('osmdContainer');
const keyboardSurface = document.getElementById('keyboardSurface');
const dotToggle = document.getElementById('dotToggle');
const restToggle = document.getElementById('restToggle');
const undoBtn = document.getElementById('undoBtn');
const clearBtn = document.getElementById('clearBtn');
const statusText = document.getElementById('statusText');
const playScaleBtn = document.getElementById('playScaleBtn');
const layoutToggle = document.getElementById('layoutToggle');
const layoutPanel = document.getElementById('layoutPanel');
const layoutClose = document.getElementById('layoutClose');
const zoneKeyboard = document.getElementById('zoneKeyboard');
const zonePanel = document.querySelector('.zone-panel');
const flickHud = document.getElementById('flickHud');

const layoutControls = {
  whiteWidth: document.getElementById('whiteWidthSlider'),
  keyboardHeight: document.getElementById('keyboardHeightSlider'),
  blackWidth: document.getElementById('blackWidthSlider'),
  blackHeight: document.getElementById('blackHeightSlider'),
  flickEighth: document.getElementById('flickEighthSlider'),
  flickSixteenth: document.getElementById('flickSixteenthSlider'),
  flickHalf: document.getElementById('flickHalfSlider'),
  flickWhole: document.getElementById('flickWholeSlider'),
};

const layoutOutputs = {
  whiteWidth: document.getElementById('whiteWidthOut'),
  keyboardHeight: document.getElementById('keyboardHeightOut'),
  blackWidth: document.getElementById('blackWidthOut'),
  blackHeight: document.getElementById('blackHeightOut'),
  flickEighth: document.getElementById('flickEighthOut'),
  flickSixteenth: document.getElementById('flickSixteenthOut'),
  flickHalf: document.getElementById('flickHalfOut'),
  flickWhole: document.getElementById('flickWholeOut'),
};

const LAYOUT_STORAGE_KEY = 'melody-writer-flick-layout-v1';
const defaultLayout = {
  whiteWidth: 100,
  keyboardHeight: 100,
  blackWidth: 66,
  blackHeight: 56,
  flick: {
    eighth: 26,
    sixteenth: 72,
    half: 26,
    whole: 72,
  },
};

let layoutState = loadLayoutState();

const titleInput = document.getElementById('titleInput');
const composerInput = document.getElementById('composerInput');
const tempoTextInput = document.getElementById('tempoTextInput');
const bpmInput = document.getElementById('bpmInput');
const beatsSelect = document.getElementById('beatsSelect');
const beatTypeSelect = document.getElementById('beatTypeSelect');
const keySelect = document.getElementById('keySelect');
const modeSelect = document.getElementById('modeSelect');

document.getElementById('tempoDown').addEventListener('click', () => adjustTempo(-1));
document.getElementById('tempoUp').addEventListener('click', () => adjustTempo(1));

const divisions = 8;
const durationDefs = [
  { zone: 0, name: '16th', label: '1/16', units: 2, type: '16th', dots: 0 },
  { zone: 1, name: 'eighth', label: '1/8', units: 4, type: 'eighth', dots: 0 },
  { zone: 2, name: 'quarter', label: '1/4', units: 8, type: 'quarter', dots: 0 },
  { zone: 3, name: 'half', label: '1/2', units: 16, type: 'half', dots: 0 },
  { zone: 4, name: 'whole', label: 'koko', units: 32, type: 'whole', dots: 0 },
];
const durationMapByUnits = new Map([
  [32, { type: 'whole', dots: 0 }],
  [24, { type: 'half', dots: 1 }],
  [16, { type: 'half', dots: 0 }],
  [12, { type: 'quarter', dots: 1 }],
  [8, { type: 'quarter', dots: 0 }],
  [6, { type: 'eighth', dots: 1 }],
  [4, { type: 'eighth', dots: 0 }],
  [3, { type: '16th', dots: 1 }],
  [2, { type: '16th', dots: 0 }],
]);
const allowedPieces = [...durationMapByUnits.keys()].sort((a,b) => b-a);
const durationByName = Object.fromEntries(durationDefs.map(d => [d.name, d]));

const keyDefs = [
  { tonic: 'C', fifths: 0 },
  { tonic: 'G', fifths: 1 },
  { tonic: 'D', fifths: 2 },
  { tonic: 'A', fifths: 3 },
  { tonic: 'E', fifths: 4 },
  { tonic: 'H', fifths: 5 },
  { tonic: 'Fis', fifths: 6 },
  { tonic: 'Cis', fifths: 7 },
  { tonic: 'F', fifths: -1 },
  { tonic: 'B', fifths: -2 },
  { tonic: 'Es', fifths: -3 },
  { tonic: 'As', fifths: -4 },
  { tonic: 'Des', fifths: -5 },
  { tonic: 'Ges', fifths: -6 },
  { tonic: 'Ces', fifths: -7 },
];
keyDefs.forEach(k => {
  const opt = document.createElement('option');
  opt.value = String(k.fifths);
  opt.textContent = k.tonic;
  if (k.fifths === 0) opt.selected = true;
  keySelect.appendChild(opt);
});

const whiteKeys = [
  { midi: 60, step: 'C', alter: 0, octave: 4, label: 'C' },
  { midi: 62, step: 'D', alter: 0, octave: 4, label: 'D' },
  { midi: 64, step: 'E', alter: 0, octave: 4, label: 'E' },
  { midi: 65, step: 'F', alter: 0, octave: 4, label: 'F' },
  { midi: 67, step: 'G', alter: 0, octave: 4, label: 'G' },
  { midi: 69, step: 'A', alter: 0, octave: 4, label: 'A' },
  { midi: 71, step: 'B', alter: 0, octave: 4, label: 'H' },
  { midi: 72, step: 'C', alter: 0, octave: 5, label: 'c' },
  { midi: 74, step: 'D', alter: 0, octave: 5, label: 'd' },
  { midi: 76, step: 'E', alter: 0, octave: 5, label: 'e' },
  { midi: 77, step: 'F', alter: 0, octave: 5, label: 'f' },
  { midi: 79, step: 'G', alter: 0, octave: 5, label: 'g' },
  { midi: 81, step: 'A', alter: 0, octave: 5, label: 'a' },
  { midi: 83, step: 'B', alter: 0, octave: 5, label: 'h' },
];

const blackKeys = [
  { midi: 61, step: 'C', alter: 1, octave: 4, afterWhiteIndex: 0 },
  { midi: 63, step: 'D', alter: 1, octave: 4, afterWhiteIndex: 1 },
  { midi: 66, step: 'F', alter: 1, octave: 4, afterWhiteIndex: 3 },
  { midi: 68, step: 'G', alter: 1, octave: 4, afterWhiteIndex: 4 },
  { midi: 70, step: 'A', alter: 1, octave: 4, afterWhiteIndex: 5 },
  { midi: 73, step: 'C', alter: 1, octave: 5, afterWhiteIndex: 7 },
  { midi: 75, step: 'D', alter: 1, octave: 5, afterWhiteIndex: 8 },
  { midi: 78, step: 'F', alter: 1, octave: 5, afterWhiteIndex: 10 },
  { midi: 80, step: 'G', alter: 1, octave: 5, afterWhiteIndex: 11 },
  { midi: 82, step: 'A', alter: 1, octave: 5, afterWhiteIndex: 12 },
];

const state = {
  notes: [],
  dot: false,
  restMode: false,
  audioContext: null,
  osmd: null,
  gesture: null,
};

function initKeyboard() {
  const whiteTemplate = document.getElementById('whiteKeyTemplate');
  const blackTemplate = document.getElementById('blackKeyTemplate');
  const totalWhite = whiteKeys.length;
  const whiteWidth = 100 / totalWhite;

  whiteKeys.forEach((key, idx) => {
    const el = whiteTemplate.content.firstElementChild.cloneNode(true);
    el.dataset.midi = String(key.midi);
    el.dataset.step = key.step;
    el.dataset.alter = String(key.alter);
    el.dataset.octave = String(key.octave);
    el.style.left = `${idx * whiteWidth}%`;
    el.style.width = `${whiteWidth}%`;
    el.querySelector('.key-label').textContent = key.label;
    keyboardSurface.appendChild(el);
  });

  blackKeys.forEach((key) => {
    const el = blackTemplate.content.firstElementChild.cloneNode(true);
    const left = (key.afterWhiteIndex + 1) * whiteWidth - whiteWidth * 0.33;
    el.dataset.midi = String(key.midi);
    el.dataset.step = key.step;
    el.dataset.alter = String(key.alter);
    el.dataset.octave = String(key.octave);
    el.style.left = `${left}%`;
    el.style.width = `${whiteWidth * (layoutState.blackWidth / 100)}%`;
    keyboardSurface.appendChild(el);
  });

  keyboardSurface.addEventListener('pointerdown', startFlickGesture, { passive: false });
  keyboardSurface.addEventListener('pointermove', moveFlickGesture, { passive: false });
  keyboardSurface.addEventListener('pointerup', endFlickGesture, { passive: false });
  keyboardSurface.addEventListener('pointercancel', cancelFlickGesture, { passive: false });
}

function startFlickGesture(ev) {
  ev.preventDefault();
  if (state.gesture) return;

  const target = document.elementFromPoint(ev.clientX, ev.clientY);
  const keyEl = target && target.closest('.key');
  if (!keyEl || !keyboardSurface.contains(keyEl)) return;

  ensureAudio();
  keyboardSurface.setPointerCapture?.(ev.pointerId);

  state.gesture = {
    pointerId: ev.pointerId,
    keyEl,
    startX: ev.clientX,
    startY: ev.clientY,
    durationName: 'quarter',
  };

  keyEl.classList.add('active');
  showFlickHud(ev.clientX, ev.clientY, 'quarter');

  // Soittotuntuma tulee heti painalluksesta. Nuotti kirjoitetaan vasta irrotettaessa.
  if (!state.restMode) playMidi(Number(keyEl.dataset.midi), 0.24);
}

function moveFlickGesture(ev) {
  if (!state.gesture || ev.pointerId !== state.gesture.pointerId) return;
  ev.preventDefault();
  const deltaY = state.gesture.startY - ev.clientY; // plus = ylöspäin
  const next = durationFromFlickDelta(deltaY);
  if (next !== state.gesture.durationName) {
    state.gesture.durationName = next;
    updateFlickHud(next);
  }
}

function endFlickGesture(ev) {
  if (!state.gesture || ev.pointerId !== state.gesture.pointerId) return;
  ev.preventDefault();
  const gesture = state.gesture;
  const deltaY = gesture.startY - ev.clientY;
  gesture.durationName = durationFromFlickDelta(deltaY);
  commitFlickGesture(gesture);
  finishFlickGesture();
}

function cancelFlickGesture(ev) {
  if (!state.gesture || ev.pointerId !== state.gesture.pointerId) return;
  finishFlickGesture();
}

function finishFlickGesture() {
  if (!state.gesture) return;
  state.gesture.keyEl.classList.remove('active');
  try { keyboardSurface.releasePointerCapture?.(state.gesture.pointerId); } catch {}
  state.gesture = null;
  flickHud.classList.remove('visible', 'rest');
  flickHud.setAttribute('aria-hidden', 'true');
}

function durationFromFlickDelta(deltaY) {
  const f = layoutState.flick;
  if (deltaY >= f.sixteenth) return '16th';
  if (deltaY >= f.eighth) return 'eighth';
  if (deltaY <= -f.whole) return 'whole';
  if (deltaY <= -f.half) return 'half';
  return 'quarter';
}

function showFlickHud(x, y, durationName) {
  const hudW = 112;
  const hudH = 204;
  const placeRight = x < window.innerWidth * 0.72;
  const left = placeRight ? x + 34 : x - hudW - 34;
  const top = y - hudH / 2;
  flickHud.style.left = `${clamp(left, 10, window.innerWidth - hudW - 10)}px`;
  flickHud.style.top = `${clamp(top, 10, window.innerHeight - hudH - 10)}px`;
  flickHud.classList.toggle('rest', state.restMode);
  flickHud.classList.add('visible');
  flickHud.setAttribute('aria-hidden', 'false');
  updateFlickHud(durationName);
}

function updateFlickHud(durationName) {
  flickHud.querySelectorAll('.flick-hud-item').forEach(el => {
    el.classList.toggle('active', el.dataset.duration === durationName);
  });
}

function commitFlickGesture(gesture) {
  const base = durationByName[gesture.durationName];
  if (!base) return;
  const durationUnits = state.dot ? Math.round(base.units * 1.5) : base.units;

  if (state.restMode) {
    addRest(durationUnits);
    return;
  }

  const keyEl = gesture.keyEl;
  state.notes.push({
    kind: 'note',
    step: keyEl.dataset.step,
    alter: Number(keyEl.dataset.alter || 0),
    octave: Number(keyEl.dataset.octave),
    units: durationUnits,
  });
  renderScore();
}

function loadLayoutState() {
  try {
    const saved = JSON.parse(localStorage.getItem(LAYOUT_STORAGE_KEY) || 'null');
    if (!saved) return structuredClone(defaultLayout);
    return {
      whiteWidth: Number(saved.whiteWidth) || defaultLayout.whiteWidth,
      keyboardHeight: Number(saved.keyboardHeight) || defaultLayout.keyboardHeight,
      blackWidth: Number(saved.blackWidth) || defaultLayout.blackWidth,
      blackHeight: Number(saved.blackHeight) || defaultLayout.blackHeight,
      flick: {
        eighth: Number(saved.flick?.eighth) || defaultLayout.flick.eighth,
        sixteenth: Number(saved.flick?.sixteenth) || defaultLayout.flick.sixteenth,
        half: Number(saved.flick?.half) || defaultLayout.flick.half,
        whole: Number(saved.flick?.whole) || defaultLayout.flick.whole,
      },
    };
  } catch {
    return structuredClone(defaultLayout);
  }
}

function saveLayoutState() {
  localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layoutState));
}

function normalizeFlickThresholds() {
  // Ulomman rajan täytyy aina olla sisempää suurempi.
  layoutState.flick.sixteenth = Math.max(layoutState.flick.sixteenth, layoutState.flick.eighth + 8);
  layoutState.flick.whole = Math.max(layoutState.flick.whole, layoutState.flick.half + 8);
}

function applyLayoutState({ save = true } = {}) {
  normalizeFlickThresholds();
  zonePanel.style.setProperty('--white-width-scale', String(layoutState.whiteWidth / 100));
  zonePanel.style.setProperty('--keyboard-height-scale', String(layoutState.keyboardHeight / 100));
  zonePanel.style.setProperty('--black-width-ratio', String(layoutState.blackWidth / 100));
  zonePanel.style.setProperty('--black-height-ratio', `${layoutState.blackHeight}%`);

  const totalWhite = whiteKeys.length;
  const whiteWidth = 100 / totalWhite;
  keyboardSurface.querySelectorAll('.black-key').forEach((el, idx) => {
    const key = blackKeys[idx];
    const left = (key.afterWhiteIndex + 1) * whiteWidth - whiteWidth * (layoutState.blackWidth / 100) / 2;
    el.style.left = `${left}%`;
    el.style.width = `${whiteWidth * (layoutState.blackWidth / 100)}%`;
  });

  syncLayoutControls();
  if (save) saveLayoutState();
}

function syncLayoutControls() {
  layoutControls.whiteWidth.value = String(layoutState.whiteWidth);
  layoutControls.keyboardHeight.value = String(layoutState.keyboardHeight);
  layoutControls.blackWidth.value = String(layoutState.blackWidth);
  layoutControls.blackHeight.value = String(layoutState.blackHeight);
  layoutControls.flickEighth.value = String(layoutState.flick.eighth);
  layoutControls.flickSixteenth.value = String(layoutState.flick.sixteenth);
  layoutControls.flickHalf.value = String(layoutState.flick.half);
  layoutControls.flickWhole.value = String(layoutState.flick.whole);

  layoutOutputs.whiteWidth.textContent = `${layoutState.whiteWidth} %`;
  layoutOutputs.keyboardHeight.textContent = `${layoutState.keyboardHeight} %`;
  layoutOutputs.blackWidth.textContent = `${layoutState.blackWidth} %`;
  layoutOutputs.blackHeight.textContent = `${layoutState.blackHeight} %`;
  layoutOutputs.flickEighth.textContent = `${layoutState.flick.eighth} px`;
  layoutOutputs.flickSixteenth.textContent = `${layoutState.flick.sixteenth} px`;
  layoutOutputs.flickHalf.textContent = `${layoutState.flick.half} px`;
  layoutOutputs.flickWhole.textContent = `${layoutState.flick.whole} px`;
}

function bindLayoutControls() {
  layoutControls.whiteWidth.addEventListener('input', e => { layoutState.whiteWidth = Number(e.target.value); applyLayoutState(); });
  layoutControls.keyboardHeight.addEventListener('input', e => { layoutState.keyboardHeight = Number(e.target.value); applyLayoutState(); });
  layoutControls.blackWidth.addEventListener('input', e => { layoutState.blackWidth = Number(e.target.value); applyLayoutState(); });
  layoutControls.blackHeight.addEventListener('input', e => { layoutState.blackHeight = Number(e.target.value); applyLayoutState(); });
  layoutControls.flickEighth.addEventListener('input', e => { layoutState.flick.eighth = Number(e.target.value); applyLayoutState(); });
  layoutControls.flickSixteenth.addEventListener('input', e => { layoutState.flick.sixteenth = Number(e.target.value); applyLayoutState(); });
  layoutControls.flickHalf.addEventListener('input', e => { layoutState.flick.half = Number(e.target.value); applyLayoutState(); });
  layoutControls.flickWhole.addEventListener('input', e => { layoutState.flick.whole = Number(e.target.value); applyLayoutState(); });
}

function setLayoutPanelOpen(open) {
  layoutPanel.classList.toggle('open', open);
  layoutPanel.setAttribute('aria-hidden', String(!open));
}

function addRest(units) {
  state.notes.push({ kind: 'rest', units });
  renderScore();
}

function durationUnitsToSeconds(units) {
  const bpm = clamp(Number(bpmInput.value) || 100, 30, 240);
  const quarterSecs = 60 / bpm;
  return quarterSecs * (units / divisions);
}

function flashKey(keyEl) {
  keyEl.classList.add('active');
  setTimeout(() => keyEl.classList.remove('active'), 130);
}

function ensureAudio() {
  if (!state.audioContext) {
    state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (state.audioContext.state === 'suspended') state.audioContext.resume();
}

function playMidi(midi, seconds = 0.45) {
  ensureAudio();
  const ctx = state.audioContext;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const freq = 440 * Math.pow(2, (midi - 69) / 12);
  osc.type = 'triangle';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + Math.max(0.18, Math.min(seconds, 1.2)));
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + Math.max(0.22, Math.min(seconds + 0.08, 1.4)));
}

function adjustTempo(delta) {
  const value = clamp((Number(bpmInput.value) || 100) + delta, 30, 240);
  bpmInput.value = String(value);
  renderScore();
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function getMeasureUnits() {
  const beats = Number(beatsSelect.value);
  const beatType = Number(beatTypeSelect.value);
  return (beats * divisions * 4) / beatType;
}

function splitUnitsGreedy(total) {
  const out = [];
  let remain = total;
  while (remain > 0) {
    const piece = allowedPieces.find(p => p <= remain);
    if (!piece) throw new Error(`Kestoa ei voitu jakaa: ${total}`);
    out.push(piece);
    remain -= piece;
  }
  return out;
}

function createEventsForScore() {
  const measureUnits = getMeasureUnits();
  const measures = [];
  let currentMeasure = [];
  let currentUnits = 0;

  const pushMeasure = () => {
    measures.push(currentMeasure);
    currentMeasure = [];
    currentUnits = 0;
  };

  const appendSegments = (entry) => {
    let remain = entry.units;
    let firstSegment = true;
    while (remain > 0) {
      const room = measureUnits - currentUnits;
      const take = Math.min(remain, room);
      const pieces = splitUnitsGreedy(take);

      pieces.forEach((piece, idx) => {
        const seg = {
          kind: entry.kind,
          units: piece,
          step: entry.step,
          alter: entry.alter,
          octave: entry.octave,
          tieStart: false,
          tieStop: false,
        };
        currentMeasure.push(seg);
        currentUnits += piece;

        const moreWithinSource = (idx < pieces.length - 1) || (remain - take > 0);
        if (entry.kind === 'note' && (moreWithinSource || !firstSegment)) {
          if (firstSegment && idx === 0) seg.tieStart = moreWithinSource;
          else {
            seg.tieStop = true;
            seg.tieStart = moreWithinSource;
          }
        }
      });

      remain -= take;
      firstSegment = false;
      if (currentUnits >= measureUnits - 1e-9) {
        pushMeasure();
      }
    }
  };

  state.notes.forEach(entry => appendSegments(entry));

  if (currentMeasure.length > 0 || measures.length === 0) {
    if (currentUnits < measureUnits) {
      const remainingPieces = splitUnitsGreedy(measureUnits - currentUnits);
      remainingPieces.forEach(piece => currentMeasure.push({ kind: 'restHidden', units: piece }));
    }
    measures.push(currentMeasure);
  }

  if (state.notes.length === 0) {
    measures[0] = [{ kind: 'restHidden', units: getMeasureUnits() }];
  }

  return measures;
}

function escapeXml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function noteToXml(seg) {
  const dur = durationMapByUnits.get(seg.units);
  if (!dur) throw new Error(`Tuntematon kesto: ${seg.units}`);

  if (seg.kind === 'restHidden') {
    return `<note print-object="no"><rest/><duration>${seg.units}</duration><type>${dur.type}</type>${dur.dots ? '<dot/>' : ''}</note>`;
  }

  const isRest = seg.kind === 'rest';
  const pitchXml = isRest
    ? '<rest/>'
    : `<pitch><step>${seg.step}</step>${seg.alter ? `<alter>${seg.alter}</alter>` : ''}<octave>${seg.octave}</octave></pitch>`;

  return `
    <note>
      ${pitchXml}
      <duration>${seg.units}</duration>
      ${seg.tieStop ? '<tie type="stop"/>' : ''}
      ${seg.tieStart ? '<tie type="start"/>' : ''}
      <voice>1</voice>
      <type>${dur.type}</type>
      ${dur.dots ? '<dot/>' : ''}
      <stem>up</stem>
      ${(!isRest && (seg.tieStart || seg.tieStop)) ? `<notations>${seg.tieStop ? '<tied type="stop"/>' : ''}${seg.tieStart ? '<tied type="start"/>' : ''}</notations>` : ''}
    </note>`;
}

function buildMusicXml() {
  const measures = createEventsForScore();
  const beats = Number(beatsSelect.value);
  const beatType = Number(beatTypeSelect.value);
  const fifths = Number(keySelect.value);
  const mode = modeSelect.value;
  const title = escapeXml(titleInput.value || 'Uusi kappale');
  const composer = escapeXml(composerInput.value || '');
  const tempoText = escapeXml(tempoTextInput.value || '');
  const bpm = clamp(Number(bpmInput.value) || 100, 30, 240);

  const measureXml = measures.map((measure, i) => {
    const number = i + 1;
    const attrs = i === 0 ? `
      <attributes>
        <divisions>${divisions}</divisions>
        <key><fifths>${fifths}</fifths><mode>${mode}</mode></key>
        <time><beats>${beats}</beats><beat-type>${beatType}</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <direction placement="above">
        <direction-type>
          <words font-style="italic">${tempoText}</words>
        </direction-type>
        <sound tempo="${bpm}"/>
      </direction>` : '';
    const notesXml = measure.map(noteToXml).join('');
    return `<measure number="${number}">${attrs}${notesXml}</measure>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <work><work-title>${title}</work-title></work>
  <identification><creator type="composer">${composer}</creator></identification>
  <part-list>
    <score-part id="P1"><part-name>Music</part-name></score-part>
  </part-list>
  <part id="P1">
    ${measureXml}
  </part>
</score-partwise>`;
}

async function renderScore() {
  try {
    statusText.textContent = 'Renderöidään…';
    const xml = buildMusicXml();
    if (!state.osmd) {
      state.osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay(osmdContainer, {
        autoResize: true,
        backend: 'svg',
        drawingParameters: 'compacttight',
        drawTitle: true,
        drawComposer: true,
        drawPartNames: false,
        pageFormat: 'Endless',
      });
    }
    await state.osmd.load(xml);
    state.osmd.zoom = 1.08;
    await state.osmd.render();
    statusText.textContent = 'Valmis';
  } catch (err) {
    console.error(err);
    statusText.textContent = 'Nuottikuvan renderöinti epäonnistui';
  }
}

function updateToggleButtons() {
  dotToggle.classList.toggle('active', state.dot);
  dotToggle.textContent = state.dot ? '• piste: päällä' : '• piste: pois';
  restToggle.classList.toggle('active', state.restMode);
  restToggle.textContent = state.restMode ? '𝄽 tauko: päällä' : '𝄽 tauko: pois';
}

dotToggle.addEventListener('click', () => {
  state.dot = !state.dot;
  updateToggleButtons();
});

restToggle.addEventListener('click', () => {
  state.restMode = !state.restMode;
  updateToggleButtons();
});

undoBtn.addEventListener('click', () => {
  state.notes.pop();
  renderScore();
});

clearBtn.addEventListener('click', () => {
  state.notes = [];
  renderScore();
});

[titleInput, composerInput, tempoTextInput, bpmInput, beatsSelect, beatTypeSelect, keySelect, modeSelect].forEach(el => {
  el.addEventListener('input', renderScore);
  el.addEventListener('change', renderScore);
});

playScaleBtn.addEventListener('click', async () => {
  ensureAudio();
  const mids = whiteKeys.slice(0, 8).map(k => k.midi);
  for (let i = 0; i < mids.length; i++) {
    playMidi(mids[i], 0.25);
    await new Promise(r => setTimeout(r, 170));
  }
});

function scheduleOsmdResizeRender() {
  if (!state.osmd) return;
  clearTimeout(window.__osmdResizeTimer);
  window.__osmdResizeTimer = setTimeout(async () => {
    try {
      // OSMD laskee järjestelmäleveyden containerin nykyisestä leveydestä renderöinnissä.
      // Zoom pidetään ennallaan, mutta koko partituuri kaiverretaan uudelleen.
      await state.osmd.render();
    } catch (err) {
      console.warn('OSMD resize render failed', err);
    }
  }, 90);
}

window.addEventListener('resize', scheduleOsmdResizeRender);

// ResizeObserver huomaa myös sellaiset layout-muutokset, jotka eivät laukaise window.resize-tapahtumaa.
if ('ResizeObserver' in window) {
  const osmdResizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;
    const width = Math.round(entry.contentRect.width);
    if (!width || width === window.__lastOsmdWidth) return;
    window.__lastOsmdWidth = width;
    scheduleOsmdResizeRender();
  });
  osmdResizeObserver.observe(osmdContainer);
}

layoutToggle.addEventListener('click', () => setLayoutPanelOpen(!layoutPanel.classList.contains('open')));
layoutClose.addEventListener('click', () => setLayoutPanelOpen(false));

document.getElementById('layoutReset').addEventListener('click', () => {
  layoutState = structuredClone(defaultLayout);
  applyLayoutState();
});

document.getElementById('layoutCopy').addEventListener('click', async () => {
  const payload = [
    `Valkoinen leveys: ${layoutState.whiteWidth}%`,
    `Koskettimiston korkeus: ${layoutState.keyboardHeight}%`,
    `Musta leveys: ${layoutState.blackWidth}%`,
    `Musta korkeus: ${layoutState.blackHeight}%`,
    `Flick 1/8: +${layoutState.flick.eighth}px`,
    `Flick 1/16: +${layoutState.flick.sixteenth}px`,
    `Flick 1/2: -${layoutState.flick.half}px`,
    `Flick koko: -${layoutState.flick.whole}px`
  ].join('\n');
  try {
    await navigator.clipboard.writeText(payload);
    statusText.textContent = 'Asetteluarvot kopioitu';
    setTimeout(() => statusText.textContent = 'Valmis', 1200);
  } catch {
    window.prompt('Kopioi arvot:', payload);
  }
});

bindLayoutControls();
initKeyboard();
applyLayoutState({ save: false });
updateToggleButtons();
renderScore();
