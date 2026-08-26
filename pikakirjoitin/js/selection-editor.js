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

        <div class="pk-direction-control pk-stem-direction-control">
          <button type="button" data-action="stem-direction"
                  aria-label="${I18N.t("stemDirection")}" title="${I18N.t("stemDirection")}"
                  aria-haspopup="menu" aria-expanded="false">
            <img class="pk-direction-icon pk-stem-direction-icon" src="assets/stem-auto.svg"
                 alt="" aria-hidden="true">
          </button>
          <div class="pk-direction-flyout pk-stem-direction-flyout" role="menu" hidden>
            <button type="button" data-stem-direction="auto" role="menuitem" title="${I18N.t("automatic")}"><img src="assets/stem-auto.svg" alt="" aria-hidden="true"></button>
            <button type="button" data-stem-direction="up" role="menuitem" title="${I18N.t("stemUp")}"><img src="assets/stem-up.svg" alt="" aria-hidden="true"></button>
            <button type="button" data-stem-direction="down" role="menuitem" title="${I18N.t("stemDown")}"><img src="assets/stem-down.svg" alt="" aria-hidden="true"></button>
          </div>
        </div>

        <div class="pk-direction-control pk-slur-placement-control">
          <button type="button" data-action="slur-placement"
                  aria-label="${I18N.t("slurPlacement")}" title="${I18N.t("slurPlacement")}"
                  aria-haspopup="menu" aria-expanded="false">
            <img class="pk-direction-icon pk-slur-placement-icon" src="assets/slur-auto.svg"
                 alt="" aria-hidden="true">
          </button>
          <div class="pk-direction-flyout pk-slur-placement-flyout" role="menu" hidden>
            <button type="button" data-slur-placement="auto" role="menuitem" title="${I18N.t("automatic")}"><img src="assets/slur-auto.svg" alt="" aria-hidden="true"></button>
            <button type="button" data-slur-placement="above" role="menuitem" title="${I18N.t("slurAbove")}"><img src="assets/slur-above.svg" alt="" aria-hidden="true"></button>
            <button type="button" data-slur-placement="below" role="menuitem" title="${I18N.t("slurBelow")}"><img src="assets/slur-below.svg" alt="" aria-hidden="true"></button>
          </div>
        </div>

        <button type="button" data-action="beam"
                aria-label="${I18N.t("beamBreak")}" title="${I18N.t("beamBreak")}"
                aria-pressed="false">
          <img class="pk-beam-icon" src="assets/beam-break.svg"
               alt="" aria-hidden="true">
        </button>

        <div class="pk-articulation-group" role="group" aria-label="Articulations">
          <button type="button" data-action="articulation" data-articulation="accent"
                  aria-label="${I18N.t("accent")}" title="${I18N.t("accent")}" aria-pressed="false">
            <span class="pk-articulation-symbol pk-accent-symbol" aria-hidden="true">&gt;</span>
          </button>
          <button type="button" data-action="articulation" data-articulation="staccato"
                  aria-label="${I18N.t("staccato")}" title="${I18N.t("staccato")}" aria-pressed="false">
            <span class="pk-articulation-symbol pk-staccato-symbol" aria-hidden="true">•</span>
          </button>
          <button type="button" data-action="articulation" data-articulation="marcato"
                  aria-label="${I18N.t("marcato")}" title="${I18N.t("marcato")}" aria-pressed="false">
            <span class="pk-articulation-symbol pk-marcato-symbol" aria-hidden="true">^</span>
          </button>
          <button type="button" data-action="articulation" data-articulation="tenuto"
                  aria-label="${I18N.t("tenuto")}" title="${I18N.t("tenuto")}" aria-pressed="false">
            <span class="pk-articulation-symbol pk-tenuto-symbol" aria-hidden="true">—</span>
          </button>
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
      this.stemDirectionControl = root.querySelector(".pk-stem-direction-control");
      this.stemDirectionButton = root.querySelector('[data-action="stem-direction"]');
      this.stemDirectionFlyout = root.querySelector(".pk-stem-direction-flyout");
      this.slurPlacementControl = root.querySelector(".pk-slur-placement-control");
      this.slurPlacementButton = root.querySelector('[data-action="slur-placement"]');
      this.slurPlacementFlyout = root.querySelector(".pk-slur-placement-flyout");
      this.stemDirection = "auto";
      this.slurPlacement = "auto";
      this.beamButton = root.querySelector('[data-action="beam"]');
      this.beamMode = "";
      this.slurFlyout = root.querySelector(".pk-slur-flyout");
      this.currentSlurChoices = [];
      this.singleSelection = false;
      document.addEventListener("pk-languagechange", () => this.localize());

      root.addEventListener("pointerdown", function (event) {
        event.stopPropagation();
      });

      root.addEventListener("click", (event) => {
        const stemChoice = event.target.closest("[data-stem-direction]");
        if (stemChoice) {
          event.preventDefault();
          event.stopPropagation();
          const direction = stemChoice.dataset.stemDirection || "auto";
          this.closeDirectionFlyouts();
          if (typeof config.onStemDirection === "function") config.onStemDirection(direction);
          return;
        }

        const placementChoice = event.target.closest("[data-slur-placement]");
        if (placementChoice) {
          event.preventDefault();
          event.stopPropagation();
          const placement = placementChoice.dataset.slurPlacement || "auto";
          this.closeDirectionFlyouts();
          if (typeof config.onSlurPlacement === "function") config.onSlurPlacement(placement);
          return;
        }

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

        if (button.dataset.action === "stem-direction") {
          this.closeSlurFlyout();
          this.toggleStemDirectionFlyout();
          return;
        }

        if (button.dataset.action === "slur-placement") {
          this.closeSlurFlyout();
          this.toggleSlurPlacementFlyout();
          return;
        }

        if (button.dataset.action === "beam") {
          if (typeof config.onBeam === "function") config.onBeam();
          return;
        }

        if (button.dataset.action === "articulation") {
          const articulation = button.dataset.articulation || "";
          if (articulation && typeof config.onArticulation === "function") {
            config.onArticulation(articulation);
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
          this.closeDirectionFlyouts();
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
      const beam = this.root.querySelector('[data-action="beam"]');
      if (beam) {
        const label = I18N.t(this.beamMode === "join" ? "beamJoin" : "beamBreak");
        beam.setAttribute("aria-label", label);
        beam.setAttribute("title", label);
        const beamIcon = beam.querySelector(".pk-beam-icon");
        if (beamIcon) {
          beamIcon.src = this.beamMode === "join"
            ? "assets/beam-join.svg"
            : "assets/beam-break.svg";
        }
      }
      if (this.stemDirectionButton) {
        this.stemDirectionButton.setAttribute("aria-label", I18N.t("stemDirection"));
        this.stemDirectionButton.setAttribute("title", I18N.t("stemDirection"));
      }
      if (this.slurPlacementButton) {
        this.slurPlacementButton.setAttribute("aria-label", I18N.t("slurPlacement"));
        this.slurPlacementButton.setAttribute("title", I18N.t("slurPlacement"));
      }
      this.root.querySelectorAll("[data-stem-direction]").forEach((button) => {
        const value = button.dataset.stemDirection;
        const label = value === "up" ? I18N.t("stemUp") : value === "down" ? I18N.t("stemDown") : I18N.t("automatic");
        button.setAttribute("aria-label", label);
        button.setAttribute("title", label);
      });
      this.root.querySelectorAll("[data-slur-placement]").forEach((button) => {
        const value = button.dataset.slurPlacement;
        const label = value === "above" ? I18N.t("slurAbove") : value === "below" ? I18N.t("slurBelow") : I18N.t("automatic");
        button.setAttribute("aria-label", label);
        button.setAttribute("title", label);
      });
      ["accent", "staccato", "marcato", "tenuto"].forEach((name) => {
        const button = this.root.querySelector('[data-articulation="' + name + '"]');
        if (button) {
          button.setAttribute("aria-label", I18N.t(name));
          button.setAttribute("title", I18N.t(name));
        }
      });
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

    closeDirectionFlyouts() {
      if (this.stemDirectionFlyout) this.stemDirectionFlyout.hidden = true;
      if (this.slurPlacementFlyout) this.slurPlacementFlyout.hidden = true;
      if (this.stemDirectionButton) this.stemDirectionButton.setAttribute("aria-expanded", "false");
      if (this.slurPlacementButton) this.slurPlacementButton.setAttribute("aria-expanded", "false");
    }

    toggleStemDirectionFlyout() {
      if (!this.stemDirectionFlyout || this.stemDirectionButton.disabled) return;
      const open = this.stemDirectionFlyout.hidden;
      this.closeDirectionFlyouts();
      this.stemDirectionFlyout.hidden = !open;
      this.stemDirectionButton.setAttribute("aria-expanded", open ? "true" : "false");
    }

    toggleSlurPlacementFlyout() {
      if (!this.slurPlacementFlyout || this.slurPlacementButton.disabled) return;
      const open = this.slurPlacementFlyout.hidden;
      this.closeDirectionFlyouts();
      this.slurPlacementFlyout.hidden = !open;
      this.slurPlacementButton.setAttribute("aria-expanded", open ? "true" : "false");
    }

    updateDirectionControls(config) {
      const canStem = Boolean(config.canStemDirection);
      this.stemDirectionControl.hidden = !canStem;
      this.stemDirectionButton.disabled = !canStem;
      this.stemDirection = ["up", "down", "auto", "mixed"].includes(config.stemDirection) ? config.stemDirection : "auto";
      const stemIcon = this.stemDirectionButton.querySelector(".pk-stem-direction-icon");
      if (stemIcon) stemIcon.src = "assets/stem-" + (this.stemDirection === "mixed" ? "auto" : this.stemDirection) + ".svg";
      this.stemDirectionButton.classList.toggle("active", this.stemDirection === "up" || this.stemDirection === "down");
      this.root.querySelectorAll("[data-stem-direction]").forEach((button) => {
        const active = button.dataset.stemDirection === this.stemDirection;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });

      const canPlacement = Boolean(config.canSlurPlacement);
      this.slurPlacementControl.hidden = !canPlacement;
      this.slurPlacementButton.disabled = !canPlacement;
      this.slurPlacement = ["above", "below", "auto"].includes(config.slurPlacement) ? config.slurPlacement : "auto";
      const slurIcon = this.slurPlacementButton.querySelector(".pk-slur-placement-icon");
      if (slurIcon) slurIcon.src = "assets/slur-" + this.slurPlacement + ".svg";
      this.slurPlacementButton.classList.toggle("active", this.slurPlacement === "above" || this.slurPlacement === "below");
      this.root.querySelectorAll("[data-slur-placement]").forEach((button) => {
        const active = button.dataset.slurPlacement === this.slurPlacement;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });

      if (!canStem && !canPlacement) this.closeDirectionFlyouts();
    }

    update(options) {
      const config = options || {};
      const visible = Boolean(config.visible);

      if (!visible) {
        this.closeSlurFlyout();
        this.closeDirectionFlyouts();
        this.root.hidden = true;
        return;
      }

      const enharmonic = this.root.querySelector('[data-action="enharmonic"]');
      enharmonic.hidden = !config.canEnharmonic;
      enharmonic.disabled = !config.canEnharmonic;

      this.updateDirectionControls(config);
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

      this.beamMode = config.beamMode === "join" ? "join" : config.beamMode === "break" ? "break" : "";
      const canBeam = Boolean(this.beamMode);
      this.beamButton.hidden = !canBeam;
      this.beamButton.disabled = !canBeam;
      this.beamButton.classList.remove("active");
      this.beamButton.setAttribute("aria-pressed", "false");
      const beamLabel = I18N.t(this.beamMode === "join" ? "beamJoin" : "beamBreak");
      this.beamButton.setAttribute("aria-label", beamLabel);
      this.beamButton.setAttribute("title", beamLabel);
      const beamIcon = this.beamButton.querySelector(".pk-beam-icon");
      if (beamIcon) {
        beamIcon.src = this.beamMode === "join"
          ? "assets/beam-join.svg"
          : "assets/beam-break.svg";
      }

      const articulationState = config.articulations || {};
      this.root.querySelectorAll("button[data-articulation]").forEach((button) => {
        const name = button.dataset.articulation || "";
        const active = Boolean(articulationState[name]);
        button.disabled = !config.canArticulate;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });

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
      this.closeDirectionFlyouts();
      this.root.hidden = true;
    }
  }

  window.PikakirjoitinSelectionEditor = { SelectionEditor };
})();
