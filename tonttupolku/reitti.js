'use strict';
const viewport=document.querySelector('#viewport'),cabin=document.querySelector('#cabin'),play=document.querySelector('#play');
const panorama=document.querySelector('#panorama');
let panoramaCamera=null;
const startButton=document.querySelector('#start'),audioButton=document.querySelector('#sound');
const sounds=new PeliAanet();
const stops=Array.from(document.querySelectorAll('nav button'));
const keys=Array.from(document.querySelectorAll('[data-key]'));
const setup=document.querySelector('#setup');
const ui={status:document.querySelector('#status'),pad:document.querySelector('#pad')};
const micStatus=document.querySelector('#mic-status');
const resonator=new ResonatorSession();
resonator.mountDeveloperSettings(document.querySelector('#resonator-dev'));
const instrumentRow=document.querySelector('#instrument-row');
const standardTargets=resonator.engine.nominalTargets;
function targetsFrom(lowestMidi){
  const targets={...standardTargets};
  for(let midi=lowestMidi;midi<59;midi++)targets[midi]=440*2**((midi-69)/12);
  return targets;
}
const upperNotes={67:'G',69:'A',71:'H',72:'C',74:'D'};
const cToGNotes={60:'C',62:'D',64:'E',65:'F',67:'G'};
const cToGGames={3:['C','D','E'],4:['C','D','E','F'],5:['C','D','E','F','G']};
const tromboneNotes={46:'B',48:'c',50:'d',51:'es',53:'f',55:'g'};
const tromboneGames={3:['B','c','d'],4:['B','c','d','es'],5:['B','c','d','f','g']};
const targetsFromBFlat=targetsFrom(58);
const instruments={
  '0':{offset:0,notes:upperNotes,games:SAVELPELIT,targets:standardTargets},
  '-2':{offset:-2,notes:cToGNotes,games:cToGGames,targets:targetsFromBFlat},
  '-9':{offset:-9,notes:upperNotes,games:SAVELPELIT,targets:targetsFromBFlat},
  '-7':{offset:-7,notes:cToGNotes,games:cToGGames,targets:targetsFrom(53)},
  '12':{offset:12,notes:upperNotes,games:SAVELPELIT,targets:standardTargets},
  trombone:{offset:0,notes:tromboneNotes,games:tromboneGames,targets:targetsFrom(46)}
};
const calibrationNotes={
  '0':[69,'a¹'], '-2':[58,'c¹'], '-9':[58,'g¹'], '-7':[53,'c¹'],
  '12':[81,'a¹'], trombone:[46,'suuri B']
};
const tuningRow=document.querySelector('#tuning-row'),retune=document.querySelector('#retune');
const retuneRow=document.querySelector('#retune-row'),tuningProgress=document.querySelector('#tuning-progress');
const resetA=document.querySelector('#reset-a'),referenceA=document.querySelector('#reference-a');
const tuner=document.querySelector('#tuner'),needle=document.querySelector('#tuner-needle');
const referenceKey='tonttupolku.a-reference.v1';
let hasReference=false,micGeneration=0,releasePrompt=false,lastCents=null;
try{
  const saved=Number(sessionStorage.getItem(referenceKey));
  if(saved>=400&&saved<=480){resonator.setTuningReference(saved);hasReference=true}
}catch{ /* Keep the reference in memory when tab storage is unavailable. */ }
function rememberReference(){
  hasReference=true;retune.checked=false;
  try{sessionStorage.setItem(referenceKey,String(resonator.engine.referenceA))}catch{}
}
function hzText(){
  return resonator.engine.referenceA.toLocaleString('fi-FI',{maximumFractionDigits:1})+' Hz';
}
function drawTuner(now){
  const value=resonator.getNeedleCents(now);
  const cents=value===null?null:Math.max(-50,Math.min(50,Math.round(value)));
  if(cents===lastCents)return;
  lastCents=cents;needle.hidden=cents===null;
  if(cents===null){
    tuner.removeAttribute('aria-valuenow');tuner.setAttribute('aria-valuetext','Ei ääntä');return;
  }
  needle.style.left=(50+cents)+'%';tuner.setAttribute('aria-valuenow',String(cents));
  tuner.setAttribute('aria-valuetext',cents+' senttiä');
}
let activeInstrument=instruments['0'];
function configureInstrument(){
  const next=instruments[setup.elements.instrument.value];
  if(next.targets!==activeInstrument.targets)resonator.engine.setTargets(next.targets);
  activeInstrument=next;
}
function noteForInstrument(midi){
  return activeInstrument.notes[Number(midi)-activeInstrument.offset];
}
let micMode='off',micError='',lastFluteId=null,watchdog=0,track=null;
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),game=new Retki();
let inCabin=true,started=false,resumeAt=1;
let scene=null,drag=null,source=null,heldKey=null,heldPointer=null,lastTime=0,lastUI='',lastPaint='',failed=false;
let touchCandidate=null,touchTimer=null,assistHold=null;
// Snow has its own transparent layer between the panorama and the game pieces.
function luoLumisade(canvas){
  const g=canvas.getContext('2d'),width=canvas.width,height=canvas.height;
  const flakes=Array.from({length:42},()=>{
    const depth=Math.random();
    return {x:Math.random()*width,y:Math.random()*height,depth,
      phase:Math.random()*2*Math.PI,radius:.65+depth*.95};
  });
  let elapsed=0,lastFrame=-1,lastCamera=null;
  const wrap=(v,span)=>((v%span)+span)%span;
  return function draw(dt,camera){
    elapsed+=dt;
    const frame=Math.floor(elapsed*30/1000);
    if(frame===lastFrame&&camera===lastCamera)return;
    lastFrame=frame;lastCamera=camera;
    const t=frame/30;
    g.clearRect(0,0,width,height);
    g.fillStyle='#f7fbff';
    for(const f of flakes){
      const drift=t*(2+4*f.depth)+Math.sin(t*.55+f.phase)*(2+3*f.depth);
      const x=wrap(f.x+drift-camera*(.56+.36*f.depth),width+8)-4;
      const y=wrap(f.y+t*(13+18*f.depth),height+8)-4;
      g.globalAlpha=.38+.38*f.depth;
      g.beginPath();g.arc(x,y,f.radius,0,Math.PI*2);g.fill();
    }
  };
}
const drawSnow=luoLumisade(document.querySelector('#lumisade'));
function scale(){return (viewport.scrollWidth-viewport.clientWidth)/CAMERA_MAX}
function scrollPosition(){return scale()>0?viewport.scrollLeft/scale():0}
function showCamera(){viewport.scrollLeft=game.camera*scale()}
function cameraTo(x){game.follow=false;game.camera=Math.max(0,Math.min(CAMERA_MAX,x));showCamera()}
function cancelControl(){
  clearTouchCandidate();
  if(source)game.site?.release();source=null;heldKey=null;heldPointer=null;assistHold=null;
}
function visit(n,instant=reduced.matches){
  if(!scene||inCabin)return;
  cancelControl();
  if(n===0){
    const previous=game.trip?.station??game.station;
    if(previous>0&&previous<4&&!game.sites[previous-1].complete)resumeAt=previous;
    else resumeAt=game.nextStation();
  }
  game.visit(n,instant);
  if(n===0&&!game.trip)enterCabin();
  showCamera();refresh();
}
function enterCabin(){
  inCabin=true;stopListening();
  if(game.total===game.goal){started=false;resumeAt=1}
  cabin.hidden=false;play.hidden=true;
  startButton.focus({preventScroll:true});refresh();
}
function selectedPitches(){
  const games=setup.elements.controller.value==='manual'?SAVELPELIT:instruments[setup.elements.instrument.value].games;
  return games[setup.elements.pitches.value];
}
function refresh(){
  const s=game.site,trip=game.trip;
  const state=[inCabin,started,game.station,game.total,s?.text,s?.phase,s?.choice,s?.pickupNote,
    trip?.station,!!scene,failed,setup.elements.instrument.value,setup.elements.pitches.value,game.pitches.length,setup.elements.controller.value,micMode,resonator.engine.running,micError,hasReference,retune.checked,releasePrompt,resonator.engine.referenceA].join('|');
  if(state===lastUI)return;lastUI=state;
  startButton.disabled=!scene;
  startButton.textContent=started?(selectedPitches()===game.pitches?'Jatka korjaamista':'Aloita uusi peli'):'Korjaa tonttupolku';
  const flute=setup.elements.controller.value==='flute';
  instrumentRow.hidden=tuningRow.hidden=!flute;
  tuner.hidden=!flute||inCabin;
  referenceA.textContent='A = '+hzText();
  const listening=inCabin&&micMode!=='off';
  setup.classList.toggle('listening',listening);
  retuneRow.hidden=!hasReference;
  resetA.hidden=listening||!hasReference||Math.abs(resonator.engine.referenceA-440)<.001;
  tuningProgress.hidden=micMode!=='tuning';
  micStatus.hidden=!flute;
  micStatus.textContent=micError||(micMode==='request'?'Salli mikrofonin käyttö selaimessa.':
    micMode==='calibration'?'Ole hetki hiljaa. Mitataan huoneen pohjakohinaa.':
    micMode==='tuning'?(releasePrompt?'Lopeta ääni. Peli alkaa, kun ääni päättyy.':tuningInstruction()):
    resonator.engine.running?(hasReference&&!retune.checked?'Mikrofoni on päällä. A = '+hzText()+'.':'Mikrofoni on päällä. Peli pyytää kalibrointisävelen.'):
    hasReference&&!retune.checked?'Peli käyttää viritystasoa A = '+hzText()+'.':
    'Aluksi mitataan pohjakohina. Sen jälkeen peli pyytää kalibrointisävelen.');
  if(listening)startButton.textContent='Peruuta';
  document.querySelector('#load-error').hidden=!failed;
  ui.status.textContent=inCabin?'Joulupukin tupa':game.finished?'Kaikki laatat paikallaan. Reitti lelupajalle on valmis.':
    s?(s.text||(s.complete?'Työmaa valmis.':'Työmaa '+game.station+'. Nostosävel '+s.pickupNote+'.')):trip?'Matkalla.':'Lelupaja';
  stops.forEach((b,i)=>{
    if((trip?.station??game.station)===i)b.setAttribute('aria-current','location');else b.removeAttribute('aria-current');
    b.classList.toggle('complete',i>0&&i<4&&game.sites[i-1].complete);
  });
  ui.pad.hidden=flute||inCabin||!s||s.complete;
  if(ui.pad.hidden)return;
  const worldX=WORKS[game.index],bubble=puhekuplanPaikka();
  for(const btn of keys){
    const note=btn.dataset.key,pickup=note===s.pickupNote,slot=s.notes.indexOf(note);
    btn.hidden=!pickup&&(slot<0||s.slots[note]);
    if(btn.hidden)continue;
    const x=pickup?bubble.x:-91+178*(slot+.5)/s.capacity;
    const y=pickup?bubble.y:324;
    btn.style.left=(worldX+x)/3376*100+'%';btn.style.top=y/390*100+'%';
    btn.style.width=(pickup?52:178/s.capacity)/3376*100+'%';
    btn.style.height=(pickup?48:57)/390*100+'%';
    btn.style.zIndex=pickup?'1':'0';
    btn.setAttribute('aria-label',note+(pickup?', nosta laatta puhekuplasta':', vapaa kolo'));
  }
}
setup.addEventListener('input',e=>{
  if(e.target.name==='controller'||e.target.name==='instrument'){stopListening();micError=''}
  refresh();
});
audioButton.addEventListener('click',()=>{sounds.toggle();audioButton.setAttribute('aria-pressed',String(sounds.enabled))});
setup.addEventListener('submit',e=>{
  e.preventDefault();if(!scene||!inCabin)return;
  if(setup.elements.controller.value==='manual'){startJourney();return}
  if(micMode!=='off'){stopListening();refresh();return}
  openMicrophone();
});
function tuningInstruction(){
  const [,name]=calibrationNotes[setup.elements.instrument.value];
  return 'Soita '+name+' tasaisesti ja odota lopetusmerkkiä.';
}
resetA.addEventListener('click',()=>{
  if(micMode!=='off')return;
  resonator.resetTuning();micError='';refresh();
});
resonator.engine.addEventListener('tuningchange',()=>{
  if(inCabin&&micMode==='off'){rememberReference();refresh()}
});
resonator.engine.addEventListener('tuningprogress',e=>{
  if(micMode!=='tuning')return;
  tuningProgress.value=e.detail.progress;
  const release=e.detail.status==='release';
  if(release!==releasePrompt){releasePrompt=release;refresh()}
});
async function measureReference(){
  const generation=micGeneration;
  const [concertMidi]=calibrationNotes[setup.elements.instrument.value];
  micMode='tuning';tuningProgress.value=0;refresh();
  await resonator.calibrateA({concertMidi,stableMs:420,timeoutMs:30000,finishOnRelease:true});
  if(generation!==micGeneration)return;
  if(resonator.tuningStatus.code!=='completed'){
    micError=resonator.tuningStatus.message||'Mittaus keskeytyi. Aloita uudelleen.';
    stopListening();refresh();return;
  }
  rememberReference();beginPlaying();
}
function beginPlaying(){
  micMode='playing';sounds.calibrating=false;sounds.mix();startJourney();
}
function microphoneReady(){
  clearTimeout(watchdog);
  if(!hasReference||retune.checked)measureReference();else beginPlaying();
}
function awaitNoiseCalibration(){
  micMode='calibration';
  clearTimeout(watchdog);
  watchdog=setTimeout(()=>micFailure('Pohjakohinan mittaus keskeytyi. Tarkista mikrofoni.'),8000);
  refresh();
}
async function openMicrophone(){
  const engine=resonator.engine;
  if(engine.running&&(track?.readyState==='ended'||engine.context?.state==='closed'))stopListening(true);
  configureInstrument();releasePrompt=false;
  micMode='request';micError='';sounds.calibrating=true;sounds.activate();sounds.mix();refresh();
  if(!engine.running){resonator.start();return}
  const generation=micGeneration;
  try{
    if(engine.context.state!=='running')await engine.context.resume();
  }catch{
    if(generation===micGeneration)micFailure('Mikrofoni ei jatkanut kuuntelua. Aloita peli uudelleen.');
    return;
  }
  if(generation!==micGeneration)return;
  if(track?.muted){microphoneMuted();return}
  resonator.setInputPaused(false);
  if(resonator.ready)microphoneReady();else awaitNoiseCalibration();
}
function startJourney(){
  const pitches=selectedPitches(),hard=setup.elements.difficulty.value==='hard';
  sounds.activate();
  if(!started||pitches!==game.pitches){game.reset(pitches,hard);scene.tonde.reset();resumeAt=1}
  game.requireSustain=hard;for(const site of game.sites)site.requireSustain=hard;
  started=true;inCabin=false;cabin.hidden=true;play.hidden=false;lastPaint='';scene.resize();
  visit(resumeAt);viewport.focus({preventScroll:true});
}
function stopListening(closeCapture=false){
  ++micGeneration;releasePrompt=false;
  const pending=micMode==='request'&&!resonator.engine.running;
  micMode='off';lastFluteId=null;clearTimeout(watchdog);
  if(closeCapture||pending){
    if(track){track.onended=track.onmute=track.onunmute=null;track=null}
    resonator.stop();
  }else resonator.setInputPaused(true);
  sounds.calibrating=false;sounds.mix();
}
function micFailure(message){
  const wasPlaying=micMode==='playing';
  micError=message;stopListening(true);
  if(wasPlaying&&!inCabin)visit(0,true);
  refresh();
}
function microphoneMuted(){
  const wasPlaying=micMode==='playing';
  micError='Mikrofoni on tilapäisesti mykistetty.';
  if(wasPlaying&&!inCabin)visit(0,true);else stopListening();
  refresh();
}
resonator.engine.addEventListener('silence',()=>{lastFluteId=null});
resonator.addEventListener('change',()=>{
  if(micMode==='off')return;
  const s=resonator.getState();
  if(s.status.error){
    if(micMode==='request'&&s.status.code==='error')return; // start() supplies the permission error name.
    const messages={NotAllowedError:'Salli mikrofonin käyttö tai valitse näppäimet ja kosketus.',
      NotFoundError:'Mikrofonia ei löytynyt. Tarkista liitäntä.'};
    micFailure(messages[s.status.name]||s.status.message||'Mikrofoni ei vastannut. Yritä uudelleen.');return;
  }
  if(micMode==='request'&&s.phase==='calibrating'){
    track=resonator.engine.stream?.getAudioTracks()[0];
    if(track){
      track.onended=()=>micFailure('Mikrofoniyhteys päättyi. Avaa mikrofoni aloittamalla peli.');
      track.onmute=microphoneMuted;
      track.onunmute=()=>{micError='';refresh()};
    }
    awaitNoiseCalibration();
    if(track?.muted)microphoneMuted();
  }
  if(micMode==='calibration'&&s.ready){microphoneReady();return}
  if(micMode!=='playing'||inCabin||document.hidden)return;
  // The session owns note stability and the release grace period. A confirmed
  // silence starts a new phrase even if the displayed note is still visible.
  if(!s.note){lastFluteId=null;release('flute');return}
  if(s.accepted?.id!==s.note.id||s.note.id===lastFluteId)return;
  const attack=lastFluteId===null;lastFluteId=s.note.id;
  const site=game.site,note=noteForInstrument(s.note.id);
  if(!site)return;
  if(source==='flute'&&attack)release('flute');
  if(!source){if(attack&&note===site.pickupNote)take('flute',note);return}
  if(source!=='flute')return;
  if(!site.choice&&site.slots[note]===false){
    choose(note);
    if(!site.requireSustain)release('flute');
  }else release('flute');
});
stops.forEach((b,i)=>b.addEventListener('click',()=>visit(i)));
function take(method,note){
  if(source||!scene||!game.site?.take(note))return false;
  heldKey=note;source=method;
  if(method==='keys'||method==='flute'){game.follow=true;game.camera=STOPS[game.station]-422;showCamera()}
  refresh();return true;
}
function release(method){
  if(source!==method)return;cancelControl();refresh();
}
function choose(k){
  if(game.site?.select(k)&&game.requireSustain)heldKey=k;
  refresh();
}
function clearTouchCandidate(){
  clearTimeout(touchTimer);touchCandidate=null;touchTimer=null;
}
function noteAt(e){
  const b=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-key]');
  return b&&ui.pad.contains(b)?b.dataset.key:null;
}
ui.pad.addEventListener('pointermove',e=>{
  if(e.pointerId!==heldPointer||!game.requireSustain)return;
  const k=noteAt(e),site=game.site;
  if(!site?.held)return;
  if(site.choice){if(k!==site.choice)release('pointer');return}
  if(k===touchCandidate)return;
  clearTouchCandidate();
  if(site.slots[k]!==false||k===site.pickupNote)return;
  // Sliding past an intermediate key should not pick that slot.
  touchCandidate=k;
  touchTimer=setTimeout(()=>{clearTouchCandidate();choose(k)},160);
});
for(const b of keys){
  const note=b.dataset.key;
  b.addEventListener('pointerdown',e=>{
    if(!e.isPrimary||e.button!==0||note!==game.site?.pickupNote)return;
    document.body.dataset.mode='pointer';
    if(!take('pointer',note))return;
    e.preventDefault();heldPointer=e.pointerId;b.setPointerCapture(e.pointerId);
  });
  b.addEventListener('click',e=>{
    if(e.detail!==0)return;
    if(source==='assist'){
      if(game.requireSustain){if(note===heldKey)release('assist');return}
      if(note!==heldKey)choose(note);
      if(note===heldKey||game.site?.choice)release('assist');
    }else take('assist',note);
  });
  // A keyboard-operated pad can select the pickup, then hold Space/Enter on a destination.
  b.addEventListener('keydown',e=>{
    if(!game.requireSustain||source!=='assist'||(e.key!==' '&&e.key!=='Enter')||note===game.site?.pickupNote)return;
    e.preventDefault();
    if(!e.repeat){choose(note);if(game.site?.choice===note)assistHold=note}
  });
  b.addEventListener('keyup',e=>{
    if(source!=='assist'||note!==assistHold||(e.key!==' '&&e.key!=='Enter'))return;
    e.preventDefault();release('assist');
  });
  b.addEventListener('blur',()=>{if(source==='assist'&&assistHold===note)release('assist')});
}
ui.pad.addEventListener('pointerup',e=>{
  if(e.pointerId!==heldPointer)return;
  if(!game.requireSustain){const k=noteAt(e);if(k&&k!==heldKey)choose(k)}
  release('pointer');
});
for(const name of ['pointercancel','lostpointercapture'])ui.pad.addEventListener(name,e=>{
  if(e.pointerId===heldPointer){heldPointer=null;release('pointer')}
});
document.addEventListener('keydown',e=>{
  if(inCabin||setup.contains(e.target)||e.ctrlKey||e.metaKey||e.altKey)return;
  const k=e.key.toUpperCase();
  if(setup.elements.controller.value==='manual'&&game.pitches.includes(k)){
    if(!game.site||game.site.complete)return;
    e.preventDefault();if(e.repeat)return;document.body.dataset.mode='keys';
    if(source==='keys'){
      if(k!==heldKey){
        if(game.requireSustain&&game.site.choice)release('keys');
        else choose(k);
      }
    }else take('keys',k);
    return;
  }
  let target=game.trip?.station??game.station;
  if(e.key==='ArrowRight')target=Math.min(4,target+1);else if(e.key==='ArrowLeft')target=Math.max(0,target-1);
  else if(e.key==='Home')target=0;else if(e.key==='End')target=4;else return;
  e.preventDefault();if(!e.repeat)visit(target);
});
document.addEventListener('keyup',e=>{if(e.key.toUpperCase()===heldKey)release('keys')});
viewport.addEventListener('pointerdown',e=>{
  if(!e.isPrimary||e.button!==0||e.target.closest('[data-key]'))return;
  if(game.follow)showCamera();
  game.follow=false;if(e.pointerType==='touch')return;
  drag={id:e.pointerId,x:e.clientX,start:scrollPosition()};
  viewport.setPointerCapture(e.pointerId);viewport.classList.add('dragging');
});
viewport.addEventListener('pointermove',e=>{
  if(drag?.id===e.pointerId&&scale()>0)cameraTo(drag.start+(drag.x-e.clientX)/scale());
});
for(const name of ['pointerup','pointercancel','lostpointercapture'])viewport.addEventListener(name,e=>{
  if(drag?.id===e.pointerId){drag=null;viewport.classList.remove('dragging')}
});
viewport.addEventListener('scroll',()=>{if(!game.follow)game.camera=scrollPosition()},{passive:true});
viewport.addEventListener('wheel',e=>{
  if(e.ctrlKey||e.metaKey||!scale())return;
  const delta=(Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY)*(e.deltaMode===1?16:e.deltaMode===2?viewport.clientWidth:1);
  if(!delta||(game.camera<=0&&delta<0)||(game.camera>=CAMERA_MAX&&delta>0))return;
  e.preventDefault();cameraTo(scrollPosition()+delta/scale());
},{passive:false});
new ResizeObserver(showCamera).observe(viewport);
window.addEventListener('blur',cancelControl);
function suspendInput(){
  cancelControl();
  if(micMode!=='off'){
    if(!inCabin)visit(0,true);
    else {stopListening();refresh()}
  }
}
document.addEventListener('visibilitychange',()=>{lastTime=0;if(document.hidden)suspendInput();sounds.mix()});
window.addEventListener('pagehide',()=>{suspendInput();stopListening(true);sounds.close();refresh()});
function tick(now){
  if(inCabin){lastTime=0;sounds.update('cabin');requestAnimationFrame(tick);return}
  if(micMode==='playing')drawTuner(now);
  const dt=lastTime?Math.min(250,now-lastTime):0;lastTime=now;
  const travelling=!!game.trip,wasSite=game.index,site=game.site,oldCount=site?.count,oldCargo=site?.cargo;
  game.advance(dt);
  if(game.index!==wasSite)cancelControl();
  if(!game.trip&&game.station===0){enterCabin();requestAnimationFrame(tick);return}
  sounds.update(game.trip?'travel':game.station===4?'workshop':'work',site,oldCount,oldCargo);
  refresh();
  const p=game.cranePose,camera=game.follow?game.camera:scrollPosition();
  if(camera!==panoramaCamera){
    panorama.style.transform=`translate3d(${-100*camera/3376}%,0,0)`;
    panoramaCamera=camera;
  }
  // The moving scene uses fractional world coordinates. Sync the native
  // hit targets once the journey ends, or when the player takes over.
  if(game.follow&&travelling&&!game.trip)showCamera();
  drawSnow(reduced.matches||game.trip?.paused?0:dt,camera);
  // The rig's gaze and hands keep easing briefly after the crane stops.
  const key=[camera,game.actor,game.index,game.total,p.phase,p.x,p.y,p.grip,p.roadWeight,p.choice,p.pickupNote,scene.canvas.width,scene.canvas.height].join('|');
  if(key!==lastPaint||now<scene.settleUntil){
    if(key!==lastPaint)scene.settleUntil=now+750;
    scene.paint(camera,game.actor,game.sites,game.index,p,dt);
    lastPaint=key;
  }
  requestAnimationFrame(tick);
}
refresh();
Promise.all(['tonde','tonde-ajo','lava','kivi'].map(name=>new Promise((done,fail)=>{
  const img=new Image();img.onload=async()=>{
    if(name==='tonde-ajo'&&img.decode){try{await img.decode()}catch{ /* onload already succeeded */ }}
    done([name,img]);
  };img.onerror=fail;img.src='kuvat/'+name+'.webp';
}))).then(entries=>{
  const images=Object.fromEntries(entries);
  scene=new Maisema(document.querySelector('#scene'),images);
  refresh();requestAnimationFrame(tick);
}).catch(()=>{failed=true;refresh()});
