'use strict';
const $=id=>document.getElementById(id), SCALES=window.ASTEIKKO_SCALES;
let scaleId='F',activeScale=SCALES[scaleId],names=activeScale.names,midi=activeScale.midi;
const targetsFor=scale=>Object.fromEntries(scale.midi.map((n,i)=>[String(i),440*2**((n-69)/12)]));
let targets=targetsFor(activeScale);
const offsets=[0,1,2,3,4,5,6,7];
const x=i=>170+offsets[i]*120, fmt=ms=>(ms/1000).toFixed(2).replace('.',',')+' s';
let engine=null,ready=false,opening=false,phase='idle',index=-1,start=0,times=[],best=null,raceGhost=null,pending='',evidence=0,mode='mic',px=170,gx=170,lastFrame=0;
let direction='up';
// Always open upwards. JSON can explicitly select another direction.
// index counts accepted notes; microphone actions and test keys stay pitches.
const stepCount=()=>direction==='both'?15:8;
const lastStep=()=>stepCount()-1;
const noteAt=step=>direction==='down'?7-step:direction==='both'&&step>7?14-step:step;
const raceX=step=>x(noteAt(step));
// An unfolded path lets a fast sequence catch up through the turning point,
// instead of cutting straight back before the runner has reached high F.
const pathX=step=>direction==='both'&&step>7?2*x(7)-raceX(step):raceX(step);
const trackX=position=>direction==='both'&&position>x(7)?2*x(7)-position:position;
const facingAt=position=>direction==='down'||(direction==='both'&&position>=x(7))?-1:1;
function syncDirection(){
 $('direction').value=direction;
 const endpoints=direction==='both'?names[0]+'–'+names[7]+'–'+names[0]+' ↔':direction==='down'?names[7]+'–'+names[0]+' ←':names[0]+'–'+names[7]+' →';
 $('scaleLabel').textContent=activeScale.label.toUpperCase()+' · '+endpoints;
 const route=Array.from({length:stepCount()},(_,i)=>names[noteAt(i)]).join('–');
 $('instructions').textContent='Soita '+route+'. Ensimmäinen '+names[noteAt(0)]+' käynnistää kellon.';

}
function syncFinish(){
 $('finishLine').setAttribute('transform',`translate(${raceX(lastStep())} 0)`);
 $('finishLine').style.display=direction==='both'&&index<7?'none':'';
}
let uncertainSoundMs=0;
const SOUND_TRANSITION_GRACE_MS=60;
let motionMode='carry',stopMs=180,gates=[],bestGates=[],ghostGates=[],voiced=false,saveThisRun=false,testHeld=null;
const RUNNER_FRAMES=[[47, 25, 340, 396], [507, 29, 260, 392], [904, 25, 256, 396], [40, 432, 371, 388], [460, 435, 348, 402], [930, 430, 258, 406], [91, 847, 261, 388], [456, 847, 372, 374], [978, 847, 154, 389]];
let animationSpeed=1;
try{const v=Number(localStorage.getItem('asteikkospurtti-animation-speed'));if(Number.isFinite(v)&&v>=.25&&v<=3)animationSpeed=v;}catch{}
const runnerSteps={player:0,ghost:0};
function animateRunner(id,distance,moving){
  if(moving)runnerSteps[id]=(runnerSteps[id]+Math.abs(distance)*animationSpeed/7)%8;
  else runnerSteps[id]=0;
  const frame=moving?Math.floor(runnerSteps[id]):8;
  $(id+'Sprite').setAttribute('viewBox',RUNNER_FRAMES[frame].join(' '));
}
const ns='http://www.w3.org/2000/svg';function svg(tag,attrs,parent,text){let e=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);if(text)e.textContent=text;parent.append(e);return e;}
for(let i=0;i<8;i++){svg('text',{x:x(i),y:137,'text-anchor':'middle','font-size':16,fill:'#466454'},$('noteLabels'),names[i]);for(let lane of [366,494])svg('circle',{cx:x(i),cy:lane,r:5,fill:'#aab9ad'},$('points'));let b=document.createElement('button');b.textContent=names[i];b.title='Näppäin '+(i+1);b.onclick=()=>{if(mode==='test'&&motionMode==='carry')acceptNote(i,performance.now());};b.onpointerdown=e=>{if(mode==='test'&&motionMode==='sound'){e.preventDefault();b.setPointerCapture?.(e.pointerId);testHeld=i;feedTest(i);}};b.onpointerup=b.onpointercancel=()=>{if(mode==='test'&&motionMode==='sound'&&testHeld===i){testHeld=null;setVoice(false,performance.now());}};$('keys').append(b);}
function syncScaleUI(){
 $('scale').value=scaleId;
 $('startScale').textContent=activeScale.label.toUpperCase()+' · '+activeScale.range;
 $('arenaSvg').setAttribute('aria-label','Kaksi juoksijaa pikselipuistossa ja '+activeScale.label+' '+activeScale.range);
 for(let i=0;i<8;i++){
  $('noteLabels').children[i].textContent=names[i];
  $('keys').children[i].textContent=names[i];
 }
}
function selectScale(id){
 if(!Object.prototype.hasOwnProperty.call(SCALES,id))throw Error('Tuntematon asteikko.');
 if(id===scaleId)return;
 const selected=SCALES[id],nextTargets=targetsFor(selected);
 engine?.setTargets(nextTargets);
 scaleId=id;activeScale=selected;names=selected.names;midi=selected.midi;targets=nextTargets;
 syncScaleUI();
 window.raceScore?.setScale(activeScale);
}
syncScaleUI();
$('scale').onchange=()=>{selectScale($('scale').value);load();reset();refreshJson();};
function storageKey(){const key=motionMode==='carry'?'asteikkospurtti-v1-'+mode:'asteikkospurtti-sound-v1-'+mode;return key+(direction==='up'?'':'-'+direction)+(scaleId==='F'?'':'-scale-'+scaleId);}
function load(){best=null;bestGates=[];try{
 const raw=JSON.parse(localStorage.getItem(storageKey()));const a=motionMode==='sound'?raw?.times:raw;
 if(Array.isArray(a)&&a.length===stepCount()&&a[0]===0&&a.every((v,i)=>Number.isFinite(v)&&v>=0&&(!i||v>a[i-1]))){
   if(motionMode==='carry'){best=a;}else if(Array.isArray(raw.gates)&&raw.gates.every((g,i)=>Number.isFinite(g.t)&&g.t>=0&&typeof g.on==='boolean'&&(!i||g.t>=raw.gates[i-1].t))){best=a;bestGates=raw.gates;}
 }
}catch{}$('best').textContent=best?fmt(best[lastStep()]):'–';}
function storeBest(){try{localStorage.setItem(storageKey(),JSON.stringify(motionMode==='sound'?{times:best,gates:bestGates}:best));}catch{}}
function setVoice(on,now){
 if(motionMode!=='sound'||(phase!=='racing'&&phase!=='finished'))return;
 if(voiced===on)return;voiced=on;gates.push({t:Math.max(0,now-start),on});
 if(saveThisRun){bestGates=gates.map(g=>({...g}));storeBest();}
}
function feedTest(i){const now=performance.now();acceptNote(i,now);setVoice(index>=0&&i===noteAt(index),now);}
function status(s){$('status').textContent=s;}
function marks(){syncFinish();window.raceScore?.setProgress(index,direction);for(let i=0;i<8;i++)$('keys').children[i].classList.toggle('next',index<lastStep()&&i===noteAt(index+1));}
function reset(){window.monsterChase?.reset();window.finishBubble?.reset();syncDirection();uncertainSoundMs=0;phase='armed';index=-1;times=[];gates=[];voiced=false;saveThisRun=false;testHeld=null;runnerSteps.player=runnerSteps.ghost=0;ghostGates=bestGates.map(g=>({...g}));raceGhost=best?.slice()||null;pending='';evidence=0;px=gx=raceX(0);$('time').textContent='0,00 s';$('result').textContent='';$('ghost').style.display=raceGhost?'':'none';marks();status(mode==='test'?`Testi valmis · paina ${names[noteAt(0)]} tai näppäintä ${noteAt(0)+1}.`:ready?`Valmis · aloita soittamalla ${names[noteAt(0)]}.`:'Avaa mikrofoni tai valitse hiiritesti.');}
function acceptNote(pitch,now){
 if(phase!=='armed'&&phase!=='racing')return;
 const next=index+1;
 if(next>=stepCount()||pitch!==noteAt(next))return;
 if(index===-1){
  start=now;phase='racing';times=[0];
  if(motionMode==='sound'){voiced=true;gates=[{t:0,on:true}];}
 }else times.push(now-start);
 index=next;marks();
 if(index===lastStep()){
  phase='finished';const total=times[lastStep()],old=best?.[lastStep()];
  $('time').textContent=fmt(total);
  window.finishBubble?.prepare(fmt(total),!best||total<old);
  if(!best||total<old){
   best=times.slice();saveThisRun=true;bestGates=gates.map(g=>({...g}));storeBest();
   $('best').textContent=fmt(total);
   $('result').textContent=old===undefined?'Ensimmäinen haamu on valmis!':'Uusi ennätys! '+fmt(old-total)+' nopeammin.';
  }else $('result').textContent=fmt(total-old)+' haamun perässä.';
  status('Maalissa! Paina Uusi kierros.');
 }else status((direction==='both'&&index>=7?'Takaisin · seuraava sävel: ':'Seuraava sävel: ')+names[noteAt(index+1)]);
}
function input(d){
 if(mode!=='mic'||!ready||document.hidden)return;
 if(!d.accepted){
   pending='';evidence=0;
   // A brief nonperiodic transition is not silence. Keep the current
   // movement gate for at most 60 ms, but never accept a note from it.
   const audible=Number.isFinite(d.rms)&&Number.isFinite(d.gate)&&d.rms>=d.gate;
   uncertainSoundMs+=Number.isFinite(d.blockMs)&&d.blockMs>0?d.blockMs:SOUND_TRANSITION_GRACE_MS;
   if(!audible||uncertainSoundMs>=SOUND_TRANSITION_GRACE_MS)setVoice(false,performance.now());
   return;
 }
 uncertainSoundMs=0;
 if(pending!==d.action){pending=d.action;evidence=0;}
 evidence+=d.blockMs||0;
 if(evidence>=10){
   const now=performance.now();acceptNote(Number(d.action),now);
   setVoice(index>=0&&Number(d.action)===noteAt(index),now);
 }
}
$('again').onclick=reset;
$('direction').onchange=()=>{direction=$('direction').value;load();reset();refreshJson();};
$('clear').onclick=()=>{if(confirm('Nollataanko tämän suunnan ja juoksu- sekä ohjaustavan haamu?')){try{localStorage.removeItem(storageKey());}catch{}best=null;$('best').textContent='–';reset();}};
$('mode').onchange=()=>{engine?.stop();engine=null;opening=ready=false;mode=$('mode').value;$('mic').disabled=false;$('mic').textContent='Avaa mikrofoni';$('mic').hidden=mode==='test';$('keys').hidden=mode!=='test';load();reset();};
$('margin').oninput=()=>{$('db').textContent=$('margin').value+' dB';engine?.setNoiseMarginDb(Number($('margin').value));};
let micTimer;
$('mic').onclick=async()=>{
 clearTimeout(micTimer);
 if(opening||ready){const old=engine;engine=null;old?.stop();ready=opening=false;$('mic').textContent='Avaa mikrofoni';reset();return;}
 const e=new ResonatorStringEngine({targets,blockSize:256,calibrationMs:1500,responseMs:1.8,toleranceCents:40,centerMatch:.955,edgeMatch:.998,minHalfPeriodEnergy:.32,noiseMarginDb:Number($('margin').value),motionMode,stopMs});
 engine=e;opening=true;$('mic').textContent='Peru avaus';status('Salli mikrofonin käyttö selaimen lupapyynnössä…');
 const fail=message=>{
   if(e!==engine)return;
   clearTimeout(micTimer);engine=null;e.stop();opening=ready=false;
   $('mic').textContent='Avaa mikrofoni';status(message);
   if(!$('settingsDialog').open)$('settingsDialog').showModal();
 };
 micTimer=setTimeout(()=>fail('Mikrofonin avaus kesti liian kauan. Tarkista selaimen mikrofonilupa ja paina Avaa mikrofoni uudelleen.'),20000);
 e.addEventListener('input',ev=>{if(e===engine)input(ev.detail);});
 e.addEventListener('silence',()=>{if(e!==engine)return;uncertainSoundMs=0;pending='';evidence=0;setVoice(false,performance.now());});
 e.addEventListener('state',ev=>{
   if(e!==engine)return;
   const state=ev.detail.state;
   if(state==='calibrating')status('Mittaa pohjakohinaa · ole hiljaa hetki…');
   if(state==='running'){clearTimeout(micTimer);ready=true;opening=false;$('mic').textContent='Sulje mikrofoni';reset();}
 });
 try{await e.start();}catch(err){
   const message=err.name==='NotAllowedError'?'Mikrofonilupa puuttuu. Salli mikrofoni selaimen sivustoasetuksista ja yritä uudelleen.':err.name==='NotFoundError'?'Mikrofonia ei löytynyt. Kytke mikrofoni ja yritä uudelleen.':'Mikrofoni ei auennut: '+err.message;
   fail(message);
 }
};
document.addEventListener('keydown',e=>{if(mode!=='test'||e.repeat||e.ctrlKey||e.metaKey||e.altKey||e.target.closest('input,select,textarea'))return;let i=Number(e.key)-1;if(i>=0&&i<8){e.preventDefault();if(motionMode==='sound'){testHeld=i;feedTest(i);}else acceptNote(i,performance.now());}});
document.addEventListener('keyup',e=>{if(mode==='test'&&motionMode==='sound'&&Number(e.key)-1===testHeld){testHeld=null;setVoice(false,performance.now());}});
window.addEventListener('blur',()=>{if(mode==='test')setVoice(false,performance.now());});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&phase==='racing'){phase='paused';status('Kierros keskeytyi välilehden vaihtuessa. Paina Uusi kierros.');}});
// A note launches a decelerating run toward 86% of the next interval.
// Replay is evaluated from event times, independently of animation frame rate.
let easeIn=1,easeOut=1,sprintDuration=440;
try {
  const saved=JSON.parse(localStorage.getItem('asteikkospurtti-easing-json-defaults-v1')||'null');
  if(saved && Number.isFinite(saved.sprintDuration))sprintDuration=Math.max(40,Math.min(1500,saved.sprintDuration));
  if(saved && Number.isFinite(saved.easeIn) && Number.isFinite(saved.easeOut)) {
    easeIn=Math.max(1,Math.min(6,saved.easeIn));
    easeOut=Math.max(1,Math.min(6,saved.easeOut));
  }
}catch{}
function syncEasing(){
  $('sprintDuration').value=String(sprintDuration);
  $('sprintDurationValue').textContent=sprintDuration+' ms';
  $('easeIn').value=String(easeIn);$('easeOut').value=String(easeOut);
  $('easeInValue').textContent=easeIn.toFixed(1).replace('.',',');
  $('easeOutValue').textContent=easeOut.toFixed(1).replace('.',',');
}
for(const id of ['easeIn','easeOut','sprintDuration'])$(id).oninput=()=>{
  easeIn=Number($('easeIn').value);easeOut=Number($('easeOut').value);
  sprintDuration=Number($('sprintDuration').value);
  syncEasing();
  try{localStorage.setItem('asteikkospurtti-easing-json-defaults-v1',JSON.stringify({easeIn,easeOut,sprintDuration}));}catch{}
  reset();
};
syncEasing();
function sprintEase(u,a=easeIn,b=easeOut){
  // Choose the join so both power curves have the same velocity there.
  const join=a/(a+b);
  return u<join?.5*Math.pow(u/join,a):1-.5*Math.pow((1-u)/(1-join),b);
}
function positionAt(events, elapsed, carry, unfolded=false) {
  let origin=pathX(0), note=pathX(0), destination=pathX(0), launch=0, sprintMs=0;
  function sample(t) {
    const age=Math.max(0,t-launch);
    if(sprintMs>0 && age<sprintMs) {
      const u=age/sprintMs;
      const eased=sprintEase(u);
      return origin+(note-origin)*eased;
    }
    const u=Math.max(0,Math.min(1,(age-sprintMs)/carry));
    return note+(destination-note)*(2*u-u*u);
  }
  for(let i=0;i<events.length;i++) {
    if(events[i]>elapsed)break;
    origin=sample(events[i]);
    note=pathX(i);
    destination=i===lastStep()?note:note+(pathX(i+1)-note)*.86;
    launch=events[i];
    sprintMs=i===0?0:sprintDuration;
  }
  const position=sample(elapsed);
  return unfolded?position:trackX(position);
}
let carryMs=5000;
$('carry').oninput=()=>{
  carryMs=Number($('carry').value);
  $('carryValue').textContent=(carryMs/1000).toFixed(1).replace('.',',')+' s';
  reset();
};
function soundPosition(notes,gateEvents,elapsed,unfolded=false){
 if(!notes.length)return raceX(0);
 let at=0,clock=0,rate=0,target=0;
 const mapped=[];
 const events=gateEvents.map(g=>({t:g.t,on:g.on})).concat(notes.map((t,i)=>({t,i}))).sort((a,b)=>a.t-b.t||(('on' in a)?-1:1));
 function advance(t){
   const dt=Math.max(0,t-at),ramp=Math.min(dt,Math.abs(target-rate)*stopMs);
   const next=rate+Math.sign(target-rate)*ramp/stopMs;
   clock+=(rate+next)*ramp/2+target*(dt-ramp);rate=next;at=t;
 }
 for(const e of events){if(e.t>elapsed)break;advance(e.t);if('on' in e)target=e.on?1:0;else mapped.push(clock);}
 advance(elapsed);
 return positionAt(mapped,clock,carryMs,unfolded);
}
$('motionMode').onchange=()=>{motionMode=$('motionMode').value;load();reset();refreshJson();};
$('stopMs').oninput=()=>{stopMs=Number($('stopMs').value);$('stopValue').textContent=stopMs+' ms';reset();refreshJson();};
function frame(now){
  const dt=Math.min(50,now-(lastFrame||now));lastFrame=now;
  const active=phase==='racing'||phase==='finished';
  const elapsed=active?now-start:phase==='paused'?(times.at(-1)||0):0;
  if(phase==='racing')$('time').textContent=fmt(elapsed);
  const playerPath=motionMode==='sound'?soundPosition(times,gates,elapsed,true):positionAt(times,elapsed,carryMs,true);
  const ghostPath=motionMode==='sound'?soundPosition(raceGhost||[],ghostGates,elapsed,true):positionAt(raceGhost||[],elapsed,carryMs,true);
  const nextPx=trackX(playerPath),nextGx=trackX(ghostPath);
  for(const [id,pos,previous,y,path] of [['player',nextPx,px,358,playerPath],['ghost',nextGx,gx,486,ghostPath]]) {
    $(id).setAttribute('transform',`translate(${pos} ${y}) scale(${facingAt(path)} 1)`);
    const moving=active&&dt>0&&Math.abs(pos-previous)>.015;
    animateRunner(id,pos-previous,moving);
  }
  window.monsterChase?.update({now,dt,phase,playerPath,sprinting:index>0&&elapsed-times.at(-1)<sprintDuration,direction,startPath:pathX(0),endPath:pathX(lastStep()),turnPath:x(7),trackX,facingAt});
  px=nextPx;gx=nextGx;
  window.finishBubble?.update(nextPx,358,phase==='finished'&&Math.abs(playerPath-pathX(lastStep()))<1e-7);
  requestAnimationFrame(frame);
}
load();reset();requestAnimationFrame(frame);

function syncAnimationSpeed(){
  $('animationSpeed').value=String(animationSpeed);
  $('animationSpeedValue').textContent=animationSpeed.toFixed(2).replace('.',',')+' ×';
}
function saveAnimationSpeed(){try{localStorage.setItem('asteikkospurtti-animation-speed',String(animationSpeed));}catch{}}
$('animationSpeed').oninput=()=>{
  animationSpeed=Number($('animationSpeed').value);syncAnimationSpeed();saveAnimationSpeed();refreshJson();
};
syncAnimationSpeed();
function currentSettings(){return {schema:'Asteikkospurtti.Settings/1',easeIn,easeOut,sprintDurationMs:sprintDuration,carryMs,noiseMarginDb:Number($('margin').value),motionMode,stopMs,animationSpeed,direction,scaleId};}
function refreshJson(){ $('settingsJson').value=JSON.stringify(currentSettings(),null,2); }
function parseSettings(text){
  const s=JSON.parse(text);
  if(!s||s.schema!=='Asteikkospurtti.Settings/1')throw Error('Tuntematon asetusten schema.');
  const ranges={easeIn:[1,6,.1],easeOut:[1,6,.1],sprintDurationMs:[40,1500,10],carryMs:[400,5000,100],noiseMarginDb:[4,10,1]};
  for(const [key,[min,max,step]] of Object.entries(ranges)){
    const n=s[key];
    if(!Number.isFinite(n)||n<min||n>max||Math.abs((n-min)/step-Math.round((n-min)/step))>1e-7)throw Error(key+': sallittu alue '+min+'–'+max+', askel '+step+'.');
  }
  if(s.motionMode===undefined)s.motionMode='carry';
  if(s.stopMs===undefined)s.stopMs=180;
  if(!['carry','sound'].includes(s.motionMode)||!Number.isFinite(s.stopMs)||s.stopMs<40||s.stopMs>600||s.stopMs%10!==0)throw Error('Tarkista motionMode ja stopMs (40–600 ms, askel 10).');
  if(s.animationSpeed===undefined)s.animationSpeed=1;
  if(!Number.isFinite(s.animationSpeed)||s.animationSpeed<.25||s.animationSpeed>3||Math.abs(s.animationSpeed*20-Math.round(s.animationSpeed*20))>1e-7)throw Error('Animaationopeus: 0,25–3,00, askel 0,05.');
  if(s.direction===undefined)s.direction='up';
  if(!['up','down','both'].includes(s.direction))throw Error('Suunta: up, down tai both.');
  if(s.scaleId===undefined)s.scaleId='F';
  if(typeof s.scaleId!=='string'||!Object.prototype.hasOwnProperty.call(SCALES,s.scaleId))throw Error('Asteikko: F, G, D1, D2, B tai C.');
  return s;
}
$('jsonRefresh').onclick=()=>{refreshJson();$('jsonStatus').textContent='Nykyiset arvot päivitetty.';};
$('jsonCopy').onclick=async()=>{
  refreshJson();
  try{await navigator.clipboard.writeText($('settingsJson').value);$('jsonStatus').textContent='JSON kopioitu.';}
  catch{$('settingsJson').focus();$('settingsJson').select();$('jsonStatus').textContent='Teksti valittu. Kopioi painamalla ⌘C tai Ctrl+C.';}
};
$('jsonDownload').onclick=()=>{
  refreshJson();const url=URL.createObjectURL(new Blob([$('settingsJson').value],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='Asteikkospurtti_asetukset.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
$('jsonApply').onclick=()=>{
  try{
    const s=parseSettings($('settingsJson').value);
    animationSpeed=s.animationSpeed;syncAnimationSpeed();saveAnimationSpeed();
    easeIn=s.easeIn;easeOut=s.easeOut;sprintDuration=s.sprintDurationMs;carryMs=s.carryMs;
    direction=s.direction;selectScale(s.scaleId);
    motionMode=s.motionMode;stopMs=s.stopMs;$('motionMode').value=motionMode;$('stopMs').value=String(stopMs);$('stopValue').textContent=stopMs+' ms';load();
    syncEasing();$('carry').value=String(carryMs);$('carryValue').textContent=(carryMs/1000).toFixed(1).replace('.',',')+' s';
    $('margin').value=String(s.noiseMarginDb);$('margin').oninput();
    try{localStorage.setItem('asteikkospurtti-easing-json-defaults-v1',JSON.stringify({easeIn,easeOut,sprintDuration}));}catch{}
    reset();refreshJson();$('jsonStatus').textContent='Asetukset otettu käyttöön.';
  }catch(e){$('jsonStatus').textContent='JSON ei kelpaa: '+e.message;}
};
for(const id of ['easeIn','easeOut','sprintDuration','carry','margin'])$(id).addEventListener('input',refreshJson);
refreshJson();
