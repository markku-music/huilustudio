const POSITION_KEY = 'pikakirjoitin2.thumbRailY';
const DRAG_THRESHOLD = 14;
const TUPLET_HORIZONTAL_THRESHOLD = 16;
const EDGE_GAP = 8;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export class ThumbRail {
  #rail;
  #boundsElement;
  #onChange;
  #onTupletRequest;
  #activePointers = new Map();
  #dragPointerId = null;
  #state = { dot: false, rest: false, tie: false, tuplet: 0 };
  #ratio = 0.52;
  #tripletButton;
  #quintupletButton;
  #sextupletButton;
  #tupletNumber;

  constructor({ rail, boundsElement, onChange, onTupletRequest }) {
    this.#rail = rail;
    this.#boundsElement = boundsElement;
    this.#onChange = onChange;
    this.#onTupletRequest = onTupletRequest;
    this.#tripletButton = rail.querySelector('#tripletButton');
    this.#quintupletButton = rail.querySelector('#quintupletButton');
    this.#sextupletButton = rail.querySelector('#sextupletButton');
    this.#tupletNumber = rail.querySelector('#tupletButtonNumber');
    this.#restorePosition();
    this.#bind();
    requestAnimationFrame(() => this.#positionFromRatio());
    window.addEventListener('resize', () => this.#positionFromRatio());
  }

  get state() { return { ...this.#state }; }

  setToggle(name, value) {
    if (!(name in this.#state) || name === 'tuplet') return;
    this.#state[name] = Boolean(value);
    const button = this.#rail.querySelector(`[data-toggle="${name}"]`);
    if (button) {
      button.classList.toggle('active', this.#state[name]);
      button.setAttribute('aria-pressed', String(this.#state[name]));
    }
    this.#emit();
  }

  setTuplet(size = 0) {
    const next = [3,5,6].includes(Number(size)) ? Number(size) : 0;
    this.#state.tuplet = next;
    if (this.#tripletButton) {
      this.#tripletButton.classList.toggle('active', next > 0);
      this.#tripletButton.setAttribute('aria-pressed', String(next > 0));
      this.#tripletButton.setAttribute('aria-label', next > 0
        ? `${next===3?'Trioli':next===5?'Kvintoli':'Sekstoli'} aktiivinen`
        : 'Trioli: napauta; liu\'uta oikealle kvintoliin tai sekstoliin');
    }
    if (this.#tupletNumber) this.#tupletNumber.textContent = String(next || 3);
    this.#emit();
  }

  #bind() {
    this.#rail.addEventListener('pointerdown', e => this.#pointerDown(e));
    this.#rail.addEventListener('pointermove', e => this.#pointerMove(e));
    this.#rail.addEventListener('pointerup', e => this.#pointerEnd(e));
    this.#rail.addEventListener('pointercancel', e => this.#pointerEnd(e));
    this.#rail.addEventListener('contextmenu', e => e.preventDefault());
  }

  #pointerDown(event) {
    const button = event.target.closest('.thumb-modifier, .thumb-toggle, .thumb-tuplet');
    if (!button || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault();
    event.stopPropagation();

    const modifier = button.dataset.modifier || null;
    const toggle = button.dataset.toggle || null;
    const tuplet = button.classList.contains('thumb-tuplet');
    if (!modifier && !toggle && !tuplet) return;

    const rect = this.#rail.getBoundingClientRect();
    const currentTuplet = this.#state.tuplet || 3;
    this.#activePointers.set(event.pointerId, {
      button, modifier, toggle, tuplet,
      startX:event.clientX, startY:event.clientY, startTop:rect.top,
      dragging:false, tupletCandidate:currentTuplet
    });

    if (modifier) {
      button.classList.add('active');
      button.setAttribute('aria-pressed','true');
      this.#state[modifier] = true;
      this.#emit();
    }

    if (tuplet) this.#showTupletChoices(button, currentTuplet);
    try { button.setPointerCapture(event.pointerId); } catch {}
  }

  #pointerMove(event) {
    const active = this.#activePointers.get(event.pointerId);
    if (!active) return;
    event.preventDefault(); event.stopPropagation();
    const dx=event.clientX-active.startX, dy=event.clientY-active.startY;

    // Pystysuunta on aina peukalopalkin siirto, myös tupletinapista.
    if (!active.dragging && this.#dragPointerId===null && Math.abs(dy)>=DRAG_THRESHOLD && Math.abs(dy)>Math.abs(dx)) {
      active.dragging=true;
      this.#dragPointerId=event.pointerId;
      this.#rail.classList.add('is-dragging');
      if (active.tuplet) this.#hideTupletChoices();
    }

    if (active.dragging && this.#dragPointerId===event.pointerId) {
      const {minTop,maxTop}=this.#bounds();
      const top=clamp(active.startTop+dy,minTop,maxTop);
      this.#rail.style.top=`${top}px`;
      this.#ratio=maxTop>minTop?(top-minTop)/(maxTop-minTop):0;
      return;
    }

    if (active.tuplet && Math.abs(dx) >= TUPLET_HORIZONTAL_THRESHOLD) {
      active.tupletCandidate = this.#tupletCandidateAt(event.clientX, event.clientY);
      this.#syncTupletChoiceHighlight(active.tupletCandidate);
    }
  }

  #pointerEnd(event) {
    const active=this.#activePointers.get(event.pointerId);
    if (!active) return;
    event.preventDefault(); event.stopPropagation();
    this.#activePointers.delete(event.pointerId);
    try { if(active.button.hasPointerCapture(event.pointerId)) active.button.releasePointerCapture(event.pointerId); } catch {}

    if (active.modifier) {
      const stillHeld=[...this.#activePointers.values()].some(item=>item.modifier===active.modifier);
      if(!stillHeld){
        active.button.classList.remove('active'); active.button.setAttribute('aria-pressed','false');
        this.#state[active.modifier]=false; this.#emit();
      }
    }

    if (active.toggle && !active.dragging && event.type!=='pointercancel') {
      this.setToggle(active.toggle, !this.#state[active.toggle]);
    }

    if (active.tuplet) {
      const candidate = active.tupletCandidate || this.#state.tuplet || 3;
      this.#hideTupletChoices();
      if (!active.dragging && event.type!=='pointercancel') this.#onTupletRequest?.(candidate);
    }

    if(this.#dragPointerId===event.pointerId){
      this.#dragPointerId=null; this.#rail.classList.remove('is-dragging'); this.#savePosition();
    }
  }

  #showTupletChoices(button, currentSize) {
    if (!this.#quintupletButton || !this.#sextupletButton) return;
    const top = button.offsetTop;
    this.#quintupletButton.style.top = `${top}px`;
    this.#sextupletButton.style.top = `${top}px`;
    this.#quintupletButton.classList.add('visible');
    this.#sextupletButton.classList.add('visible');
    this.#syncTupletChoiceHighlight(currentSize);
  }

  #hideTupletChoices() {
    for (const button of [this.#quintupletButton, this.#sextupletButton]) {
      if (!button) continue;
      button.classList.remove('visible','active');
      button.setAttribute('aria-pressed','false');
    }
  }

  #syncTupletChoiceHighlight(size) {
    if (this.#quintupletButton) {
      const active = Number(size) === 5;
      this.#quintupletButton.classList.toggle('active', active);
      this.#quintupletButton.setAttribute('aria-pressed', String(active));
    }
    if (this.#sextupletButton) {
      const active = Number(size) === 6;
      this.#sextupletButton.classList.toggle('active', active);
      this.#sextupletButton.setAttribute('aria-pressed', String(active));
    }
  }

  #tupletCandidateAt(clientX, clientY) {
    const hit = button => {
      if (!button) return false;
      const r=button.getBoundingClientRect();
      return clientX>=r.left && clientX<=r.right && clientY>=r.top && clientY<=r.bottom;
    };
    if (hit(this.#sextupletButton)) return 6;
    if (hit(this.#quintupletButton)) return 5;
    return this.#state.tuplet || 3;
  }

  #bounds(){
    const rect=this.#boundsElement.getBoundingClientRect();
    const minTop=rect.top+EDGE_GAP;
    const maxTop=Math.max(minTop,rect.bottom-this.#rail.offsetHeight-EDGE_GAP);
    return {minTop,maxTop};
  }
  #positionFromRatio(){
    const {minTop,maxTop}=this.#bounds();
    this.#rail.style.top=`${minTop+(maxTop-minTop)*clamp(this.#ratio,0,1)}px`;
  }
  #restorePosition(){ try{const saved=Number.parseFloat(localStorage.getItem(POSITION_KEY));if(Number.isFinite(saved))this.#ratio=clamp(saved,0,1)}catch{} }
  #savePosition(){ try{localStorage.setItem(POSITION_KEY,this.#ratio.toFixed(4))}catch{} }
  #emit(){ this.#onChange?.(this.state); }
}
