(() => {
'use strict';

// Lentokonepelin alkuperäinen äänen analyysiydin irrotettuna app.js:stä.
// Laskentalogiikka ja vakioarvot on säilytetty alkuperäisinä.
const HARMONICS=8;
const HS_MIN_F0=80;
const HS_MAX_F0=2200;
const HS_MAX_HARMONIC_HZ=8000;
const HS_MAX_HARMONICS=8;
const HS_PEAK_GATE_DB=-56;
const HS_CONCENTRATION_MIN_HZ=80;
const HS_CONCENTRATION_MAX_HZ=8000;
const HS_CONCENTRATION_HALF_WIDTH_CENTS=28;

let yinDiffBuffer=null,yinCmndBuffer=null;

function clamp(x,min,max){return Math.max(min,Math.min(max,x))}
function median(a){
  if(!a.length)return 0;
  const b=[...a].sort((x,y)=>x-y),m=b.length>>1;
  return b.length%2?b[m]:(b[m-1]+b[m])/2;
}
function centsDiff(a,b){return 1200*Math.log2(a/b)}
function rmsDb(buf){
  let s=0;
  for(let i=0;i<buf.length;i++){const v=buf[i];s+=v*v}
  const rms=Math.sqrt(s/buf.length)||1e-12;
  return {rms,db:20*Math.log10(rms)};
}
function yin(buf,sr){
  const n=Math.min(buf.length,4096),minF=75,maxF=1300;
  const minTau=Math.max(2,Math.floor(sr/maxF));
  const maxTau=Math.min(Math.floor(sr/minF),Math.floor(n/2));
  const needed=maxTau+1;
  if(!yinDiffBuffer||yinDiffBuffer.length<needed){
    yinDiffBuffer=new Float32Array(needed);
    yinCmndBuffer=new Float32Array(needed);
  }
  const d=yinDiffBuffer,cmnd=yinCmndBuffer;
  for(let tau=1;tau<=maxTau;tau++){
    let sum=0;
    for(let i=0;i<n-tau;i++){const x=buf[i]-buf[i+tau];sum+=x*x}
    d[tau]=sum;
  }
  cmnd[0]=1;
  let run=0;
  for(let tau=1;tau<=maxTau;tau++){
    run+=d[tau];
    cmnd[tau]=d[tau]*tau/(run||1);
  }
  let tau=-1;
  for(let t=minTau;t<=maxTau;t++){
    if(cmnd[t]<0.13){while(t+1<=maxTau&&cmnd[t+1]<cmnd[t])t++;tau=t;break}
  }
  if(tau<0)return null;
  const x0=Math.max(minTau,tau-1),x2=Math.min(maxTau,tau+1);
  const s0=cmnd[x0],s1=cmnd[tau],s2=cmnd[x2],den=2*s1-s2-s0;
  const better=den?tau+(s2-s0)/(2*den):tau;
  const f=sr/better;
  return (f>=minF&&f<=maxF)?f:null;
}
function harmonicVector(f0,sampleRate,freqData){
  if(!f0)return null;
  const ny=sampleRate/2;
  const binHz=ny/freqData.length;
  const amps=[];
  for(let h=1;h<=HARMONICS;h++){
    const target=f0*h;
    if(target>=ny){amps.push(0);continue}
    const idx=Math.round(target/binHz);
    const radius=Math.max(1,Math.round(12/binHz));
    let best=-Infinity;
    for(let j=Math.max(1,idx-radius);j<=Math.min(freqData.length-1,idx+radius);j++){
      if(freqData[j]>best)best=freqData[j];
    }
    amps.push(Math.pow(10,best/20));
  }
  const vals=amps.slice(1,8);
  const total=vals.reduce((s,x)=>s+x,0);
  if(total<=0)return null;
  return vals.map(x=>x/total);
}
function harmonicH1H8(f0,sampleRate,freqData){
  if(!f0)return null;
  const ny=sampleRate/2;
  const binHz=ny/freqData.length;
  const amps=[];
  for(let h=1;h<=HARMONICS;h++){
    const target=f0*h;
    if(target>=ny){amps.push(0);continue}
    const idx=Math.round(target/binHz);
    const radius=Math.max(1,Math.round(12/binHz));
    let best=-Infinity;
    for(let j=Math.max(1,idx-radius);j<=Math.min(freqData.length-1,idx+radius);j++){
      if(freqData[j]>best)best=freqData[j];
    }
    amps.push(Math.pow(10,best/20));
  }
  const total=amps.reduce((sum,x)=>sum+x,0);
  if(total<=0)return null;
  return amps.map(x=>x/total);
}
function h2h8FromH1H8(fp8){
  if(!fp8||fp8.length<8)return null;
  const vals=fp8.slice(1,8).map(v=>Math.max(0,Number(v)||0));
  const total=vals.reduce((sum,v)=>sum+v,0);
  return total>0?vals.map(v=>v/total):null;
}
function averageFingerprint(fps,length){
  if(!fps.length)return null;
  const out=Array(length).fill(0);
  for(const fp of fps)for(let i=0;i<length;i++)out[i]+=Number(fp[i])||0;
  for(let i=0;i<length;i++)out[i]/=fps.length;
  const total=out.reduce((sum,v)=>sum+v,0)||1;
  return out.map(v=>v/total);
}
function puhFingerprintSimilarity(a,b){
  if(!a||!b||a.length!==8||b.length!==8)return 0;
  let sum=0;
  for(let i=0;i<8;i++){
    const da=20*Math.log10((a[i]||0)+1e-5);
    const db=20*Math.log10((b[i]||0)+1e-5);
    const d=(da-db)/18;
    sum+=d*d;
  }
  return clamp(100*Math.exp(-.78*Math.sqrt(sum/8)),0,100);
}
function aggregateTrainingReference(samples){
  if(!samples.length)return null;
  const f0=median(samples.map(sample=>sample.f0).filter(Number.isFinite));
  const fp8=averageFingerprint(samples.map(sample=>sample.fp8).filter(Boolean),8);
  const fingerprint=h2h8FromH1H8(fp8);
  return f0&&fingerprint?{f0,fingerprint}:null;
}
function fpDistance(a,b){
  let s=0;
  for(let i=0;i<a.length;i++){
    const da=20*Math.log10(a[i]+1e-5),db=20*Math.log10(b[i]+1e-5),d=(da-db)/16;
    s+=d*d;
  }
  return Math.sqrt(s/a.length);
}
function similarity(take,ref){
  const cents=Math.abs(centsDiff(take.f0,ref.f0));
  const pitchPenalty=Math.min(3,cents/110);
  const spectralPenalty=fpDistance(take.fp,ref.fingerprint);
  const combined=Math.sqrt(0.42*pitchPenalty*pitchPenalty+0.58*spectralPenalty*spectralPenalty);
  return Math.max(0,Math.min(100,100*Math.exp(-0.82*combined)));
}
function midiFromFrequency(freq){return Math.round(69+12*Math.log2(freq/440))}
function harmonicSpectrumFromData(sampleRate,freqData){
  if(!freqData||!sampleRate)return null;
  const mags=new Float64Array(freqData.length);
  let maxMag=1e-18;
  for(let k=0;k<freqData.length;k++){
    const db=Number.isFinite(freqData[k])?freqData[k]:-120;
    const mag=Math.pow(10,db/20);
    mags[k]=mag;
    if(mag>maxMag)maxMag=mag;
  }
  return {mags,binHz:(sampleRate/2)/freqData.length,maxMag};
}
function hsRefinePeak(mags,k,binHz){
  if(k<=0||k>=mags.length-1)return {hz:k*binHz};
  const y1=Math.log(Math.max(mags[k-1],1e-18));
  const y2=Math.log(Math.max(mags[k],1e-18));
  const y3=Math.log(Math.max(mags[k+1],1e-18));
  const denom=y1-2*y2+y3;
  let delta=0;
  if(Math.abs(denom)>1e-12){
    delta=.5*(y1-y3)/denom;
    delta=clamp(delta,-.5,.5);
  }
  return {hz:(k+delta)*binHz};
}
function hsCollectPeaks(spectrum){
  const mags=spectrum.mags;
  const minBin=Math.max(2,Math.floor(80/spectrum.binHz));
  const maxBin=Math.min(mags.length-3,Math.ceil(HS_MAX_HARMONIC_HZ/spectrum.binHz));
  const out=[];
  for(let k=minBin;k<=maxBin;k++){
    const m=mags[k];
    if(!(m>mags[k-1]&&m>=mags[k+1]))continue;
    const relDb=20*Math.log10(Math.max(m/spectrum.maxMag,1e-12));
    if(relDb<HS_PEAK_GATE_DB)continue;
    const refined=hsRefinePeak(mags,k,spectrum.binHz);
    out.push({hz:refined.hz,mag:m,relDb});
  }
  return out.sort((a,b)=>b.mag-a.mag).slice(0,100);
}
function hsBuildSubharmonicCandidates(peaks){
  const raw=[];
  for(const p of peaks){
    for(let h=1;h<=HS_MAX_HARMONICS;h++){
      const f0=p.hz/h;
      if(f0>=HS_MIN_F0&&f0<=HS_MAX_F0)raw.push({hz:f0,vote:p.mag/Math.pow(h,.72)});
    }
  }
  raw.sort((a,b)=>a.hz-b.hz);
  const merged=[];
  for(const c of raw){
    const prev=merged[merged.length-1];
    if(prev){
      const cents=Math.abs(1200*Math.log2(c.hz/prev.hz));
      if(cents<22){
        const total=prev.weight+c.vote;
        prev.hz=(prev.hz*prev.weight+c.hz*c.vote)/total;
        prev.weight=total;
        continue;
      }
    }
    merged.push({hz:c.hz,weight:c.vote});
  }
  return merged;
}
function hsFindPeakNear(spectrum,targetHz,centsTolerance){
  const ratio=Math.pow(2,centsTolerance/1200);
  const loHz=targetHz/ratio,hiHz=targetHz*ratio;
  const lo=Math.max(2,Math.floor(loHz/spectrum.binHz));
  const hi=Math.min(spectrum.mags.length-3,Math.ceil(hiHz/spectrum.binHz));
  let bestK=-1,bestMag=0;
  for(let k=lo;k<=hi;k++){
    if(spectrum.mags[k]>bestMag&&spectrum.mags[k]>=spectrum.mags[k-1]&&spectrum.mags[k]>=spectrum.mags[k+1]){
      bestMag=spectrum.mags[k];bestK=k;
    }
  }
  if(bestK<0)return null;
  const refined=hsRefinePeak(spectrum.mags,bestK,spectrum.binHz);
  return {hz:refined.hz,mag:bestMag,cents:1200*Math.log2(refined.hz/targetHz)};
}
function hsEvaluateCandidate(f0,spectrum){
  let score=0,possible=0,matches=0,refineNum=0,refineDen=0;
  for(let h=1;h<=HS_MAX_HARMONICS;h++){
    const target=f0*h;
    if(target>HS_MAX_HARMONIC_HZ)break;
    const w=1/Math.pow(h,.78);
    possible+=w;
    const peak=hsFindPeakNear(spectrum,target,32);
    if(!peak)continue;
    const relDb=20*Math.log10(Math.max(peak.mag/spectrum.maxMag,1e-12));
    if(relDb<HS_PEAK_GATE_DB)continue;
    const closeness=Math.max(0,1-Math.abs(peak.cents)/32);
    const amp=Math.sqrt(peak.mag/spectrum.maxMag);
    score+=w*amp*(.55+.45*closeness);
    matches++;
    refineNum+=(peak.hz/h)*peak.mag*w;
    refineDen+=peak.mag*w;
  }
  const refinedHz=refineDen>0?refineNum/refineDen:f0;
  const rawSupport=possible>0?score/possible:0;
  const matchFactor=Math.min(1,matches/5);
  const support=clamp(rawSupport*(.65+.35*matchFactor),0,1);
  return {hz:refinedHz,score:support,support,matches};
}
function hsChooseBestCandidate(candidates,spectrum){
  let best=null;
  for(const c of candidates){
    const e=hsEvaluateCandidate(c.hz,spectrum);
    if(!best||e.score>best.score)best=e;
  }
  if(!best||best.matches<2||best.support<.10)return null;
  return best;
}
function harmonicConcentration(spectrum,f0){
  if(!spectrum||!Number.isFinite(f0)||f0<=0)return 0;
  const mags=spectrum.mags,binHz=spectrum.binHz;
  const loBin=Math.max(1,Math.floor(HS_CONCENTRATION_MIN_HZ/binHz));
  const hiBin=Math.min(mags.length-1,Math.floor(HS_CONCENTRATION_MAX_HZ/binHz));
  const mask=new Uint8Array(mags.length);
  const ratio=Math.pow(2,HS_CONCENTRATION_HALF_WIDTH_CENTS/1200);
  const maxHarmonic=Math.floor(HS_CONCENTRATION_MAX_HZ/f0);
  for(let h=1;h<=maxHarmonic;h++){
    const center=f0*h;
    let lowHz=center/ratio,highHz=center*ratio;
    const minHalfWidthHz=1.5*binHz;
    lowHz=Math.min(lowHz,center-minHalfWidthHz);
    highHz=Math.max(highHz,center+minHalfWidthHz);
    const a=Math.max(loBin,Math.floor(lowHz/binHz));
    const b=Math.min(hiBin,Math.ceil(highHz/binHz));
    for(let k=a;k<=b;k++)mask[k]=1;
  }
  let harmonicPower=0,totalPower=0;
  for(let k=loBin;k<=hiBin;k++){
    const p=mags[k]*mags[k];
    totalPower+=p;
    if(mask[k])harmonicPower+=p;
  }
  return totalPower>0?clamp(harmonicPower/totalPower,0,1):0;
}
function analyzeHarmonicControl(sampleRate,freqData){
  const spectrum=harmonicSpectrumFromData(sampleRate,freqData);
  if(!spectrum)return null;
  const peaks=hsCollectPeaks(spectrum);
  if(peaks.length<2)return null;
  const candidates=hsBuildSubharmonicCandidates(peaks);
  const best=hsChooseBestCandidate(candidates,spectrum);
  if(!best||!Number.isFinite(best.hz))return null;
  return {
    hz:best.hz,
    midi:midiFromFrequency(best.hz),
    support:best.support,
    matches:best.matches,
    concentration:harmonicConcentration(spectrum,best.hz)
  };
}
function isAcceptedOpenHeadjoint(analysis,trainedControlRef){
  if(!analysis||!trainedControlRef)return false;
  const targetMidi=midiFromFrequency(trainedControlRef.f0);
  return analysis.midi===targetMidi-1||analysis.midi===targetMidi||analysis.midi===targetMidi+1;
}

window.PlaneEngine=Object.freeze({
  rmsDb,
  yin,
  harmonicVector,
  harmonicH1H8,
  h2h8FromH1H8,
  averageFingerprint,
  puhFingerprintSimilarity,
  aggregateTrainingReference,
  fpDistance,
  similarity,
  midiFromFrequency,
  analyzeHarmonicControl,
  isAcceptedOpenHeadjoint
});
})();
