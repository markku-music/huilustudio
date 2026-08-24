(function () {
  "use strict";

  const MIN_MIDI = 36;
  const MAX_MIDI = 95;
  const WHITE_COUNT = 35;
  const BLACK_WIDTH = 0.62;

  const WHITE_NAMES = {
    0: "C",
    2: "D",
    4: "E",
    5: "F",
    7: "G",
    9: "A",
    11: "H"
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
    const name = WHITE_NAMES[((midi % 12) + 12) % 12];

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
    return midiToPitch(midi).replace("B", "H").replace("#", "is");
  }

  class PianoKeyboard {
    constructor(options) {
      this.piano = options.piano;
      this.whiteKeys = options.whiteKeys;
      this.viewport = options.viewport;
      this.rail = options.rail;
      this.track = options.track;
      this.thumb = options.thumb;
      this.onNote = options.onNote;

      this.activePointerId = null;
      this.activeKey = null;
      this.scrollPointerId = null;
      this.scrollGrabOffset = 0;

      this.buildKeys();
      this.bindNotes();
      this.bindScrollRail();

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

    bindNotes() {
      this.piano.addEventListener("pointerdown", (event) => {
        const key = event.target.closest(".key");
        if (!key || this.activePointerId !== null) return;
        if (event.pointerType === "mouse" && event.button !== 0) return;

        event.preventDefault();
        this.activePointerId = event.pointerId;
        this.activeKey = key;
        key.classList.add("active");

        try {
          this.piano.setPointerCapture(event.pointerId);
        } catch (error) {}

        if (typeof this.onNote === "function") {
          this.onNote(Number(key.dataset.midi), key.dataset.pitch);
        }
      });

      const finish = (event) => {
        if (event.pointerId !== this.activePointerId) return;

        if (this.activeKey) this.activeKey.classList.remove("active");

        try {
          if (this.piano.hasPointerCapture(event.pointerId)) {
            this.piano.releasePointerCapture(event.pointerId);
          }
        } catch (error) {}

        this.activePointerId = null;
        this.activeKey = null;
      };

      this.piano.addEventListener("pointerup", finish);
      this.piano.addEventListener("pointercancel", finish);
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
