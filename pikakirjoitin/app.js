const osmdContainer = document.getElementById('osmdContainer');
const appShell = document.getElementById('appShell');
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
const flickCursorShorter = document.getElementById('flickCursorShorter');
const flickCursorCurrent = document.getElementById('flickCursorCurrent');
const flickCursorLonger = document.getElementById('flickCursorLonger');
const rightHandBtn = document.getElementById('rightHandBtn');
const leftHandBtn = document.getElementById('leftHandBtn');

const layoutControls = {
  whiteWidth: document.getElementById('whiteWidthSlider'),
  keyboardHeight: document.getElementById('keyboardHeightSlider'),
  blackWidth: document.getElementById('blackWidthSlider'),
  blackHeight: document.getElementById('blackHeightSlider'),
  flickEighth: document.getElementById('flickEighthSlider'),
  flickHalf: document.getElementById('flickHalfSlider'),
  longPress: document.getElementById('longPressSlider'),
};

const layoutOutputs = {
  whiteWidth: document.getElementById('whiteWidthOut'),
  keyboardHeight: document.getElementById('keyboardHeightOut'),
  blackWidth: document.getElementById('blackWidthOut'),
  blackHeight: document.getElementById('blackHeightOut'),
  flickEighth: document.getElementById('flickEighthOut'),
  flickHalf: document.getElementById('flickHalfOut'),
  longPress: document.getElementById('longPressOut'),
};

const LAYOUT_STORAGE_KEY = 'melody-writer-flick-layout-v1';
const defaultLayout = {
  handedness: 'right',
  whiteWidth: 100,
  keyboardHeight: 100,
  blackWidth: 66,
  blackHeight: 56,
  flick: {
    eighth: 26,
    half: 26,
    longPressMs: 550,
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
  currentDurationName: 'quarter',
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

  const target = document.elementFromPoint(ev.clientX, ev.clientY);
  const keyEl = target && target.closest('.key');
  if (!keyEl || !keyboardSurface.contains(keyEl)) return;

  // Toinen sormi muuttaa keskeneräisen yhden sormen eleen Undo-eleeksi.
  // Sormien ei tarvitse osua samalle koskettimelle.
  if (state.gesture) {
    const gesture = state.gesture;
    if (ev.pointerType === 'touch' && gesture.pointerType === 'touch' && !gesture.twoFingerUndo) {
      keyboardSurface.setPointerCapture?.(ev.pointerId);
      clearLongPressTimer(gesture);
      gesture.keyEl.classList.remove('active');
      gesture.twoFingerUndo = {
        pointerIds: new Set([gesture.pointerId, ev.pointerId]),
        starts: new Map([
          [gesture.pointerId, { x: gesture.startX, y: gesture.startY }],
          [ev.pointerId, { x: ev.clientX, y: ev.clientY }],
        ]),
        moved: false,
      };
      hideFlickHud();
    }
    return;
  }

  ensureAudio();
  keyboardSurface.setPointerCapture?.(ev.pointerId);

  state.gesture = {
    pointerId: ev.pointerId,
    pointerType: ev.pointerType,
    keyEl,
    startX: ev.clientX,
    startY: ev.clientY,
    durationName: 'quarter',
    dottedByRightSweep: false,
    longPressLocked: false,
    longPressTimer: null,
  };

  keyEl.classList.add('active');
  showFlickHud(ev.clientX, ev.clientY, 'quarter');

  // Pitkä paikallaan pysyvä painallus lukitsee kokonuotin.
  state.gesture.longPressTimer = window.setTimeout(() => {
    const g = state.gesture;
    if (!g || g.pointerId !== ev.pointerId) return;
    g.longPressLocked = true;
    g.durationName = 'whole';
    updateFlickHud('whole');
  }, layoutState.flick.longPressMs);

  // Soittotuntuma tulee heti painalluksesta. Nuotti kirjoitetaan vasta irrotettaessa.
  if (!state.restMode) playMidi(Number(keyEl.dataset.midi), 0.24);
}

function moveFlickGesture(ev) {
  if (!state.gesture) return;
  const undoGesture = state.gesture.twoFingerUndo;
  if (undoGesture?.pointerIds.has(ev.pointerId)) {
    ev.preventDefault();
    const start = undoGesture.starts.get(ev.pointerId);
    if (start && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 24) {
      undoGesture.moved = true;
    }
    return;
  }
  if (ev.pointerId !== state.gesture.pointerId) return;
  ev.preventDefault();
  const gesture = state.gesture;
  const deltaX = ev.clientX - gesture.startX;
  const deltaY = gesture.startY - ev.clientY; // plus = ylöspäin

  // Luonnollinen pieni sormivapina sallitaan. Selvä liike peruu pitkän painalluksen.
  if (!gesture.longPressLocked && (Math.abs(deltaY) > 12 || Math.abs(deltaX) > 18)) {
    clearLongPressTimer(gesture);
  }

  if (gesture.longPressLocked) return;

  const next = durationFromFlickDelta(deltaY);
  gesture.dottedByRightSweep =
    next === 'quarter' &&
    deltaX >= 48 &&
    Math.abs(deltaY) <= 14;

  if (next !== gesture.durationName) {
    gesture.durationName = next;
  }
  updateFlickHud(next);
}

function endFlickGesture(ev) {
  if (!state.gesture) return;
  const undoGesture = state.gesture.twoFingerUndo;
  if (undoGesture?.pointerIds.has(ev.pointerId)) {
    ev.preventDefault();
    undoGesture.pointerIds.delete(ev.pointerId);
    try { keyboardSurface.releasePointerCapture?.(ev.pointerId); } catch {}
    if (undoGesture.pointerIds.size === 0) {
      if (!undoGesture.moved) undoLastNoteWithFeedback();
      finishFlickGesture();
    }
    return;
  }
  if (ev.pointerId !== state.gesture.pointerId) return;
  ev.preventDefault();
  const gesture = state.gesture;
  clearLongPressTimer(gesture);
  if (!gesture.longPressLocked) {
    const deltaX = ev.clientX - gesture.startX;
    const deltaY = gesture.startY - ev.clientY;
    gesture.durationName = durationFromFlickDelta(deltaY);
    gesture.dottedByRightSweep =
      gesture.durationName === 'quarter' &&
      deltaX >= 48 &&
      Math.abs(deltaY) <= 14;
  }
  commitFlickGesture(gesture);
  finishFlickGesture();
}

function cancelFlickGesture(ev) {
  if (!state.gesture) return;
  const undoGesture = state.gesture.twoFingerUndo;
  if (undoGesture?.pointerIds.has(ev.pointerId)) {
    undoGesture.moved = true;
    undoGesture.pointerIds.delete(ev.pointerId);
    if (undoGesture.pointerIds.size === 0) finishFlickGesture();
    return;
  }
  if (ev.pointerId !== state.gesture.pointerId) return;
  finishFlickGesture();
}

function clearLongPressTimer(gesture) {
  if (!gesture?.longPressTimer) return;
  clearTimeout(gesture.longPressTimer);
  gesture.longPressTimer = null;
}

function finishFlickGesture() {
  if (!state.gesture) return;
  clearLongPressTimer(state.gesture);
  state.gesture.keyEl.classList.remove('active');
  try { keyboardSurface.releasePointerCapture?.(state.gesture.pointerId); } catch {}
  state.gesture = null;
  hideFlickHud();
}

function hideFlickHud() {
  flickHud.classList.remove('visible', 'rest');
  flickHud.setAttribute('aria-hidden', 'true');
}

function undoLastNoteWithFeedback() {
  if (state.notes.length > 0) {
    state.notes.pop();
    renderScore();
    statusText.textContent = 'Kumottu';
  } else {
    statusText.textContent = 'Ei kumottavaa';
  }
  clearTimeout(window.__undoFeedbackTimer);
  window.__undoFeedbackTimer = setTimeout(() => {
    statusText.textContent = 'Valmis';
  }, 900);
}

const durationOrder = ['whole', 'half', 'quarter', 'eighth', '16th'];

function shiftDuration(baseName, steps) {
  const index = durationOrder.indexOf(baseName);
  const safeIndex = index >= 0 ? index : durationOrder.indexOf('quarter');
  return durationOrder[clamp(safeIndex + steps, 0, durationOrder.length - 1)];
}

function durationFromFlickDelta(deltaY) {
  const f = layoutState.flick;

  // Ylös = 1/2, tap = 1/4, alas = 1/8.
  // Kokonuotti syntyy vain pitkällä paikallaan pidetyllä painalluksella.
  if (deltaY >= f.half) return 'half';
  if (deltaY <= -f.eighth) return 'eighth';
  return 'quarter';
}

function showFlickHud(x, y, durationName) {
  const hudW = 82;
  const hudH = 154;
  const gap = 28;

  // Palaute keskitetään sormen yläpuolelle. Näin se näkyy samalla tavalla
  // kummallakin kädellä eikä sormi peitä valittua aika-arvoa.
  const left = x - hudW / 2;
  const top = y - hudH - gap;
  flickHud.style.left = `${clamp(left, 10, window.innerWidth - hudW - 10)}px`;
  flickHud.style.top = `${clamp(top, 10, window.innerHeight - hudH - 10)}px`;
  flickHud.dataset.side = 'above';
  flickHud.classList.toggle('rest', state.restMode);
  flickHud.classList.add('visible');
  flickHud.setAttribute('aria-hidden', 'false');
  updateFlickHud(durationName);
}

function updateFlickHud(durationName) {
  if (durationName === 'whole') {
    setFlickDurationOption(flickCursorShorter, null);
    setFlickDurationOption(flickCursorCurrent, 'whole');
    setFlickDurationOption(flickCursorLonger, null);
    return;
  }

  setFlickDurationOption(flickCursorShorter, 'half');
  setFlickDurationOption(flickCursorCurrent, durationName);
  setFlickDurationOption(flickCursorLonger, 'eighth');
}

function setFlickDurationOption(element, durationName) {
  const symbols = {
    '16th': ['𝅘𝅥𝅯', '1/16'],
    eighth: ['♪', '1/8'],
    quarter: ['♩', '1/4'],
    half: ['𝅗𝅥', '1/2'],
    whole: ['𝅝', 'koko'],
  };
  const symbolEl = element.querySelector('.flick-duration-symbol');
  const labelEl = element.querySelector('.flick-duration-label');
  const available = Boolean(durationName && symbols[durationName]);
  element.classList.toggle('unavailable', !available);
  if (!available) return;
  const [symbol, label] = symbols[durationName];
  symbolEl.textContent = symbol;
  labelEl.textContent = label;
}

function commitFlickGesture(gesture) {
  const base = durationByName[gesture.durationName];
  if (!base) return;

  const useDot = state.dot || gesture.dottedByRightSweep;
  const durationUnits = useDot ? Math.round(base.units * 1.5) : base.units;

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
      handedness: saved.handedness === 'left' ? 'left' : 'right',
      whiteWidth: Number(saved.whiteWidth) || defaultLayout.whiteWidth,
      keyboardHeight: Number(saved.keyboardHeight) || defaultLayout.keyboardHeight,
      blackWidth: Number(saved.blackWidth) || defaultLayout.blackWidth,
      blackHeight: Number(saved.blackHeight) || defaultLayout.blackHeight,
      flick: {
        eighth: Number(saved.flick?.eighth) || defaultLayout.flick.eighth,
        half: Number(saved.flick?.half) || defaultLayout.flick.half,
        longPressMs: Number(saved.flick?.longPressMs) || defaultLayout.flick.longPressMs,
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
  layoutState.flick.longPressMs = clamp(layoutState.flick.longPressMs, 300, 1200);
}

function applyLayoutState({ save = true } = {}) {
  normalizeFlickThresholds();
  appShell.classList.toggle('left-handed', layoutState.handedness === 'left');
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
  rightHandBtn.classList.toggle('active', layoutState.handedness === 'right');
  leftHandBtn.classList.toggle('active', layoutState.handedness === 'left');
  rightHandBtn.setAttribute('aria-pressed', String(layoutState.handedness === 'right'));
  leftHandBtn.setAttribute('aria-pressed', String(layoutState.handedness === 'left'));

  layoutControls.whiteWidth.value = String(layoutState.whiteWidth);
  layoutControls.keyboardHeight.value = String(layoutState.keyboardHeight);
  layoutControls.blackWidth.value = String(layoutState.blackWidth);
  layoutControls.blackHeight.value = String(layoutState.blackHeight);
  layoutControls.flickEighth.value = String(layoutState.flick.eighth);
  layoutControls.flickHalf.value = String(layoutState.flick.half);
  layoutControls.longPress.value = String(layoutState.flick.longPressMs);

  layoutOutputs.whiteWidth.textContent = `${layoutState.whiteWidth} %`;
  layoutOutputs.keyboardHeight.textContent = `${layoutState.keyboardHeight} %`;
  layoutOutputs.blackWidth.textContent = `${layoutState.blackWidth} %`;
  layoutOutputs.blackHeight.textContent = `${layoutState.blackHeight} %`;
  layoutOutputs.flickEighth.textContent = `${layoutState.flick.eighth} px`;
  layoutOutputs.flickHalf.textContent = `${layoutState.flick.half} px`;
  layoutOutputs.longPress.textContent = `${layoutState.flick.longPressMs} ms`;
}

function bindLayoutControls() {
  rightHandBtn.addEventListener('click', () => { layoutState.handedness = 'right'; applyLayoutState(); });
  leftHandBtn.addEventListener('click', () => { layoutState.handedness = 'left'; applyLayoutState(); });

  layoutControls.whiteWidth.addEventListener('input', e => { layoutState.whiteWidth = Number(e.target.value); applyLayoutState(); });
  layoutControls.keyboardHeight.addEventListener('input', e => { layoutState.keyboardHeight = Number(e.target.value); applyLayoutState(); });
  layoutControls.blackWidth.addEventListener('input', e => { layoutState.blackWidth = Number(e.target.value); applyLayoutState(); });
  layoutControls.blackHeight.addEventListener('input', e => { layoutState.blackHeight = Number(e.target.value); applyLayoutState(); });
  layoutControls.flickEighth.addEventListener('input', e => { layoutState.flick.eighth = Number(e.target.value); applyLayoutState(); });
  layoutControls.flickHalf.addEventListener('input', e => { layoutState.flick.half = Number(e.target.value); applyLayoutState(); });
  layoutControls.longPress.addEventListener('input', e => { layoutState.flick.longPressMs = Number(e.target.value); applyLayoutState(); });
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


function annotateDefaultBeams(measure) {
  // Oletuspalkitus: peräkkäiset 1/8-nuotit pareittain ja 1/16-nuotit neljän ryhmiin.
  // Tauko, eri aika-arvo tai tahdin raja katkaisee ryhmän.
  const annotateRuns = (units, groupSize, beamLevels) => {
    let run = [];

    const flush = () => {
      for (let start = 0; start + groupSize <= run.length; start += groupSize) {
        const group = run.slice(start, start + groupSize);
        group.forEach((seg, index) => {
          const value = index === 0 ? 'begin' : index === group.length - 1 ? 'end' : 'continue';
          seg.beams = beamLevels.map(number => ({ number, value }));
        });
      }
      run = [];
    };

    measure.forEach(seg => {
      if (seg.kind === 'note' && seg.units === units) {
        run.push(seg);
      } else {
        flush();
      }
    });
    flush();
  };

  measure.forEach(seg => { delete seg.beams; });
  annotateRuns(4, 2, [1]);       // 1/8: kaksi nuottia samaan palkkiin
  annotateRuns(2, 4, [1, 2]);    // 1/16: neljä nuottia, kaksi palkkitasoa
  return measure;
}

function beamXml(seg) {
  if (!seg.beams?.length) return '';
  return seg.beams.map(beam => `<beam number="${beam.number}">${beam.value}</beam>`).join('');
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
      ${!isRest ? beamXml(seg) : ''}
      ${(!isRest && (seg.tieStart || seg.tieStop)) ? `<notations>${seg.tieStop ? '<tied type="stop"/>' : ''}${seg.tieStart ? '<tied type="start"/>' : ''}</notations>` : ''}
    </note>`;
}

function buildMusicXml() {
  const measures = createEventsForScore().map(annotateDefaultBeams);
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
  undoLastNoteWithFeedback();
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
    `Kätisyys: ${layoutState.handedness === 'right' ? 'Oikea käsi' : 'Vasen käsi'}`,
    `Valkoinen leveys: ${layoutState.whiteWidth}%`,
    `Koskettimiston korkeus: ${layoutState.keyboardHeight}%`,
    `Musta leveys: ${layoutState.blackWidth}%`,
    `Musta korkeus: ${layoutState.blackHeight}%`,
    `Sweep alas → 1/8: ${layoutState.flick.eighth}px`,
    `Sweep ylös → 1/2: ${layoutState.flick.half}px`,
    `Pitkä painallus → koko: ${layoutState.flick.longPressMs}ms`
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
