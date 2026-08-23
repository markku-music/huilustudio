const POSITION_KEY = 'pikakirjoitin2.thumbRailY';
const DRAG_THRESHOLD = 14;
const EDGE_GAP = 8;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export class ThumbRail {
  #rail;
  #boundsElement;
  #onChange;
  #activePointers = new Map();
  #dragPointerId = null;
  #state = { dot: false, rest: false, tie: false };
  #ratio = 0.52;

  constructor({ rail, boundsElement, onChange }) {
    this.#rail = rail;
    this.#boundsElement = boundsElement;
    this.#onChange = onChange;
    this.#restorePosition();
    this.#bind();
    requestAnimationFrame(() => this.#positionFromRatio());
    window.addEventListener('resize', () => this.#positionFromRatio());
  }

  get state() { return { ...this.#state }; }

  setToggle(name, value) {
    if (!(name in this.#state)) return;
    this.#state[name] = Boolean(value);
    const button = this.#rail.querySelector(`[data-toggle="${name}"]`);
    if (button) {
      button.classList.toggle('active', this.#state[name]);
      button.setAttribute('aria-pressed', String(this.#state[name]));
    }
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
    const button = event.target.closest('.thumb-modifier, .thumb-toggle');
    if (!button || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault();
    event.stopPropagation();
    const modifier = button.dataset.modifier || null;
    const toggle = button.dataset.toggle || null;
    if (!modifier && !toggle) return;
    const rect = this.#rail.getBoundingClientRect();
    this.#activePointers.set(event.pointerId, {
      button, modifier, toggle, startX:event.clientX, startY:event.clientY, startTop:rect.top, dragging:false
    });
    if (modifier) {
      button.classList.add('active');
      button.setAttribute('aria-pressed','true');
      this.#state[modifier] = true;
      this.#emit();
    }
    try { button.setPointerCapture(event.pointerId); } catch {}
  }

  #pointerMove(event) {
    const active = this.#activePointers.get(event.pointerId);
    if (!active) return;
    event.preventDefault(); event.stopPropagation();
    const dx=event.clientX-active.startX, dy=event.clientY-active.startY;
    if (!active.dragging && this.#dragPointerId===null && Math.abs(dy)>=DRAG_THRESHOLD && Math.abs(dy)>Math.abs(dx)) {
      active.dragging=true; this.#dragPointerId=event.pointerId; this.#rail.classList.add('is-dragging');
    }
    if (!active.dragging || this.#dragPointerId!==event.pointerId) return;
    const {minTop,maxTop}=this.#bounds();
    const top=clamp(active.startTop+dy,minTop,maxTop);
    this.#rail.style.top=`${top}px`;
    this.#ratio=maxTop>minTop?(top-minTop)/(maxTop-minTop):0;
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
    // Sidekaaren kaltainen kertakäyttöinen toggle vaihtuu vain napautuksesta.
    // Pystyveto siirtää palkkia eikä muuta togglen tilaa.
    if (active.toggle && !active.dragging && event.type!=='pointercancel') {
      this.setToggle(active.toggle, !this.#state[active.toggle]);
    }
    if(this.#dragPointerId===event.pointerId){
      this.#dragPointerId=null; this.#rail.classList.remove('is-dragging'); this.#savePosition();
    }
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
