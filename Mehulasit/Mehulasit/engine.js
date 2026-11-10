/* Mehulasit YIN diagnostics 1.2. No DOM, microphone or game dependencies.
 * Baseline: original Mehulasit 1.4.3, CMND < .13, median 6, original targets.
 * Experiment: separate CMND threshold + periodicity-based rate estimate.
 * Periodicity is a signal measure, not an objective grade for flute timbre.
 */
(function (root) {
  'use strict';
  const TARGETS = Object.freeze({G:390.9783096102657,A:435.9136184358308,H:493.27278117625264,C:521.7425815931465,D:590.9565023710167});
  const DEFAULTS = Object.freeze({threshold:.35,tolerance:55,history:6,slowQuality:.996,fullQuality:.9995,minSpeed:.15,gateDb:-70});
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  function median(xs){if(!xs.length)return 0;const a=[...xs].sort((a,b)=>a-b),m=a.length>>1;return a.length%2?a[m]:(a[m-1]+a[m])/2;}
  function dbRms(buf){let e=0;for(const x of buf)e+=x*x;return 20*Math.log10(Math.sqrt(e/buf.length)||1e-12);}
  function nearest(hz,tolerance=55){if(!Number.isFinite(hz)||hz<=0)return null;let best=null;for(const [key,target] of Object.entries(TARGETS)){const cents=1200*Math.log2(hz/target);if(!best||Math.abs(cents)<Math.abs(best.cents))best={key,target,cents};}return {...best,inRange:Math.abs(best.cents)<=tolerance};}
  function rateFor(quality,settings){const lower=settings.slowQuality;const full=Math.max(lower+.0001,settings.fullQuality);return clamp(settings.minSpeed+(1-settings.minSpeed)*(quality-lower)/(full-lower),settings.minSpeed,1);}
  class YinAnalysis {
    constructor(){this.diff=new Float32Array(0);this.cmnd=new Float32Array(0);}
    measure(buf,sampleRate){
      const n=Math.min(buf.length,4096),minF=75,maxF=1300;
      const minTau=Math.max(2,Math.floor(sampleRate/maxF));
      const maxTau=Math.min(Math.floor(sampleRate/minF),Math.floor(n/2));
      if(this.diff.length<maxTau+1){this.diff=new Float32Array(maxTau+1);this.cmnd=new Float32Array(maxTau+1);}
      const d=this.diff,c=this.cmnd;
      // Deliberately identical accumulation/order/window to the original YIN.
      for(let tau=1;tau<=maxTau;tau++){let sum=0;for(let i=0;i<n-tau;i++){const x=buf[i]-buf[i+tau];sum+=x*x;}d[tau]=sum;}
      c[0]=1;let run=0;
      for(let tau=1;tau<=maxTau;tau++){run+=d[tau];c[tau]=d[tau]*tau/(run||1);}
      this.sampleRate=sampleRate;this.minTau=minTau;this.maxTau=maxTau;this.n=n;
      let best=minTau;for(let t=minTau;t<=maxTau;t++)if(c[t]<c[best])best=t;
      this.bestQuality=clamp(1-c[best],0,1);
      // With no signal, zero difference is not evidence of periodicity.
      this.hasEnergy=dbRms(buf)>-120;
      return this;
    }
    pick(threshold,refineValley=false){
      if(!this.hasEnergy)return null;
      const c=this.cmnd,min=this.minTau,max=this.maxTau;
      let tau=-1;
      for(let t=min;t<=max;t++){if(c[t]<threshold){while(t+1<=max&&c[t+1]<c[t])t++;tau=t;break;}}
      if(tau<0)return null;
      // Trial only: noisy valleys can contain early local minima. Find the
      // deepest point in this small neighborhood before interpolating.
      // No target-note attraction and no octave substitution are applied.
      if(refineValley){
        const lo=Math.max(min,Math.floor(tau*.94)),hi=Math.min(max,Math.ceil(tau*1.08));
        for(let t=lo;t<=hi;t++)if(c[t]<c[tau])tau=t;
      }
      const x0=Math.max(min,tau-1),x2=Math.min(max,tau+1),s0=c[x0],s1=c[tau],s2=c[x2],den=2*s1-s2-s0;
      const better=den?tau+(s2-s0)/(2*den):tau,hz=this.sampleRate/better;
      return hz>=75&&hz<=1300?{hz,quality:clamp(1-s1,0,1),cmnd:s1,lag:better}:null;
    }
  }
  class Tracker {
    constructor(){this.history=[];}
    reset(){this.history=[];}
    evaluate(candidate,loud,settings,isBaseline){
      if(!loud){this.reset();return {accepted:false,reason:'quiet',speed:0,note:null,hz:null,rawHz:null,quality:null,cents:null};}
      // Original game keeps pitch history during an audible YIN rejection.
      if(!candidate)return {accepted:false,reason:'aperiodic',speed:0,note:null,hz:null,rawHz:null,quality:null,cents:null};
      this.history.push(candidate.hz);if(this.history.length>settings.history)this.history.shift();
      const hz=median(this.history),note=nearest(hz,settings.tolerance),accepted=Boolean(note?.inRange);
      return {accepted,reason:accepted?'accepted':'pitch',speed:accepted?(isBaseline?1:rateFor(candidate.quality,settings)):0,note:note?.key||null,hz,rawHz:candidate.hz,quality:candidate.quality,cmnd:candidate.cmnd,cents:note?.cents??null};
    }
  }
  class BenchEngine {
    constructor(settings={}){this.analysis=new YinAnalysis();this.baseline=new Tracker();this.trial=new Tracker();this.settings={...DEFAULTS};this.configure(settings);}
    configure(settings={}){
      const s={...this.settings,...settings};
      for(const key of Object.keys(DEFAULTS))if(!Number.isFinite(s[key]))throw new TypeError('Virheellinen asetus: '+key);
      s.threshold=clamp(s.threshold,.13,.45);s.tolerance=clamp(s.tolerance,10,55);s.history=Math.round(clamp(s.history,1,10));s.slowQuality=clamp(s.slowQuality,.5,.9998);s.fullQuality=clamp(s.fullQuality,s.slowQuality+.0001,.9999);s.minSpeed=clamp(s.minSpeed,.05,.5);s.gateDb=clamp(s.gateDb,-90,-10);
      this.settings=s;this.reset();return {...s};
    }
    reset(){this.baseline.reset();this.trial.reset();}
    process(buffer,sampleRate){
      if(!(sampleRate>=8000)||buffer.length<1024)throw new RangeError('Tarvitaan vähintään 1024 näytettä ja kelvollinen näytetaajuus.');
      const db=dbRms(buffer),loud=db>this.settings.gateDb;
      let strict=null,relaxed=null,bestQuality=null;
      if(loud){this.analysis.measure(buffer,sampleRate);strict=this.analysis.pick(.13);relaxed=this.analysis.pick(this.settings.threshold,true);bestQuality=this.analysis.bestQuality;}
      const baseSettings={...DEFAULTS,gateDb:this.settings.gateDb};
      return {db,loud,gateDb:this.settings.gateDb,bestQuality,
        original:this.baseline.evaluate(strict,loud,baseSettings,true),
        experiment:this.trial.evaluate(relaxed,loud,this.settings,false)};
    }
  }
  function syntheticBuffer({sampleRate=48000,length=8192,hz=TARGETS.A,cents=0,noise=0,levelDb=-24,offset=0,seed=19,kind='tone'}={}){
    const a=new Float32Array(length),f=hz*Math.pow(2,cents/1200),amplitude=Math.pow(10,levelDb/20);
    let state=(seed+offset)>>>0;
    for(let i=0;i<length;i++){
      state=(Math.imul(1664525,state)+1013904223)>>>0;const white=(state/4294967296*2-1)*Math.sqrt(3);
      const p=2*Math.PI*f*(i+offset)/sampleRate;
      // Normalized harmonic tone and noise; level remains independent of ratio.
      const tone=(Math.sin(p)+.3*Math.sin(2*p)+.12*Math.sin(3*p))/Math.sqrt((1+.09+.0144)/2);
      a[i]=kind==='silence'?0:kind==='noise'?amplitude*white:amplitude*(tone+noise*white)/Math.sqrt(1+noise*noise);
    }
    return a;
  }
  const api={TARGETS,DEFAULTS,median,dbRms,nearest,rateFor,YinAnalysis,BenchEngine,syntheticBuffer};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.MehulasitEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
