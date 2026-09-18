/*
 * Display-only protection against short/decaying changes at a note's end.
 * The original ResonatorEngine is not modified. Durations use audio blocks,
 * so UI scheduling or the display refresh rate cannot lengthen the evidence.
 */
(() => {
  'use strict';

  class ResonatorNoteStability {
    constructor({targets, stableMs=120, changeMs=48, octaveMs=90, quietChangeMs=160}={}) {
      this.targets=targets||{};
      this.stableMs=stableMs;
      this.changeMs=changeMs;
      this.octaveMs=octaveMs;
      this.quietChangeMs=quietChangeMs;
      this.reset();
    }

    reset() {
      this.current='';
      this.sameMs=0;
      this.locked=false;
      this.referenceRms=0;
      this.pending=null;
    }

    silence() { this.reset(); }

    reject() {
      // An unrecognized interval is not a fresh sound onset. Keep the anchor,
      // but require a new, continuous run of evidence for another pitch.
      this.pending=null;
      if(!this.locked)this.sameMs=0;
    }

    _commit(id, ms, rms) {
      this.current=id;
      this.sameMs=ms;
      this.locked=ms>=this.stableMs;
      this.referenceRms=rms;
      this.pending=null;
    }

    _envelope(pending) {
      // Compare equal halves of the recent evidence, with audio-time weights.
      const half=pending.windowMs/2;
      let at=0,early=0,late=0;
      for(const frame of pending.frames) {
        const first=Math.max(0,Math.min(frame.ms,half-at));
        early+=frame.rms*first;
        late+=frame.rms*(frame.ms-first);
        at+=frame.ms;
      }
      return {early:early/half,late:late/half};
    }

    accept(detail) {
      const id=detail.action;
      if(detail.accepted!==true || !(id in this.targets))return null;
      const ms=Number.isFinite(detail.blockMs)&&detail.blockMs>0?detail.blockMs:0;
      const rms=Number.isFinite(detail.rms)?Math.max(0,detail.rms):0;

      if(!this.current) {
        this._commit(id,ms,rms);
        return detail; // No added delay at a new sound's onset.
      }
      if(id===this.current) {
        this.sameMs+=ms;
        this.locked=this.locked||this.sameMs>=this.stableMs;
        // A slowly decaying reference remembers the body of a held note.
        this.referenceRms=Math.max(rms,this.referenceRms*Math.exp(-ms/1600));
        this.pending=null;
        return detail;
      }
      if(!this.locked) {
        this._commit(id,ms,rms);
        return detail;
      }
      if(ms<=0)return null;

      if(this.pending?.id!==id)this.pending={id,ms:0,windowMs:0,frames:[]};
      const pending=this.pending;
      pending.ms+=ms;
      pending.windowMs+=ms;
      pending.frames.push({ms,rms});
      // Keep a rolling window so a genuinely quieter legato note can settle.
      while(pending.frames.length>1 && pending.windowMs-pending.frames[0].ms>=this.quietChangeMs) {
        pending.windowMs-=pending.frames.shift().ms;
      }
      const cents=Math.abs(1200*Math.log2(this.targets[id]/this.targets[this.current]));
      const octave=Math.abs(cents-1200)<40;
      const quiet=rms<this.referenceRms*0.65;
      const required=quiet?this.quietChangeMs:octave?this.octaveMs:this.changeMs;
      if(pending.ms<required)return null;

      const envelope=this._envelope(pending);
      // A continuing decay is weak evidence for a deliberate new pitch.
      // A sustained or rising new note is allowed, including a soft legato.
      if(envelope.late<envelope.early*0.92)return null;
      this._commit(id,pending.ms,rms);
      this.locked=true; // A confirmed legato change remains protected too.
      return detail;
    }
  }

  window.ResonatorNoteStability=ResonatorNoteStability;
})();
