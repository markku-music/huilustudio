(function () {
  "use strict";

  const POSITION_KEY = "pikakirjoitin3.thumbRailY";
  const DRAG_THRESHOLD = 14;
  const EDGE_GAP = 8;
  const FLYOUT_SLOP = 10;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  class ThumbRail {
    constructor(options) {
      this.rail = options.rail;
      this.boundsElement = options.boundsElement;
      this.onChange = options.onChange;

      this.activePointers = new Map();
      this.dragPointerId = null;
      this.stateValue = { rest: false, dots: 0, slur: false, tie: false, layout: false, barlines: false };
      this.ratio = 0.52;

      this.dotWrap = this.rail.querySelector(".thumb-dot-wrap");
      this.dot1Button = this.rail.querySelector("#dot1Button");
      this.dot2Flyout = this.rail.querySelector("#dot2Flyout");
      this.tieFlyout = this.rail.querySelector("#tieFlyout");

      this.restorePosition();
      this.bind();

      requestAnimationFrame(() => this.positionFromRatio());
      window.addEventListener("resize", () => this.positionFromRatio());
    }

    get state() {
      return Object.assign({}, this.stateValue);
    }

    setToggle(name, value) {
      if (!["layout", "barlines"].includes(name)) return;
      this.stateValue[name] = Boolean(value);
      this.updateStateAndButtons();
    }

    consumeTie() {
      let changed = false;

      for (const active of this.activePointers.values()) {
        const isTieSelection =
          active.modifier === "tie" ||
          (active.modifier === "dot1" && active.dotSelection === "tie");

        if (isTieSelection && !active.tieConsumed) {
          active.tieConsumed = true;
          changed = true;
        }
      }

      if (changed) this.updateStateAndButtons();
    }

    bind() {
      this.rail.addEventListener("pointerdown", (event) => this.pointerDown(event));
      this.rail.addEventListener("pointermove", (event) => this.pointerMove(event));
      this.rail.addEventListener("pointerup", (event) => this.pointerEnd(event));
      this.rail.addEventListener("pointercancel", (event) => this.pointerEnd(event));
      this.rail.addEventListener("contextmenu", (event) => event.preventDefault());
    }

    pointerDown(event) {
      const button = event.target.closest(".thumb-modifier");
      if (!button) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;

      const modifier = button.dataset.modifier;
      if (!["rest", "dot1", "dot2", "slur", "tie", "layout", "barlines"].includes(modifier)) return;

      event.preventDefault();
      event.stopPropagation();

      if (modifier === "dot2") return;

      // Tie on temporary-modifier kuten muutkin paina-ja-pidä-toiminnot.
      // Se on aktiivinen vain niin kauan kuin tie-vaihtoehtoa pidetään
      // valittuna. Seuraava uusi nuotti kuluttaa tien heti.
      if (modifier === "layout" || modifier === "barlines") {
        const next = !this.stateValue[modifier];
        this.stateValue[modifier] = next;
        if (next && modifier === "layout") this.stateValue.barlines = false;
        if (next && modifier === "barlines") this.stateValue.layout = false;
        this.updateStateAndButtons();
        return;
      }

      const rect = this.rail.getBoundingClientRect();

      this.activePointers.set(event.pointerId, {
        button: button,
        modifier: modifier,
        startX: event.clientX,
        startY: event.clientY,
        startTop: rect.top,
        dragging: false,
        dotSelection: modifier === "dot1" ? 1 : 0,
        tieConsumed: false
      });

      if (modifier === "dot1") {
        this.openDotFlyout();
      }

      try {
        button.setPointerCapture(event.pointerId);
      } catch (error) {}

      this.updateStateAndButtons();
    }

    pointerMove(event) {
      const active = this.activePointers.get(event.pointerId);
      if (!active) return;

      event.preventDefault();
      event.stopPropagation();

      const dx = event.clientX - active.startX;
      const dy = event.clientY - active.startY;

      if (active.modifier === "dot1") {
        if (this.isInsideFlyout(this.tieFlyout, event.clientX, event.clientY)) {
          active.dotSelection = "tie";
        } else if (this.isInsideFlyout(this.dot2Flyout, event.clientX, event.clientY)) {
          active.dotSelection = 2;
        } else {
          active.dotSelection = 1;
        }

        this.updateStateAndButtons();
        return;
      }

      if (
        active.modifier === "rest" &&
        !active.dragging &&
        this.dragPointerId === null &&
        Math.abs(dy) >= DRAG_THRESHOLD &&
        Math.abs(dy) > Math.abs(dx)
      ) {
        active.dragging = true;
        this.dragPointerId = event.pointerId;
        this.rail.classList.add("is-dragging");
      }

      if (!active.dragging || this.dragPointerId !== event.pointerId) return;

      const bounds = this.bounds();
      const top = clamp(active.startTop + dy, bounds.minTop, bounds.maxTop);

      this.rail.style.top = top + "px";
      this.ratio = bounds.maxTop > bounds.minTop
        ? (top - bounds.minTop) / (bounds.maxTop - bounds.minTop)
        : 0;
    }

    pointerEnd(event) {
      const active = this.activePointers.get(event.pointerId);
      if (!active) return;

      event.preventDefault();
      event.stopPropagation();

      this.activePointers.delete(event.pointerId);

      try {
        if (active.button.hasPointerCapture(event.pointerId)) {
          active.button.releasePointerCapture(event.pointerId);
        }
      } catch (error) {}

      if (this.dragPointerId === event.pointerId) {
        this.dragPointerId = null;
        this.rail.classList.remove("is-dragging");
        this.savePosition();
      }

      if (active.modifier === "dot1") {
        this.closeDotFlyout();
      }

      this.updateStateAndButtons();
    }

    isInsideFlyout(element, clientX, clientY) {
      if (!element) return false;

      const rect = element.getBoundingClientRect();

      return (
        clientX >= rect.left - FLYOUT_SLOP &&
        clientX <= rect.right + FLYOUT_SLOP &&
        clientY >= rect.top - FLYOUT_SLOP &&
        clientY <= rect.bottom + FLYOUT_SLOP
      );
    }

    openDotFlyout() {
      if (!this.dotWrap || !this.dot2Flyout || !this.tieFlyout) return;
      this.dotWrap.classList.add("flyout-open");
      this.dot2Flyout.setAttribute("aria-hidden", "false");
      this.tieFlyout.setAttribute("aria-hidden", "false");
    }

    closeDotFlyout() {
      if (!this.dotWrap || !this.dot2Flyout || !this.tieFlyout) return;
      this.dotWrap.classList.remove("flyout-open", "dot2-selected", "tie-selected");
      this.dot2Flyout.setAttribute("aria-hidden", "true");
      this.dot2Flyout.setAttribute("aria-pressed", "false");
      this.tieFlyout.setAttribute("aria-hidden", "true");
    }

    updateStateAndButtons() {
      let rest = false;
      let dots = 0;
      let slur = false;
      let tiePreview = false;
      let tie = false;
      const layout = Boolean(this.stateValue.layout);
      const barlines = Boolean(this.stateValue.barlines);

      for (const active of this.activePointers.values()) {
        if (active.modifier === "rest") {
          rest = true;
        }

        if (active.modifier === "dot1") {
          if (active.dotSelection === "tie") {
            tiePreview = true;
            if (!active.tieConsumed) tie = true;
          } else {
            dots = Math.max(dots, Number(active.dotSelection) || 1);
          }
        }

        if (active.modifier === "tie") {
          tiePreview = true;
          if (!active.tieConsumed) tie = true;
        }

        if (active.modifier === "slur") {
          slur = true;
        }
      }

      this.stateValue = { rest: rest, dots: dots, slur: slur, tie: tie, layout: layout, barlines: barlines };

      const restButton = this.rail.querySelector('[data-modifier="rest"]');
      if (restButton) {
        restButton.classList.toggle("active", rest);
        restButton.setAttribute("aria-pressed", rest ? "true" : "false");
      }

      const slurButton = this.rail.querySelector('[data-modifier="slur"]');
      if (slurButton) {
        slurButton.classList.toggle("active", slur);
        slurButton.setAttribute("aria-pressed", slur ? "true" : "false");
      }

      const tieButton = this.rail.querySelector('[data-modifier="tie"]');
      if (tieButton) {
        tieButton.classList.toggle("active", tie);
        tieButton.setAttribute("aria-pressed", tie ? "true" : "false");
      }

      const layoutButton = this.rail.querySelector('[data-modifier="layout"]');
      if (layoutButton) {
        layoutButton.classList.toggle("active", layout);
        layoutButton.setAttribute("aria-pressed", layout ? "true" : "false");
      }

      const barlineButton = this.rail.querySelector('[data-modifier="barlines"]');
      if (barlineButton) {
        barlineButton.classList.toggle("active", barlines);
        barlineButton.setAttribute("aria-pressed", barlines ? "true" : "false");
      }

      if (this.dot1Button) {
        const dotPressed = dots >= 1;
        this.dot1Button.classList.toggle("active", dotPressed && dots === 1);
        this.dot1Button.setAttribute(
          "aria-pressed",
          dotPressed && dots === 1 ? "true" : "false"
        );
      }

      if (this.dotWrap && this.dot2Flyout && this.tieFlyout) {
        const doubleSelected = dots === 2;
        this.dotWrap.classList.toggle("dot2-selected", doubleSelected);
        this.dotWrap.classList.toggle("tie-selected", tiePreview);
        this.dotWrap.classList.toggle("tie-armed", tie);
        this.dot2Flyout.setAttribute(
          "aria-pressed",
          doubleSelected ? "true" : "false"
        );
      }

      this.emit();
    }

    bounds() {
      const rect = this.boundsElement.getBoundingClientRect();
      const minTop = rect.top + EDGE_GAP;
      const maxTop = Math.max(
        minTop,
        rect.bottom - this.rail.offsetHeight - EDGE_GAP
      );
      return { minTop: minTop, maxTop: maxTop };
    }

    positionFromRatio() {
      const bounds = this.bounds();
      const top = bounds.minTop +
        (bounds.maxTop - bounds.minTop) * clamp(this.ratio, 0, 1);
      this.rail.style.top = top + "px";
    }

    restorePosition() {
      try {
        const saved = Number.parseFloat(localStorage.getItem(POSITION_KEY));
        if (Number.isFinite(saved)) {
          this.ratio = clamp(saved, 0, 1);
        }
      } catch (error) {}
    }

    savePosition() {
      try {
        localStorage.setItem(POSITION_KEY, this.ratio.toFixed(4));
      } catch (error) {}
    }

    emit() {
      if (typeof this.onChange === "function") {
        this.onChange(this.state);
      }
    }
  }

  window.PikakirjoitinThumbRail = { ThumbRail: ThumbRail };
})();
