'use strict';
const NS='http://www.w3.org/2000/svg';
const $=s=>document.querySelector(s);
const board=$('#board'),aimLayer=$('#aimLayer'),labels=$('#labels'),score=$('#score'),shotLabel=$('#shots'),message=$('#message');
const micButton=$('#mic'),micStatus=$('#micStatus');
const targets=[{x:182,y:540,r:98},{x:511,y:540,r:98},{x:837,y:540,r:98},{x:1163,y:540,r:98},{x:1494,y:540,r:98}];
const acceptedRadius=43,chosen=['G1','A1','H1','C2','D2'];
const semitones={C:0,Cis:1,D:2,Es:3,E:4,F:5,Fis:6,G:7,As:8,A:9,B:10,H:11};
const options=[];for(let octave=0;octave<=3;octave++)for(const n of Object.keys(semitones))options.push(n+octave);
let hits=0,shots=0,enabled=true,engine=null,session=0,reticle=null,pointer=null,lastFrameTime=0;
let tuningCache={i:-1,time:-Infinity,pitch:null};
const instruction='Soita ja lopeta keskellä. Hiirikokeessa pidä painettuna ja vapauta.';
function noteFrequency(n){const m=n.match(/^(.+)([0-3])$/);return 440*2**((12*(Number(m[2])+4)+semitones[m[1]]-69)/12)}
function settings(){return {goalMs:60000/Number($('#tempo').value)*Number($('#length').value),centsLimit:Number($('#centsLimit').value),durationTolerance:Number($('#durationTolerance').value)}}
function showGoal(){const s=settings();$('#goal').textContent='Tavoite '+(s.goalMs/1000).toFixed(2).replace('.',',')+' s'}
function svg(tag,attrs,parent=board){const el=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);parent.append(el);return el}
function makeSoundPool(url){return Array.from({length:5},()=>{const a=new Audio(url);a.preload='auto';a.volume=.85;return a})}
const hitSounds=makeSoundPool('assets/target-hit-third.wav'),missSounds=makeSoundPool('assets/target-miss-second.wav');
let hitSoundIndex=0,missSoundIndex=0;
function sound(hit){if(!enabled)return;const a=hit?hitSounds[hitSoundIndex++%hitSounds.length]:missSounds[missSoundIndex++%missSounds.length];a.currentTime=0;a.play().catch(()=>{})}
// Prime media elements in the user's microphone-button gesture for Safari/iOS.
function unlockSounds(){for(const a of [...hitSounds,...missSounds]){a.muted=true;const p=a.play();p?.then(()=>{a.pause();a.currentTime=0;a.muted=false}).catch(()=>{a.muted=false})}}
function classify(t,x,y){return Math.hypot(x-t.x,y-t.y)<=acceptedRadius}
function fire(i,x,y,valid=true){
 const t=targets[i];if(t.done||hits===5)return false;
 shots++;shotLabel.textContent=shots;const ok=valid&&classify(t,x,y);
 if(ok){t.done=true;hits++;t.group.replaceChildren();svg('circle',{cx:t.x,cy:t.y,r:t.r,class:'flap'},t.group);score.textContent=hits+' / 5';t.zone.setAttribute('aria-label',chosen[i]+' – osuttu');if(hits===5)message.textContent='Kaikki viisi!'}
 else{const m=svg('g',{class:'mark'},t.group);svg('circle',{cx:x,cy:y,r:5,fill:'#c1ccd5',opacity:'.85'},m);svg('circle',{cx:x,cy:y,r:2.7,fill:'#14191e'},m);if(t.group.querySelectorAll('.mark').length>40)t.group.querySelector('.mark').remove()}
 sound(ok);return ok;
}
function lockControls(lock){document.querySelectorAll('.note,.settings input,.settings select').forEach(el=>el.disabled=lock)}
function showAim(p){
 labels.querySelectorAll('.note').forEach((el,i)=>el.classList.toggle('active',!!p&&p.i===i));
 if(!p){if(reticle)reticle.setAttribute('visibility','hidden');lockControls(false);return}
 lockControls(true);const t=targets[p.i],dx=p.valid?p.dx:Math.max(68,p.dx);
 reticle.setAttribute('visibility','visible');reticle.setAttribute('class','reticle'+(p.valid?'':' invalid'));
 reticle.setAttribute('transform',`translate(${t.x+SavelAim.clamp(dx,-115,115)} ${t.y+SavelAim.clamp(p.dy,-172,172)})`);
 const cents=p.valid?((p.cents>0?'+':'')+Math.round(p.cents)+' c'):'etsitään virettä';
 micStatus.textContent=chosen[p.i]+' · '+(p.duration/1000).toFixed(2).replace('.',',')+' s · '+cents;
}
const round=new SavelAim.AimRound({settings,onAim:showAim,onShot:p=>{
 const t=targets[p.i];const dx=p.valid?p.dx:Math.max(68,p.dx);
 const ok=fire(p.i,t.x+SavelAim.clamp(dx,-115,115),t.y+SavelAim.clamp(p.dy,-172,172),p.valid);
 micStatus.textContent=hits===5?'Kaikki viisi!':ok?'Osuma! Pidä pieni tauko.':'Ohi – kokeile uudelleen pienen tauon jälkeen.';
}});
function localPoint(e){const p=board.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(board.getScreenCTM().inverse())}
function cancelPointer(){if(!pointer)return;const id=pointer.id;pointer=null;if(board.hasPointerCapture?.(id))board.releasePointerCapture(id);round.cancel()}
function beginPointer(e,i){
 if(e.button!==0||targets[i].done||pointer||round.phase==='aiming')return;
 e.preventDefault();stopMic();unlockSounds();round.reset();const now=performance.now();round.begin(i,now,'mouse',true);pointer={id:e.pointerId,i};board.setPointerCapture(e.pointerId);
 const p=localPoint(e);round.updatePitch((p.x-targets[i].x)/43*settings().centsLimit,now);showAim(round.position(now));
}
board.addEventListener('pointermove',e=>{if(!pointer||e.pointerId!==pointer.id)return;const p=localPoint(e);round.updatePitch((p.x-targets[pointer.i].x)/43*settings().centsLimit,performance.now())});
board.addEventListener('pointerup',e=>{if(!pointer||e.pointerId!==pointer.id)return;const p=localPoint(e),now=performance.now();round.updatePitch((p.x-targets[pointer.i].x)/43*settings().centsLimit,now);const id=pointer.id;pointer=null;round.finish(now);if(board.hasPointerCapture(id))board.releasePointerCapture(id)});
board.addEventListener('pointercancel',cancelPointer);board.addEventListener('lostpointercapture',cancelPointer);
function stopMic(){session++;engine?.stop();engine=null;round.cancel();tuningCache={i:-1,time:-Infinity,pitch:null};micButton.textContent='Avaa mikrofoni';micButton.setAttribute('aria-pressed','false');micStatus.textContent=instruction}
function handleAnalysis(d){
 lastFrameTime=d.timeMs;
 const fallback=targets.findIndex(t=>!t.done);
 const safe=d.match>=.90&&d.halfEnergy>=.32;
 const matchIndex=safe?targets.findIndex((t,i)=>!t.done&&chosen[i]===d.best):-1;
 round.frame(d,{fallback,matchIndex,noteForTarget:i=>chosen[i],tuning:i=>{
  if(tuningCache.i!==i||d.timeMs-tuningCache.time>=22){tuningCache={i,time:d.timeMs,pitch:SavelAim.finePitch(engine,noteFrequency(chosen[i]))}}
  return tuningCache.pitch;
 }});
}
async function startMic(){
 if(engine){stopMic();return}
 cancelPointer();round.cancel();unlockSounds();const token=++session;let waitingNotice;
 try{
  if(!window.isSecureContext)throw new Error('Mikrofoni tarvitsee HTTPS-osoitteen. Avaa peli yllä olevasta linkistä.');
  const policy=document.permissionsPolicy||document.featurePolicy;
  if(policy?.allowsFeature&&policy.allowsFeature('microphone')===false){const err=new Error('Tämä näkymä estää mikrofonin. Paina Avaa omaan välilehteen ja avaa mikrofoni siellä.');err.name='MicrophonePolicyBlocked';throw err}
  if(!navigator.mediaDevices?.getUserMedia)throw new Error('Selain ei anna mikrofonia käyttöön tässä näkymässä. Avaa peli omaan välilehteen.');
  if(typeof ResonatorStringEngine!=='function')throw new Error('Resonator ei latautunut. Päivitä sivu ja kokeile uudelleen.');
  const frequencies=Object.fromEntries([...new Set(chosen)].map(n=>[n,noteFrequency(n)]));
  const e=new ResonatorStringEngine({targets:frequencies,blockSize:256,calibrationMs:280,responseMs:1.8,toleranceCents:80,centerMatch:.955,edgeMatch:.998,minHalfPeriodEnergy:.32});engine=e;micButton.textContent='Peru mikrofonin avaus';micStatus.textContent='Salli mikrofonin käyttö selaimen lupapyynnössä.';
  waitingNotice=setTimeout(()=>{if(token===session&&engine===e&&!e.running)micStatus.textContent='Mikrofonin avaus odottaa. Tarkista selaimen lupapyyntö tai avaa peli omaan välilehteen.'},12000);
  e.addEventListener('state',event=>{if(token!==session)return;const state=event.detail.state;if(state==='unlocking-audio')micStatus.textContent='Mikrofoni löytyi. Käynnistetään ääni…';if(state==='calibrating')micStatus.textContent='Hetki hiljaa – kohinan mittaus…';if(state==='running'){clearTimeout(waitingNotice);micButton.textContent='Sulje mikrofoni';micButton.setAttribute('aria-pressed','true');micStatus.textContent='Mikrofoni kuuntelee. Soita taulun sävel.'}});
  e.addEventListener('analysis',event=>{if(token===session)handleAnalysis(event.detail)});
  await e.start();if(token!==session)return;for(const track of e.stream.getTracks())track.addEventListener('ended',()=>{if(token===session){stopMic();micStatus.textContent='Mikrofoniyhteys katkesi. Avaa mikrofoni uudelleen.'}})
 }catch(err){if(token!==session)return;stopMic();const help={NotAllowedError:'Mikrofonilupa estettiin. Salli mikrofoni osoiterivin sivustoasetuksista. Jos peli on upotettuna, avaa se omaan välilehteen.',NotFoundError:'Mikrofonia ei löytynyt. Kytke mikrofoni ja kokeile uudelleen.',NotReadableError:'Mikrofonia ei saada käyttöön. Tarkista mikrofonilaite ja selaimen lupa käyttöjärjestelmän asetuksista.'};micStatus.textContent=(help[err.name]||err.message)+' ['+(err.name||'Virhe')+']';
 }finally{clearTimeout(waitingNotice)}
}
micButton.onclick=startMic;
function reset(){cancelPointer();stopMic();hits=shots=0;score.textContent='0 / 5';shotLabel.textContent='0';message.textContent='';board.replaceChildren();aimLayer.replaceChildren();
 targets.forEach((t,i)=>{t.done=false;t.group=svg('g',{});svg('circle',{cx:t.x,cy:t.y,r:acceptedRadius,class:'ring'},t.group);t.zone=svg('rect',{x:t.x-124,y:t.y-128,width:248,height:248,class:'zone',tabindex:'0',role:'button','aria-label':chosen[i]+' – pidä painettuna ja vapauta'});t.zone.addEventListener('pointerdown',e=>beginPointer(e,i));t.zone.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!e.repeat&&!targets[i].done&&!pointer&&round.phase!=='aiming'){e.preventDefault();stopMic();unlockSounds();const now=performance.now();round.begin(i,now,'mouse',true);round.updatePitch(0,now);pointer={id:null,i};showAim(round.position(now))}});t.zone.addEventListener('keyup',e=>{if((e.key==='Enter'||e.key===' ')&&pointer?.id===null){e.preventDefault();pointer=null;const now=performance.now();round.updatePitch(0,now);round.finish(now)}})});
 reticle=svg('g',{class:'reticle',visibility:'hidden'},aimLayer);svg('circle',{r:15},reticle);svg('path',{d:'M-25 0H-7 M7 0H25 M0-25V-7 M0 7V25'},reticle);svg('circle',{r:2,class:'aim-dot'},reticle);
}
targets.forEach((t,i)=>{const select=document.createElement('select');select.className='note';select.style.left=t.x/1672*100+'%';select.setAttribute('aria-label','Taulun '+(i+1)+' sävel');for(const n of options){const option=document.createElement('option');option.value=n;option.textContent=n.replace(/([0-3])$/,(_,d)=>'₀₁₂₃'[Number(d)]);select.append(option)}select.value=chosen[i];select.onchange=()=>{chosen[i]=select.value;reset()};labels.append(select)});
for(const el of document.querySelectorAll('.settings input,.settings select'))el.addEventListener('change',()=>{if(el.id==='tempo'){const n=Number(el.value);el.value=Number.isFinite(n)&&n>=40&&n<=180?n:90}cancelPointer();round.cancel();showGoal()});
$('#reset').onclick=reset;$('#sound').onclick=e=>{enabled=!enabled;e.currentTarget.textContent=enabled?'Äänet ✓':'Äänet –';e.currentTarget.setAttribute('aria-pressed',enabled)};
window.addEventListener('pagehide',stopMic);window.addEventListener('blur',cancelPointer);document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelPointer();stopMic()}});document.addEventListener('keydown',e=>{if(e.key==='Escape'){cancelPointer();stopMic()}});
function animate(){if(pointer&&round.aim){const now=performance.now();round.aim.validAt=now;showAim(round.position(now))}requestAnimationFrame(animate)}
reset();showGoal();animate();
