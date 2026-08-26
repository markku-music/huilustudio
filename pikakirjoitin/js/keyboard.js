(function () {
  "use strict";

  const MIN_MIDI = 36;
  const MAX_MIDI = 95;
  const WHITE_COUNT = 35;
  const BLACK_WIDTH = 0.62;
  const I18N = window.PikakirjoitinI18n;

  const LONG_PRESS_MS = 500;
  const LONG_PRESS_MOVE = 14;
  const SWIPE_DIRECTION_DOMINANCE = 1.25;
  const HORIZONTAL_SWIPE_MULTIPLIER = 1.15;

  const WHITE_NAMES = {
    0: "C",
    2: "D",
    4: "E",
    5: "F",
    7: "G",
    9: "A",
    11: "B"
  };

  const PITCH_STEPS = [
    ["C", 0],
    ["C", 1],
    ["D", 0],
    ["D", 1],
    ["E", 0],
    ["F", 0],
    ["F", 1],
    ["G", 0],
    ["G", 1],
    ["A", 0],
    ["A", 1],
    ["B", 0]
  ];

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function visibleName(midi) {
    const octave = Math.floor(midi / 12) - 1;
    const pitchClass = ((midi % 12) + 12) % 12;
    const name = I18N.keyboardLetter(pitchClass);

    if (octave <= 0) return "SK-" + name;
    if (octave === 1) return "K-" + name;
    if (octave === 2) return name;
    if (octave === 3) return name.toLowerCase();
    return name.toLowerCase() + (octave - 3);
  }

  function midiToPitch(midi) {
    const pitchClass = ((midi % 12) + 12) % 12;
    const octave = Math.floor(midi / 12) - 1;
    const data = PITCH_STEPS[pitchClass];
    return data[0] + (data[1] ? "#" : "") + octave;
  }

  function spokenName(midi) {
    return I18N.spokenPitch(midiToPitch(midi));
  }

  class PianoKeyboard {
    constructor(options) {
      this.piano = options.piano;
      this.whiteKeys = options.whiteKeys;
      this.viewport = options.viewport;
      this.rail = options.rail;
      this.track = options.track;
      this.thumb = options.thumb;

      this.onStart = options.onStart;
      this.onDuration = options.onDuration;
      this.onSoundStart = options.onSoundStart;
      this.onSoundStop = options.onSoundStop;
      this.onFinish = options.onFinish;

      this.active = null;
      this.scrollPointerId = null;
      this.scrollGrabOffset = 0;

      this.buildKeys();
      this.bindNoteGestures();
      this.bindScrollRail();
      document.addEventListener("pk-languagechange", () => this.updateLanguage());

      requestAnimationFrame(() => this.centerOnMiddleC());
    }

    buildKeys() {
      let whiteIndex = 0;

      for (let midi = MIN_MIDI; midi <= MAX_MIDI; midi += 1) {
        const pitchClass = ((midi % 12) + 12) % 12;
        const isWhite = Object.prototype.hasOwnProperty.call(WHITE_NAMES, pitchClass);
        const key = document.createElement("button");

        key.type = "button";
        key.className = "key " + (isWhite ? "white" : "black");
        key.dataset.midi = String(midi);
        key.dataset.pitch = midiToPitch(midi);
        key.setAttribute("aria-label", spokenName(midi));

        if (isWhite) {
          key.textContent = visibleName(midi);
          this.whiteKeys.appendChild(key);
          whiteIndex += 1;
        } else {
          const whiteWidth = 100 / WHITE_COUNT;
          key.style.left = (whiteIndex * whiteWidth - whiteWidth * BLACK_WIDTH / 2) + "%";
          key.style.width = (whiteWidth * BLACK_WIDTH) + "%";
          this.piano.appendChild(key);
        }
      }
    }

    updateLanguage() {
      this.piano.querySelectorAll(".key").forEach((key) => {
        const midi = Number(key.dataset.midi);
        key.setAttribute("aria-label", spokenName(midi));
        if (key.classList.contains("white")) {
          key.textContent = visibleName(midi);
        }
      });
    }

    bindNoteGestures() {
      this.piano.addEventListener("pointerdown", (event) => this.startNote(event));
      this.piano.addEventListener("pointermove", (event) => this.moveNote(event));
      this.piano.addEventListener("pointerup", (event) => this.finishNote(event));
      this.piano.addEventListener("pointercancel", (event) => this.finishNote(event));
    }

    startNote(event) {
      const key = event.target.closest(".key");
      if (!key || this.active) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;

      event.preventDefault();

      const midi = Number(key.dataset.midi);
      const pitch = key.dataset.pitch;

      // Sama perusidea kuin Pikakirjoitin 2:ssa:
      // tapahtuma syntyy heti neljäsosana, ja ele voi muuttaa aika-arvon.
      const startResult = typeof this.onStart === "function"
        ? this.onStart(midi, pitch, "quarter")
        : null;

      const noteId = typeof startResult === "object"
        ? startResult && startResult.id
        : startResult;
      const playSound = typeof startResult === "object"
        ? startResult.sound !== false
        : true;

      if (!noteId) return;

      key.classList.add("active");

      // REF1 1.1.76:n tuntumaa vastaava perusraja lasketaan koko
      // varsinaisesta kosketinalueesta (yläkahva pois), jotta eleohjerivin
      // korkeus ei tee swipe-eleestä vahingossa herkempää.
      const panel = this.viewport.closest(".keyboard-panel");
      const thresholdHeight = panel && this.rail
        ? Math.max(this.viewport.clientHeight, panel.clientHeight - this.rail.clientHeight)
        : this.viewport.clientHeight;
      const threshold = clamp(thresholdHeight * 0.12, 24, 48);

      this.active = {
        pointerId: event.pointerId,
        key: key,
        noteId: noteId,
        midi: midi,
        pitch: pitch,
        startX: event.clientX,
        startY: event.clientY,
        threshold: threshold,
        horizontalThreshold: threshold * HORIZONTAL_SWIPE_MULTIPLIER,
        duration: "quarter",
        locked: false,
        soundOn: playSound,
        timer: null
      };

      try {
        this.piano.setPointerCapture(event.pointerId);
      } catch (error) {}

      if (playSound && typeof this.onSoundStart === "function") {
        this.onSoundStart(midi);
      }

      this.active.timer = window.setTimeout(() => {
        const active = this.active;
        if (!active || active.pointerId !== event.pointerId || active.locked) return;

        active.locked = true;
        active.duration = "whole";
        active.key.classList.add("gesture-whole");

        if (typeof this.onDuration === "function") {
          this.onDuration(active.noteId, "whole", active.midi, active.pitch);
        }
      }, LONG_PRESS_MS);
    }

    moveNote(event) {
      const active = this.active;
      if (!active || event.pointerId !== active.pointerId || active.locked) return;

      event.preventDefault();

      const dx = event.clientX - active.startX;
      const dy = event.clientY - active.startY;

      if (Math.hypot(dx, dy) > LONG_PRESS_MOVE) {
        this.clearLongPress();
      }

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      // Nelisuuntaisessa eleessä ei enää arvata suuntaa 45 asteen rajalla.
      // Suunnan pitää olla selvästi hallitseva. Diagonaalialueella odotetaan
      // sormen seuraavaa liikettä, jolloin yhden pikselin ero ei voi vaihtaa
      // aika-arvoa kokonaan toiseksi.
      const horizontal = absX >= absY * SWIPE_DIRECTION_DOMINANCE;
      const vertical = absY >= absX * SWIPE_DIRECTION_DOMINANCE;
      if (!horizontal && !vertical) return;

      const threshold = horizontal ? active.horizontalThreshold : active.threshold;
      const primaryDistance = horizontal ? absX : absY;
      if (primaryDistance < threshold) return;

      active.locked = true;

      if (horizontal) {
        // Vaakasuuntainen 1/16 / 1/32 vaatii 15 % pidemmän liikkeen, jotta
        // pieni tahaton sivuttaisliike ei voita pystysuuntaista aika-arvoelettä.
        active.duration = dx > 0 ? "sixteenth" : "thirty-second";
        active.key.classList.add(dx > 0 ? "gesture-right" : "gesture-left");
      } else {
        active.duration = dy > 0 ? "eighth" : "half";
        active.key.classList.add(dy > 0 ? "gesture-down" : "gesture-up");
      }

      if (typeof this.onDuration === "function") {
        this.onDuration(active.noteId, active.duration, active.midi, active.pitch);
      }
    }

    finishNote(event) {
      const active = this.active;
      if (!active || event.pointerId !== active.pointerId) return;

      this.clearLongPress();

      active.key.classList.remove(
        "active",
        "gesture-down",
        "gesture-up",
        "gesture-right",
        "gesture-left",
        "gesture-whole"
      );

      if (active.soundOn && typeof this.onSoundStop === "function") {
        this.onSoundStop();
      }

      if (typeof this.onFinish === "function") {
        this.onFinish(active.noteId, active.duration, active.midi, active.pitch);
      }

      try {
        if (this.piano.hasPointerCapture(event.pointerId)) {
          this.piano.releasePointerCapture(event.pointerId);
        }
      } catch (error) {}

      this.active = null;
    }

    clearLongPress() {
      if (!this.active || !this.active.timer) return;
      clearTimeout(this.active.timer);
      this.active.timer = null;
    }

    centerOnMiddleC() {
      this.scrollToMidi(60);
    }

    scrollToMidi(midi) {
      const whites = Array.from(this.whiteKeys.children);
      const index = whites.findIndex((key) => Number(key.dataset.midi) === Number(midi));
      if (index < 0) return;

      const whiteWidth = this.piano.scrollWidth / WHITE_COUNT;
      const maxScroll = Math.max(0, this.piano.scrollWidth - this.viewport.clientWidth);

      this.viewport.scrollLeft = clamp(index * whiteWidth, 0, maxScroll);
      this.syncThumb();
    }

    bindScrollRail() {
      this.rail.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;

        event.preventDefault();
        this.scrollPointerId = event.pointerId;

        const thumbRect = this.thumb.getBoundingClientRect();
        this.scrollGrabOffset = this.thumb.contains(event.target)
          ? event.clientX - thumbRect.left
          : thumbRect.width / 2;

        try {
          this.rail.setPointerCapture(event.pointerId);
        } catch (error) {}

        this.setScrollFromPointer(event.clientX);
      });

      this.rail.addEventListener("pointermove", (event) => {
        if (event.pointerId !== this.scrollPointerId) return;
        event.preventDefault();
        this.setScrollFromPointer(event.clientX);
      });

      const finishScroll = (event) => {
        if (event.pointerId !== this.scrollPointerId) return;
        this.scrollPointerId = null;

        try {
          if (this.rail.hasPointerCapture(event.pointerId)) {
            this.rail.releasePointerCapture(event.pointerId);
          }
        } catch (error) {}
      };

      this.rail.addEventListener("pointerup", finishScroll);
      this.rail.addEventListener("pointercancel", finishScroll);

      this.rail.addEventListener("keydown", (event) => {
        const maxScroll = Math.max(0, this.piano.scrollWidth - this.viewport.clientWidth);
        const step = this.viewport.clientWidth / 2;

        if (event.key === "ArrowLeft") {
          this.viewport.scrollLeft = clamp(this.viewport.scrollLeft - step, 0, maxScroll);
        } else if (event.key === "ArrowRight") {
          this.viewport.scrollLeft = clamp(this.viewport.scrollLeft + step, 0, maxScroll);
        } else if (event.key === "Home") {
          this.viewport.scrollLeft = 0;
        } else if (event.key === "End") {
          this.viewport.scrollLeft = maxScroll;
        } else {
          return;
        }

        event.preventDefault();
        this.syncThumb();
      });

      window.addEventListener("resize", () => this.syncThumb());
    }

    setScrollFromPointer(clientX) {
      const trackRect = this.track.getBoundingClientRect();
      const travel = Math.max(0, trackRect.width - this.thumb.offsetWidth);
      const left = clamp(
        clientX - trackRect.left - this.scrollGrabOffset,
        0,
        travel
      );
      const maxScroll = Math.max(0, this.piano.scrollWidth - this.viewport.clientWidth);

      this.viewport.scrollLeft = travel ? (left / travel) * maxScroll : 0;
      this.syncThumb();
    }

    syncThumb() {
      const maxScroll = Math.max(0, this.piano.scrollWidth - this.viewport.clientWidth);
      const travel = Math.max(0, this.track.clientWidth - this.thumb.offsetWidth);
      const ratio = maxScroll ? this.viewport.scrollLeft / maxScroll : 0;

      this.thumb.style.transform = "translate3d(" + (ratio * travel) + "px, 0, 0)";
      this.rail.setAttribute("aria-valuenow", String(Math.round(ratio * 100)));
    }
  }

  window.PikakirjoitinKeyboard = {
    PianoKeyboard: PianoKeyboard,
    midiToPitch: midiToPitch
  };
})();
