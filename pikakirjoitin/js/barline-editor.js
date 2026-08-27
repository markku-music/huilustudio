(function () {
  "use strict";

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  const CHOICES = [
    { type:"normal", symbol:"|", label:"Tavallinen tahtiviiva" },
    { type:"double", symbol:"||", label:"Kaksoisviiva" },
    { type:"final", symbol:"|]", label:"Loppuviiva" },
    { type:"repeat-start", symbol:"|:", label:"Kertauksen alku" },
    { type:"repeat-end", symbol:":|", label:"Kertauksen loppu" },
    { type:"repeat-both", symbol:":||:", label:"Kertaus molempiin suuntiin" }
  ];

  class BarlineEditor {
    constructor(options) {
      const config = options || {};
      this.overlay = config.overlay;
      this.paper = config.paper;
      this.container = config.container;
      this.getMeasureLayout = config.getMeasureLayout;
      this.getMeasureCount = config.getMeasureCount;
      this.getBarlineType = config.getBarlineType;
      this.onSetBarline = config.onSetBarline;
      this.active = false;
      this.openBoundaryIndex = null;

      this.overlay.addEventListener("click", (event) => {
        const choice = event.target.closest(".barline-choice");
        if (choice) {
          event.preventDefault();
          event.stopPropagation();
          const boundaryIndex = Number(choice.dataset.boundaryIndex);
          const type = choice.dataset.barlineType;
          if (Number.isInteger(boundaryIndex) && type && typeof this.onSetBarline === "function") {
            this.onSetBarline(boundaryIndex, type);
          }
          return;
        }

        const marker = event.target.closest(".barline-marker");
        if (!marker) return;
        event.preventDefault();
        event.stopPropagation();
        const boundaryIndex = Number(marker.dataset.boundaryIndex);
        if (!Number.isInteger(boundaryIndex)) return;
        this.openChoicePopover(marker, boundaryIndex);
      });

      window.addEventListener("resize", () => {
        if (this.active) requestAnimationFrame(() => this.refresh());
      });
    }

    setActive(active) {
      this.active = Boolean(active);
      this.overlay.hidden = !this.active;
      this.overlay.setAttribute("aria-hidden", this.active ? "false" : "true");
      this.openBoundaryIndex = null;
      if (this.active) this.refresh();
      else this.overlay.replaceChildren();
    }

    isActive() {
      return this.active;
    }

    refresh() {
      if (!this.active) return;

      const measures = typeof this.getMeasureLayout === "function"
        ? this.getMeasureLayout().filter(Boolean).sort(function (a, b) {
            return a.measureIndex - b.measureIndex;
          })
        : [];

      this.overlay.replaceChildren();
      this.openBoundaryIndex = null;
      if (!measures.length) return;

      const paperRect = this.paper.getBoundingClientRect();
      const containerRect = this.container.getBoundingClientRect();
      const offsetX = containerRect.left - paperRect.left;
      const offsetY = containerRect.top - paperRect.top;
      const count = typeof this.getMeasureCount === "function"
        ? Math.max(0, Number(this.getMeasureCount()) || 0)
        : measures.length;

      const positions = [];
      const first = measures[0];
      if (first && first.measureIndex === 0) {
        positions.push({
          boundaryIndex:0,
          x:offsetX + first.startX,
          y:offsetY + first.staffTop - 22
        });
      }

      measures.forEach(function (measure) {
        positions.push({
          boundaryIndex:measure.measureIndex + 1,
          x:offsetX + measure.endX,
          y:offsetY + measure.staffTop - 22
        });
      });

      positions.forEach((position) => {
        if (position.boundaryIndex < 0 || position.boundaryIndex > count) return;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "barline-marker";
        button.dataset.boundaryIndex = String(position.boundaryIndex);
        button.textContent = "+";

        const type = typeof this.getBarlineType === "function"
          ? this.getBarlineType(position.boundaryIndex)
          : "normal";

        button.dataset.currentType = type;
        button.setAttribute("aria-label", "Muokkaa tahtiviivaa");
        button.title = "Muokkaa tahtiviivaa";
        if (type !== "normal") button.classList.add("has-special-barline");

        button.style.left = clamp(position.x, 18, paperRect.width - 18) + "px";
        button.style.top = Math.max(12, position.y) + "px";
        this.overlay.appendChild(button);
      });
    }

    openChoicePopover(marker, boundaryIndex) {
      this.overlay.querySelectorAll(".barline-choice-popover").forEach(function (node) {
        node.remove();
      });

      this.openBoundaryIndex = boundaryIndex;
      const current = typeof this.getBarlineType === "function"
        ? this.getBarlineType(boundaryIndex)
        : "normal";

      const popover = document.createElement("div");
      popover.className = "barline-choice-popover";
      popover.setAttribute("role", "menu");
      popover.setAttribute("aria-label", "Valitse tahtiviiva");

      CHOICES.forEach(function (choice) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "barline-choice";
        button.dataset.boundaryIndex = String(boundaryIndex);
        button.dataset.barlineType = choice.type;
        button.textContent = choice.symbol;
        button.title = choice.label;
        button.setAttribute("aria-label", choice.label);
        button.setAttribute("role", "menuitemradio");
        button.setAttribute("aria-checked", choice.type === current ? "true" : "false");
        if (choice.type === current) button.classList.add("active");
        popover.appendChild(button);
      });

      this.overlay.appendChild(popover);

      const overlayRect = this.overlay.getBoundingClientRect();
      const markerRect = marker.getBoundingClientRect();
      const width = 306;
      const left = clamp(
        markerRect.left - overlayRect.left - width / 2 + markerRect.width / 2,
        8,
        Math.max(8, overlayRect.width - width - 8)
      );
      let top = markerRect.bottom - overlayRect.top + 8;
      if (top + 54 > overlayRect.height) {
        top = markerRect.top - overlayRect.top - 62;
      }
      popover.style.left = left + "px";
      popover.style.top = Math.max(8, top) + "px";
    }
  }

  window.PikakirjoitinBarlineEditor = { BarlineEditor:BarlineEditor };
})();
