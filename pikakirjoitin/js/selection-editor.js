(function () {
  "use strict";

  class SelectionEditor {
    constructor(options) {
      const config = options || {};
      const root = document.createElement("div");
      root.className = "pk-selection-editor";
      root.hidden = true;
      root.setAttribute("role", "toolbar");
      root.setAttribute("aria-label", "Valinnan muokkaus");
      root.innerHTML = `
        <button type="button" data-action="enharmonic"
                aria-label="Enharmoninen vaihto" title="Enharmoninen vaihto">
          <img class="pk-enharmonic-icon" src="assets/Enharmoninen.svg"
               alt="" aria-hidden="true">
        </button>

        <button type="button" data-action="rest"
                aria-label="Muuta valinta tauoksi" title="Muuta valinta tauoksi">
          <img class="pk-rest-icon" src="assets/rest.svg"
               alt="" aria-hidden="true">
        </button>

        <button type="button" data-action="delete"
                aria-label="Poista valinta" title="Poista valinta"
                class="is-delete">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 8v10m4-10v10m4-10v10M5 5h14M9 5l1-2h4l1 2m3 0-1 16H7L6 5"/>
          </svg>
        </button>`;

      document.body.appendChild(root);
      this.root = root;

      root.addEventListener("pointerdown", function (event) {
        event.stopPropagation();
      });

      root.addEventListener("click", function (event) {
        const button = event.target.closest("button[data-action]");
        if (!button || button.disabled) return;

        event.preventDefault();
        event.stopPropagation();

        if (button.dataset.action === "enharmonic") {
          if (typeof config.onEnharmonic === "function") config.onEnharmonic();
        }
        if (button.dataset.action === "rest") {
          if (typeof config.onRest === "function") config.onRest();
        }
        if (button.dataset.action === "delete") {
          if (typeof config.onDelete === "function") config.onDelete();
        }
      });
    }

    update(options) {
      const config = options || {};
      const visible = Boolean(config.visible);

      if (!visible) {
        this.root.hidden = true;
        return;
      }

      const enharmonic = this.root.querySelector('[data-action="enharmonic"]');
      enharmonic.hidden = !config.canEnharmonic;
      enharmonic.disabled = !config.canEnharmonic;

      this.root.hidden = false;

      const width = this.root.offsetWidth || 154;
      const half = width / 2;
      const x = Number(config.x) || window.innerWidth / 2;
      this.root.style.left =
        Math.max(half + 6, Math.min(window.innerWidth - half - 6, x)) + "px";

      const height = this.root.offsetHeight || 46;
      const staffTop = Number(config.staffTop) || 0;
      const staffBottom = Number(config.staffBottom) || staffTop + 50;
      const above = staffTop - height - 34;
      const top = above >= 6
        ? above
        : Math.min(window.innerHeight - height - 6, staffBottom + 10);

      this.root.style.top = Math.max(6, top) + "px";
    }

    hide() {
      this.root.hidden = true;
    }
  }

  window.PikakirjoitinSelectionEditor = { SelectionEditor };
})();
