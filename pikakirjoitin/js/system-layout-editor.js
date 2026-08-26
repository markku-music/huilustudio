(function () {
  "use strict";

  const MIN_FACTOR = 1;
  const MAX_FACTOR = 6;
  const DRAG_THRESHOLD_PX = 6;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function sameSystem(a, b) {
    return Math.abs(Number(a.systemTop) - Number(b.systemTop)) < 4;
  }

  class SystemLayoutEditor {
    constructor(options) {
      const config = options || {};

      this.overlay = config.overlay;
      this.paper = config.paper;
      this.container = config.container;
      this.getMeasureLayout = config.getMeasureLayout;
      this.getMeasureCount = config.getMeasureCount;
      this.hasContent = config.hasContent;
      this.isSystemBreak = config.isSystemBreak;
      this.onToggleSystemBreak = config.onToggleSystemBreak;
      this.getLastSystemFactor = config.getLastSystemFactor;
      this.onLastSystemFactorCommit = config.onLastSystemFactorCommit;

      this.active = false;
      this.drag = null;

      this.overlay.addEventListener("pointerdown", (event) => {
        const marker = event.target.closest(".system-break-marker");
        if (marker) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        const handle =
          event.target.closest(".last-system-stretch-handle");

        if (handle) {
          this.startStretch(event, handle);
        }
      });

      this.overlay.addEventListener("click", (event) => {
        const marker = event.target.closest(".system-break-marker");
        if (!marker) return;

        event.preventDefault();
        event.stopPropagation();

        const startMeasureIndex =
          Number(marker.dataset.startMeasureIndex);

        if (!Number.isInteger(startMeasureIndex)) return;

        if (typeof this.onToggleSystemBreak === "function") {
          this.onToggleSystemBreak(startMeasureIndex);
        }
      });

      window.addEventListener("resize", () => {
        if (this.active && !this.drag) {
          requestAnimationFrame(() => this.refresh());
        }
      });
    }

    setActive(active) {
      this.active = Boolean(active);
      this.overlay.hidden = !this.active;
      this.overlay.setAttribute(
        "aria-hidden",
        this.active ? "false" : "true"
      );

      if (this.active) this.refresh();
      else this.cancelStretch();
    }

    refresh() {
      if (!this.active || this.drag) return;

      const measures =
        typeof this.getMeasureLayout === "function"
          ? this.getMeasureLayout().filter(Boolean)
          : [];

      this.overlay.replaceChildren();
      if (!measures.length) return;

      const paperRect = this.paper.getBoundingClientRect();
      const containerRect = this.container.getBoundingClientRect();
      const offsetX = containerRect.left - paperRect.left;
      const offsetY = containerRect.top - paperRect.top;

      const measureCount =
        typeof this.getMeasureCount === "function"
          ? Number(this.getMeasureCount()) || 0
          : measures.length;

      measures.forEach((measure) => {
        const nextIndex = measure.measureIndex + 1;

        // Ei merkkiä viimeisen tahdin jälkeen.
        if (nextIndex >= measureCount) return;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "system-break-marker";
        button.dataset.startMeasureIndex = String(nextIndex);
        button.textContent = "↵";

        const active =
          typeof this.isSystemBreak === "function"
            ? Boolean(this.isSystemBreak(nextIndex))
            : false;

        button.classList.toggle("active", active);
        button.setAttribute(
          "aria-pressed",
          active ? "true" : "false"
        );

        button.setAttribute(
          "aria-label",
          active
            ? "Poista rivinvaihto tahdin " +
                (measure.measureIndex + 1) +
                " jälkeen"
            : "Aloita uusi rivi tahdin " +
                (measure.measureIndex + 1) +
                " jälkeen"
        );

        const x = offsetX + measure.endX;
        const y = offsetY + measure.staffTop - 22;

        button.style.left =
          clamp(x, 18, paperRect.width - 18) + "px";
        button.style.top = Math.max(12, y) + "px";

        this.overlay.appendChild(button);
      });

      if (
        typeof this.hasContent === "function" &&
        !this.hasContent()
      ) {
        return;
      }

      this.createStretchHandle(
        measures,
        offsetX,
        offsetY,
        paperRect.width
      );
    }

    createStretchHandle(measures, offsetX, offsetY, paperWidth) {
      const lastMeasure = measures[measures.length - 1];

      const sameLine = measures.filter((measure) => {
        return sameSystem(measure, lastMeasure);
      });

      if (!sameLine.length) return;

      const lineStart = Math.min.apply(
        null,
        sameLine.map((measure) => measure.startX)
      );

      const lineEnd = Math.max.apply(
        null,
        sameLine.map((measure) => measure.endX)
      );

      const staffTop = Math.min.apply(
        null,
        sameLine.map((measure) => measure.staffTop)
      );

      const staffBottom = Math.max.apply(
        null,
        sameLine.map((measure) => measure.staffBottom)
      );

      const handle = document.createElement("button");
      handle.type = "button";
      handle.className = "last-system-stretch-handle";
      handle.textContent = "↔";
      handle.title = "Venytä viimeistä riviä";
      handle.setAttribute(
        "aria-label",
        I18N.t("stretchLastSystem")
      );

      handle.dataset.lineStart = String(offsetX + lineStart);
      handle.dataset.lineEnd = String(offsetX + lineEnd);
      handle.dataset.paperWidth = String(paperWidth);

      handle.style.left =
        clamp(offsetX + lineEnd + 17, 24, paperWidth - 18) +
        "px";

      handle.style.top =
        (offsetY + (staffTop + staffBottom) / 2) + "px";

      this.overlay.appendChild(handle);
    }

    startStretch(event, handle) {
      if (!this.active) return;

      event.preventDefault();
      event.stopPropagation();

      const lineStart = Number(handle.dataset.lineStart);
      const lineEnd = Number(handle.dataset.lineEnd);
      const paperWidth = Number(handle.dataset.paperWidth);
      const currentWidth = Math.max(80, lineEnd - lineStart);

      const startFactor = clamp(
        Number(
          typeof this.getLastSystemFactor === "function"
            ? this.getLastSystemFactor()
            : 1.4
        ) || 1.4,
        MIN_FACTOR,
        MAX_FACTOR
      );

      this.drag = {
        pointerId: event.pointerId,
        handle: handle,
        startClientX: event.clientX,
        startLeft: parseFloat(handle.style.left) || lineEnd,
        lineStart: lineStart,
        currentWidth: currentWidth,
        paperWidth: paperWidth,
        startFactor: startFactor,
        factor: startFactor,
        moved: false
      };

      handle.classList.add("dragging");

      this.boundMove = (moveEvent) => {
        this.moveStretch(moveEvent);
      };

      this.boundEnd = (endEvent) => {
        this.endStretch(endEvent);
      };

      window.addEventListener(
        "pointermove",
        this.boundMove,
        { passive:false }
      );

      window.addEventListener(
        "pointerup",
        this.boundEnd,
        { passive:false }
      );

      window.addEventListener(
        "pointercancel",
        this.boundEnd,
        { passive:false }
      );
    }

    moveStretch(event) {
      if (
        !this.drag ||
        event.pointerId !== this.drag.pointerId
      ) {
        return;
      }

      event.preventDefault();

      const dx = event.clientX - this.drag.startClientX;

      // Nopea napautus on oma eleensä: vasta selvä liike aloittaa
      // portaattoman venytyksen. Näin pieni sormen/hiiren heilahdus
      // ei estä kertaklikkauksen "maksimiin"-toimintoa.
      if (!this.drag.moved) {
        if (Math.abs(dx) < DRAG_THRESHOLD_PX) return;
        this.drag.moved = true;
      }

      const minLeft = this.drag.lineStart + 80;
      const maxLeft = this.drag.paperWidth - 18;

      const targetLeft = clamp(
        this.drag.startLeft + dx,
        minLeft,
        maxLeft
      );

      const targetWidth =
        Math.max(80, targetLeft - this.drag.lineStart);

      const factor = clamp(
        this.drag.startFactor *
          (targetWidth / this.drag.currentWidth),
        MIN_FACTOR,
        MAX_FACTOR
      );

      this.drag.factor = factor;
      this.drag.handle.style.left = targetLeft + "px";
      this.drag.handle.classList.add("preview");
    }

    endStretch(event) {
      if (
        !this.drag ||
        event.pointerId !== this.drag.pointerId
      ) {
        return;
      }

      event.preventDefault();

      const drag = this.drag;
      const handle = drag.handle;

      // Kertaklikkaus / nopea napautus: venytä viimeinen rivi suoraan
      // samaan maksimiin, johon kahvaa voisi vetää käsin.
      // Jos käyttäjä liikutti osoitinta yli kynnyksen, säilytetään
      // nykyinen portaattoman vedon toiminta.
      let factor = drag.factor;
      if (!drag.moved) {
        const maxLeft = drag.paperWidth - 18;
        const maxWidth = Math.max(80, maxLeft - drag.lineStart);
        factor = clamp(
          drag.startFactor * (maxWidth / drag.currentWidth),
          MIN_FACTOR,
          MAX_FACTOR
        );
      }

      this.removeWindowDragListeners();
      this.drag = null;

      if (handle) {
        handle.classList.remove("dragging", "preview");
      }

      if (
        typeof this.onLastSystemFactorCommit === "function"
      ) {
        this.onLastSystemFactorCommit(factor);
      }
    }

    cancelStretch() {
      if (!this.drag) return;
      this.removeWindowDragListeners();
      this.drag = null;
    }

    removeWindowDragListeners() {
      if (this.boundMove) {
        window.removeEventListener(
          "pointermove",
          this.boundMove
        );
        this.boundMove = null;
      }

      if (this.boundEnd) {
        window.removeEventListener(
          "pointerup",
          this.boundEnd
        );
        window.removeEventListener(
          "pointercancel",
          this.boundEnd
        );
        this.boundEnd = null;
      }
    }
  }

  window.PikakirjoitinSystemLayoutEditor = {
    SystemLayoutEditor: SystemLayoutEditor
  };
})();
