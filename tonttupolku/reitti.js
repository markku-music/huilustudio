'use strict';
const viewport=document.querySelector('#viewport'),cabin=document.querySelector('#cabin'),play=document.querySelector('#play');
const panorama=document.querySelector('#panorama');
let panoramaCamera=null;
const startButton=document.querySelector('#start'),audioButton=document.querySelector('#sound');
const sounds=new PeliAanet();
const stops=Array.from(document.querySelectorAll('nav button'));
const keys=Array.from(document.querySelectorAll('[data-key]'));
const setup=document.querySelector('#setup');
const ui={status:document.querySelector('#status'),pad:document.querySelector('#pad'),mic:document.querySelector('#mic-info')};
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),game=new Retki();
const fluteNotes={67:'G',69:'A',71:'H',72:'C',74:'D'};
const microphone=new Huilumikrofoni(fluteEvent,fluteInterrupted);
let micState='off',micError='';
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
function rememberWorksite(){
  const previous=game.trip?.station??game.station;
  if(previous===0)return;
  resumeAt=previous<4&&!game.sites[previous-1].complete?previous:game.nextStation();
}
function visit(n){
  if(!scene||inCabin)return;
  cancelControl();
  if(n===0)rememberWorksite();
  game.visit(n,reduced.matches);
  if(n===0&&!game.trip)enterCabin();
  showCamera();refresh();
}
function enterCabin(){
  stopFlute();
  inCabin=true;
  if(game.total===game.goal){started=false;resumeAt=1}
  cabin.hidden=false;play.hidden=true;
  startButton.focus({preventScroll:true});refresh();
}
function selectedPitches(){return SAVELPELIT[setup.elements.pitches.value]}
function refresh(){
  const s=game.site,trip=game.trip;
  const state=[inCabin,started,game.station,game.total,s?.text,s?.phase,s?.choice,s?.pickupNote,
    trip?.station,!!scene,failed,setup.elements.pitches.value,game.pitches.length,
    setup.elements.controller.value,micState,micError].join('|');
  if(state===lastUI)return;lastUI=state;
  startButton.disabled=!scene;
  startButton.textContent=started?(selectedPitches()===game.pitches?'Jatka korjaamista':'Aloita uusi peli'):'Korjaa tonttupolku';
  const fluteMode=setup.elements.controller.value==='flute';
  ui.mic.hidden=!fluteMode;
  if(inCabin&&fluteMode){
    const micText=micError||(micState==='permission'?'Odotetaan mikrofonilupaa…':
      micState==='calibrating'?'Kuunnellaan huoneen ääntä. Ole hetki hiljaa…':'Salli mikrofoni ja ole aluksi hiljaa 1,5 sekuntia.');
    if(ui.mic.textContent!==micText)ui.mic.textContent=micText;
    if(micState!=='off')startButton.textContent='Peruuta';
  }
  document.querySelector('#load-error').hidden=!failed;
  ui.status.textContent=inCabin?'Joulupukin tupa':game.finished?'Kaikki laatat paikallaan. Reitti lelupajalle on valmis.':
    s?(s.text||(s.complete?'Työmaa valmis.':'Työmaa '+game.station+'. Nostosävel '+s.pickupNote+'.')):trip?'Matkalla.':'Lelupaja';
  stops.forEach((b,i)=>{
    if((trip?.station??game.station)===i)b.setAttribute('aria-current','location');else b.removeAttribute('aria-current');
    b.classList.toggle('complete',i>0&&i<4&&game.sites[i-1].complete);
  });
  ui.pad.hidden=fluteMode||inCabin||!s||s.complete;
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
  if(e.target.name==='controller'||(e.target.name==='pitches'&&micState!=='off')){stopFlute();micError=''}
  sounds.activate();refresh();
});
audioButton.addEventListener('click',()=>{sounds.toggle();audioButton.setAttribute('aria-pressed',String(sounds.enabled))});
setup.addEventListener('submit',e=>{
  e.preventDefault();if(!scene||!inCabin)return;
  if(setup.elements.controller.value!=='flute'){startJourney();return}
  if(micState!=='off'){stopFlute();refresh();return}
  micError='';micState='permission';
  sounds.calibrating=true;sounds.mix();refresh();
  const pitches=selectedPitches();
  const targets=Object.fromEntries(Object.entries(fluteNotes)
    .filter(([,note])=>pitches.includes(note))
    .map(([midi])=>[midi,440*2**((Number(midi)-69)/12)]));
  try{microphone.start(sounds.context(),targets)}catch(err){fluteInterrupted(err.message)}
});
function startJourney(){
  const pitches=selectedPitches(),hard=setup.elements.difficulty.value==='hard';
  sounds.activate();
  if(!started||pitches!==game.pitches){game.reset(pitches,hard);scene.tonde.reset();resumeAt=1}
  game.requireSustain=hard;for(const site of game.sites)site.requireSustain=hard;
  started=true;inCabin=false;cabin.hidden=true;play.hidden=false;lastPaint='';scene.resize();
  visit(resumeAt);viewport.focus({preventScroll:true});
}
function stopFlute(){
  microphone.stop();micState='off';
  sounds.calibrating=false;sounds.mix();
}
function fluteInterrupted(message){
  micError=message;
  if(inCabin){stopFlute();refresh();return}
  cancelControl();rememberWorksite();game.visit(0,true);enterCabin();
}
function fluteEvent(kind,midi){
  if(kind==='calibrating'){micState='calibrating';refresh();return}
  if(kind==='ready'){
    if(!inCabin||micState!=='calibrating'||document.hidden)return;
    micState='playing';sounds.calibrating=false;sounds.mix();startJourney();return;
  }
  const site=game.site;
  if(micState!=='playing'||inCabin||document.hidden||!site)return;
  if(kind==='release'){release('flute');return}
  const note=fluteNotes[midi];
  if(source!=='flute'){
    if(kind==='attack'&&note===site.pickupNote)take('flute',note);
    return;
  }
  if(!site.choice){
    // Re-tonguing the pickup can begin the same pair again. Only a connected
    // change from that pickup can select a free destination.
    if(kind==='attack'&&note===site.pickupNote)return;
    if(kind==='legato'&&site.slots[note]===false){
      choose(note);
      if(!site.requireSustain)release('flute');
      return;
    }
  }
  release('flute');
}
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
function pauseInput(){
  if(micState!=='off')fluteInterrupted('');
  else cancelControl();
}
document.addEventListener('visibilitychange',()=>{lastTime=0;if(document.hidden)pauseInput();sounds.mix()});
window.addEventListener('pagehide',pauseInput);
function tick(now){
  if(inCabin){lastTime=0;sounds.update('cabin');requestAnimationFrame(tick);return}
  const dt=lastTime?Math.min(250,now-lastTime):0;lastTime=now;
  const wasSite=game.index,site=game.site,oldCount=site?.count,oldCargo=site?.cargo;
  game.advance(dt);
  if(source==='flute'&&!site?.held)release('flute');
  if(game.index!==wasSite)cancelControl();
  if(!game.trip&&game.station===0){enterCabin();requestAnimationFrame(tick);return}
  if(game.finished&&micState==='playing')stopFlute();
  sounds.update(game.trip?'travel':game.station===4?'workshop':'work',site,oldCount,oldCargo);
  refresh();
  const p=game.cranePose,camera=game.follow?game.camera:scrollPosition();
  if(camera!==panoramaCamera){
    // Keep the native scroller aligned for input. Draw all layers at the exact camera position.
    if(game.follow)showCamera();
    panorama.style.transform=`translate3d(${-100*camera/3376}%,0,0)`;
    panoramaCamera=camera;
  }
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
Promise.all(['tonde','lava','kivi'].map(name=>new Promise((done,fail)=>{
  const img=new Image();img.onload=()=>done([name,img]);img.onerror=fail;img.src='kuvat/'+name+'.webp';
}))).then(entries=>{
  const images=Object.fromEntries(entries);
  scene=new Maisema(document.querySelector('#scene'),images);
  refresh();requestAnimationFrame(tick);
}).catch(()=>{failed=true;refresh()});
