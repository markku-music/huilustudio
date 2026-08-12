const osmdContainer = document.getElementById('osmdContainer');
const appShell = document.getElementById('appShell');
const keyboardSurface = document.getElementById('keyboardSurface');
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
const dotShiftBtn = document.getElementById('dotShiftBtn');
const sixteenthShiftBtn = document.getElementById('sixteenthShiftBtn');
const restShiftBtn = document.getElementById('restShiftBtn');
const systemBreakBtn = document.getElementById('systemBreakBtn');
const stretchLastLineBtn = document.getElementById('stretchLastLineBtn');
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

const LAYOUT_STORAGE_KEY = 'melody-writer-flick-layout-v1';
const defaultLayout = {
  handedness: 'right',
  scoreShare: 54,
  noteSpacing: 100,
  scoreZoom: 108,
  systemSpacing: 300,
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
  restMode: false,
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
  systemBreaks: new Set(),
  pendingSystemBreakIndex: null,
};

const scoreTouchGesture = {
  pointers: new Map(),
  maxCount: 0,
  moved: false,
  cancelled: false,
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
  if (!state.restMode && !isRestShiftActive()) playMidi(Number(keyEl.dataset.midi), 0.24);
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

  const svg = osmdContainer.querySelector('svg');
  const measureList = state.osmd.GraphicSheet?.MeasureList;
  if (!svg || !measureList) return;

  const svgRect = svg.getBoundingClientRect();
  const containerRect = osmdContainer.getBoundingClientRect();
  const viewBox = svg.viewBox?.baseVal;
  const viewWidth = viewBox?.width || Number(svg.getAttribute('width')) || svgRect.width;
  const viewHeight = viewBox?.height || Number(svg.getAttribute('height')) || svgRect.height;
  if (!viewWidth || !viewHeight || !svgRect.width || !svgRect.height) return;

  const scaleX = svgRect.width / viewWidth;
  const scaleY = svgRect.height / viewHeight;
  const layer = document.createElement('div');
  layer.className = 'system-break-markers';
  layer.style.width = `${osmdContainer.scrollWidth}px`;
  layer.style.height = `${osmdContainer.scrollHeight}px`;
  const rowYByStaffLine = new WeakMap();

  const appendMarker = (measureIndex, candidate = false) => {
    const measure = measureList[measureIndex - 1]?.find(item => item && item.isVisible?.() !== false);
    if (!measure) return;

    const stave = measure.stave;
    let x;
    let y;
    if (stave?.getX && stave?.getWidth && stave?.getY) {
      x = stave.getX() + stave.getWidth();
      y = stave.getY();
    } else {
      const box = measure.PositionAndShape;
      if (!box?.AbsolutePosition) return;
      x = (box.AbsolutePosition.x + box.BorderRight) * 10 * state.osmd.zoom;
      y = (box.AbsolutePosition.y + box.BorderTop) * 10 * state.osmd.zoom;
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
    const pointer = scoreTouchGesture.pointers.get(ev.pointerId);
    if (!pointer) return;
    ev.preventDefault();
    if (Math.hypot(ev.clientX - pointer.startX, ev.clientY - pointer.startY) > 24) {
      scoreTouchGesture.moved = true;
    }
  }, { passive: false });

  const finishPointer = (ev, cancelled = false) => {
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
  flickHud.classList.toggle('rest', state.restMode || isRestShiftActive());
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

  if (state.restMode || isRestShiftActive()) {
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
  settlePendingSystemBreak();
  renderScore();
}

function finiteLayoutNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function loadLayoutState() {
  try {
    const saved = JSON.parse(localStorage.getItem(LAYOUT_STORAGE_KEY) || 'null');
    if (!saved) return structuredClone(defaultLayout);
    return {
      handedness: saved.handedness === 'left' ? 'left' : 'right',
      scoreShare: Number(saved.scoreShare) || defaultLayout.scoreShare,
      noteSpacing: normalizeNoteSpacing(saved.noteSpacing),
      scoreZoom: finiteLayoutNumber(saved.scoreZoom, defaultLayout.scoreZoom),
      systemSpacing: finiteLayoutNumber(saved.systemSpacing, defaultLayout.systemSpacing),
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
}

function normalizeFlickThresholds() {
  // Ulomman rajan täytyy aina olla sisempää suurempi.
  layoutState.flick.longPressMs = clamp(layoutState.flick.longPressMs, 300, 1200);
  layoutState.scoreShare = clamp(Number(layoutState.scoreShare) || defaultLayout.scoreShare, 30, 70);
  layoutState.noteSpacing = normalizeNoteSpacing(layoutState.noteSpacing);
  layoutState.scoreZoom = clamp(finiteLayoutNumber(layoutState.scoreZoom, defaultLayout.scoreZoom), 70, 160);
  layoutState.systemSpacing = clamp(finiteLayoutNumber(layoutState.systemSpacing, defaultLayout.systemSpacing), 50, 400);
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

  syncLayoutControls();
  syncStretchLastLineButton();
  applyNoteSpacing();
  applyScoreLayout();
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
}

function setLayoutPanelOpen(open) {
  layoutPanel.classList.toggle('open', open);
  layoutPanel.setAttribute('aria-hidden', String(!open));
}

function setSongPanelOpen(open) {
  songPanel.classList.toggle('open', open);
  songPanelBackdrop.classList.toggle('open', open);
  songPanel.setAttribute('aria-hidden', String(!open));
  songPanelBackdrop.setAttribute('aria-hidden', String(!open));
  songPanelToggle.setAttribute('aria-expanded', String(open));
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
    const spacing = layoutState.noteSpacing;
    clearTimeout(window.__noteSpacingRenderTimer);
    window.__noteSpacingRenderTimer = setTimeout(async () => {
      try {
        setOsmdNoteSpacingRules(state.osmd, spacing);
        await state.osmd.render();
        state.appliedNoteSpacing = spacing;
        renderSystemBreakMarkers();
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
  rules.PageBottomMargin = layoutState.margins.bottom;
}

function bindScoreKeyboardDivider() {
  scoreKeyboardDivider.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    scoreKeyboardDivider.classList.add('dragging');
    scoreKeyboardDivider.setPointerCapture?.(ev.pointerId);
  }, { passive: false });

  scoreKeyboardDivider.addEventListener('pointermove', (ev) => {
    if (!scoreKeyboardDivider.hasPointerCapture?.(ev.pointerId)) return;
    ev.preventDefault();
    const rect = mainColumn.getBoundingClientRect();
    setScoreShare(((ev.clientY - rect.top) / rect.height) * 100);
  }, { passive: false });

  const finishDrag = (ev) => {
    if (scoreKeyboardDivider.hasPointerCapture?.(ev.pointerId)) {
      try { scoreKeyboardDivider.releasePointerCapture(ev.pointerId); } catch {}
    }
    scoreKeyboardDivider.classList.remove('dragging');
    saveLayoutState();
  };
  scoreKeyboardDivider.addEventListener('pointerup', finishDrag);
  scoreKeyboardDivider.addEventListener('pointercancel', finishDrag);

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
        handedness: imported.handedness === 'left' ? 'left' : 'right',
        scoreShare: Number(imported.scoreShare) || defaultLayout.scoreShare,
        noteSpacing: normalizeNoteSpacing(imported.noteSpacing),
        scoreZoom: finiteLayoutNumber(imported.scoreZoom, defaultLayout.scoreZoom),
        systemSpacing: finiteLayoutNumber(imported.systemSpacing, defaultLayout.systemSpacing),
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

function addRest(units) {
  state.notes.push({ kind: 'rest', units });
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

let scoreRenderRequested = false;
let scoreRenderLoopPromise = null;

function renderScore() {
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
        pageFormat: 'Endless',
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
    state.appliedNoteSpacing = layoutState.noteSpacing;
    state.appliedScoreLayoutSignature = getScoreLayoutSignature();
    renderSystemBreakMarkers();
    statusText.textContent = 'Valmis';
  } catch (err) {
    console.error(err);
    statusText.textContent = 'Nuottikuvan renderöinti epäonnistui';
  }
}

function updateToggleButtons() {
  restToggle.classList.toggle('active', state.restMode);
  restToggle.textContent = state.restMode ? '𝄽 tauko: päällä' : '𝄽 tauko: pois';
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

restToggle.addEventListener('click', () => {
  state.restMode = !state.restMode;
  updateToggleButtons();
});

systemBreakBtn.addEventListener('click', togglePendingSystemBreak);
stretchLastLineBtn.addEventListener('click', stretchLastLineOnce);

undoBtn.addEventListener('click', () => {
  undoLastNoteWithFeedback();
});

clearBtn.addEventListener('click', () => {
  state.notes = [];
  state.systemBreaks.clear();
  state.pendingSystemBreakIndex = null;
  syncSystemBreakButton();
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
      renderSystemBreakMarkers();
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
initScoreTouchGestures();
applyLayoutState({ save: false });
setScoreShare(layoutState.scoreShare);
updateToggleButtons();
renderScore();
