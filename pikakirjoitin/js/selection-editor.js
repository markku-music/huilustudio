(function () {
  "use strict";

  const I18N = window.PikakirjoitinI18n;

  class SelectionEditor {
    constructor(options) {
      const config = options || {};
      const root = document.createElement("div");
      root.className = "pk-selection-editor";
      root.hidden = true;
      root.setAttribute("role", "toolbar");
      root.setAttribute("aria-label", I18N.t("selectionEdit"));
      root.innerHTML = `
        <button type="button" data-action="enharmonic"
                aria-label="${I18N.t("enharmonic")}" title="${I18N.t("enharmonic")}">
          <img class="pk-enharmonic-icon" src="assets/Enharmoninen.svg"
               alt="" aria-hidden="true">
        </button>

        <div class="pk-slur-control">
          <button type="button" data-action="slur"
                  aria-label="Slur" title="Slur" aria-haspopup="false"
                  aria-expanded="false">
            <img class="pk-slur-icon" src="assets/slur.svg"
                 alt="" aria-hidden="true">
          </button>
          <div class="pk-slur-flyout" role="menu" hidden></div>
        </div>

        <button type="button" data-action="rest"
                aria-label="${I18N.t("convertRest")}" title="${I18N.t("convertRest")}">
          <img class="pk-rest-icon" src="assets/rest.svg"
               alt="" aria-hidden="true">
        </button>

        <button type="button" data-action="delete"
                aria-label="${I18N.t("deleteSelection")}" title="${I18N.t("deleteSelection")}"
                class="is-delete">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 8v10m4-10v10m4-10v10M5 5h14M9 5l1-2h4l1 2m3 0-1 16H7L6 5"/>
          </svg>
        </button>`;

      document.body.appendChild(root);

      this.root = root;
      this.slurButton = root.querySelector('[data-action="slur"]');
      this.slurFlyout = root.querySelector(".pk-slur-flyout");
      this.currentSlurChoices = [];
      this.singleSelection = false;
      document.addEventListener("pk-languagechange", () => this.localize());

      root.addEventListener("pointerdown", function (event) {
        event.stopPropagation();
      });

      root.addEventListener("click", (event) => {
        const choice = event.target.closest("[data-slur-id]");
        if (choice) {
          event.preventDefault();
          event.stopPropagation();

          const slurId = choice.dataset.slurId;
          this.closeSlurFlyout();

          if (slurId && typeof config.onSlurChoice === "function") {
            config.onSlurChoice(slurId);
          }
          return;
        }

        const button = event.target.closest("button[data-action]");
        if (!button || button.disabled) return;

        event.preventDefault();
        event.stopPropagation();

        if (button.dataset.action === "enharmonic") {
          if (typeof config.onEnharmonic === "function") config.onEnharmonic();
          return;
        }

        if (button.dataset.action === "slur") {
          if (this.singleSelection && this.currentSlurChoices.length > 1) {
            this.toggleSlurFlyout();
          } else if (typeof config.onSlur === "function") {
            this.closeSlurFlyout();
            config.onSlur();
          }
          return;
        }

        if (button.dataset.action === "rest") {
          if (typeof config.onRest === "function") config.onRest();
          return;
        }

        if (button.dataset.action === "delete") {
          if (typeof config.onDelete === "function") config.onDelete();
        }
      });

      document.addEventListener("pointerdown", (event) => {
        if (!this.root.contains(event.target)) {
          this.closeSlurFlyout();
        }
      }, { passive:true });
    }

    localize() {
      this.root.setAttribute("aria-label", I18N.t("selectionEdit"));
      const enh = this.root.querySelector('[data-action="enharmonic"]');
      if (enh) {
        enh.setAttribute("aria-label", I18N.t("enharmonic"));
        enh.setAttribute("title", I18N.t("enharmonic"));
      }
      const rest = this.root.querySelector('[data-action="rest"]');
      if (rest) {
        rest.setAttribute("aria-label", I18N.t("convertRest"));
        rest.setAttribute("title", I18N.t("convertRest"));
      }
      const del = this.root.querySelector('[data-action="delete"]');
      if (del) {
        del.setAttribute("aria-label", I18N.t("deleteSelection"));
        del.setAttribute("title", I18N.t("deleteSelection"));
      }
      this.renderSlurChoices(this.currentSlurChoices);
    }

    renderSlurChoices(choices) {
      const items = Array.isArray(choices) ? choices : [];
      this.currentSlurChoices = items.slice();
      this.slurFlyout.innerHTML = "";

      items.forEach((choice) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "pk-slur-choice";
        button.dataset.slurId = choice.id;
        button.setAttribute("role", "menuitem");
        button.setAttribute(
          "aria-label",
          I18N.t("removeSlur") + " " + (choice.label || "")
        );
        button.innerHTML = `
          <img src="assets/slur.svg" alt="" aria-hidden="true">
          <span>${choice.label || "Slur"}</span>`;
        this.slurFlyout.appendChild(button);
      });
    }

    toggleSlurFlyout() {
      if (!this.currentSlurChoices.length) return;

      const willOpen = this.slurFlyout.hidden;
      this.slurFlyout.hidden = !willOpen;
      this.slurButton.setAttribute("aria-expanded", willOpen ? "true" : "false");
    }

    closeSlurFlyout() {
      if (!this.slurFlyout) return;
      this.slurFlyout.hidden = true;
      if (this.slurButton) {
        this.slurButton.setAttribute("aria-expanded", "false");
      }
    }

    update(options) {
      const config = options || {};
      const visible = Boolean(config.visible);

      if (!visible) {
        this.closeSlurFlyout();
        this.root.hidden = true;
        return;
      }

      const enharmonic = this.root.querySelector('[data-action="enharmonic"]');
      enharmonic.hidden = !config.canEnharmonic;
      enharmonic.disabled = !config.canEnharmonic;

      this.singleSelection = Boolean(config.singleSelection);
      this.renderSlurChoices(config.slurChoices || []);

      this.slurButton.disabled = !config.canSlur;
      this.slurButton.classList.toggle("active", Boolean(config.slurActive));
      this.slurButton.setAttribute(
        "aria-pressed",
        config.slurActive ? "true" : "false"
      );

      const hasChoiceFlyout =
        this.singleSelection &&
        this.currentSlurChoices.length > 1;

      this.slurButton.setAttribute(
        "aria-haspopup",
        hasChoiceFlyout ? "menu" : "false"
      );

      if (!hasChoiceFlyout) {
        this.closeSlurFlyout();
      }

      this.root.hidden = false;

      const width = this.root.offsetWidth || 206;
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
      this.closeSlurFlyout();
      this.root.hidden = true;
    }
  }

  window.PikakirjoitinSelectionEditor = { SelectionEditor };
})();
