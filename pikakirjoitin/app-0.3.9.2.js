const osmdContainer = document.getElementById('osmdContainer');
const appShell = document.getElementById('appShell');
const keyboardSurface = document.getElementById('keyboardSurface');
const keyboardViewport = document.getElementById('keyboardViewport');
const octavePrevBtn = document.getElementById('octavePrevBtn');
const octaveNextBtn = document.getElementById('octaveNextBtn');
const octaveRail = document.getElementById('octaveRail');
const octaveRangeLabel = document.getElementById('octaveRangeLabel');
const octaveWindowMarker = document.getElementById('octaveWindowMarker');
const statusText = document.getElementById('statusText');
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
const dotShiftBtn = document.getElementById('dotShiftBtn');
const sixteenthShiftBtn = document.getElementById('sixteenthShiftBtn');
const restShiftBtn = document.getElementById('restShiftBtn');
const systemBreakBtn = document.getElementById('systemBreakBtn');
const stretchLastLineBtn = document.getElementById('stretchLastLineBtn');
const selectNotesBtn = document.getElementById('selectNotesBtn');
const selectionToolbar = document.getElementById('selectionToolbar');
const selectionCount = document.getElementById('selectionCount');
const selectionSlurBtn = document.getElementById('selectionSlurBtn');
const selectionStaccatoBtn = document.getElementById('selectionStaccatoBtn');
const selectionPortatoBtn = document.getElementById('selectionPortatoBtn');
const selectionAccentBtn = document.getElementById('selectionAccentBtn');
const selectionDynamicSelect = document.getElementById('selectionDynamicSelect');
const selectionCrescendoBtn = document.getElementById('selectionCrescendoBtn');
const selectionDiminuendoBtn = document.getElementById('selectionDiminuendoBtn');
const selectionClearBtn = document.getElementById('selectionClearBtn');
const songPanel = document.getElementById('songPanel');
const songPanelToggle = document.getElementById('songPanelToggle');
const songPanelClose = document.getElementById('songPanelClose');
const songPanelDone = document.getElementById('songPanelDone');
const songPanelBackdrop = document.getElementById('songPanelBackdrop');
const mainColumn = document.querySelector('.main-column');
const scoreKeyboardDivider = document.getElementById('scoreKeyboardDivider');
const layoutJsonExport = document.getElementById('layoutJsonExport');
const layoutJsonImport = document.getElementById('layoutJsonImport');
const layoutJsonFile = document.getElementById('layoutJsonFile');
const scoreShareOut = document.getElementById('scoreShareOut');
const noteSpacingSlider = document.getElementById('noteSpacingSlider');
const noteSpacingOut = document.getElementById('noteSpacingOut');
const printScoreBtn = document.getElementById('printScoreBtn');
const pdfShareBtn = document.getElementById('pdfShareBtn');
const pdfShareBtnLabel = document.getElementById('pdfShareBtnLabel');
const documentActionStatus = document.getElementById('documentActionStatus');
const projectSaveBtn = document.getElementById('projectSaveBtn');
const projectLoadBtn = document.getElementById('projectLoadBtn');
const projectFileInput = document.getElementById('projectFileInput');
const projectActionStatus = document.getElementById('projectActionStatus');
const recentProjectsList = document.getElementById('recentProjectsList');
const printWatermarkToggle = document.getElementById('printWatermarkToggle');
const printWatermarkState = document.getElementById('printWatermarkState');
const pitchNameToggle = document.getElementById('pitchNameToggle');
const pitchNameState = document.getElementById('pitchNameState');
const PRINT_WATERMARK_TEXT = 'HUILUSTUDIO · KOKEILUVERSIO';

const layoutControls = {
  scoreZoom: document.getElementById('scoreZoomSlider'),
  systemSpacing: document.getElementById('systemSpacingSlider'),
  marginLeft: document.getElementById('marginLeftSlider'),
  marginRight: document.getElementById('marginRightSlider'),
  marginTop: document.getElementById('marginTopSlider'),
  marginBottom: document.getElementById('marginBottomSlider'),
  whiteWidth: document.getElementById('whiteWidthSlider'),
  keyboardHeight: document.getElementById('keyboardHeightSlider'),
  blackWidth: document.getElementById('blackWidthSlider'),
  blackHeight: document.getElementById('blackHeightSlider'),
  flickEighth: document.getElementById('flickEighthSlider'),
  flickHalf: document.getElementById('flickHalfSlider'),
  longPress: document.getElementById('longPressSlider'),
};

const layoutOutputs = {
  scoreZoom: document.getElementById('scoreZoomOut'),
  systemSpacing: document.getElementById('systemSpacingOut'),
  marginLeft: document.getElementById('marginLeftOut'),
  marginRight: document.getElementById('marginRightOut'),
  marginTop: document.getElementById('marginTopOut'),
  marginBottom: document.getElementById('marginBottomOut'),
  whiteWidth: document.getElementById('whiteWidthOut'),
  keyboardHeight: document.getElementById('keyboardHeightOut'),
  blackWidth: document.getElementById('blackWidthOut'),
  blackHeight: document.getElementById('blackHeightOut'),
  flickEighth: document.getElementById('flickEighthOut'),
  flickHalf: document.getElementById('flickHalfOut'),
  longPress: document.getElementById('longPressOut'),
};

const scoreTextControls = {
  title: {
    size: document.getElementById('titleSizeSlider'),
    x: document.getElementById('titleXSlider'),
    y: document.getElementById('titleYSlider'),
  },
  composer: {
    size: document.getElementById('composerSizeSlider'),
    x: document.getElementById('composerXSlider'),
    y: document.getElementById('composerYSlider'),
  },
  tempo: {
    size: document.getElementById('tempoSizeSlider'),
    x: document.getElementById('tempoXSlider'),
    y: document.getElementById('tempoYSlider'),
  },
};

const scoreTextOutputs = {
  title: {
    size: document.getElementById('titleSizeOut'),
    x: document.getElementById('titleXOut'),
    y: document.getElementById('titleYOut'),
  },
  composer: {
    size: document.getElementById('composerSizeOut'),
    x: document.getElementById('composerXOut'),
    y: document.getElementById('composerYOut'),
  },
  tempo: {
    size: document.getElementById('tempoSizeOut'),
    x: document.getElementById('tempoXOut'),
    y: document.getElementById('tempoYOut'),
  },
};

const SCORE_TEXT_ROLES = ['title', 'composer', 'tempo'];

const LAYOUT_STORAGE_KEY = 'melody-writer-flick-layout-v1';
const LAYOUT_DEFAULTS_VERSION = 3;
const PROJECT_FORMAT = 'Pikakirjoitin project';
const PROJECT_FORMAT_VERSION = 1;
const PROJECT_APP_VERSION = '0.3.9.1';
const PROJECT_AUTOSAVE_KEY = 'pikakirjoitin-project-autosave-v1';
const RECENT_PROJECTS_DB_NAME = 'pikakirjoitin-recent-projects';
const RECENT_PROJECTS_STORE = 'projects';
const RECENT_PROJECTS_LIMIT = 10;
const defaultLayout = {
  defaultsVersion: LAYOUT_DEFAULTS_VERSION,
  handedness: 'right',
  scoreShare: 70,
  noteSpacing: 100,
  scoreZoom: 100,
  systemSpacing: 500,
  pitchNames: true,
  printWatermark: true,
  scoreText: {
    title: { size: 90, x: 0, y: -30 },
    composer: { size: 100, x: 0, y: 15 },
    tempo: { size: 100, x: 55, y: 0 },
  },
  margins: {
    left: 2,
    right: 2,
    top: 5,
    bottom: 0,
  },
  whiteWidth: 100,
  keyboardHeight: 100,
  blackWidth: 43,
  blackHeight: 46,
  flick: {
    eighth: 26,
    half: 26,
    longPressMs: 550,
  },
};

let layoutState = loadLayoutState();
let stretchLastLineOnceRequested = false;
let stretchLastLineCommandRunning = false;
let scoreRenderRevision = 0;
let pdfActionRunning = false;
let cachedPdfFile = null;
let cachedPdfSignature = '';
let projectAutosaveEnabled = false;
let projectAutosaveTimer = null;
let currentProjectId = createProjectId();
let suppressCurrentProjectInRecents = false;
let recentProjectsDbPromise = null;
let recentProjectsWriteQueue = Promise.resolve();

const titleInput = document.getElementById('titleInput');
const startupOverlay = document.getElementById('startupOverlay');
const startupTitleInput = document.getElementById('startupTitleInput');
const startupBeginBtn = document.getElementById('startupBeginBtn');
const startupHint = document.getElementById('startupHint');
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
  { midi: 72, step: 'C', alter: 0, octave: 5, label: 'C' },
  { midi: 74, step: 'D', alter: 0, octave: 5, label: 'D' },
  { midi: 76, step: 'E', alter: 0, octave: 5, label: 'E' },
  { midi: 77, step: 'F', alter: 0, octave: 5, label: 'F' },
  { midi: 79, step: 'G', alter: 0, octave: 5, label: 'G' },
  { midi: 81, step: 'A', alter: 0, octave: 5, label: 'A' },
  { midi: 83, step: 'B', alter: 0, octave: 5, label: 'H' },
  { midi: 84, step: 'C', alter: 0, octave: 6, label: 'C' },
  { midi: 86, step: 'D', alter: 0, octave: 6, label: 'D' },
  { midi: 88, step: 'E', alter: 0, octave: 6, label: 'E' },
  { midi: 89, step: 'F', alter: 0, octave: 6, label: 'F' },
  { midi: 91, step: 'G', alter: 0, octave: 6, label: 'G' },
  { midi: 93, step: 'A', alter: 0, octave: 6, label: 'A' },
  { midi: 95, step: 'B', alter: 0, octave: 6, label: 'H' },
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
  { midi: 85, step: 'C', alter: 1, octave: 6, afterWhiteIndex: 14 },
  { midi: 87, step: 'D', alter: 1, octave: 6, afterWhiteIndex: 15 },
  { midi: 90, step: 'F', alter: 1, octave: 6, afterWhiteIndex: 17 },
  { midi: 92, step: 'G', alter: 1, octave: 6, afterWhiteIndex: 18 },
  { midi: 94, step: 'A', alter: 1, octave: 6, afterWhiteIndex: 19 },
];

const state = {
  notes: [],
  nextEntryId: 1,
  nextSlurId: 1,
  nextHairpinId: 1,
  slurs: [],
  hairpins: [],
  selectionMode: false,
  selectedNoteIndices: new Set(),
  noteSelectionHitboxes: [],
  selectionDrag: null,
  renderedNoteObjectMap: new Map(),
  renderedNoteUnitsMap: new Map(),
  modifiers: {
    dotPointers: new Set(),
    sixteenthPointers: new Set(),
    restPointers: new Set(),
    dotKeyboard: false,
    sixteenthKeyboard: false,
    restKeyboard: false,
  },
  audioContext: null,
  osmd: null,
  appliedScoreLayoutSignature: null,
  gesture: null,
  currentDurationName: 'quarter',
  keyboardOctaveWindow: 0,
  keyboardOctavePosition: 0,
  octaveDrag: null,
  scoreEntryToFollowId: null,
  systemBreaks: new Set(),
  pendingSystemBreakIndex: null,
};

const scoreTouchGesture = {
  pointers: new Map(),
  maxCount: 0,
  moved: false,
  cancelled: false,
};

function updateKeyboardOctavePosition(position = state.keyboardOctavePosition) {
  const nextPosition = clamp(Number(position) || 0, 0, 1);
  state.keyboardOctavePosition = nextPosition;

  const viewportWidth = keyboardViewport.clientWidth || zoneKeyboard.clientWidth || 0;
  const pairWidth = viewportWidth * (layoutState.whiteWidth / 100);
  const centeredPairOffset = (viewportWidth - pairWidth) / 2;
  const keyboardOffset = centeredPairOffset - nextPosition * pairWidth / 2;
  keyboardSurface.style.transform = `translateX(${keyboardOffset}px)`;
  octaveWindowMarker.style.transform = `translateX(${nextPosition * 50}%)`;

  const windowIndex = nextPosition >= 0.5 ? 1 : 0;
  const rangeText = windowIndex === 0 ? 'OKTAAVIT 1–2' : 'OKTAAVIT 2–3';
  const spokenRange = windowIndex === 0 ? 'Oktaavit 1–2' : 'Oktaavit 2–3';
  octaveRangeLabel.textContent = rangeText;
  octaveRail.setAttribute('aria-valuenow', String(windowIndex + 1));
  octaveRail.setAttribute('aria-valuetext', spokenRange);
  octavePrevBtn.disabled = nextPosition <= 0.001;
  octaveNextBtn.disabled = nextPosition >= 0.999;
}

function setKeyboardOctaveWindow(windowIndex) {
  const nextWindow = clamp(Math.round(Number(windowIndex) || 0), 0, 1);
  state.keyboardOctaveWindow = nextWindow;
  updateKeyboardOctavePosition(nextWindow);
}

function finishOctaveRailDrag(ev, cancelled = false) {
  const drag = state.octaveDrag;
  if (!drag || (ev?.pointerId !== undefined && ev.pointerId !== drag.pointerId)) return;
  const deltaX = Number(ev?.clientX) - drag.startX;
  const target = cancelled
    ? drag.startWindow
    : Math.abs(deltaX) >= 18
      ? (deltaX < 0 ? 1 : 0)
      : Math.round(state.keyboardOctavePosition);
  state.octaveDrag = null;
  octaveRail.classList.remove('dragging');
  zoneKeyboard.classList.remove('octave-dragging');
  try { octaveRail.releasePointerCapture?.(drag.pointerId); } catch {}
  setKeyboardOctaveWindow(target);
}

function bindOctaveNavigator() {
  octavePrevBtn.addEventListener('click', () => setKeyboardOctaveWindow(0));
  octaveNextBtn.addEventListener('click', () => setKeyboardOctaveWindow(1));

  octaveRail.addEventListener('pointerdown', ev => {
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
    ev.preventDefault();
    state.octaveDrag = {
      pointerId: ev.pointerId,
      startX: ev.clientX,
      startPosition: state.keyboardOctavePosition,
      startWindow: state.keyboardOctaveWindow,
    };
    octaveRail.classList.add('dragging');
    zoneKeyboard.classList.add('octave-dragging');
    try { octaveRail.setPointerCapture?.(ev.pointerId); } catch {}
  }, { passive: false });

  octaveRail.addEventListener('pointermove', ev => {
    const drag = state.octaveDrag;
    if (!drag || drag.pointerId !== ev.pointerId) return;
    ev.preventDefault();
    const oneOctaveWidth = Math.max(1, octaveRail.clientWidth / 3);
    const nextPosition = drag.startPosition - (ev.clientX - drag.startX) / oneOctaveWidth;
    updateKeyboardOctavePosition(nextPosition);
  }, { passive: false });

  octaveRail.addEventListener('pointerup', ev => finishOctaveRailDrag(ev));
  octaveRail.addEventListener('pointercancel', ev => finishOctaveRailDrag(ev, true));
  octaveRail.addEventListener('lostpointercapture', ev => finishOctaveRailDrag(ev));
  octaveRail.addEventListener('keydown', ev => {
    if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
    ev.preventDefault();
    setKeyboardOctaveWindow(ev.key === 'ArrowRight' ? 1 : 0);
  });

  setKeyboardOctaveWindow(0);
}

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
    if (key.step === 'C') {
      const badge = document.createElement('span');
      badge.className = 'key-octave-badge';
      badge.textContent = String(Math.floor(idx / 7) + 1);
      badge.setAttribute('aria-hidden', 'true');
      el.appendChild(badge);
    }
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
  bindOctaveNavigator();
}

function startFlickGesture(ev) {
  ev.preventDefault();

  const target = document.elementFromPoint(ev.clientX, ev.clientY);
  const keyEl = target && target.closest('.key');
  if (!keyEl || !keyboardSurface.contains(keyEl)) return;

  // Hiiren PointerEvent kertoo myös jo pohjassa olevat Mac-modifioijat.
  // Tämä toimii silloinkin, jos jokin kappaletietojen kenttä oli juuri aktiivisena.
  if (ev.pointerType === 'mouse') {
    if (ev.shiftKey) state.modifiers.dotKeyboard = true;
    if (ev.altKey) state.modifiers.sixteenthKeyboard = true;
    syncModifierButtons();
  }
  if (isEditableTarget(document.activeElement)) document.activeElement.blur();

  if (state.gesture) return;

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
    committed: false,
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
    commitFlickGesture(g);
    g.committed = true;
  }, layoutState.flick.longPressMs);

  // Soittotuntuma tulee heti painalluksesta. Tavallinen nuotti kirjoitetaan
  // irrotettaessa, mutta kokonuotti heti pitkän painalluksen täyttyessä.
  if (!isRestShiftActive()) playMidi(Number(keyEl.dataset.midi), 0.24);
}

function moveFlickGesture(ev) {
  if (!state.gesture) return;
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
  if (!gesture.committed) commitFlickGesture(gesture);
  finishFlickGesture();
}

function cancelFlickGesture(ev) {
  if (!state.gesture) return;
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
    pruneSlurs();
    pruneHairpins();
    clearNoteSelection();
    restorePendingSystemBreakAfterUndo();
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

function getWrittenUnits() {
  return state.notes.reduce((total, entry) => total + Number(entry.units || 0), 0);
}

function getNextMeasureIndex() {
  return Math.max(1, Math.ceil(getWrittenUnits() / getMeasureUnits()));
}

function togglePendingSystemBreak() {
  if (state.pendingSystemBreakIndex !== null) {
    state.systemBreaks.delete(state.pendingSystemBreakIndex);
    state.pendingSystemBreakIndex = null;
  } else {
    const measureIndex = getNextMeasureIndex();
    state.systemBreaks.add(measureIndex);
    state.pendingSystemBreakIndex = measureIndex;
  }
  syncSystemBreakButton();
  renderScore();
}

function settlePendingSystemBreak() {
  if (state.pendingSystemBreakIndex === null) return;
  const breakStartsAtUnits = state.pendingSystemBreakIndex * getMeasureUnits();
  if (getWrittenUnits() > breakStartsAtUnits) {
    state.pendingSystemBreakIndex = null;
    syncSystemBreakButton();
  }
}

function syncSystemBreakButton() {
  const active = state.pendingSystemBreakIndex !== null;
  systemBreakBtn.classList.toggle('active', active);
  systemBreakBtn.setAttribute('aria-pressed', String(active));
}

function removeSystemBreak(measureIndex) {
  state.systemBreaks.delete(measureIndex);
  if (state.pendingSystemBreakIndex === measureIndex) {
    state.pendingSystemBreakIndex = null;
    syncSystemBreakButton();
  }
  renderScore();
}

function placeSystemBreakAfterMeasure(measureIndex) {
  if (state.pendingSystemBreakIndex !== null) {
    state.systemBreaks.delete(state.pendingSystemBreakIndex);
  }
  state.systemBreaks.add(measureIndex);
  state.pendingSystemBreakIndex = null;
  syncSystemBreakButton();
  renderScore();
}

function renderSystemBreakMarkers() {
  osmdContainer.querySelector('.system-break-markers')?.remove();
  osmdContainer.querySelectorAll('.system-break-candidate-svg').forEach(element => element.remove());
  if (!state.osmd || (state.systemBreaks.size === 0 && state.pendingSystemBreakIndex === null)) return;

  const graphicSheet = state.osmd.GraphicSheet;
  const measureList = graphicSheet?.MeasureList;
  const musicPages = graphicSheet?.MusicPages || [];
  const fallbackSvg = osmdContainer.querySelector('svg');
  if (!fallbackSvg || !measureList) return;

  // OSMD tekee A4-tilassa jokaiselle sivulle oman SVG:n. Sidotaan jokainen
  // GraphicalMusicPage vastaavaan sivu-SVG:hen, jotta editorimerkit eivät
  // kasaannu ensimmäiselle sivulle.
  const svgByMusicPage = new Map();
  musicPages.forEach((musicPage, pageIndex) => {
    const pageElement = osmdContainer.querySelector(`#osmdCanvasPage${pageIndex + 1}`);
    const pageSvg = pageElement?.querySelector('svg');
    if (pageSvg) svgByMusicPage.set(musicPage, pageSvg);
  });

  const containerRect = osmdContainer.getBoundingClientRect();
  const layer = document.createElement('div');
  layer.className = 'system-break-markers';
  layer.style.width = `${osmdContainer.scrollWidth}px`;
  layer.style.height = `${osmdContainer.scrollHeight}px`;
  const rowYByStaffLine = new WeakMap();

  const appendMarker = (measureIndex, candidate = false) => {
    const measure = measureList[measureIndex - 1]?.find(item => item && item.isVisible?.() !== false);
    if (!measure) return;

    const musicPage = measure.ParentMusicSystem?.Parent
      || measure.ParentStaffLine?.ParentMusicSystem?.Parent;
    const svg = svgByMusicPage.get(musicPage) || fallbackSvg;

    const stave = measure.stave;
    let x;
    let y;
    if (stave?.getX && stave?.getWidth && stave?.getY) {
      x = stave.getX() + stave.getWidth();
      y = stave.getY();
    } else {
      const box = measure.PositionAndShape;
      if (!box?.AbsolutePosition) return;
      const pageOrigin = musicPage?.PositionAndShape?.AbsolutePosition || { x: 0, y: 0 };
      x = (box.AbsolutePosition.x - pageOrigin.x + box.BorderRight) * 10 * state.osmd.zoom;
      y = (box.AbsolutePosition.y - pageOrigin.y + box.BorderTop) * 10 * state.osmd.zoom;
    }

    if (candidate) {
      const svgNs = 'http://www.w3.org/2000/svg';
      const zoom = Number(state.osmd.zoom) || 1;
      const staffLine = measure.ParentStaffLine;
      if (staffLine && !rowYByStaffLine.has(staffLine)) {
        const firstMeasure = staffLine.Measures?.find(item => item?.stave?.getY);
        rowYByStaffLine.set(staffLine, firstMeasure?.stave?.getY?.() ?? y);
      }
      const rowY = staffLine ? (rowYByStaffLine.get(staffLine) ?? y) : y;
      // VexFlow-staven koordinaatit sisältävät jo OSMD-zoomin. SVG-juureen
      // lisättävä editorimerkki tarvitsee takaisin zoomaamattoman arvon.
      const markerX = x / zoom;
      const markerY = rowY / zoom;
      const group = document.createElementNS(svgNs, 'g');
      group.classList.add('system-break-candidate-svg');
      group.setAttribute('role', 'button');
      group.setAttribute('tabindex', '0');
      group.setAttribute('aria-label', `Tee rivinvaihto tahdin ${measureIndex} jälkeen`);

      const hitArea = document.createElementNS(svgNs, 'rect');
      hitArea.setAttribute('x', String(markerX - 18));
      hitArea.setAttribute('y', String(markerY - 38));
      hitArea.setAttribute('width', '36');
      hitArea.setAttribute('height', '36');
      hitArea.setAttribute('fill', 'transparent');

      const plus = document.createElementNS(svgNs, 'text');
      plus.setAttribute('x', String(markerX));
      plus.setAttribute('y', String(markerY - 12));
      plus.setAttribute('text-anchor', 'middle');
      plus.textContent = '+';

      const placeBreak = ev => {
        ev.preventDefault();
        ev.stopPropagation();
        placeSystemBreakAfterMeasure(measureIndex);
      };
      group.addEventListener('pointerdown', ev => ev.stopPropagation());
      group.addEventListener('click', placeBreak);
      group.addEventListener('keydown', ev => {
        if (ev.key === 'Enter' || ev.key === ' ') placeBreak(ev);
      });
      group.append(hitArea, plus);
      svg.appendChild(group);
      return;
    }

    const marker = document.createElement('button');
    marker.type = 'button';
    marker.className = 'system-break-marker';
    marker.textContent = '↵';
    const actionLabel = `Poista rivinvaihto tahdin ${measureIndex} jälkeen`;
    marker.setAttribute('aria-label', actionLabel);
    marker.title = actionLabel;
    const svgRect = svg.getBoundingClientRect();
    const viewBox = svg.viewBox?.baseVal;
    const viewWidth = viewBox?.width || Number(svg.getAttribute('width')) || svgRect.width;
    const viewHeight = viewBox?.height || Number(svg.getAttribute('height')) || svgRect.height;
    if (!viewWidth || !viewHeight || !svgRect.width || !svgRect.height) return;
    const scaleX = svgRect.width / viewWidth;
    const scaleY = svgRect.height / viewHeight;
    const barlineX = svgRect.left - containerRect.left + osmdContainer.scrollLeft
      + (x - (viewBox?.x || 0)) * scaleX;
    const staffTopY = svgRect.top - containerRect.top + osmdContainer.scrollTop
      + (y - (viewBox?.y || 0)) * scaleY;
    // Pidetään painike kokonaan nuotti-ikkunan sisällä. Täyteen leveyteen
    // venytetty järjestelmä ei saa työntää merkkiä overflow-rajan taakse.
    const visibleLeft = osmdContainer.scrollLeft + 4;
    const visibleRight = osmdContainer.scrollLeft + osmdContainer.clientWidth - 40;
    marker.style.left = `${clamp(barlineX - 40, visibleLeft, visibleRight)}px`;
    marker.style.top = `${Math.max(4, staffTopY - 34)}px`;
    marker.addEventListener('pointerdown', ev => ev.stopPropagation());
    marker.addEventListener('click', ev => {
      ev.preventDefault();
      ev.stopPropagation();
      removeSystemBreak(measureIndex);
    });
    layer.appendChild(marker);
  };

  [...state.systemBreaks].sort((a, b) => a - b).forEach(measureIndex => {
    appendMarker(measureIndex, false);
  });

  if (state.pendingSystemBreakIndex !== null) {
    measureList.forEach((_, measurePosition) => {
      const breakAfterMeasure = measurePosition + 1;
      if (!state.systemBreaks.has(breakAfterMeasure)) {
        appendMarker(breakAfterMeasure, true);
      }
    });
  }

  osmdContainer.appendChild(layer);
}

function restorePendingSystemBreakAfterUndo() {
  const writtenUnits = getWrittenUnits();
  const futureBreaks = [...state.systemBreaks]
    .filter(index => writtenUnits <= index * getMeasureUnits())
    .sort((a, b) => a - b);
  state.pendingSystemBreakIndex = futureBreaks[0] ?? null;
  syncSystemBreakButton();
}

function clearScoreWithFeedback() {
  state.notes = [];
  state.slurs = [];
  state.hairpins = [];
  clearNoteSelection();
  state.systemBreaks.clear();
  state.pendingSystemBreakIndex = null;
  syncSystemBreakButton();
  renderScore();
  statusText.textContent = 'Nuotit tyhjennetty';
  clearTimeout(window.__clearScoreFeedbackTimer);
  window.__clearScoreFeedbackTimer = setTimeout(() => {
    statusText.textContent = 'Valmis';
  }, 900);
}

function resetScoreTouchGesture() {
  scoreTouchGesture.pointers.clear();
  scoreTouchGesture.maxCount = 0;
  scoreTouchGesture.moved = false;
  scoreTouchGesture.cancelled = false;
}

function initScoreTouchGestures() {
  osmdContainer.addEventListener('pointerdown', (ev) => {
    if (state.selectionMode) return;
    if (ev.pointerType !== 'touch') return;
    ev.preventDefault();
    if (scoreTouchGesture.pointers.size === 0) resetScoreTouchGesture();
    scoreTouchGesture.pointers.set(ev.pointerId, {
      startX: ev.clientX,
      startY: ev.clientY,
    });
    scoreTouchGesture.maxCount = Math.max(
      scoreTouchGesture.maxCount,
      scoreTouchGesture.pointers.size,
    );
    osmdContainer.setPointerCapture?.(ev.pointerId);
  }, { passive: false });

  osmdContainer.addEventListener('pointermove', (ev) => {
    if (state.selectionMode) return;
    const pointer = scoreTouchGesture.pointers.get(ev.pointerId);
    if (!pointer) return;
    ev.preventDefault();
    if (Math.hypot(ev.clientX - pointer.startX, ev.clientY - pointer.startY) > 24) {
      scoreTouchGesture.moved = true;
    }
  }, { passive: false });

  const finishPointer = (ev, cancelled = false) => {
    if (state.selectionMode) return;
    if (!scoreTouchGesture.pointers.has(ev.pointerId)) return;
    ev.preventDefault();
    if (cancelled) scoreTouchGesture.cancelled = true;
    scoreTouchGesture.pointers.delete(ev.pointerId);
    try { osmdContainer.releasePointerCapture?.(ev.pointerId); } catch {}
    if (scoreTouchGesture.pointers.size > 0) return;

    if (!scoreTouchGesture.moved && !scoreTouchGesture.cancelled) {
      if (scoreTouchGesture.maxCount >= 3) clearScoreWithFeedback();
      else if (scoreTouchGesture.maxCount === 2) undoLastNoteWithFeedback();
    }
    resetScoreTouchGesture();
  };

  osmdContainer.addEventListener('pointerup', ev => finishPointer(ev));
  osmdContainer.addEventListener('pointercancel', ev => finishPointer(ev, true));
}

function createScoreEntryId() {
  const id = `entry-${state.nextEntryId}`;
  state.nextEntryId += 1;
  return id;
}

function ensureScoreEntryIds() {
  state.notes.forEach(entry => {
    if (!entry.id) entry.id = createScoreEntryId();
  });
}

function pruneSlurs() {
  ensureScoreEntryIds();
  const entryIds = new Set(state.notes.map(entry => entry.id));
  state.slurs = state.slurs.filter(slur => (
    entryIds.has(slur.startId) && entryIds.has(slur.endId)
  ));
}

function pruneHairpins() {
  ensureScoreEntryIds();
  const entryIds = new Set(state.notes.map(entry => entry.id));
  state.hairpins = state.hairpins.filter(hairpin => (
    entryIds.has(hairpin.startId) && entryIds.has(hairpin.endId)
  ));
}

function getSelectedNoteIndices() {
  return [...state.selectedNoteIndices]
    .filter(index => state.notes[index]?.kind === 'note')
    .sort((a, b) => a - b);
}

function getLegatoSelectionRange() {
  const indices = getSelectedNoteIndices();
  if (indices.length < 2) return null;
  const first = indices[0];
  const last = indices[indices.length - 1];
  for (let index = first; index <= last; index += 1) {
    if (state.notes[index]?.kind !== 'note' || !state.selectedNoteIndices.has(index)) return null;
  }
  return {
    first,
    last,
    startId: state.notes[first].id,
    endId: state.notes[last].id,
  };
}

function findExactSelectionSlur(range = getLegatoSelectionRange()) {
  if (!range) return null;
  return state.slurs.find(slur => (
    slur.startId === range.startId && slur.endId === range.endId
  )) || null;
}

function findExactSelectionHairpin(type, range = getLegatoSelectionRange()) {
  if (!range) return null;
  return state.hairpins.find(hairpin => (
    hairpin.type === type
    && hairpin.startId === range.startId
    && hairpin.endId === range.endId
  )) || null;
}

function rectanglesIntersect(a, b) {
  return a.left <= b.right && a.right >= b.left && a.top <= b.bottom && a.bottom >= b.top;
}

function normalizedSelectionRectangle(start, end) {
  return {
    left: Math.min(start.x, end.x),
    right: Math.max(start.x, end.x),
    top: Math.min(start.y, end.y),
    bottom: Math.max(start.y, end.y),
  };
}

function contentPointFromPointer(ev) {
  const rect = osmdContainer.getBoundingClientRect();
  return {
    x: ev.clientX - rect.left + osmdContainer.scrollLeft,
    y: ev.clientY - rect.top + osmdContainer.scrollTop,
  };
}

function getElementClientRectangle(element) {
  const direct = element?.getBoundingClientRect?.();
  if (direct && direct.width > 0 && direct.height > 0) {
    return {
      left: direct.left,
      top: direct.top,
      right: direct.right,
      bottom: direct.bottom,
      width: direct.width,
      height: direct.height,
    };
  }

  try {
    const box = element.getBBox();
    const matrix = element.getScreenCTM();
    if (!matrix || !box.width || !box.height) return null;
    const transform = (x, y) => ({
      x: matrix.a * x + matrix.c * y + matrix.e,
      y: matrix.b * x + matrix.d * y + matrix.f,
    });
    const corners = [
      transform(box.x, box.y),
      transform(box.x + box.width, box.y),
      transform(box.x, box.y + box.height),
      transform(box.x + box.width, box.y + box.height),
    ];
    const xs = corners.map(point => point.x);
    const ys = corners.map(point => point.y);
    const left = Math.min(...xs);
    const right = Math.max(...xs);
    const top = Math.min(...ys);
    const bottom = Math.max(...ys);
    return { left, right, top, bottom, width: right - left, height: bottom - top };
  } catch {
    return null;
  }
}

let scoreFollowAnimationFrame = 0;

function requestScoreEntryFollow(entry) {
  state.scoreEntryToFollowId = entry?.id || null;
}

function getRenderedScoreEntryClientRectangle(entryIndex) {
  if (!Number.isInteger(entryIndex) || !state.osmd) return null;

  const measureList = state.osmd.GraphicSheet?.MeasureList || [];
  const visitedGroups = new Set();
  let latestRect = null;

  measureList.forEach(measureGroup => {
    (measureGroup || []).forEach(measure => {
      (measure?.staffEntries || []).forEach(staffEntry => {
        (staffEntry?.graphicalVoiceEntries || []).forEach(voiceEntry => {
          (voiceEntry?.notes || []).forEach(graphicalNote => {
            const objectId = graphicalNote?.sourceNote?.NoteToGraphicalNoteObjectId;
            if (state.renderedNoteObjectMap.get(objectId) !== entryIndex) return;

            const vexRef = graphicalNote.vfnote;
            const vexNote = Array.isArray(vexRef) ? vexRef[0] : vexRef;
            const group = vexNote?.attrs?.el || voiceEntry?.mVexFlowStaveNote?.attrs?.el;
            if (!group || visitedGroups.has(group)) return;
            visitedGroups.add(group);

            const rect = getElementClientRectangle(group);
            if (!rect) return;
            if (
              !latestRect
              || rect.bottom > latestRect.bottom + 1
              || (Math.abs(rect.bottom - latestRect.bottom) <= 1 && rect.right > latestRect.right)
            ) {
              latestRect = rect;
            }
          });
        });
      });
    });
  });

  return latestRect;
}

function followLatestScoreEntryAfterRender() {
  const targetId = state.scoreEntryToFollowId;
  if (!targetId || !state.osmd) return;

  cancelAnimationFrame(scoreFollowAnimationFrame);
  scoreFollowAnimationFrame = requestAnimationFrame(() => {
    scoreFollowAnimationFrame = 0;
    if (state.scoreEntryToFollowId !== targetId) return;

    const entryIndex = state.notes.findIndex(entry => entry.id === targetId);
    if (entryIndex < 0) {
      state.scoreEntryToFollowId = null;
      return;
    }

    // Jos renderöintijonossa on vielä kierros kesken, kohde ei välttämättä ole
    // tässä GraphicSheetissä. Tällöin pyyntö jätetään seuraavalle kierrokselle.
    const entryRect = getRenderedScoreEntryClientRectangle(entryIndex);
    if (!entryRect) return;
    state.scoreEntryToFollowId = null;

    const containerRect = osmdContainer.getBoundingClientRect();
    const lowerSafetyMargin = clamp(osmdContainer.clientHeight * 0.16, 48, 84);
    const visibleTop = containerRect.top + 24;
    const visibleBottom = containerRect.bottom - lowerSafetyMargin;
    let scrollDelta = 0;

    if (entryRect.bottom > visibleBottom) {
      scrollDelta = entryRect.bottom - visibleBottom;
    } else if (entryRect.top < visibleTop) {
      scrollDelta = entryRect.top - visibleTop;
    }

    if (Math.abs(scrollDelta) < 1) return;
    const maxScrollTop = Math.max(0, osmdContainer.scrollHeight - osmdContainer.clientHeight);
    const nextScrollTop = clamp(osmdContainer.scrollTop + scrollDelta, 0, maxScrollTop);
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    try {
      osmdContainer.scrollTo({
        top: nextScrollTop,
        left: osmdContainer.scrollLeft,
        behavior: reduceMotion ? 'auto' : 'smooth',
      });
    } catch {
      osmdContainer.scrollTop = nextScrollTop;
    }
  });
}

function buildNoteSelectionHitboxes() {
  state.noteSelectionHitboxes = [];
  if (!state.selectionMode || !state.osmd) return;

  const measureList = state.osmd.GraphicSheet?.MeasureList || [];
  const containerRect = osmdContainer.getBoundingClientRect();
  const visitedGroups = new Set();

  measureList.forEach(measureGroup => {
    (measureGroup || []).forEach(measure => {
      (measure?.staffEntries || []).forEach(staffEntry => {
        (staffEntry?.graphicalVoiceEntries || []).forEach(voiceEntry => {
          (voiceEntry?.notes || []).forEach(graphicalNote => {
            const objectId = graphicalNote?.sourceNote?.NoteToGraphicalNoteObjectId;
            const entryIndex = state.renderedNoteObjectMap.get(objectId);
            if (!Number.isInteger(entryIndex) || state.notes[entryIndex]?.kind !== 'note') return;

            const vexRef = graphicalNote.vfnote;
            const vexNote = Array.isArray(vexRef) ? vexRef[0] : vexRef;
            const group = vexNote?.attrs?.el || voiceEntry?.mVexFlowStaveNote?.attrs?.el;
            if (!group || visitedGroups.has(group)) return;
            visitedGroups.add(group);

            const rect = getElementClientRectangle(group);
            if (!rect) return;
            const horizontalPadding = 7;
            const verticalPadding = 5;
            const left = rect.left - containerRect.left + osmdContainer.scrollLeft - horizontalPadding;
            const top = rect.top - containerRect.top + osmdContainer.scrollTop - verticalPadding;
            const width = Math.max(28, rect.width + horizontalPadding * 2);
            const height = Math.max(30, rect.height + verticalPadding * 2);
            state.noteSelectionHitboxes.push({
              entryIndex,
              left,
              top,
              right: left + width,
              bottom: top + height,
              width,
              height,
            });
          });
        });
      });
    });
  });
}

function syncNoteSelectionToolbar() {
  const indices = getSelectedNoteIndices();
  const legatoRange = getLegatoSelectionRange();
  const exactSlur = findExactSelectionSlur(legatoRange);
  const exactCrescendo = findExactSelectionHairpin('crescendo', legatoRange);
  const exactDiminuendo = findExactSelectionHairpin('diminuendo', legatoRange);
  const allStaccato = indices.length > 0 && indices.every(index => Boolean(state.notes[index].staccato));
  const allPortato = indices.length > 0 && indices.every(index => Boolean(state.notes[index].portato));
  const allAccented = indices.length > 0 && indices.every(index => Boolean(state.notes[index].accent));
  const firstDynamic = indices.length > 0 ? (state.notes[indices[0]].dynamic || '') : '';

  selectNotesBtn.classList.toggle('active', state.selectionMode);
  selectNotesBtn.setAttribute('aria-pressed', String(state.selectionMode));
  osmdContainer.classList.toggle('selection-mode', state.selectionMode);
  selectionToolbar.classList.toggle('open', state.selectionMode);
  selectionToolbar.setAttribute('aria-hidden', String(!state.selectionMode));
  selectionCount.textContent = indices.length > 0
    ? `${indices.length} ${indices.length === 1 ? 'nuotti' : 'nuottia'}`
    : 'Vedä nuottien yli';

  selectionStaccatoBtn.disabled = indices.length === 0;
  selectionStaccatoBtn.classList.toggle('active', allStaccato);
  selectionStaccatoBtn.setAttribute('aria-pressed', String(allStaccato));
  selectionPortatoBtn.disabled = indices.length === 0;
  selectionPortatoBtn.classList.toggle('active', allPortato);
  selectionPortatoBtn.setAttribute('aria-pressed', String(allPortato));
  selectionAccentBtn.disabled = indices.length === 0;
  selectionAccentBtn.classList.toggle('active', allAccented);
  selectionAccentBtn.setAttribute('aria-pressed', String(allAccented));
  selectionDynamicSelect.disabled = indices.length === 0;
  selectionDynamicSelect.value = firstDynamic;
  selectionSlurBtn.disabled = !legatoRange;
  selectionSlurBtn.classList.toggle('active', Boolean(exactSlur));
  selectionSlurBtn.setAttribute('aria-pressed', String(Boolean(exactSlur)));
  selectionCrescendoBtn.disabled = !legatoRange;
  selectionCrescendoBtn.classList.toggle('active', Boolean(exactCrescendo));
  selectionCrescendoBtn.setAttribute('aria-pressed', String(Boolean(exactCrescendo)));
  selectionDiminuendoBtn.disabled = !legatoRange;
  selectionDiminuendoBtn.classList.toggle('active', Boolean(exactDiminuendo));
  selectionDiminuendoBtn.setAttribute('aria-pressed', String(Boolean(exactDiminuendo)));
}

function renderNoteSelectionOverlay() {
  osmdContainer.querySelector('.note-selection-layer')?.remove();
  syncNoteSelectionToolbar();
  if (!state.selectionMode) return;

  const layer = document.createElement('div');
  layer.className = 'note-selection-layer';
  layer.style.width = `${osmdContainer.scrollWidth}px`;
  layer.style.height = `${osmdContainer.scrollHeight}px`;

  state.noteSelectionHitboxes.forEach(hitbox => {
    if (!state.selectedNoteIndices.has(hitbox.entryIndex)) return;
    const highlight = document.createElement('div');
    highlight.className = 'note-selection-highlight';
    highlight.style.left = `${hitbox.left}px`;
    highlight.style.top = `${hitbox.top}px`;
    highlight.style.width = `${hitbox.width}px`;
    highlight.style.height = `${hitbox.height}px`;
    layer.appendChild(highlight);
  });

  if (state.selectionDrag) {
    const rect = normalizedSelectionRectangle(state.selectionDrag.start, state.selectionDrag.current);
    const marquee = document.createElement('div');
    marquee.className = 'note-selection-marquee';
    marquee.style.left = `${rect.left}px`;
    marquee.style.top = `${rect.top}px`;
    marquee.style.width = `${Math.max(1, rect.right - rect.left)}px`;
    marquee.style.height = `${Math.max(1, rect.bottom - rect.top)}px`;
    layer.appendChild(marquee);
  }

  osmdContainer.appendChild(layer);
}

function refreshNoteSelectionGeometry() {
  buildNoteSelectionHitboxes();
  renderNoteSelectionOverlay();
}

function getDynamicExpressionSvgElements(expression) {
  if (expression?.InstantaneousDynamic && expression.Label?.SVGNode) {
    return [expression.Label.SVGNode];
  }
  if (
    expression?.ContinuousDynamic
    && Array.isArray(expression.Lines)
    && expression.Lines.length === 2
    && expression.Lines.every(line => line?.SVGElement)
  ) {
    return expression.Lines.map(line => line.SVGElement);
  }
  return [];
}

function getCombinedSvgBounds(elements) {
  const bounds = elements.map(element => {
    try {
      const box = element.getBBox();
      if (![box.x, box.y, box.width, box.height].every(Number.isFinite)) return null;
      return {
        left: box.x,
        right: box.x + box.width,
        top: box.y,
        bottom: box.y + box.height,
      };
    } catch {
      return null;
    }
  }).filter(Boolean);
  if (bounds.length !== elements.length || bounds.length === 0) return null;
  const left = Math.min(...bounds.map(box => box.left));
  const right = Math.max(...bounds.map(box => box.right));
  const top = Math.min(...bounds.map(box => box.top));
  const bottom = Math.max(...bounds.map(box => box.bottom));
  return { left, right, top, bottom, centerY: (top + bottom) / 2 };
}

function getDynamicExpressionFallbackCenterY(expression) {
  if (expression?.ContinuousDynamic && Array.isArray(expression.Lines)) {
    return expression.Lines.reduce(
      (total, line) => total + Number(line.Start?.y || 0),
      0,
    ) / Math.max(1, expression.Lines.length) * 10;
  }
  const centerY = Number(expression?.PositionAndShape?.Center?.y);
  if (Number.isFinite(centerY)) return centerY * 10;
  return Number(expression?.PositionAndShape?.RelativePosition?.y || 0) * 10;
}

function alignDynamicsByStaffLine() {
  const measureList = state.osmd?.GraphicSheet?.MeasureList || [];
  const staffLines = new Set();
  measureList.forEach(measureGroup => {
    (measureGroup || []).forEach(measure => {
      const staffLine = measure?.ParentStaffLine;
      if (staffLine) staffLines.add(staffLine);
    });
  });

  staffLines.forEach(staffLine => {
    const expressions = (staffLine.AbstractExpressions || []).map(expression => {
      const elements = getDynamicExpressionSvgElements(expression);
      if (elements.length === 0) return null;
      const bounds = getCombinedSvgBounds(elements);
      return {
        expression,
        elements,
        centerY: bounds?.centerY ?? getDynamicExpressionFallbackCenterY(expression),
      };
    }).filter(Boolean);
    if (expressions.length < 2) return;

    // Koko nuottiriville valitaan alin OSMD:n tarvitsema dynamiikkataso.
    // Näin ppp–fff-merkit ja hairpinit ovat suorassa linjassa, mutta mikään
    // niistä ei nouse takaisin nuottien tai varsien päälle.
    const targetY = Math.max(...expressions.map(item => item.centerY));

    expressions.forEach(item => {
      const shiftSvgUnits = targetY - item.centerY;
      item.elements.forEach(element => {
        if (!element.hasAttribute('data-dynamic-base-transform')) {
          element.setAttribute('data-dynamic-base-transform', element.getAttribute('transform') || '');
        }
        const baseTransform = element.getAttribute('data-dynamic-base-transform') || '';
        const alignmentTransform = Math.abs(shiftSvgUnits) > 0.001
          ? `translate(0 ${shiftSvgUnits})`
          : '';
        const transform = `${baseTransform} ${alignmentTransform}`.trim();
        if (transform) element.setAttribute('transform', transform);
        else element.removeAttribute('transform');
        element.setAttribute('data-dynamic-row-aligned', 'true');
        if (item.expression.ContinuousDynamic) {
          element.setAttribute('data-hairpin-row-aligned', 'true');
        }
      });
    });
  });
}

function clearNoteSelection() {
  state.selectedNoteIndices.clear();
  state.selectionDrag = null;
  renderNoteSelectionOverlay();
}

function setNoteSelectionMode(enabled) {
  state.selectionMode = Boolean(enabled);
  resetScoreTouchGesture();
  if (!state.selectionMode) {
    state.selectedNoteIndices.clear();
    state.noteSelectionHitboxes = [];
    state.selectionDrag = null;
  }
  refreshNoteSelectionGeometry();
}

function selectNotesInRectangle(rect) {
  state.selectedNoteIndices.clear();
  state.noteSelectionHitboxes.forEach(hitbox => {
    if (rectanglesIntersect(rect, hitbox)) state.selectedNoteIndices.add(hitbox.entryIndex);
  });
}

function selectNoteAtPoint(point) {
  const hits = state.noteSelectionHitboxes
    .filter(hitbox => rectanglesIntersect(
      { left: point.x, right: point.x, top: point.y, bottom: point.y },
      hitbox,
    ))
    .sort((a, b) => (a.width * a.height) - (b.width * b.height));
  state.selectedNoteIndices.clear();
  if (hits[0]) state.selectedNoteIndices.add(hits[0].entryIndex);
}

function toggleStaccatoForSelection() {
  const indices = getSelectedNoteIndices();
  if (indices.length === 0) return;
  const enable = !indices.every(index => Boolean(state.notes[index].staccato));
  indices.forEach(index => { state.notes[index].staccato = enable; });
  statusText.textContent = enable ? 'Staccato lisätty' : 'Staccato poistettu';
  renderScore();
}

function togglePortatoForSelection() {
  const indices = getSelectedNoteIndices();
  if (indices.length === 0) return;
  const enable = !indices.every(index => Boolean(state.notes[index].portato));
  indices.forEach(index => { state.notes[index].portato = enable; });
  statusText.textContent = enable ? 'Portatoviiva lisätty' : 'Portatoviiva poistettu';
  renderScore();
}

function toggleAccentForSelection() {
  const indices = getSelectedNoteIndices();
  if (indices.length === 0) return;
  const enable = !indices.every(index => Boolean(state.notes[index].accent));
  indices.forEach(index => { state.notes[index].accent = enable; });
  statusText.textContent = enable ? 'Aksentti lisätty' : 'Aksentti poistettu';
  renderScore();
}

function applyDynamicForSelection(value) {
  const indices = getSelectedNoteIndices();
  if (indices.length === 0) return;
  const allowedDynamics = new Set(['ppp', 'pp', 'p', 'mp', 'mf', 'f', 'ff', 'fff']);
  indices.forEach(index => { delete state.notes[index].dynamic; });
  if (allowedDynamics.has(value)) {
    state.notes[indices[0]].dynamic = value;
    statusText.textContent = `Dynamiikka ${value} lisätty`;
  } else {
    statusText.textContent = 'Dynamiikka poistettu';
  }
  renderScore();
}

function toggleLegatoForSelection() {
  ensureScoreEntryIds();
  const range = getLegatoSelectionRange();
  if (!range) {
    statusText.textContent = 'Valitse vähintään kaksi peräkkäistä nuottia';
    return;
  }
  const existing = findExactSelectionSlur(range);
  if (existing) {
    state.slurs = state.slurs.filter(slur => slur !== existing);
    statusText.textContent = 'Legatokaari poistettu';
  } else {
    state.slurs.push({
      id: `slur-${state.nextSlurId}`,
      startId: range.startId,
      endId: range.endId,
    });
    state.nextSlurId += 1;
    statusText.textContent = 'Legatokaari lisätty';
  }
  renderScore();
}

function toggleHairpinForSelection(type) {
  ensureScoreEntryIds();
  const range = getLegatoSelectionRange();
  if (!range) {
    statusText.textContent = 'Valitse vähintään kaksi peräkkäistä nuottia';
    return;
  }

  const existing = findExactSelectionHairpin(type, range);
  state.hairpins = state.hairpins.filter(hairpin => !(
    hairpin.startId === range.startId && hairpin.endId === range.endId
  ));
  if (existing) {
    statusText.textContent = type === 'crescendo' ? 'Crescendo poistettu' : 'Diminuendo poistettu';
  } else {
    state.hairpins.push({
      id: `hairpin-${state.nextHairpinId}`,
      type,
      startId: range.startId,
      endId: range.endId,
    });
    state.nextHairpinId += 1;
    statusText.textContent = type === 'crescendo' ? 'Crescendo lisätty' : 'Diminuendo lisätty';
  }
  renderScore();
}

function initNoteSelection() {
  selectNotesBtn.addEventListener('click', () => {
    setNoteSelectionMode(!state.selectionMode);
  });
  selectionClearBtn.addEventListener('click', clearNoteSelection);
  selectionStaccatoBtn.addEventListener('click', toggleStaccatoForSelection);
  selectionPortatoBtn.addEventListener('click', togglePortatoForSelection);
  selectionAccentBtn.addEventListener('click', toggleAccentForSelection);
  selectionDynamicSelect.addEventListener('change', ev => applyDynamicForSelection(ev.target.value));
  selectionSlurBtn.addEventListener('click', toggleLegatoForSelection);
  selectionCrescendoBtn.addEventListener('click', () => toggleHairpinForSelection('crescendo'));
  selectionDiminuendoBtn.addEventListener('click', () => toggleHairpinForSelection('diminuendo'));

  osmdContainer.addEventListener('pointerdown', ev => {
    if (!state.selectionMode || (ev.pointerType === 'mouse' && ev.button !== 0)) return;
    if (ev.target.closest?.('.system-break-marker, .system-break-candidate-svg')) return;
    ev.preventDefault();
    ev.stopPropagation();
    const start = contentPointFromPointer(ev);
    state.selectionDrag = {
      pointerId: ev.pointerId,
      start,
      current: start,
      moved: false,
    };
    state.selectedNoteIndices.clear();
    osmdContainer.setPointerCapture?.(ev.pointerId);
    renderNoteSelectionOverlay();
  }, { passive: false });

  osmdContainer.addEventListener('pointermove', ev => {
    const drag = state.selectionDrag;
    if (!state.selectionMode || !drag || drag.pointerId !== ev.pointerId) return;
    ev.preventDefault();
    drag.current = contentPointFromPointer(ev);
    drag.moved = drag.moved || Math.hypot(
      drag.current.x - drag.start.x,
      drag.current.y - drag.start.y,
    ) > 4;
    if (drag.moved) selectNotesInRectangle(normalizedSelectionRectangle(drag.start, drag.current));
    renderNoteSelectionOverlay();
  }, { passive: false });

  const finishSelection = (ev, cancelled = false) => {
    const drag = state.selectionDrag;
    if (!drag || drag.pointerId !== ev.pointerId) return;
    ev.preventDefault();
    if (!cancelled) {
      drag.current = contentPointFromPointer(ev);
      if (drag.moved) selectNotesInRectangle(normalizedSelectionRectangle(drag.start, drag.current));
      else selectNoteAtPoint(drag.current);
    } else {
      state.selectedNoteIndices.clear();
    }
    state.selectionDrag = null;
    try { osmdContainer.releasePointerCapture?.(ev.pointerId); } catch {}
    renderNoteSelectionOverlay();
  };

  osmdContainer.addEventListener('pointerup', ev => finishSelection(ev));
  osmdContainer.addEventListener('pointercancel', ev => finishSelection(ev, true));
  syncNoteSelectionToolbar();
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
  // Pohjassa pidettävä 1/16-Shift muuttaa vain alas-eleen.
  // Kokonuotti syntyy vain pitkällä paikallaan pidetyllä painalluksella.
  if (deltaY >= f.half) return 'half';
  if (deltaY <= -f.eighth) {
    return isSixteenthModifierActive() ? '16th' : 'eighth';
  }
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
  flickHud.classList.toggle('rest', isRestShiftActive());
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

  const useDot = isDotModifierActive() || gesture.dottedByRightSweep;
  const durationUnits = useDot ? Math.round(base.units * 1.5) : base.units;

  if (isRestShiftActive()) {
    addRest(durationUnits);
    return;
  }

  const keyEl = gesture.keyEl;
  clearNoteSelection();
  const entry = {
    id: createScoreEntryId(),
    kind: 'note',
    step: keyEl.dataset.step,
    alter: Number(keyEl.dataset.alter || 0),
    octave: Number(keyEl.dataset.octave),
    units: durationUnits,
  };
  state.notes.push(entry);
  requestScoreEntryFollow(entry);
  settlePendingSystemBreak();
  renderScore();
}

function finiteLayoutNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function migrateEarlierDefault(value, previousDefault, nextDefault, usesEarlierDefaults) {
  const parsed = finiteLayoutNumber(value, nextDefault);
  return usesEarlierDefaults && parsed === previousDefault ? nextDefault : parsed;
}

function loadLayoutState() {
  try {
    const saved = JSON.parse(localStorage.getItem(LAYOUT_STORAGE_KEY) || 'null');
    if (!saved) return structuredClone(defaultLayout);
    const usesEarlierDefaults = finiteLayoutNumber(saved.defaultsVersion, 0) < LAYOUT_DEFAULTS_VERSION;
    const savedScoreShare = finiteLayoutNumber(saved.scoreShare, defaultLayout.scoreShare);
    const savedScoreZoom = finiteLayoutNumber(saved.scoreZoom, defaultLayout.scoreZoom);
    const savedSystemSpacing = finiteLayoutNumber(saved.systemSpacing, defaultLayout.systemSpacing);
    return {
      defaultsVersion: LAYOUT_DEFAULTS_VERSION,
      handedness: saved.handedness === 'left' ? 'left' : 'right',
      scoreShare: usesEarlierDefaults && savedScoreShare === 54 ? defaultLayout.scoreShare : savedScoreShare,
      noteSpacing: normalizeNoteSpacing(saved.noteSpacing),
      scoreZoom: usesEarlierDefaults && (savedScoreZoom === 108 || savedScoreZoom === 150)
        ? defaultLayout.scoreZoom
        : savedScoreZoom,
      systemSpacing: usesEarlierDefaults && (savedSystemSpacing === 100 || savedSystemSpacing === 300)
        ? defaultLayout.systemSpacing
        : savedSystemSpacing,
      pitchNames: saved.pitchNames !== false,
      printWatermark: saved.printWatermark !== false,
      scoreText: {
        title: {
          size: migrateEarlierDefault(saved.scoreText?.title?.size, 100, defaultLayout.scoreText.title.size, usesEarlierDefaults),
          x: finiteLayoutNumber(saved.scoreText?.title?.x, defaultLayout.scoreText.title.x),
          y: migrateEarlierDefault(saved.scoreText?.title?.y, 0, defaultLayout.scoreText.title.y, usesEarlierDefaults),
        },
        composer: {
          size: finiteLayoutNumber(saved.scoreText?.composer?.size, defaultLayout.scoreText.composer.size),
          x: finiteLayoutNumber(saved.scoreText?.composer?.x, defaultLayout.scoreText.composer.x),
          y: migrateEarlierDefault(saved.scoreText?.composer?.y, 0, defaultLayout.scoreText.composer.y, usesEarlierDefaults),
        },
        tempo: {
          size: finiteLayoutNumber(saved.scoreText?.tempo?.size, defaultLayout.scoreText.tempo.size),
          x: migrateEarlierDefault(saved.scoreText?.tempo?.x, 0, defaultLayout.scoreText.tempo.x, usesEarlierDefaults),
          y: finiteLayoutNumber(saved.scoreText?.tempo?.y, defaultLayout.scoreText.tempo.y),
        },
      },
      margins: {
        left: finiteLayoutNumber(saved.margins?.left, defaultLayout.margins.left),
        right: finiteLayoutNumber(saved.margins?.right, defaultLayout.margins.right),
        top: finiteLayoutNumber(saved.margins?.top, defaultLayout.margins.top),
        bottom: finiteLayoutNumber(saved.margins?.bottom, defaultLayout.margins.bottom),
      },
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
  scheduleProjectAutosave();
}

function normalizeFlickThresholds() {
  // Ulomman rajan täytyy aina olla sisempää suurempi.
  layoutState.defaultsVersion = LAYOUT_DEFAULTS_VERSION;
  layoutState.flick.longPressMs = clamp(layoutState.flick.longPressMs, 300, 1200);
  layoutState.scoreShare = clamp(Number(layoutState.scoreShare) || defaultLayout.scoreShare, 30, 70);
  layoutState.noteSpacing = normalizeNoteSpacing(layoutState.noteSpacing);
  layoutState.scoreZoom = clamp(finiteLayoutNumber(layoutState.scoreZoom, defaultLayout.scoreZoom), 70, 160);
  layoutState.systemSpacing = clamp(finiteLayoutNumber(layoutState.systemSpacing, defaultLayout.systemSpacing), 500, 1000);
  layoutState.pitchNames = layoutState.pitchNames !== false;
  layoutState.printWatermark = layoutState.printWatermark !== false;
  layoutState.scoreText ||= structuredClone(defaultLayout.scoreText);
  SCORE_TEXT_ROLES.forEach(role => {
    layoutState.scoreText[role] ||= structuredClone(defaultLayout.scoreText[role]);
    layoutState.scoreText[role].size = clamp(
      finiteLayoutNumber(layoutState.scoreText[role].size, defaultLayout.scoreText[role].size),
      50,
      250,
    );
    layoutState.scoreText[role].x = clamp(
      finiteLayoutNumber(layoutState.scoreText[role].x, defaultLayout.scoreText[role].x),
      -300,
      300,
    );
    layoutState.scoreText[role].y = clamp(
      finiteLayoutNumber(layoutState.scoreText[role].y, defaultLayout.scoreText[role].y),
      -200,
      200,
    );
  });
  layoutState.margins.left = clamp(finiteLayoutNumber(layoutState.margins.left, defaultLayout.margins.left), 0, 12);
  layoutState.margins.right = clamp(finiteLayoutNumber(layoutState.margins.right, defaultLayout.margins.right), 0, 12);
  layoutState.margins.top = clamp(finiteLayoutNumber(layoutState.margins.top, defaultLayout.margins.top), 0, 15);
  layoutState.margins.bottom = clamp(finiteLayoutNumber(layoutState.margins.bottom, defaultLayout.margins.bottom), 0, 15);
}

function applyLayoutState({ save = true } = {}) {
  normalizeFlickThresholds();
  appShell.classList.toggle('left-handed', layoutState.handedness === 'left');
  mainColumn.style.setProperty('--score-share', `${layoutState.scoreShare}%`);
  scoreKeyboardDivider.setAttribute('aria-valuenow', String(Math.round(layoutState.scoreShare)));
  scoreKeyboardDivider.setAttribute('aria-valuemin', '30');
  scoreKeyboardDivider.setAttribute('aria-valuemax', '70');
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
  updateKeyboardOctavePosition();

  syncLayoutControls();
  syncStretchLastLineButton();
  applyNoteSpacing();
  applyScoreLayout();
  applyScoreTextLayout();
  renderPitchNameOverlays();
  renderMarginGuides();
  if (save) saveLayoutState();
}

function syncLayoutControls() {
  rightHandBtn.classList.toggle('active', layoutState.handedness === 'right');
  leftHandBtn.classList.toggle('active', layoutState.handedness === 'left');
  rightHandBtn.setAttribute('aria-pressed', String(layoutState.handedness === 'right'));
  leftHandBtn.setAttribute('aria-pressed', String(layoutState.handedness === 'left'));

  layoutControls.scoreZoom.value = String(layoutState.scoreZoom);
  layoutControls.systemSpacing.value = String(layoutState.systemSpacing);
  layoutControls.marginLeft.value = String(layoutState.margins.left);
  layoutControls.marginRight.value = String(layoutState.margins.right);
  layoutControls.marginTop.value = String(layoutState.margins.top);
  layoutControls.marginBottom.value = String(layoutState.margins.bottom);
  layoutControls.whiteWidth.value = String(layoutState.whiteWidth);
  layoutControls.keyboardHeight.value = String(layoutState.keyboardHeight);
  layoutControls.blackWidth.value = String(layoutState.blackWidth);
  layoutControls.blackHeight.value = String(layoutState.blackHeight);
  layoutControls.flickEighth.value = String(layoutState.flick.eighth);
  layoutControls.flickHalf.value = String(layoutState.flick.half);
  layoutControls.longPress.value = String(layoutState.flick.longPressMs);

  layoutOutputs.scoreZoom.textContent = `${layoutState.scoreZoom} %`;
  layoutOutputs.systemSpacing.textContent = `${layoutState.systemSpacing} %`;
  layoutOutputs.marginLeft.textContent = `${layoutState.margins.left} u`;
  layoutOutputs.marginRight.textContent = `${layoutState.margins.right} u`;
  layoutOutputs.marginTop.textContent = `${layoutState.margins.top} u`;
  layoutOutputs.marginBottom.textContent = `${layoutState.margins.bottom} u`;
  layoutOutputs.whiteWidth.textContent = `${layoutState.whiteWidth} %`;
  layoutOutputs.keyboardHeight.textContent = `${layoutState.keyboardHeight} %`;
  layoutOutputs.blackWidth.textContent = `${layoutState.blackWidth} %`;
  layoutOutputs.blackHeight.textContent = `${layoutState.blackHeight} %`;
  layoutOutputs.flickEighth.textContent = `${layoutState.flick.eighth} px`;
  layoutOutputs.flickHalf.textContent = `${layoutState.flick.half} px`;
  layoutOutputs.longPress.textContent = `${layoutState.flick.longPressMs} ms`;
  scoreShareOut.textContent = `${Math.round(layoutState.scoreShare)} %`;
  noteSpacingSlider.value = String(layoutState.noteSpacing);
  noteSpacingOut.textContent = `${layoutState.noteSpacing} %`;
  printWatermarkToggle.classList.toggle('active', layoutState.printWatermark);
  printWatermarkToggle.setAttribute('aria-pressed', String(layoutState.printWatermark));
  printWatermarkState.textContent = layoutState.printWatermark ? 'Päällä' : 'Pois';
  pitchNameToggle.classList.toggle('active', layoutState.pitchNames);
  pitchNameToggle.setAttribute('aria-pressed', String(layoutState.pitchNames));
  pitchNameState.textContent = layoutState.pitchNames ? 'Päällä' : 'Pois';
  SCORE_TEXT_ROLES.forEach(role => {
    scoreTextControls[role].size.value = String(layoutState.scoreText[role].size);
    scoreTextControls[role].x.value = String(layoutState.scoreText[role].x);
    scoreTextControls[role].y.value = String(layoutState.scoreText[role].y);
    scoreTextOutputs[role].size.textContent = `${layoutState.scoreText[role].size} %`;
    scoreTextOutputs[role].x.textContent = `${layoutState.scoreText[role].x} u`;
    scoreTextOutputs[role].y.textContent = `${layoutState.scoreText[role].y} u`;
  });
}

function syncStretchLastLineButton() {
  stretchLastLineBtn.classList.toggle('active', stretchLastLineCommandRunning);
  stretchLastLineBtn.setAttribute('aria-busy', String(stretchLastLineCommandRunning));
}

async function stretchLastLineOnce() {
  if (stretchLastLineCommandRunning) return;
  stretchLastLineCommandRunning = true;
  stretchLastLineOnceRequested = true;
  syncStretchLastLineButton();
  clearTimeout(window.__noteSpacingRenderTimer);
  clearTimeout(window.__osmdResizeTimer);
  // Ensimmäinen kierros vaihtaa OSMD:n kaiverrussäännön. Safarissa viimeisen
  // järjestelmän leveys voi silti jäädä edellisestä GraphicSheetistä, kunnes
  // jokin muu nappi pyytää uuden renderöinnin. Tehdään sama toinen kierros
  // automaattisesti heti seuraavassa ruudunpäivityksessä.
  try {
    await renderScore();
    await new Promise(resolve => requestAnimationFrame(() => resolve()));
    await renderScore();
  } finally {
    // Nykyinen GraphicSheet jää venytetyksi. Seuraava tavallinen nuotti- tai
    // tietomuutos renderöidään taas normaalina, ellei komentoa paineta uudelleen.
    stretchLastLineOnceRequested = false;
    stretchLastLineCommandRunning = false;
    syncStretchLastLineButton();
  }
}

function bindLayoutControls() {
  rightHandBtn.addEventListener('click', () => { layoutState.handedness = 'right'; applyLayoutState(); });
  leftHandBtn.addEventListener('click', () => { layoutState.handedness = 'left'; applyLayoutState(); });

  layoutControls.scoreZoom.addEventListener('input', e => { layoutState.scoreZoom = Number(e.target.value); applyLayoutState(); });
  layoutControls.systemSpacing.addEventListener('input', e => { layoutState.systemSpacing = Number(e.target.value); applyLayoutState(); });
  layoutControls.marginLeft.addEventListener('input', e => { layoutState.margins.left = Number(e.target.value); applyLayoutState(); });
  layoutControls.marginRight.addEventListener('input', e => { layoutState.margins.right = Number(e.target.value); applyLayoutState(); });
  layoutControls.marginTop.addEventListener('input', e => { layoutState.margins.top = Number(e.target.value); applyLayoutState(); });
  layoutControls.marginBottom.addEventListener('input', e => { layoutState.margins.bottom = Number(e.target.value); applyLayoutState(); });
  layoutControls.whiteWidth.addEventListener('input', e => { layoutState.whiteWidth = Number(e.target.value); applyLayoutState(); });
  layoutControls.keyboardHeight.addEventListener('input', e => { layoutState.keyboardHeight = Number(e.target.value); applyLayoutState(); });
  layoutControls.blackWidth.addEventListener('input', e => { layoutState.blackWidth = Number(e.target.value); applyLayoutState(); });
  layoutControls.blackHeight.addEventListener('input', e => { layoutState.blackHeight = Number(e.target.value); applyLayoutState(); });
  layoutControls.flickEighth.addEventListener('input', e => { layoutState.flick.eighth = Number(e.target.value); applyLayoutState(); });
  layoutControls.flickHalf.addEventListener('input', e => { layoutState.flick.half = Number(e.target.value); applyLayoutState(); });
  layoutControls.longPress.addEventListener('input', e => { layoutState.flick.longPressMs = Number(e.target.value); applyLayoutState(); });
  printWatermarkToggle.addEventListener('click', () => {
    layoutState.printWatermark = !layoutState.printWatermark;
    invalidateCachedPdf();
    syncLayoutControls();
    saveLayoutState();
  });
  pitchNameToggle.addEventListener('click', () => {
    layoutState.pitchNames = !layoutState.pitchNames;
    syncLayoutControls();
    saveLayoutState();
    renderPitchNameOverlays();
    invalidateCachedPdf();
  });
  SCORE_TEXT_ROLES.forEach(role => {
    ['size', 'x', 'y'].forEach(property => {
      scoreTextControls[role][property].addEventListener('input', event => {
        layoutState.scoreText[role][property] = Number(event.target.value);
        normalizeFlickThresholds();
        syncLayoutControls();
        applyScoreTextLayout();
        invalidateCachedPdf();
        saveLayoutState();
      });
    });
  });
}

function setLayoutPanelOpen(open) {
  layoutPanel.classList.toggle('open', open);
  layoutPanel.setAttribute('aria-hidden', String(!open));
  osmdContainer.classList.toggle('show-margin-guides', open);
  renderMarginGuides();
}

function setSongPanelOpen(open) {
  songPanel.classList.toggle('open', open);
  songPanelBackdrop.classList.toggle('open', open);
  songPanel.setAttribute('aria-hidden', String(!open));
  songPanelBackdrop.setAttribute('aria-hidden', String(!open));
  songPanelToggle.setAttribute('aria-expanded', String(open));
}

function getPdfFilename() {
  const base = String(titleInput.value || 'Uusi kappale')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/[. ]+$/g, '')
    .trim()
    .slice(0, 120) || 'Uusi kappale';
  return `${base}.pdf`;
}

function getScorePageSvgs() {
  const pageSvgs = [...osmdContainer.querySelectorAll('div[id^="osmdCanvasPage"]')]
    .map(page => page.querySelector('svg'))
    .filter(Boolean);
  return pageSvgs.length ? pageSvgs : [...osmdContainer.querySelectorAll('svg')];
}

function normalizeRenderedText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function getSvgTextFontSize(element) {
  return finiteLayoutNumber(String(element.getAttribute('font-size') || '').replace('px', ''), 20);
}

function getSvgTextBox(element) {
  try {
    const box = element.getBBox();
    if ([box.x, box.y, box.width, box.height].every(Number.isFinite) && box.width >= 0 && box.height > 0) {
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    }
  } catch {}

  const x = finiteLayoutNumber(element.getAttribute('x'), 0);
  const y = finiteLayoutNumber(element.getAttribute('y'), 0);
  const fontSize = getSvgTextFontSize(element);
  let width = normalizeRenderedText(element.textContent).length * fontSize * 0.55;
  try {
    const measuredWidth = element.getComputedTextLength();
    if (Number.isFinite(measuredWidth) && measuredWidth > 0) width = measuredWidth;
  } catch {}
  return { x, y: y - fontSize * 0.8, width, height: fontSize };
}

function findScoreTextElement(svg, role, value, claimedElements) {
  const existing = svg.querySelector(`text[data-score-text-role="${role}"]`);
  if (existing && !claimedElements.has(existing)) return existing;

  const wanted = normalizeRenderedText(value);
  if (!wanted) return null;
  const candidates = [...svg.querySelectorAll('text')].filter(element => (
    !claimedElements.has(element)
    && !element.hasAttribute('data-score-text-role')
    && normalizeRenderedText(element.textContent) === wanted
  ));
  if (!candidates.length) return null;

  if (role === 'title') {
    candidates.sort((a, b) => getSvgTextFontSize(b) - getSvgTextFontSize(a));
  } else if (role === 'composer') {
    candidates.sort((a, b) => getSvgTextBox(a).y - getSvgTextBox(b).y);
  } else {
    candidates.sort((a, b) => getSvgTextBox(b).y - getSvgTextBox(a).y);
  }
  return candidates[0];
}

function rememberScoreTextBase(element, role) {
  if (!element.hasAttribute('data-score-text-base-box')) {
    const box = getSvgTextBox(element);
    element.setAttribute('data-score-text-base-x', String(finiteLayoutNumber(element.getAttribute('x'), 0)));
    element.setAttribute('data-score-text-base-y', String(finiteLayoutNumber(element.getAttribute('y'), 0)));
    element.setAttribute('data-score-text-base-font-size', String(getSvgTextFontSize(element)));
    element.setAttribute('data-score-text-base-box', [box.x, box.y, box.width, box.height].join(','));
  }
  element.setAttribute('data-score-text-role', role);
}

function applyScoreTextElement(element, role, settings) {
  rememberScoreTextBase(element, role);
  const baseX = finiteLayoutNumber(element.getAttribute('data-score-text-base-x'), 0);
  const baseY = finiteLayoutNumber(element.getAttribute('data-score-text-base-y'), 0);
  const baseFontSize = finiteLayoutNumber(element.getAttribute('data-score-text-base-font-size'), 20);
  const baseBoxValues = String(element.getAttribute('data-score-text-base-box') || '')
    .split(',')
    .map(Number);
  const baseBox = baseBoxValues.length === 4 && baseBoxValues.every(Number.isFinite)
    ? { x: baseBoxValues[0], y: baseBoxValues[1], width: baseBoxValues[2], height: baseBoxValues[3] }
    : getSvgTextBox(element);

  element.setAttribute('x', String(baseX));
  element.setAttribute('y', String(baseY));
  element.setAttribute('font-size', `${baseFontSize * settings.size / 100}px`);
  const scaledBox = getSvgTextBox(element);

  let horizontalCorrection = baseBox.x - scaledBox.x;
  if (role === 'title') {
    horizontalCorrection = (baseBox.x + baseBox.width / 2) - (scaledBox.x + scaledBox.width / 2);
  } else if (role === 'composer') {
    horizontalCorrection = (baseBox.x + baseBox.width) - (scaledBox.x + scaledBox.width);
  }
  const verticalCorrection = (baseBox.y + baseBox.height / 2) - (scaledBox.y + scaledBox.height / 2);
  element.setAttribute('x', String(baseX + horizontalCorrection + settings.x));
  // compacttight siirtää säveltäjän, tempon ja nuottirivit PageTopMarginNarrow-
  // arvolla, mutta jättää otsikon kiinteään kohtaan. Otsikolle lisätään sama
  // OSMD-yksiköistä SVG-yksiköiksi muunnettu siirto erikseen.
  const topMarginCorrection = role === 'title'
    ? finiteLayoutNumber(layoutState.margins?.top, 0) * 10
    : 0;
  element.setAttribute('y', String(baseY + verticalCorrection + settings.y + topMarginCorrection));
}

function applyScoreTextLayout() {
  if (!layoutState?.scoreText) return;
  const values = {
    title: titleInput.value || 'Uusi kappale',
    composer: composerInput.value || '',
    tempo: tempoTextInput.value || '',
  };
  getScorePageSvgs().forEach(svg => {
    const claimedElements = new Set();
    SCORE_TEXT_ROLES.forEach(role => {
      const element = findScoreTextElement(svg, role, values[role], claimedElements);
      if (!element) return;
      claimedElements.add(element);
      applyScoreTextElement(element, role, layoutState.scoreText[role]);
    });
  });
}

function getCurrentPdfSignature() {
  return `${scoreRenderRevision}|${getPdfFilename()}|${layoutState.printWatermark ? 'wm1' : 'wm0'}`;
}

function invalidateCachedPdf() {
  cachedPdfFile = null;
  cachedPdfSignature = '';
  syncPdfActionButton();
}

function syncPdfActionButton() {
  const cacheIsCurrent = cachedPdfFile && cachedPdfSignature === getCurrentPdfSignature();
  if (cachedPdfFile && !cacheIsCurrent) {
    cachedPdfFile = null;
    cachedPdfSignature = '';
  }
  pdfShareBtn.disabled = pdfActionRunning;
  pdfShareBtn.setAttribute('aria-busy', String(pdfActionRunning));
  pdfShareBtnLabel.textContent = pdfActionRunning
    ? 'Luodaan PDF…'
    : cacheIsCurrent
      ? 'Jaa valmis PDF'
      : 'PDF / Jaa';
}

function noteScoreRenderCompleted() {
  renderMarginGuides();
  followLatestScoreEntryAfterRender();
  scoreRenderRevision += 1;
  syncPdfActionButton();
}

function setDocumentActionStatus(message) {
  documentActionStatus.textContent = message;
}

function waitForAnimationFrame() {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

async function waitForScoreReady() {
  // Sliderien renderöinnit käynnistyvät 120 ms viiveellä. Lyhyt odotus ottaa
  // mukaan myös juuri ennen PDF-nappia tehdyn zoomaus- tai välistysmuutoksen.
  await new Promise(resolve => setTimeout(resolve, 160));
  while (scoreRenderLoopPromise) await scoreRenderLoopPromise;
  await waitForAnimationFrame();
  if (!getScorePageSvgs().length) throw new Error('Nuottisivuja ei löytynyt.');
}

function cloneSvgForPdf(sourceSvg) {
  const clone = sourceSvg.cloneNode(true);
  clone.querySelectorAll('.system-break-candidate-svg').forEach(element => element.remove());
  clone.querySelectorAll('.margin-guide-overlay').forEach(element => element.remove());
  if (!clone.hasAttribute('viewBox')) {
    const sourceWidth = Number.parseFloat(sourceSvg.getAttribute('width')) || 850;
    const sourceHeight = Number.parseFloat(sourceSvg.getAttribute('height')) || sourceWidth * 297 / 210;
    clone.setAttribute('viewBox', `0 0 ${sourceWidth} ${sourceHeight}`);
  }
  clone.removeAttribute('style');
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', '850');
  clone.setAttribute('height', String(850 * 297 / 210));
  clone.style.display = 'block';
  clone.style.width = '850px';
  clone.style.height = `${850 * 297 / 210}px`;
  appendPdfWatermark(clone);
  return clone;
}

function parseSvgViewBox(svg) {
  const values = String(svg.getAttribute('viewBox') || '')
    .trim()
    .split(/[ ,]+/)
    .map(Number);
  if (values.length === 4 && values.every(Number.isFinite) && values[2] > 0 && values[3] > 0) {
    return { x: values[0], y: values[1], width: values[2], height: values[3] };
  }
  return { x: 0, y: 0, width: 850, height: 850 * 297 / 210 };
}

function createMarginGuideLine(side, x1, y1, x2, y2) {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('data-margin-side', side);
  line.setAttribute('x1', String(x1));
  line.setAttribute('y1', String(y1));
  line.setAttribute('x2', String(x2));
  line.setAttribute('y2', String(y2));
  return line;
}

function renderMarginGuides() {
  getScorePageSvgs().forEach(svg => {
    svg.querySelectorAll('.margin-guide-overlay').forEach(element => element.remove());
    const box = parseSvgViewBox(svg);
    const minX = box.x;
    const minY = box.y;
    const maxX = box.x + box.width;
    const maxY = box.y + box.height;
    const visibleInset = 1;
    const unitScale = 10;
    const left = clamp(minX + layoutState.margins.left * unitScale, minX + visibleInset, maxX - visibleInset);
    const right = clamp(maxX - layoutState.margins.right * unitScale, minX + visibleInset, maxX - visibleInset);
    const top = clamp(minY + layoutState.margins.top * unitScale, minY + visibleInset, maxY - visibleInset);
    const bottom = clamp(maxY - layoutState.margins.bottom * unitScale, minY + visibleInset, maxY - visibleInset);

    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.classList.add('margin-guide-overlay');
    group.setAttribute('aria-hidden', 'true');
    group.setAttribute('pointer-events', 'none');
    group.appendChild(createMarginGuideLine('left', left, minY, left, maxY));
    group.appendChild(createMarginGuideLine('right', right, minY, right, maxY));
    group.appendChild(createMarginGuideLine('top', minX, top, maxX, top));
    group.appendChild(createMarginGuideLine('bottom', minX, bottom, maxX, bottom));
    svg.appendChild(group);
  });
}

function appendPdfWatermark(svg) {
  if (!layoutState.printWatermark) return;
  const box = parseSvgViewBox(svg);
  const centerX = box.x + box.width / 2;
  const fontSize = box.width * 0.05;
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.classList.add('pdf-watermark-overlay');
  group.setAttribute('pointer-events', 'none');

  [0.22, 0.5, 0.78].forEach(verticalPosition => {
    const centerY = box.y + box.height * verticalPosition;
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', String(centerX));
    text.setAttribute('y', String(centerY));
    text.setAttribute('dy', String(fontSize * 0.34));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('transform', `rotate(-28 ${centerX} ${centerY})`);
    text.setAttribute('fill', '#6f7785');
    text.setAttribute('fill-opacity', '0.12');
    text.setAttribute('font-family', 'Arial, Helvetica, sans-serif');
    text.setAttribute('font-size', String(fontSize));
    text.setAttribute('font-weight', '800');
    text.setAttribute('letter-spacing', String(box.width * 0.002));
    text.textContent = PRINT_WATERMARK_TEXT;
    group.appendChild(text);
  });

  svg.appendChild(group);
}

async function createScorePdfFile() {
  const JsPdf = window.jspdf?.jsPDF;
  if (!JsPdf) throw new Error('PDF-kirjastoa ei voitu ladata.');

  const sourceSvgs = getScorePageSvgs();
  if (!sourceSvgs.length) throw new Error('Nuottisivuja ei löytynyt.');

  const pdf = new JsPdf({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
    putOnlyUsedFonts: true,
  });
  pdf.setProperties({
    title: String(titleInput.value || 'Uusi kappale'),
    author: String(composerInput.value || ''),
    subject: 'Pikakirjoitin-nuotti',
    creator: 'Pikakirjoitin',
  });

  const scratch = document.createElement('div');
  scratch.className = 'pdf-svg-scratch';
  document.body.appendChild(scratch);

  try {
    for (let index = 0; index < sourceSvgs.length; index += 1) {
      if (index > 0) pdf.addPage('a4', 'portrait');
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, 210, 297, 'F');

      const clone = cloneSvgForPdf(sourceSvgs[index]);
      scratch.appendChild(clone);
      await pdf.svg(clone, { x: 0, y: 0, width: 210, height: 297 });
      clone.remove();
    }
  } finally {
    scratch.remove();
  }

  const blob = pdf.output('blob');
  return new File([blob], getPdfFilename(), { type: 'application/pdf' });
}

function browserCanSharePdf(file) {
  if (typeof navigator.share !== 'function') return false;
  if (typeof navigator.canShare !== 'function') return true;
  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

function downloadPdfFile(file) {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  setDocumentActionStatus('PDF tallennettu tiedostoksi.');
}

function finishPdfAction() {
  pdfActionRunning = false;
  syncPdfActionButton();
}

function sharePreparedPdf(file, { generatedNow = false } = {}) {
  if (!browserCanSharePdf(file)) {
    downloadPdfFile(file);
    finishPdfAction();
    return;
  }

  // Kun valmis PDF jaetaan toisella painalluksella, navigator.share kutsutaan
  // heti painalluksen sisällä. Tämä on tärkeä iPadOS Safarin käyttäjäele-ehto.
  let sharePromise;
  try {
    sharePromise = navigator.share({
      files: [file],
      title: String(titleInput.value || 'Uusi kappale'),
    });
  } catch (error) {
    sharePromise = Promise.reject(error);
  }

  Promise.resolve(sharePromise)
    .then(() => setDocumentActionStatus('PDF jaettu.'))
    .catch(error => {
      if (error?.name === 'AbortError') {
        setDocumentActionStatus('Jakaminen peruttiin. PDF on edelleen valmiina.');
      } else if (generatedNow && error?.name === 'NotAllowedError') {
        setDocumentActionStatus('PDF on valmis. Paina “Jaa valmis PDF”, niin iPadin jakovalikko avautuu.');
      } else {
        console.warn('PDF sharing failed', error);
        downloadPdfFile(file);
      }
    })
    .finally(finishPdfAction);
}

async function createAndSharePdf() {
  pdfActionRunning = true;
  syncPdfActionButton();
  setDocumentActionStatus('Muodostetaan A4-PDF:ää…');

  try {
    await waitForScoreReady();
    const signature = getCurrentPdfSignature();
    const file = await createScorePdfFile();
    cachedPdfFile = file;
    cachedPdfSignature = signature;
    sharePreparedPdf(file, { generatedNow: true });
  } catch (error) {
    console.error('PDF creation failed', error);
    setDocumentActionStatus(`PDF:n luonti epäonnistui: ${error?.message || 'tuntematon virhe'}`);
    finishPdfAction();
  }
}

function handlePdfShare() {
  if (pdfActionRunning) return;
  const cacheIsCurrent = cachedPdfFile && cachedPdfSignature === getCurrentPdfSignature();
  if (cacheIsCurrent) {
    pdfActionRunning = true;
    syncPdfActionButton();
    sharePreparedPdf(cachedPdfFile);
    return;
  }
  createAndSharePdf();
}

function removePrintWatermarks() {
  osmdContainer.querySelectorAll('.print-watermark-overlay').forEach(element => element.remove());
}

function preparePrintWatermarks() {
  removePrintWatermarks();
  if (!layoutState.printWatermark) return;
  osmdContainer.querySelectorAll('div[id^="osmdCanvasPage"]').forEach(page => {
    const overlay = document.createElement('div');
    overlay.className = 'print-watermark-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    for (let index = 0; index < 3; index += 1) {
      const label = document.createElement('span');
      label.textContent = PRINT_WATERMARK_TEXT;
      overlay.appendChild(label);
    }
    page.appendChild(overlay);
  });
}

function printScore() {
  const previousTitle = document.title;
  document.title = String(titleInput.value || 'Uusi kappale');
  setSongPanelOpen(false);
  preparePrintWatermarks();

  let printStateRestored = false;
  const restorePrintState = () => {
    if (printStateRestored) return;
    printStateRestored = true;
    document.title = previousTitle;
    removePrintWatermarks();
    window.removeEventListener('afterprint', restorePrintState);
  };
  window.addEventListener('afterprint', restorePrintState, { once: true });
  window.print();
  setTimeout(restorePrintState, 60000);
}

function setScoreShare(value, { save = false } = {}) {
  layoutState.scoreShare = clamp(Number(value) || defaultLayout.scoreShare, 30, 70);
  mainColumn.style.setProperty('--score-share', `${layoutState.scoreShare}%`);
  scoreKeyboardDivider.setAttribute('aria-valuenow', String(Math.round(layoutState.scoreShare)));
  scoreKeyboardDivider.setAttribute('aria-valuemin', '30');
  scoreKeyboardDivider.setAttribute('aria-valuemax', '70');
  scoreShareOut.textContent = `${Math.round(layoutState.scoreShare)} %`;
  if (save) saveLayoutState();
}

function applyNoteSpacing({ save = false } = {}) {
  layoutState.noteSpacing = normalizeNoteSpacing(layoutState.noteSpacing);
  noteSpacingSlider.value = String(layoutState.noteSpacing);
  noteSpacingOut.textContent = `${layoutState.noteSpacing} %`;

  if (state.osmd && state.appliedNoteSpacing !== layoutState.noteSpacing) {
    invalidateCachedPdf();
    const spacing = layoutState.noteSpacing;
    clearTimeout(window.__noteSpacingRenderTimer);
    window.__noteSpacingRenderTimer = setTimeout(async () => {
      try {
        setOsmdNoteSpacingRules(state.osmd, spacing);
        await state.osmd.render();
        applyScoreTextLayout();
        alignDynamicsByStaffLine();
        renderPitchNameOverlays();
        state.appliedNoteSpacing = spacing;
        renderSystemBreakMarkers();
        refreshNoteSelectionGeometry();
        noteScoreRenderCompleted();
      } catch (err) {
        console.warn('OSMD spacing render failed', err);
      }
    }, 120);
  }
  if (save) saveLayoutState();
}

function getScoreLayoutSignature() {
  return [
    layoutState.scoreZoom,
    layoutState.systemSpacing,
    layoutState.margins.left,
    layoutState.margins.right,
    layoutState.margins.top,
    layoutState.margins.bottom,
  ].join('|');
}

function applyScoreLayout() {
  if (!state.osmd || state.appliedScoreLayoutSignature === getScoreLayoutSignature()) return;
  invalidateCachedPdf();
  clearTimeout(window.__noteSpacingRenderTimer);
  clearTimeout(window.__scoreLayoutRenderTimer);
  window.__scoreLayoutRenderTimer = setTimeout(() => renderScore(), 120);
}

function normalizeNoteSpacing(value) {
  const parsed = Number(value);
  // Versioissa 0.3.4.1–0.3.4.2 tallennettu arvo oli OSMD:n
  // softmax-luku välillä 1–30. Se ei vastaa uuden sliderin prosentteja.
  if (!Number.isFinite(parsed) || parsed <= 30) return defaultLayout.noteSpacing;
  return clamp(Math.round(parsed), 50, 150);
}

function setOsmdNoteSpacingRules(osmd, percent) {
  if (!osmd?.EngravingRules) return;
  const scale = normalizeNoteSpacing(percent) / 100;
  osmd.EngravingRules.SoftmaxFactorVexFlow = 15;
  osmd.EngravingRules.VoiceSpacingMultiplierVexflow = 0.65 * scale;
  osmd.EngravingRules.VoiceSpacingAddendVexflow = 2 * scale;
}

function setOsmdScoreLayoutRules(osmd) {
  if (!osmd?.EngravingRules) return;
  const rules = osmd.EngravingRules;
  const systemSpacingScale = layoutState.systemSpacing / 100;
  // compacttight-asetuksen alkuarvot ovat molemmissa 1 OSMD-yksikkö.
  rules.MinimumDistanceBetweenSystems = systemSpacingScale;
  rules.MinSkyBottomDistBetweenSystems = systemSpacingScale;
  rules.PageLeftMargin = layoutState.margins.left;
  rules.PageRightMargin = layoutState.margins.right;
  rules.PageTopMargin = layoutState.margins.top;
  // compacttight käyttää ensimmäisellä ja seuraavilla sivuilla kapean
  // yläreunan sääntöä tavallisen PageTopMargin-arvon sijasta.
  rules.PageTopMarginNarrow = layoutState.margins.top;
  rules.PageBottomMargin = layoutState.margins.bottom;
}

function bindScoreKeyboardDivider() {
  let activePointerId = null;

  const updateFromPointer = (ev) => {
    if (activePointerId === null || ev.pointerId !== activePointerId) return;
    ev.preventDefault();
    const rect = mainColumn.getBoundingClientRect();
    if (!rect.height) return;
    setScoreShare(((ev.clientY - rect.top) / rect.height) * 100);
  };

  const finishDrag = (ev) => {
    if (activePointerId === null) return;
    if (ev?.pointerId !== undefined && ev.pointerId !== activePointerId) return;
    const pointerId = activePointerId;
    activePointerId = null;
    if (scoreKeyboardDivider.hasPointerCapture?.(pointerId)) {
      try { scoreKeyboardDivider.releasePointerCapture(pointerId); } catch {}
    }
    scoreKeyboardDivider.classList.remove('dragging');
    saveLayoutState();
  };

  scoreKeyboardDivider.addEventListener('pointerdown', (ev) => {
    if (activePointerId !== null) return;
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
    ev.preventDefault();
    activePointerId = ev.pointerId;
    scoreKeyboardDivider.classList.add('dragging');
    try { scoreKeyboardDivider.setPointerCapture?.(ev.pointerId); } catch {}
  }, { passive: false });

  // iPadOS Safari ei aina pidä pointer capturea voimassa. Ikkunatason
  // kuuntelu pitää vedon toiminnassa myös silloin, kun sormi poistuu kahvalta.
  window.addEventListener('pointermove', updateFromPointer, { passive: false });
  window.addEventListener('pointerup', finishDrag);
  window.addEventListener('pointercancel', finishDrag);
  window.addEventListener('blur', () => finishDrag());

  scoreKeyboardDivider.addEventListener('keydown', (ev) => {
    if (ev.key !== 'ArrowUp' && ev.key !== 'ArrowDown') return;
    ev.preventDefault();
    setScoreShare(layoutState.scoreShare + (ev.key === 'ArrowDown' ? 1 : -1), { save: true });
  });
}

function exportLayoutJson() {
  const payload = {
    format: 'Pikakirjoitin layout',
    version: 1,
    layout: structuredClone(layoutState),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Pikakirjoitin_asettelu.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  statusText.textContent = 'Asettelu-JSON tallennettu';
  setTimeout(() => statusText.textContent = 'Valmis', 1200);
}

function importLayoutJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || ''));
      const imported = parsed.layout || parsed;
      layoutState = {
        defaultsVersion: LAYOUT_DEFAULTS_VERSION,
        handedness: imported.handedness === 'left' ? 'left' : 'right',
        scoreShare: Number(imported.scoreShare) || defaultLayout.scoreShare,
        noteSpacing: normalizeNoteSpacing(imported.noteSpacing),
        scoreZoom: finiteLayoutNumber(imported.scoreZoom, defaultLayout.scoreZoom),
        systemSpacing: finiteLayoutNumber(imported.systemSpacing, defaultLayout.systemSpacing),
        pitchNames: imported.pitchNames !== false,
        printWatermark: imported.printWatermark !== false,
        scoreText: {
          title: {
            size: finiteLayoutNumber(imported.scoreText?.title?.size, defaultLayout.scoreText.title.size),
            x: finiteLayoutNumber(imported.scoreText?.title?.x, defaultLayout.scoreText.title.x),
            y: finiteLayoutNumber(imported.scoreText?.title?.y, defaultLayout.scoreText.title.y),
          },
          composer: {
            size: finiteLayoutNumber(imported.scoreText?.composer?.size, defaultLayout.scoreText.composer.size),
            x: finiteLayoutNumber(imported.scoreText?.composer?.x, defaultLayout.scoreText.composer.x),
            y: finiteLayoutNumber(imported.scoreText?.composer?.y, defaultLayout.scoreText.composer.y),
          },
          tempo: {
            size: finiteLayoutNumber(imported.scoreText?.tempo?.size, defaultLayout.scoreText.tempo.size),
            x: finiteLayoutNumber(imported.scoreText?.tempo?.x, defaultLayout.scoreText.tempo.x),
            y: finiteLayoutNumber(imported.scoreText?.tempo?.y, defaultLayout.scoreText.tempo.y),
          },
        },
        margins: {
          left: finiteLayoutNumber(imported.margins?.left, defaultLayout.margins.left),
          right: finiteLayoutNumber(imported.margins?.right, defaultLayout.margins.right),
          top: finiteLayoutNumber(imported.margins?.top, defaultLayout.margins.top),
          bottom: finiteLayoutNumber(imported.margins?.bottom, defaultLayout.margins.bottom),
        },
        whiteWidth: Number(imported.whiteWidth) || defaultLayout.whiteWidth,
        keyboardHeight: Number(imported.keyboardHeight) || defaultLayout.keyboardHeight,
        blackWidth: Number(imported.blackWidth) || defaultLayout.blackWidth,
        blackHeight: Number(imported.blackHeight) || defaultLayout.blackHeight,
        flick: {
          eighth: Number(imported.flick?.eighth) || defaultLayout.flick.eighth,
          half: Number(imported.flick?.half) || defaultLayout.flick.half,
          longPressMs: Number(imported.flick?.longPressMs) || defaultLayout.flick.longPressMs,
        },
      };
      applyLayoutState();
      statusText.textContent = 'Asettelu-JSON ladattu';
      setTimeout(() => statusText.textContent = 'Valmis', 1200);
    } catch {
      statusText.textContent = 'JSON-tiedostoa ei voitu lukea';
    } finally {
      layoutJsonFile.value = '';
    }
  };
  reader.readAsText(file);
}

function projectText(value, fallback = '', maxLength = 200) {
  return String(value ?? fallback).slice(0, maxLength);
}

function createProjectId() {
  try {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  } catch {}
  return `project-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function getProjectLayoutData() {
  return {
    noteSpacing: layoutState.noteSpacing,
    scoreZoom: layoutState.scoreZoom,
    systemSpacing: layoutState.systemSpacing,
    pitchNames: layoutState.pitchNames,
    printWatermark: layoutState.printWatermark,
    scoreText: structuredClone(layoutState.scoreText),
    margins: structuredClone(layoutState.margins),
  };
}

function createProjectPayload() {
  ensureScoreEntryIds();
  pruneSlurs();
  pruneHairpins();
  return {
    format: PROJECT_FORMAT,
    version: PROJECT_FORMAT_VERSION,
    appVersion: PROJECT_APP_VERSION,
    projectId: currentProjectId,
    savedAt: new Date().toISOString(),
    song: {
      title: titleInput.value || 'Uusi kappale',
      composer: composerInput.value || '',
      tempoText: tempoTextInput.value || '',
      bpm: clamp(Number(bpmInput.value) || 100, 30, 240),
      time: {
        beats: Number(beatsSelect.value) || 4,
        beatType: Number(beatTypeSelect.value) || 4,
      },
      key: {
        fifths: Number(keySelect.value) || 0,
        mode: modeSelect.value === 'minor' ? 'minor' : 'major',
      },
    },
    score: {
      notes: structuredClone(state.notes),
      slurs: structuredClone(state.slurs),
      hairpins: structuredClone(state.hairpins),
      systemBreaks: [...state.systemBreaks].sort((a, b) => a - b),
      pendingSystemBreakIndex: state.pendingSystemBreakIndex,
    },
    layout: getProjectLayoutData(),
  };
}

function normalizeProjectLayout(imported) {
  imported ||= {};
  const current = getProjectLayoutData();
  const readScoreText = (role, property) => finiteLayoutNumber(
    imported.scoreText?.[role]?.[property],
    current.scoreText[role][property],
  );
  return {
    noteSpacing: normalizeNoteSpacing(imported.noteSpacing ?? current.noteSpacing),
    scoreZoom: clamp(finiteLayoutNumber(imported.scoreZoom, current.scoreZoom), 70, 160),
    systemSpacing: clamp(finiteLayoutNumber(imported.systemSpacing, current.systemSpacing), 500, 1000),
    pitchNames: Object.prototype.hasOwnProperty.call(imported, 'pitchNames')
      ? imported.pitchNames !== false
      : current.pitchNames,
    printWatermark: Object.prototype.hasOwnProperty.call(imported, 'printWatermark')
      ? imported.printWatermark !== false
      : current.printWatermark,
    scoreText: {
      title: {
        size: readScoreText('title', 'size'),
        x: readScoreText('title', 'x'),
        y: readScoreText('title', 'y'),
      },
      composer: {
        size: readScoreText('composer', 'size'),
        x: readScoreText('composer', 'x'),
        y: readScoreText('composer', 'y'),
      },
      tempo: {
        size: readScoreText('tempo', 'size'),
        x: readScoreText('tempo', 'x'),
        y: readScoreText('tempo', 'y'),
      },
    },
    margins: {
      left: finiteLayoutNumber(imported.margins?.left, current.margins.left),
      right: finiteLayoutNumber(imported.margins?.right, current.margins.right),
      top: finiteLayoutNumber(imported.margins?.top, current.margins.top),
      bottom: finiteLayoutNumber(imported.margins?.bottom, current.margins.bottom),
    },
  };
}

function parseProjectPayload(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('Projektitiedoston rakenne puuttuu.');
  if (raw.format !== PROJECT_FORMAT) throw new Error('Tiedosto ei ole Pikakirjoitin-projekti.');
  const version = Number(raw.version);
  if (!Number.isInteger(version) || version < 1 || version > PROJECT_FORMAT_VERSION) {
    throw new Error('Projektitiedoston versiota ei tueta.');
  }

  const sourceNotes = raw.score?.notes;
  if (!Array.isArray(sourceNotes)) throw new Error('Projektista puuttuvat nuotit.');
  if (sourceNotes.length > 10000) throw new Error('Projektissa on liian monta nuottia.');

  const oldToNewId = new Map();
  const noteKindById = new Map();
  const allowedDynamics = new Set(['ppp', 'pp', 'p', 'mp', 'mf', 'f', 'ff', 'fff']);
  const notes = sourceNotes.map((source, index) => {
    if (!source || (source.kind !== 'note' && source.kind !== 'rest')) {
      throw new Error(`Virheellinen nuotti kohdassa ${index + 1}.`);
    }
    const units = Number(source.units);
    if (!durationMapByUnits.has(units)) {
      throw new Error(`Tuntematon aika-arvo kohdassa ${index + 1}.`);
    }
    const id = `entry-${index + 1}`;
    const oldId = projectText(source.id, '', 100);
    if (oldId && !oldToNewId.has(oldId)) oldToNewId.set(oldId, id);
    noteKindById.set(id, source.kind);
    if (source.kind === 'rest') return { id, kind: 'rest', units };

    const step = projectText(source.step, '', 1).toUpperCase();
    const octave = Number(source.octave);
    const alter = Number(source.alter || 0);
    if (!/^[A-G]$/.test(step) || !Number.isInteger(octave) || octave < 0 || octave > 9) {
      throw new Error(`Virheellinen sävel kohdassa ${index + 1}.`);
    }
    if (!Number.isInteger(alter) || alter < -2 || alter > 2) {
      throw new Error(`Virheellinen etumerkki kohdassa ${index + 1}.`);
    }
    const note = { id, kind: 'note', step, alter, octave, units };
    if (source.staccato) note.staccato = true;
    if (source.portato) note.portato = true;
    if (source.accent) note.accent = true;
    if (allowedDynamics.has(source.dynamic)) note.dynamic = source.dynamic;
    return note;
  });

  const remapRange = (source, type, index) => {
    const startId = oldToNewId.get(projectText(source?.startId, '', 100));
    const endId = oldToNewId.get(projectText(source?.endId, '', 100));
    if (!startId || !endId || startId === endId) return null;
    if (noteKindById.get(startId) !== 'note' || noteKindById.get(endId) !== 'note') return null;
    return { id: `${type}-${index + 1}`, startId, endId };
  };
  const slurs = (Array.isArray(raw.score?.slurs) ? raw.score.slurs : [])
    .slice(0, 10000)
    .map((source, index) => remapRange(source, 'slur', index))
    .filter(Boolean)
    .map((range, index) => ({ ...range, id: `slur-${index + 1}` }));
  const hairpins = (Array.isArray(raw.score?.hairpins) ? raw.score.hairpins : [])
    .slice(0, 10000)
    .map((source, index) => {
      const range = remapRange(source, 'hairpin', index);
      if (!range || !['crescendo', 'diminuendo'].includes(source?.type)) return null;
      return { ...range, type: source.type };
    })
    .filter(Boolean)
    .map((hairpin, index) => ({ ...hairpin, id: `hairpin-${index + 1}` }));

  const systemBreaks = [...new Set(
    (Array.isArray(raw.score?.systemBreaks) ? raw.score.systemBreaks : [])
      .map(Number)
      .filter(value => Number.isInteger(value) && value > 0 && value <= 10000),
  )].sort((a, b) => a - b);
  const requestedPendingBreak = Number(raw.score?.pendingSystemBreakIndex);
  const pendingSystemBreakIndex = Number.isInteger(requestedPendingBreak)
    && systemBreaks.includes(requestedPendingBreak)
    ? requestedPendingBreak
    : null;

  const beats = Number(raw.song?.time?.beats);
  const beatType = Number(raw.song?.time?.beatType);
  const fifths = Number(raw.song?.key?.fifths);
  return {
    format: PROJECT_FORMAT,
    version,
    projectId: projectText(raw.projectId, '', 100) || createProjectId(),
    savedAt: projectText(raw.savedAt, '', 60),
    song: {
      title: projectText(raw.song?.title, 'Uusi kappale', 200) || 'Uusi kappale',
      composer: projectText(raw.song?.composer, '', 200),
      tempoText: projectText(raw.song?.tempoText, '', 100),
      bpm: clamp(finiteLayoutNumber(raw.song?.bpm, 100), 30, 240),
      time: {
        beats: [2, 3, 4, 6].includes(beats) ? beats : 4,
        beatType: [4, 8].includes(beatType) ? beatType : 4,
      },
      key: {
        fifths: Number.isInteger(fifths) && fifths >= -7 && fifths <= 7 ? fifths : 0,
        mode: raw.song?.key?.mode === 'minor' ? 'minor' : 'major',
      },
    },
    score: { notes, slurs, hairpins, systemBreaks, pendingSystemBreakIndex },
    layout: normalizeProjectLayout(raw.layout),
  };
}

function applyProjectPayload(project, { render = true, saveAutosave = true } = {}) {
  const wasAutosaveEnabled = projectAutosaveEnabled;
  projectAutosaveEnabled = false;
  clearTimeout(projectAutosaveTimer);
  try {
    titleInput.value = project.song.title;
    composerInput.value = project.song.composer;
    tempoTextInput.value = project.song.tempoText;
    bpmInput.value = String(project.song.bpm);
    beatsSelect.value = String(project.song.time.beats);
    beatTypeSelect.value = String(project.song.time.beatType);
    keySelect.value = String(project.song.key.fifths);
    modeSelect.value = project.song.key.mode;

    state.notes = structuredClone(project.score.notes);
    state.slurs = structuredClone(project.score.slurs);
    state.hairpins = structuredClone(project.score.hairpins);
    state.nextEntryId = state.notes.length + 1;
    state.nextSlurId = state.slurs.length + 1;
    state.nextHairpinId = state.hairpins.length + 1;
    state.systemBreaks = new Set(project.score.systemBreaks);
    state.pendingSystemBreakIndex = project.score.pendingSystemBreakIndex;
    currentProjectId = project.projectId;
    suppressCurrentProjectInRecents = false;
    setNoteSelectionMode(false);
    syncSystemBreakButton();

    layoutState.noteSpacing = project.layout.noteSpacing;
    layoutState.scoreZoom = project.layout.scoreZoom;
    layoutState.systemSpacing = project.layout.systemSpacing;
    layoutState.pitchNames = project.layout.pitchNames;
    layoutState.printWatermark = project.layout.printWatermark;
    layoutState.scoreText = structuredClone(project.layout.scoreText);
    layoutState.margins = structuredClone(project.layout.margins);
    applyLayoutState();
  } finally {
    projectAutosaveEnabled = wasAutosaveEnabled;
  }
  if (render) renderScore();
  if (saveAutosave && projectAutosaveEnabled) saveAutosavedProjectNow({ announce: false });
}

function getProjectFilename() {
  const base = String(titleInput.value || 'Uusi kappale')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/[. ]+$/g, '')
    .trim()
    .slice(0, 100) || 'Uusi kappale';
  return `${base}.pikakirjoitin.json`;
}

function downloadProjectFile(file) {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  projectActionStatus.textContent = 'Projektitiedosto tallennettu.';
}

function saveProjectToFile() {
  suppressCurrentProjectInRecents = false;
  const payload = createProjectPayload();
  const json = JSON.stringify(payload, null, 2);
  const file = new File([json], getProjectFilename(), { type: 'application/json' });
  saveAutosavedProjectNow({ payload, announce: false });

  let canShare = false;
  try {
    const isIPadOrIphone = /iPad|iPhone|iPod/.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    canShare = Boolean(isIPadOrIphone && navigator.share && navigator.canShare?.({ files: [file] }));
  } catch {}
  if (!canShare) {
    downloadProjectFile(file);
    return;
  }

  projectActionStatus.textContent = 'Avataan tallennuspaikan valinta…';
  navigator.share({
    files: [file],
    title: titleInput.value || 'Pikakirjoitin-projekti',
  }).then(() => {
    projectActionStatus.textContent = 'Projekti tallennettu tai jaettu.';
  }).catch(error => {
    if (error?.name === 'AbortError') projectActionStatus.textContent = 'Tallennus peruttiin.';
    else {
      console.warn('Project sharing failed', error);
      downloadProjectFile(file);
    }
  });
}

async function loadProjectFile(file) {
  try {
    if (file.size > 5 * 1024 * 1024) throw new Error('Projektitiedosto on liian suuri.');
    const raw = JSON.parse(await file.text());
    const project = parseProjectPayload(raw);
    applyProjectPayload(project);
    projectActionStatus.textContent = `Avattu: ${file.name}`;
    statusText.textContent = 'Projekti avattu';
    setTimeout(() => statusText.textContent = 'Valmis', 1200);
  } catch (error) {
    console.warn('Project loading failed', error);
    projectActionStatus.textContent = error?.message || 'Projektia ei voitu avata.';
  } finally {
    projectFileInput.value = '';
  }
}

function openRecentProjectsDb() {
  if (recentProjectsDbPromise) return recentProjectsDbPromise;
  recentProjectsDbPromise = new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error('IndexedDB ei ole käytettävissä.'));
      return;
    }
    const request = indexedDB.open(RECENT_PROJECTS_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(RECENT_PROJECTS_STORE)) {
        db.createObjectStore(RECENT_PROJECTS_STORE, { keyPath: 'projectId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Projektimuistia ei voitu avata.'));
    request.onblocked = () => reject(new Error('Projektimuistin päivitys estyi.'));
  }).catch(error => {
    recentProjectsDbPromise = null;
    throw error;
  });
  return recentProjectsDbPromise;
}

async function readRecentProjectRecords() {
  const db = await openRecentProjectsDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(RECENT_PROJECTS_STORE, 'readonly');
    const request = transaction.objectStore(RECENT_PROJECTS_STORE).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error || new Error('Projektimuistia ei voitu lukea.'));
  });
}

async function readRecentProjectRecord(projectId) {
  const db = await openRecentProjectsDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(RECENT_PROJECTS_STORE, 'readonly');
    const request = transaction.objectStore(RECENT_PROJECTS_STORE).get(projectId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error('Projektia ei voitu lukea.'));
  });
}

async function writeRecentProjectRecord(record) {
  const db = await openRecentProjectsDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(RECENT_PROJECTS_STORE, 'readwrite');
    transaction.objectStore(RECENT_PROJECTS_STORE).put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Projektia ei voitu tallentaa muistiin.'));
    transaction.onabort = () => reject(transaction.error || new Error('Projektin tallennus keskeytyi.'));
  });
}

async function deleteRecentProjectRecord(projectId) {
  const db = await openRecentProjectsDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(RECENT_PROJECTS_STORE, 'readwrite');
    transaction.objectStore(RECENT_PROJECTS_STORE).delete(projectId);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Projektia ei voitu poistaa.'));
    transaction.onabort = () => reject(transaction.error || new Error('Projektin poisto keskeytyi.'));
  });
}

function sortRecentProjectRecords(records) {
  return [...records].sort((a, b) => (
    finiteLayoutNumber(Date.parse(b.savedAt), 0) - finiteLayoutNumber(Date.parse(a.savedAt), 0)
  ));
}

async function trimRecentProjects() {
  const records = sortRecentProjectRecords(await readRecentProjectRecords());
  const obsolete = records.slice(RECENT_PROJECTS_LIMIT);
  for (const record of obsolete) await deleteRecentProjectRecord(record.projectId);
}

function formatRecentProjectTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('fi-FI', {
    day: 'numeric',
    month: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function openRecentProject(projectId) {
  try {
    const record = await readRecentProjectRecord(projectId);
    if (!record?.payload) throw new Error('Projektia ei löytynyt muistista.');
    const project = parseProjectPayload(record.payload);
    applyProjectPayload(project);
    projectActionStatus.textContent = `Avattu muistista: ${project.song.title}`;
    statusText.textContent = 'Projekti avattu';
    setSongPanelOpen(false);
    setTimeout(() => statusText.textContent = 'Valmis', 1200);
  } catch (error) {
    console.warn('Recent project loading failed', error);
    projectActionStatus.textContent = error?.message || 'Projektia ei voitu avata.';
  }
}

async function removeRecentProject(projectId, title) {
  const remove = window.confirm(`Poistetaanko “${title}” viimeisimpien projektien muistista?`);
  if (!remove) return;
  try {
    await deleteRecentProjectRecord(projectId);
    if (projectId === currentProjectId) suppressCurrentProjectInRecents = true;
    await renderRecentProjects();
    projectActionStatus.textContent = 'Projekti poistettu muistista.';
  } catch (error) {
    console.warn('Recent project removal failed', error);
    projectActionStatus.textContent = 'Projektia ei voitu poistaa muistista.';
  }
}

async function renderRecentProjects() {
  try {
    const records = sortRecentProjectRecords(await readRecentProjectRecords()).slice(0, RECENT_PROJECTS_LIMIT);
    recentProjectsList.replaceChildren();
    if (!records.length) {
      const empty = document.createElement('p');
      empty.className = 'recent-projects-empty';
      empty.textContent = 'Ei tallennettuja projekteja';
      recentProjectsList.appendChild(empty);
      return;
    }

    records.forEach(record => {
      const row = document.createElement('div');
      row.className = 'recent-project-row';

      const openButton = document.createElement('button');
      openButton.type = 'button';
      openButton.className = 'recent-project-open';
      openButton.classList.toggle('current', record.projectId === currentProjectId);
      openButton.setAttribute('aria-label', `Avaa projekti ${record.title}`);
      const title = document.createElement('strong');
      title.textContent = record.title || 'Nimetön kappale';
      const meta = document.createElement('small');
      meta.textContent = [record.composer, formatRecentProjectTime(record.savedAt)].filter(Boolean).join(' · ');
      openButton.append(title, meta);
      openButton.addEventListener('click', () => openRecentProject(record.projectId));

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'recent-project-delete';
      deleteButton.textContent = '×';
      deleteButton.setAttribute('aria-label', `Poista projekti ${record.title} muistista`);
      deleteButton.addEventListener('click', () => removeRecentProject(record.projectId, record.title));
      row.append(openButton, deleteButton);
      recentProjectsList.appendChild(row);
    });
  } catch (error) {
    console.warn('Recent projects could not be listed', error);
    recentProjectsList.replaceChildren();
    const empty = document.createElement('p');
    empty.className = 'recent-projects-empty';
    empty.textContent = 'Projektimuisti ei ole käytettävissä';
    recentProjectsList.appendChild(empty);
  }
}

function storeRecentProject(project) {
  if (suppressCurrentProjectInRecents || !projectHasMeaningfulContent(project)) return;
  const record = {
    projectId: project.projectId,
    title: project.song.title || 'Nimetön kappale',
    composer: project.song.composer || '',
    savedAt: project.savedAt || new Date().toISOString(),
    payload: structuredClone(project),
  };
  recentProjectsWriteQueue = recentProjectsWriteQueue
    .then(async () => {
      await writeRecentProjectRecord(record);
      await trimRecentProjects();
      await renderRecentProjects();
    })
    .catch(error => {
      console.warn('Recent project storing failed', error);
    });
}

function saveAutosavedProjectNow({ payload = null, announce = true } = {}) {
  if (!projectAutosaveEnabled && !payload) return;
  try {
    const project = payload || createProjectPayload();
    localStorage.setItem(PROJECT_AUTOSAVE_KEY, JSON.stringify(project));
    storeRecentProject(project);
    if (announce) {
      const time = new Date().toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
      projectActionStatus.textContent = `Automaattisesti tallennettu ${time}`;
    }
  } catch (error) {
    console.warn('Project autosave failed', error);
    if (announce) projectActionStatus.textContent = 'Automaattitallennus epäonnistui.';
  }
}

function scheduleProjectAutosave() {
  if (!projectAutosaveEnabled) return;
  clearTimeout(projectAutosaveTimer);
  projectAutosaveTimer = setTimeout(() => saveAutosavedProjectNow(), 450);
}

function projectHasMeaningfulContent(project) {
  return project.score.notes.length > 0
    || project.score.slurs.length > 0
    || project.score.hairpins.length > 0
    || project.score.systemBreaks.length > 0
    || project.song.title !== 'Uusi kappale'
    || project.song.composer !== 'Markku'
    || project.song.tempoText !== 'Andante'
    || project.song.bpm !== 100
    || project.song.time.beats !== 4
    || project.song.time.beatType !== 4
    || project.song.key.fifths !== 0
    || project.song.key.mode !== 'major';
}

function restoreAutosavedProjectOnStartup() {
  const raw = localStorage.getItem(PROJECT_AUTOSAVE_KEY);
  if (!raw) return false;
  try {
    const project = parseProjectPayload(JSON.parse(raw));
    if (!projectHasMeaningfulContent(project)) return false;
    const savedTime = Number.isNaN(Date.parse(project.savedAt))
      ? ''
      : `\nTallennettu ${new Date(project.savedAt).toLocaleString('fi-FI')}.`;
    const restore = window.confirm(
      `Edellinen keskeneräinen kappale “${project.song.title}” löytyi.${savedTime}\n\nPalautetaanko se?`,
    );
    if (!restore) {
      localStorage.removeItem(PROJECT_AUTOSAVE_KEY);
      return false;
    }
    applyProjectPayload(project, { render: false, saveAutosave: false });
    projectActionStatus.textContent = 'Edellinen keskeneräinen kappale palautettiin.';
    return true;
  } catch (error) {
    console.warn('Autosaved project could not be restored', error);
    localStorage.removeItem(PROJECT_AUTOSAVE_KEY);
    return false;
  }
}

function addRest(units) {
  clearNoteSelection();
  const entry = { id: createScoreEntryId(), kind: 'rest', units };
  state.notes.push(entry);
  requestScoreEntryFollow(entry);
  settlePendingSystemBreak();
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
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    try {
      state.audioContext = new AudioContextClass({ latencyHint: 'interactive' });
    } catch {
      state.audioContext = new AudioContextClass();
    }
  }
  if (state.audioContext.state === 'suspended') state.audioContext.resume();
}

function unlockAudioFromStartupGesture() {
  try {
    ensureAudio();
    const ctx = state.audioContext;
    if (!ctx) return;

    // Äänetön yhden näytteen lähde käynnistetään samassa käyttäjäeleessä.
    // Tämä ei kuulu käyttäjälle, mutta auttaa iPad/Safaria avaamaan Web Audion.
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    const silentGain = ctx.createGain();
    silentGain.gain.value = 0.000001;
    source.buffer = buffer;
    source.connect(silentGain);
    silentGain.connect(ctx.destination);
    source.start(0);

    if (ctx.state === 'suspended') {
      const resumePromise = ctx.resume();
      if (resumePromise && typeof resumePromise.catch === 'function') {
        resumePromise.catch(() => {});
      }
    }
  } catch (error) {
    console.warn('Startup audio unlock failed', error);
  }
}

function finishStartupGate() {
  const nextTitle = String(startupTitleInput.value || '').trim();
  if (!nextTitle) {
    startupTitleInput.classList.remove('name-needed');
    void startupTitleInput.offsetWidth;
    startupTitleInput.classList.add('name-needed');
    startupHint.textContent = 'Kirjoita ensin kappaleen nimi.';
    startupTitleInput.focus();
    return;
  }

  startupTitleInput.classList.remove('name-needed');
  titleInput.value = nextTitle;
  startupTitleInput.blur();
  startupOverlay.classList.add('hidden');
  startupOverlay.setAttribute('aria-hidden', 'true');
  renderScore();
  scheduleProjectAutosave();
}

function initStartupGate() {
  if (!startupOverlay || !startupTitleInput || !startupBeginBtn) return;

  // Jos automaattisesti palautetulla projektilla on oikea nimi, näytetään se valmiina.
  const restoredTitle = String(titleInput.value || '').trim();
  startupTitleInput.value = restoredTitle && restoredTitle !== 'Uusi kappale' ? restoredTitle : '';

  // Pointerdown on varsinainen iPadin käyttäjäele, jolla Web Audio herätetään.
  startupBeginBtn.addEventListener('pointerdown', unlockAudioFromStartupGesture, { passive: true });
  startupBeginBtn.addEventListener('click', finishStartupGate);

  startupTitleInput.addEventListener('input', () => {
    startupTitleInput.classList.remove('name-needed');
    startupHint.textContent = 'Anna kappaleelle nimi ja aloita.';
  });

  startupTitleInput.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    unlockAudioFromStartupGesture();
    finishStartupGate();
  });

  setTimeout(() => {
    try { startupTitleInput.focus({ preventScroll: true }); }
    catch { startupTitleInput.focus(); }
  }, 80);
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
  ensureScoreEntryIds();
  pruneSlurs();
  pruneHairpins();
  const measureUnits = getMeasureUnits();
  const measures = [];
  const segmentsByEntryId = new Map();
  let currentMeasure = [];
  let currentUnits = 0;

  const pushMeasure = () => {
    measures.push(currentMeasure);
    currentMeasure = [];
    currentUnits = 0;
  };

  const appendSegments = (entry, entryIndex) => {
    const sourceSegments = [];
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
          sourceEntryId: entry.id,
          sourceEntryIndex: entryIndex,
          tieStart: false,
          tieStop: false,
        };
        currentMeasure.push(seg);
        sourceSegments.push(seg);
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
    if (entry.kind === 'note' && sourceSegments.length > 0) {
      sourceSegments[0].staccato = Boolean(entry.staccato);
      sourceSegments[0].portato = Boolean(entry.portato);
      sourceSegments[0].accent = Boolean(entry.accent);
      sourceSegments[0].dynamic = entry.dynamic || '';
      segmentsByEntryId.set(entry.id, sourceSegments);
    }
  };

  state.notes.forEach((entry, entryIndex) => appendSegments(entry, entryIndex));

  state.slurs.forEach((slur, slurIndex) => {
    const startSegments = segmentsByEntryId.get(slur.startId);
    const stopSegments = segmentsByEntryId.get(slur.endId);
    if (!startSegments?.length || !stopSegments?.length) return;
    const number = (slurIndex % 6) + 1;
    startSegments[0].slurStarts = [...(startSegments[0].slurStarts || []), number];
    const lastStopSegment = stopSegments[stopSegments.length - 1];
    lastStopSegment.slurStops = [...(lastStopSegment.slurStops || []), number];
  });

  state.hairpins.forEach((hairpin, hairpinIndex) => {
    const startSegments = segmentsByEntryId.get(hairpin.startId);
    const stopSegments = segmentsByEntryId.get(hairpin.endId);
    if (!startSegments?.length || !stopSegments?.length) return;
    const number = (hairpinIndex % 6) + 1;
    startSegments[0].hairpinStarts = [
      ...(startSegments[0].hairpinStarts || []),
      { number, type: hairpin.type },
    ];
    const lastStopSegment = stopSegments[stopSegments.length - 1];
    lastStopSegment.hairpinStops = [
      ...(lastStopSegment.hairpinStops || []),
      { number },
    ];
  });

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

function noteNotationsXml(seg, isRest) {
  if (isRest) return '';
  const tied = `${seg.tieStop ? '<tied type="stop"/>' : ''}${seg.tieStart ? '<tied type="start"/>' : ''}`;
  const slurs = [
    ...(seg.slurStops || []).map(number => `<slur type="stop" number="${number}"/>`),
    ...(seg.slurStarts || []).map(number => `<slur type="start" number="${number}"/>`),
  ].join('');
  const articulationItems = `${seg.staccato ? '<staccato/>' : ''}${seg.portato ? '<tenuto/>' : ''}${seg.accent ? '<accent/>' : ''}`;
  const articulations = articulationItems ? `<articulations>${articulationItems}</articulations>` : '';
  const contents = `${tied}${slurs}${articulations}`;
  return contents ? `<notations>${contents}</notations>` : '';
}

function hairpinDirectionsXml(hairpins, stop = false) {
  return (hairpins || []).map(hairpin => `
    <direction placement="below">
      <direction-type>
        <wedge type="${stop ? 'stop' : hairpin.type}" number="${hairpin.number}"/>
      </direction-type>
    </direction>`).join('');
}

function dynamicDirectionXml(dynamic) {
  const allowedDynamics = new Set(['ppp', 'pp', 'p', 'mp', 'mf', 'f', 'ff', 'fff']);
  if (!allowedDynamics.has(dynamic)) return '';
  return `
    <direction placement="below">
      <direction-type>
        <dynamics><${dynamic}/></dynamics>
      </direction-type>
    </direction>`;
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
      ${noteNotationsXml(seg, isRest)}
    </note>`;
}

function buildMusicXml() {
  const measures = createEventsForScore().map(annotateDefaultBeams);
  state.renderedNoteObjectMap = new Map();
  state.renderedNoteUnitsMap = new Map();
  let renderedNoteObjectId = 0;
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
    const notesXml = measure.map(seg => {
      if (Number.isInteger(seg.sourceEntryIndex)) {
        state.renderedNoteObjectMap.set(renderedNoteObjectId, seg.sourceEntryIndex);
        state.renderedNoteUnitsMap.set(renderedNoteObjectId, seg.units);
      }
      renderedNoteObjectId += 1;
      const hairpinStart = hairpinDirectionsXml(seg.hairpinStarts);
      const dynamic = dynamicDirectionXml(seg.dynamic);
      const noteXml = noteToXml(seg);
      const hairpinStop = hairpinDirectionsXml(seg.hairpinStops, true);
      return `${hairpinStart}${dynamic}${noteXml}${hairpinStop}`;
    }).join('');
    const systemBreak = i > 0 && state.systemBreaks.has(i) ? '<print new-system="yes"/>' : '';
    const finalBarline = state.notes.length > 0 && i === measures.length - 1
      ? '<barline location="right"><bar-style>light-heavy</bar-style></barline>'
      : '';
    return `<measure number="${number}">${systemBreak}${attrs}${notesXml}${finalBarline}</measure>`;
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

function keySignatureAlterForStep(step) {
  const fifths = Number(keySelect.value) || 0;
  const order = fifths > 0
    ? ['F', 'C', 'G', 'D', 'A', 'E', 'B']
    : ['B', 'E', 'A', 'D', 'G', 'C', 'F'];
  return order.slice(0, Math.abs(fifths)).includes(step) ? Math.sign(fifths) : 0;
}

function buildPitchNameInfo() {
  const result = new Map();
  const measureUnits = Number(beatsSelect.value) * divisions * (4 / Number(beatTypeSelect.value));
  const activeAccidentals = new Map();
  let positionInMeasure = 0;

  state.notes.forEach((entry, entryIndex) => {
    if (entry.kind === 'note') {
      const pitchKey = `${entry.step}${entry.octave}`;
      const previousAlter = activeAccidentals.has(pitchKey)
        ? activeAccidentals.get(pitchKey)
        : keySignatureAlterForStep(entry.step);
      const accidental = entry.alter > 0
        ? 'sharp'
        : entry.alter < 0
          ? 'flat'
          : previousAlter !== 0
            ? 'natural'
            : '';
      const finnishStep = entry.step === 'B' && entry.alter >= 0 ? 'H' : entry.step;
      const letter = finnishStep;
      result.set(entryIndex, {
        letter,
        accidental,
        accidentalCount: Math.min(2, Math.abs(Number(entry.alter) || 0)),
      });
      activeAccidentals.set(pitchKey, entry.alter);
    }

    let remaining = Number(entry.units) || 0;
    while (remaining > 0 && measureUnits > 0) {
      const space = measureUnits - positionInMeasure;
      if (remaining >= space) {
        remaining -= space;
        positionInMeasure = 0;
        activeAccidentals.clear();
      } else {
        positionInMeasure += remaining;
        remaining = 0;
      }
    }
  });
  return result;
}

function appendVectorAccidental(parent, type, count, color) {
  const svgNs = 'http://www.w3.org/2000/svg';
  const copies = Math.max(1, count || 1);
  for (let index = 0; index < copies; index += 1) {
    const path = document.createElementNS(svgNs, 'path');
    const offset = (index - (copies - 1) / 2) * 2.5;
    if (type === 'sharp') {
      path.setAttribute('d', `M${offset - 0.8} -3.1v6.2M${offset + 0.8} -3.5v6.2M${offset - 1.7} -1.1l3.4-.6M${offset - 1.7} 1.2l3.4-.6`);
    } else if (type === 'flat') {
      path.setAttribute('d', `M${offset - 0.7} -3.6v6.7M${offset - 0.7} 0c2.7-2.2 3.1 1.7 0 2.4`);
    } else {
      path.setAttribute('d', `M${offset - 0.8} -3.2v5.5l1.6-.6v-5.5M${offset - 0.8}-.3l1.6-.6`);
    }
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '0.72');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    parent.appendChild(path);
  }
}

function getNoteheadCenterInSvg(graphicalNote, svg, noteHeadIndex) {
  let noteheads = [];
  try {
    noteheads = graphicalNote?.getNoteheadSVGs?.() || [];
  } catch {}
  const notehead = noteheads[noteHeadIndex] || noteheads[0];
  if (!notehead?.getBBox || !svg?.createSVGPoint) return null;

  try {
    const box = notehead.getBBox();
    const noteheadToScreen = notehead.getScreenCTM?.();
    const svgToScreen = svg.getScreenCTM?.();
    if (!noteheadToScreen || !svgToScreen) return null;

    const center = svg.createSVGPoint();
    center.x = box.x + box.width / 2;
    center.y = box.y + box.height / 2;
    const screenCenter = center.matrixTransform(noteheadToScreen);
    const svgCenter = screenCenter.matrixTransform(svgToScreen.inverse());
    return Number.isFinite(svgCenter.x) && Number.isFinite(svgCenter.y)
      ? { x: svgCenter.x, y: svgCenter.y }
      : null;
  } catch {
    return null;
  }
}

function renderPitchNameOverlays() {
  osmdContainer.querySelectorAll('.pitch-name-overlay').forEach(element => element.remove());
  if (!layoutState.pitchNames || !state.osmd) return;

  const svgNs = 'http://www.w3.org/2000/svg';
  const zoom = Number(state.osmd.zoom) || 1;
  const pitchNameInfo = buildPitchNameInfo();
  const measureList = state.osmd.GraphicSheet?.MeasureList || [];

  measureList.forEach(measureGroup => {
    (measureGroup || []).forEach(measure => {
      (measure?.staffEntries || []).forEach(staffEntry => {
        (staffEntry?.graphicalVoiceEntries || []).forEach(voiceEntry => {
          (voiceEntry?.notes || []).forEach(graphicalNote => {
            const objectId = graphicalNote?.sourceNote?.NoteToGraphicalNoteObjectId;
            const entryIndex = state.renderedNoteObjectMap.get(objectId);
            const info = pitchNameInfo.get(entryIndex);
            if (!info) return;

            const vexRef = graphicalNote.vfnote;
            const vexNote = Array.isArray(vexRef) ? vexRef[0] : vexRef;
            const noteHeadIndex = Array.isArray(vexRef) ? (Number(vexRef[1]) || 0) : 0;
            const svg = vexNote?.attrs?.el?.ownerSVGElement || voiceEntry?.mVexFlowStaveNote?.attrs?.el?.ownerSVGElement;
            const ys = vexNote?.getYs?.();
            const beginX = Number(vexNote?.getNoteHeadBeginX?.());
            const endX = Number(vexNote?.getNoteHeadEndX?.());
            const fallbackX = Number(vexNote?.getAbsoluteX?.());
            const rawX = Number.isFinite(beginX) && Number.isFinite(endX)
              ? (beginX + endX) / 2
              : fallbackX;
            const rawY = Number(ys?.[noteHeadIndex]);
            if (!svg) return;
            const exactCenter = getNoteheadCenterInSvg(graphicalNote, svg, noteHeadIndex);
            const centerX = exactCenter?.x ?? (Number.isFinite(rawX) ? rawX / zoom : Number.NaN);
            const centerY = exactCenter?.y ?? (Number.isFinite(rawY) ? rawY / zoom : Number.NaN);
            if (!Number.isFinite(centerX) || !Number.isFinite(centerY)) return;

            const renderedUnits = state.renderedNoteUnitsMap.get(objectId);
            const color = Number(renderedUnits) >= 16 ? '#111111' : '#ffffff';
            const group = document.createElementNS(svgNs, 'g');
            group.classList.add('pitch-name-overlay');
            group.setAttribute('aria-hidden', 'true');
            group.setAttribute('pointer-events', 'none');
            group.setAttribute('data-entry-index', String(entryIndex));
            group.setAttribute('transform', `translate(${centerX} ${centerY})`);

            const text = document.createElementNS(svgNs, 'text');
            const hasAccidental = Boolean(info.accidental);
            text.setAttribute('x', hasAccidental ? '-1.55' : '0');
            text.setAttribute('y', '0');
            text.setAttribute('dy', '0.34em');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', color);
            text.setAttribute('font-family', 'Arial, Helvetica, sans-serif');
            text.setAttribute('font-size', hasAccidental ? '5.8' : '7.2');
            text.setAttribute('font-weight', '800');
            text.textContent = info.letter;
            group.appendChild(text);

            if (hasAccidental) {
              const accidentalGroup = document.createElementNS(svgNs, 'g');
              accidentalGroup.setAttribute('transform', `translate(${info.accidentalCount > 1 ? 2.35 : 2.5} 0) scale(${info.accidentalCount > 1 ? 0.72 : 0.88})`);
              appendVectorAccidental(accidentalGroup, info.accidental, info.accidentalCount, color);
              group.appendChild(accidentalGroup);
            }
            svg.appendChild(group);
          });
        });
      });
    });
  });
}

let scoreRenderRequested = false;
let scoreRenderLoopPromise = null;

function renderScore() {
  invalidateCachedPdf();
  scheduleProjectAutosave();
  scoreRenderRequested = true;
  if (!scoreRenderLoopPromise) {
    scoreRenderLoopPromise = (async () => {
      while (scoreRenderRequested) {
        scoreRenderRequested = false;
        await renderScoreNow();
      }
    })().finally(() => {
      scoreRenderLoopPromise = null;
      // Pyyntö voi syntyä aivan viimeisen kierroksen valmistuessa.
      if (scoreRenderRequested) renderScore();
    });
  }
  return scoreRenderLoopPromise;
}

async function renderScoreNow() {
  try {
    statusText.textContent = 'Renderöidään…';
    const xml = buildMusicXml();
    const stretchLastLine = stretchLastLineOnceRequested;
    if (!state.osmd) {
      state.osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay(osmdContainer, {
        autoResize: true,
        backend: 'svg',
        drawingParameters: 'compacttight',
        spacingFactorSoftmax: 15,
        drawTitle: true,
        drawComposer: true,
        drawPartNames: false,
        newSystemFromXML: true,
        stretchLastSystemLine: stretchLastLine,
        pageFormat: 'A4_P',
        pageBackgroundColor: '#FFFFFF',
      });
    }
    const osmd = state.osmd;
    osmd.setOptions({ stretchLastSystemLine: stretchLastLine });
    setOsmdNoteSpacingRules(osmd, layoutState.noteSpacing);
    setOsmdScoreLayoutRules(osmd);
    if (osmd.EngravingRules) {
      osmd.EngravingRules.StretchLastSystemLine = stretchLastLine;
      osmd.EngravingRules.LastSystemMaxScalingFactor = stretchLastLine ? 100 : 1.4;
    }
    await osmd.load(xml);
    setOsmdScoreLayoutRules(osmd);
    if (osmd.EngravingRules) {
      osmd.EngravingRules.StretchLastSystemLine = stretchLastLine;
      osmd.EngravingRules.LastSystemMaxScalingFactor = stretchLastLine ? 100 : 1.4;
    }
    osmd.zoom = layoutState.scoreZoom / 100;
    await osmd.render();
    applyScoreTextLayout();
    alignDynamicsByStaffLine();
    renderPitchNameOverlays();
    state.appliedNoteSpacing = layoutState.noteSpacing;
    state.appliedScoreLayoutSignature = getScoreLayoutSignature();
    renderSystemBreakMarkers();
    refreshNoteSelectionGeometry();
    noteScoreRenderCompleted();
    statusText.textContent = 'Valmis';
  } catch (err) {
    console.error(err);
    statusText.textContent = 'Nuottikuvan renderöinti epäonnistui';
  }
}

function isDotModifierActive() {
  return state.modifiers.dotPointers.size > 0 || state.modifiers.dotKeyboard;
}

function isSixteenthModifierActive() {
  return state.modifiers.sixteenthPointers.size > 0 || state.modifiers.sixteenthKeyboard;
}

function isRestShiftActive() {
  return state.modifiers.restPointers.size > 0 || state.modifiers.restKeyboard;
}

function syncModifierButtons() {
  const dotActive = isDotModifierActive();
  const sixteenthActive = isSixteenthModifierActive();
  const restActive = isRestShiftActive();
  dotShiftBtn.classList.toggle('active', dotActive);
  dotShiftBtn.setAttribute('aria-pressed', String(dotActive));
  sixteenthShiftBtn.classList.toggle('active', sixteenthActive);
  sixteenthShiftBtn.setAttribute('aria-pressed', String(sixteenthActive));
  restShiftBtn.classList.toggle('active', restActive);
  restShiftBtn.setAttribute('aria-pressed', String(restActive));
}

function bindHoldModifier(button, pointerSet) {

  button.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    pointerSet.add(ev.pointerId);
    button.setPointerCapture?.(ev.pointerId);
    syncModifierButtons();
  }, { passive: false });

  const release = (ev) => {
    if (!pointerSet.has(ev.pointerId)) return;
    pointerSet.delete(ev.pointerId);
    try { button.releasePointerCapture?.(ev.pointerId); } catch {}
    syncModifierButtons();
  };

  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
  button.addEventListener('contextmenu', ev => ev.preventDefault());
}

bindHoldModifier(dotShiftBtn, state.modifiers.dotPointers);
bindHoldModifier(sixteenthShiftBtn, state.modifiers.sixteenthPointers);
bindHoldModifier(restShiftBtn, state.modifiers.restPointers);

function isEditableTarget(target) {
  return target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}

function clearKeyboardModifiers() {
  state.modifiers.dotKeyboard = false;
  state.modifiers.sixteenthKeyboard = false;
  state.modifiers.restKeyboard = false;
  syncModifierButtons();
}

window.addEventListener('keydown', (ev) => {
  if (isEditableTarget(ev.target) && !state.gesture) return;

  if (ev.key === 'Shift') {
    state.modifiers.dotKeyboard = true;
    syncModifierButtons();
  } else if (ev.key === 'Alt') {
    state.modifiers.sixteenthKeyboard = true;
    syncModifierButtons();
    ev.preventDefault();
  } else if (ev.code === 'Space') {
    state.modifiers.restKeyboard = true;
    syncModifierButtons();
    ev.preventDefault();
  }
});

window.addEventListener('keyup', (ev) => {
  if (ev.key === 'Shift') {
    state.modifiers.dotKeyboard = ev.shiftKey;
    syncModifierButtons();
  } else if (ev.key === 'Alt') {
    state.modifiers.sixteenthKeyboard = ev.altKey;
    syncModifierButtons();
  } else if (ev.code === 'Space') {
    state.modifiers.restKeyboard = false;
    syncModifierButtons();
    ev.preventDefault();
  }
});

document.addEventListener('focusin', (ev) => {
  if (isEditableTarget(ev.target)) clearKeyboardModifiers();
});

window.addEventListener('blur', clearKeyboardModifiers);

systemBreakBtn.addEventListener('click', togglePendingSystemBreak);
stretchLastLineBtn.addEventListener('click', stretchLastLineOnce);

[titleInput, composerInput, tempoTextInput, bpmInput, beatsSelect, beatTypeSelect, keySelect, modeSelect].forEach(el => {
  el.addEventListener('input', renderScore);
  el.addEventListener('change', renderScore);
});

function scheduleOsmdResizeRender() {
  updateKeyboardOctavePosition();
  if (!state.osmd) return;
  invalidateCachedPdf();
  clearTimeout(window.__osmdResizeTimer);
  window.__osmdResizeTimer = setTimeout(async () => {
    try {
      // OSMD laskee järjestelmäleveyden containerin nykyisestä leveydestä renderöinnissä.
      // Zoom pidetään ennallaan, mutta koko partituuri kaiverretaan uudelleen.
      await state.osmd.render();
      applyScoreTextLayout();
      alignDynamicsByStaffLine();
      renderPitchNameOverlays();
      renderSystemBreakMarkers();
      refreshNoteSelectionGeometry();
      noteScoreRenderCompleted();
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
songPanelToggle.addEventListener('click', () => setSongPanelOpen(!songPanel.classList.contains('open')));
songPanelClose.addEventListener('click', () => setSongPanelOpen(false));
songPanelDone.addEventListener('click', () => setSongPanelOpen(false));
songPanelBackdrop.addEventListener('click', () => setSongPanelOpen(false));
printScoreBtn.addEventListener('click', printScore);
pdfShareBtn.addEventListener('click', handlePdfShare);
projectSaveBtn.addEventListener('click', saveProjectToFile);
projectLoadBtn.addEventListener('click', () => projectFileInput.click());
projectFileInput.addEventListener('change', () => {
  const [file] = projectFileInput.files || [];
  if (file) loadProjectFile(file);
});
layoutJsonExport.addEventListener('click', exportLayoutJson);
layoutJsonImport.addEventListener('click', () => layoutJsonFile.click());
layoutJsonFile.addEventListener('change', () => {
  const [file] = layoutJsonFile.files || [];
  if (file) importLayoutJson(file);
});
noteSpacingSlider.addEventListener('input', (ev) => {
  layoutState.noteSpacing = Number(ev.target.value);
  applyNoteSpacing({ save: true });
});

window.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' && songPanel.classList.contains('open')) {
    setSongPanelOpen(false);
  }
});

document.getElementById('layoutReset').addEventListener('click', () => {
  layoutState = structuredClone(defaultLayout);
  applyLayoutState();
});

document.getElementById('layoutCopy').addEventListener('click', async () => {
  const payload = [
    `Kätisyys: ${layoutState.handedness === 'right' ? 'Oikea käsi' : 'Vasen käsi'}`,
    `Nuotti-ikkunan osuus: ${Math.round(layoutState.scoreShare)}%`,
    `Nuottien välistys: ${layoutState.noteSpacing}%`,
    `Nuottikuvan zoom: ${layoutState.scoreZoom}%`,
    `Riviväli: ${layoutState.systemSpacing}%`,
    `Sävelnimet nuottipalloissa: ${layoutState.pitchNames ? 'Päällä' : 'Pois'}`,
    `Kokeiluvesileima: ${layoutState.printWatermark ? 'Päällä' : 'Pois'}`,
    `Otsikko (koko/X/Y): ${layoutState.scoreText.title.size}% / ${layoutState.scoreText.title.x} / ${layoutState.scoreText.title.y} u`,
    `Säveltäjä (koko/X/Y): ${layoutState.scoreText.composer.size}% / ${layoutState.scoreText.composer.x} / ${layoutState.scoreText.composer.y} u`,
    `Tempoteksti (koko/X/Y): ${layoutState.scoreText.tempo.size}% / ${layoutState.scoreText.tempo.x} / ${layoutState.scoreText.tempo.y} u`,
    `Marginaalit (vasen/oikea/ylä/ala): ${layoutState.margins.left}/${layoutState.margins.right}/${layoutState.margins.top}/${layoutState.margins.bottom} u`,
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
bindScoreKeyboardDivider();
initKeyboard();
initNoteSelection();
initScoreTouchGestures();
applyLayoutState({ save: false });
setScoreShare(layoutState.scoreShare);
syncPdfActionButton();
restoreAutosavedProjectOnStartup();
projectAutosaveEnabled = true;
renderRecentProjects();
renderScore();
initStartupGate();
