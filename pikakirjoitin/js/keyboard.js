const MIN_MIDI = 36;
const MAX_MIDI = 95;
const WHITE_COUNT = 35;
const BLACK_WIDTH = 0.62;
const LONG_PRESS_MS = 500;
const LONG_PRESS_MOVE = 14;

const WHITE_NAMES = { 0: 'C', 2: 'D', 4: 'E', 5: 'F', 7: 'G', 9: 'A', 11: 'H' };
const SPOKEN = ['c', 'cis', 'd', 'dis', 'e', 'f', 'fis', 'g', 'gis', 'a', 'ais', 'h'];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function visibleName(midi) {
  const octave = Math.floor(midi / 12) - 1;
  const name = WHITE_NAMES[((midi % 12) + 12) % 12];
  if (octave <= 0) return `SK-${name}`;
  if (octave === 1) return `K-${name}`;
  if (octave === 2) return name;
  if (octave === 3) return name.toLowerCase();
  return name.toLowerCase() + (octave - 3);
}

function spokenName(midi) {
  const pitchClass = ((midi % 12) + 12) % 12;
  return `${SPOKEN[pitchClass]} ${Math.floor(midi / 12) - 1}`;
}

export class PianoKeyboard {
  #piano;
  #whiteKeys;
  #viewport;
  #rail;
  #track;
  #thumb;
  #onStart;
  #onDuration;
  #onSoundStart;
  #onSoundStop;
  #active = null;
  #scrollPointerId = null;
  #scrollGrabOffset = 0;

  constructor({ piano, whiteKeys, viewport, rail, track, thumb, onStart, onDuration, onSoundStart, onSoundStop }) {
    this.#piano = piano;
    this.#whiteKeys = whiteKeys;
    this.#viewport = viewport;
    this.#rail = rail;
    this.#track = track;
    this.#thumb = thumb;
    this.#onStart = onStart;
    this.#onDuration = onDuration;
    this.#onSoundStart = onSoundStart;
    this.#onSoundStop = onSoundStop;

    this.#buildKeys();
    this.#bindNoteGestures();
    this.#bindScrollRail();
    requestAnimationFrame(() => this.centerOnMiddleC());
  }

  centerOnMiddleC() {
    const whites = [...this.#whiteKeys.children];
    const middleCIndex = whites.findIndex(key => Number(key.dataset.midi) === 60);
    const whiteWidth = this.#piano.scrollWidth / WHITE_COUNT;
    const maxScroll = Math.max(0, this.#piano.scrollWidth - this.#viewport.clientWidth);
    this.#viewport.scrollLeft = clamp(middleCIndex * whiteWidth, 0, maxScroll);
    this.#syncThumb();
  }

  #buildKeys() {
    let whiteIndex = 0;
    for (let midi = MIN_MIDI; midi <= MAX_MIDI; midi += 1) {
      const pitchClass = midi % 12;
      const isWhite = Object.hasOwn(WHITE_NAMES, pitchClass);
      const key = document.createElement('button');
      key.type = 'button';
      key.className = `key ${isWhite ? 'white' : 'black'}`;
      key.dataset.midi = String(midi);
      key.setAttribute('aria-label', spokenName(midi));

      if (isWhite) {
        key.textContent = visibleName(midi);
        this.#whiteKeys.appendChild(key);
        whiteIndex += 1;
      } else {
        const whiteWidth = 100 / WHITE_COUNT;
        key.style.left = `${whiteIndex * whiteWidth - whiteWidth * BLACK_WIDTH / 2}%`;
        key.style.width = `${whiteWidth * BLACK_WIDTH}%`;
        this.#piano.appendChild(key);
      }
    }
  }

  #bindNoteGestures() {
    this.#piano.addEventListener('pointerdown', event => this.#startNote(event));
    this.#piano.addEventListener('pointermove', event => this.#moveNote(event));
    this.#piano.addEventListener('pointerup', event => this.#finishNote(event));
    this.#piano.addEventListener('pointercancel', event => this.#finishNote(event));
  }

  #startNote(event) {
    const key = event.target.closest('.key');
    if (!key || this.#active || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault();

    const midi = Number(key.dataset.midi);
    const noteId = this.#onStart?.(midi, 'quarter');
    if (!noteId) return;

    key.classList.add('active');
    const threshold = clamp(this.#viewport.clientHeight * 0.12, 24, 48);
    this.#active = {
      pointerId: event.pointerId,
      key,
      noteId,
      startX: event.clientX,
      startY: event.clientY,
      threshold,
      duration: 'quarter',
      locked: false,
      timer: null
    };

    try { this.#piano.setPointerCapture(event.pointerId); } catch {}
    this.#onSoundStart?.(midi);

    this.#active.timer = window.setTimeout(() => {
      const active = this.#active;
      if (!active || active.pointerId !== event.pointerId || active.locked) return;
      active.locked = true;
      active.duration = 'whole';
      this.#onDuration?.(active.noteId, 'whole');
    }, LONG_PRESS_MS);
  }

  #moveNote(event) {
    const active = this.#active;
    if (!active || event.pointerId !== active.pointerId || active.locked) return;
    event.preventDefault();

    const dx = event.clientX - active.startX;
    const dy = event.clientY - active.startY;
    if (Math.hypot(dx, dy) > LONG_PRESS_MOVE) this.#clearLongPress();
    if (Math.abs(dy) < active.threshold) return;

    active.locked = true;
    active.duration = dy > 0 ? 'eighth' : 'half';
    this.#onDuration?.(active.noteId, active.duration);
  }

  #finishNote(event) {
    const active = this.#active;
    if (!active || event.pointerId !== active.pointerId) return;

    this.#clearLongPress();
    active.key.classList.remove('active');
    this.#onSoundStop?.();
    try {
      if (this.#piano.hasPointerCapture(event.pointerId)) this.#piano.releasePointerCapture(event.pointerId);
    } catch {}
    this.#active = null;
  }

  #clearLongPress() {
    if (!this.#active?.timer) return;
    clearTimeout(this.#active.timer);
    this.#active.timer = null;
  }

  #bindScrollRail() {
    this.#rail.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      event.preventDefault();
      this.#scrollPointerId = event.pointerId;
      const thumbRect = this.#thumb.getBoundingClientRect();
      this.#scrollGrabOffset = this.#thumb.contains(event.target)
        ? event.clientX - thumbRect.left
        : thumbRect.width / 2;
      try { this.#rail.setPointerCapture(event.pointerId); } catch {}
      this.#setScrollFromPointer(event.clientX);
    });

    this.#rail.addEventListener('pointermove', event => {
      if (event.pointerId !== this.#scrollPointerId) return;
      event.preventDefault();
      this.#setScrollFromPointer(event.clientX);
    });

    const finish = event => {
      if (event.pointerId !== this.#scrollPointerId) return;
      this.#scrollPointerId = null;
      try {
        if (this.#rail.hasPointerCapture(event.pointerId)) this.#rail.releasePointerCapture(event.pointerId);
      } catch {}
    };
    this.#rail.addEventListener('pointerup', finish);
    this.#rail.addEventListener('pointercancel', finish);

    this.#rail.addEventListener('keydown', event => {
      const maxScroll = Math.max(0, this.#piano.scrollWidth - this.#viewport.clientWidth);
      const step = this.#viewport.clientWidth / 2;
      if (event.key === 'ArrowLeft') this.#viewport.scrollLeft = clamp(this.#viewport.scrollLeft - step, 0, maxScroll);
      else if (event.key === 'ArrowRight') this.#viewport.scrollLeft = clamp(this.#viewport.scrollLeft + step, 0, maxScroll);
      else if (event.key === 'Home') this.#viewport.scrollLeft = 0;
      else if (event.key === 'End') this.#viewport.scrollLeft = maxScroll;
      else return;
      event.preventDefault();
      this.#syncThumb();
    });

    window.addEventListener('resize', () => this.#syncThumb());
  }

  #setScrollFromPointer(clientX) {
    const trackRect = this.#track.getBoundingClientRect();
    const travel = Math.max(0, trackRect.width - this.#thumb.offsetWidth);
    const left = clamp(clientX - trackRect.left - this.#scrollGrabOffset, 0, travel);
    const maxScroll = Math.max(0, this.#piano.scrollWidth - this.#viewport.clientWidth);
    this.#viewport.scrollLeft = travel ? (left / travel) * maxScroll : 0;
    this.#syncThumb();
  }

  #syncThumb() {
    const maxScroll = Math.max(0, this.#piano.scrollWidth - this.#viewport.clientWidth);
    const travel = Math.max(0, this.#track.clientWidth - this.#thumb.offsetWidth);
    const ratio = maxScroll ? this.#viewport.scrollLeft / maxScroll : 0;
    this.#thumb.style.transform = `translate3d(${ratio * travel}px, 0, 0)`;
    this.#rail.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
  }
}
