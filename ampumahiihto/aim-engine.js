/* Target-relative tuning and one-release/one-shot state, independent of the UI. */
(function(global){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function finePitch(engine,hz){
  const ring=engine._ring, size=engine._ringSize,sr=engine.sampleRate;
  if(!ring||!Number.isFinite(hz)||hz<=0)return null;
  // Port of the scale game's ResonatorEngine 1.0.11 continuous meter:
  // 16 ms period window, +/-140 cents, fractional-lag interpolation.
  // The anchor stays on the selected target for this breath.
  const searchCents=140,ratio=2**(searchCents/1200);
  const lo=Math.max(2,Math.floor(sr/(hz*ratio))),hi=Math.ceil(sr/(hz/ratio));
  const maxLag=Math.ceil(sr/Math.min(...Object.values(engine.targets))*ratio)+2;
  const n=Math.min(Math.round(sr*.016),Math.max(128,size-maxLag-4));
  if(n+hi+2>size||engine._samplesSeen<n+hi+2)return null;
  const periodMatch=lag=>{
    let error=0,energy=0,current=engine._writePos-1;
    if(current<0)current+=size;
    let delayed=current-lag;while(delayed<0)delayed+=size;
    for(let i=0;i<n;i++){
      const a=ring[current],b=ring[delayed];error+=(a-b)**2;energy+=a*a+b*b;
      if(--current<0)current=size-1;if(--delayed<0)delayed=size-1;
    }
    return 1-error/Math.max(1e-12,energy);
  };
  let best=lo,bestMatch=-Infinity;
  for(let lag=lo;lag<=hi;lag++){
    const match=periodMatch(lag);
    if(match>bestMatch){bestMatch=match;best=lag;}
  }
  if(!Number.isFinite(bestMatch)||bestMatch<.55)return null;
  const left=periodMatch(best-1),right=periodMatch(best+1);
  const denominator=left-2*bestMatch+right;
  const shift=Math.abs(denominator)>1e-12?clamp(.5*(left-right)/denominator,-1,1):0;
  const frequency=sr/(best+shift),cents=1200*Math.log2(frequency/hz);
  if(!Number.isFinite(cents)||Math.abs(cents)>searchCents+12)return null;
  return {frequency,cents,quality:bestMatch};
}
class AimRound{
  constructor({onAim=()=>{},onShot=()=>{},settings=()=>({goalMs:1333,centsLimit:25,durationTolerance:.25})}={}){
    this.onAim=onAim;this.onShot=onShot;this.settings=settings;this.reset();
  }
  reset(){this.phase='idle';this.aim=null;this.cooldownUntil=0;this.quietSince=null;}
  cancel(){this.reset();this.onAim(null);}
  begin(i,time,mode='mic',locked=false){if(this.phase!=='idle')return;this.phase='aiming';this.aim={i,mode,locked,start:time,end:time,cents:0,validAt:-Infinity,hasPitch:false,lastPitchTime:time,peakRms:0,settings:{...this.settings()}};this.quietSince=null;}
  position(time){const a=this.aim;if(!a)return null;const duration=Math.max(0,time-a.start);const {goalMs,centsLimit,durationTolerance}=a.settings;return {i:a.i,duration,cents:a.cents,valid:a.hasPitch&&time-a.validAt<=140,dx:43*a.cents/centsLimit,dy:43*(1-duration/goalMs)/durationTolerance};}
  updatePitch(cents,time){const a=this.aim;if(!a||!Number.isFinite(cents))return;const alpha=a.hasPitch?1-Math.exp(-Math.max(0,time-a.lastPitchTime)/35):1;a.cents+=alpha*(cents-a.cents);a.lastPitchTime=time;a.validAt=time;a.hasPitch=true;}
  finish(end,time=end){const a=this.aim;if(!a)return;const pos=this.position(end);this.aim=null;this.phase='cooldown';this.cooldownUntil=time+1000;this.quietSince=null;this.onAim(null);
    if(pos.duration<60)return; // Ignore very short transient clicks.
    this.onShot({...pos,valid:pos.valid&&a.locked,mode:a.mode});
  }
  frame(frame,{fallback,matchIndex,tuning,noteForTarget}){
    const time=frame.timeMs,voiced=frame.voiced;
    if(this.phase==='cooldown'){
      if(voiced)this.quietSince=null;else if(this.quietSince===null)this.quietSince=time;
      if(time>=this.cooldownUntil&&this.quietSince!==null&&time-this.quietSince>=160)this.phase='idle';
      return;
    }
    if(this.phase==='idle'){
      if(!voiced||fallback<0)return;
      this.begin(fallback,frame.onsetMs??time);
    }
    const a=this.aim;if(!a||a.mode!=='mic')return;
    if(voiced){
      this.quietSince=null;a.end=time;a.peakRms=Math.max(a.peakRms,frame.rms);
      // Once acquired, keep this target for the entire breath.
      if(!a.locked&&matchIndex>=0){a.i=matchIndex;a.locked=true;}
      const octaveSafe=frame.halfEnergies?.[noteForTarget(a.i)]>=.32;
      if(a.locked&&octaveSafe&&frame.rms>=a.peakRms*.22){const p=tuning(a.i);if(p)this.updatePitch(p.cents,time);}
      this.onAim(this.position(time));
    }else{
      if(this.quietSince===null)this.quietSince=time;
      // Hold the last voiced position; do not include release debounce in duration.
      this.onAim(this.position(a.end));
      if(time-this.quietSince>=90)this.finish(a.end,time);
    }
  }
}
global.SavelAim={AimRound,finePitch,clamp};
})(typeof window!=='undefined'?window:globalThis);
