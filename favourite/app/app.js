(() => {
'use strict';
const $=id=>document.getElementById(id);
const settings=$('settings'),card=document.querySelector('.game-card');
const game=new NoteGame();
const tuner=new PitchMeter($('tuner'));
const staffSparkles=new StaffSparkles();
let pitchReading=null;
const burstAudio=new BurstAudio(window.BURST_SOUNDS);
const shortAudio=new BurstAudio(window.SHORT_SOUND);
function unlockSounds(){burstAudio.unlock();shortAudio.context=burstAudio.context;shortAudio.unlock();}
let shortNoticeTimer=null;
function hideShortNotice(){clearTimeout(shortNoticeTimer);shortNoticeTimer=null;$('shortNotice').hidden=true;$('shortNotice').textContent='';}
function positionShortNotice(){
 const notice=$('shortNotice');if(notice.hidden)return;
 const svg=$('score').querySelector('svg'),note=current().notes.find(n=>n.id===game.target);
 if(!svg||!note)return;
 const area=document.querySelector('.score-area').getBoundingClientRect(),matrix=svg.querySelector('.note-position').getScreenCTM();if(!matrix)return;
 const point=new DOMPoint(note.head.x,getNotationBounds().bottom).matrixTransform(matrix);
 const half=notice.offsetWidth/2;
 notice.style.left=Math.max(half+4,Math.min(area.width-half-4,point.x-area.left))+'px';
 notice.style.top=Math.max(4,Math.min(area.height-notice.offsetHeight-4,point.y-area.top+14))+'px';
}
function playShortFeedback(){
 if(profile==='fun')shortAudio.play();hideShortNotice();$('shortNotice').textContent='Liian lyhyt';$('shortNotice').hidden=false;positionShortNotice();
 shortNoticeTimer=setTimeout(hideShortNotice,1000);
}
const calibrationView=new CalibrationView($('calibration'));
function finishOpening(){const token=request;calibrationView.finish(()=>{if(token!==request||!opening||engineState!=='running')return;opening=false;game.silence();beginRound();});}
let profile=NoteSettings.defaults.profile;
let profilePositions=NoteSettings.copy(NoteSettings.defaults.profilePositions);
let selected='flute',transpositions={flute:0,clarinet:-2,sax:-9,trumpet:-2,trombone:0};
let effects=NoteSettings.copy(NoteSettings.defaults.effects),notation=NoteSettings.copy(NoteSettings.defaults.notation);
let orientationPaused=false;
const notationBounds=new Map();
let engine=null,stability=null,engineState='stopped',source='mic',opening=false,request=0;
let previewId='G',lastWrong=null,roundActive=false;
let frameNote=null,audioEnd=null,manualNote=null,popping=false,popTimer=null,lastInputLoud=false;
const duration=new NoteDuration({onGrow:growHead,onFinish:finishSound,onPop:popHead});
const configuration={flute:[[0,'C · huilu']],clarinet:[[-2,'B-klarinetti'],[-3,'A-klarinetti'],[0,'C-klarinetti']],sax:[[-9,'Es · alttosaksofoni'],[-14,'B · tenorisaksofoni'],[-2,'B · sopraanosaksofoni'],[-21,'Es · baritonisaksofoni']],trumpet:[[-2,'B-trumpetti'],[0,'C-trumpetti']],trombone:[[0,'Soiva sävelkorkeus · F-avain']]};
try{
 const saved=JSON.parse(localStorage.getItem('nuottiseikkailu-v1')||'null');
 if(saved){if(['concert','fun','home'].includes(saved.profile))profile=saved.profile;if(NOTE_DATA[saved.selected])selected=saved.selected;
  if(saved.effects){const value=NoteSettings.validate(saved);effects=value.effects;notation=value.notation;profilePositions=value.profilePositions;}
  else if(Number.isFinite(saved.growthEase)&&saved.growthEase>=1&&saved.growthEase<=5)effects.growthEase=saved.growthEase;
  if(typeof saved.dynamicsCompression==='boolean')$('dynamicsCompression').checked=saved.dynamicsCompression;
  if(typeof saved.names==='boolean')$('names').checked=saved.names;
  if(Number.isInteger(saved.margin)&&saved.margin>=4&&saved.margin<=10)$('margin').value=saved.margin;
  for(const id of Object.keys(transpositions))if(configuration[id].some(([v])=>v===saved.transpositions?.[id]))transpositions[id]=saved.transpositions[id];
 }
}catch{}
const current=()=>NOTE_DATA[selected];
function allSettings(){return {schema:NoteSettings.defaults.schema,profile,profilePositions:NoteSettings.copy(profilePositions),selected,transpositions:{...transpositions},names:$('names').checked,margin:Number($('margin').value),dynamicsCompression:$('dynamicsCompression').checked,notation:{...notation},effects:NoteSettings.copy(effects)};}
function persist(){try{localStorage.setItem('nuottiseikkailu-v1',JSON.stringify(allSettings()));}catch{}}

const positionInputs={noteY:'profileNoteY',backgroundY:'profileBackgroundY',tunerY:'profileTunerY'};
const signedPosition=value=>(value>0?'+':'')+Math.round(value)+' px';
function updatePositionControls(){
 const positions=profilePositions[profile],app=document.querySelector('.app');
 app.style.setProperty('--background-y',positions.backgroundY+'px');
 app.style.setProperty('--tuner-y',positions.tunerY+'px');
 $('positionProfileName').textContent={concert:'Konserttisali',fun:'Pilailu',home:'Olohuone'}[profile];
 for(const [key,id] of Object.entries(positionInputs)){$(id).value=positions[key];$(id+'Value').textContent=signedPosition(positions[key]);}
 layoutNotation();
}
for(const [key,id] of Object.entries(positionInputs))$(id).addEventListener('input',()=>{
 profilePositions[profile][key]=Number($(id).value);updatePositionControls();persist();
});
function updateProfile(){
 document.querySelector('.app').dataset.profile=profile;
 document.querySelectorAll('.profile-picker button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.profile===profile)));
 if(profile!=='fun'){burstAudio.stop();shortAudio.stop();}
 updatePositionControls();
}
document.querySelectorAll('.profile-picker button').forEach(button=>button.addEventListener('click',()=>{
 profile=button.dataset.profile;updateProfile();persist();
}));
updateProfile();

function targets(){return Object.fromEntries(current().notes.map(n=>[n.id,440*2**((n.midi+transpositions[selected]-69)/12)]));}
function say(text){$('feedback').textContent=text;}
function drawNote(id){
 hideShortNotice();
 const note=current().notes.find(n=>n.id===id)||current().notes[0],rhythm=game.task?.rhythm||'quarter';
 $('score').innerHTML=rhythm==='half'?note.halfSvg:note.svg;$('score').dataset.note=note.id;$('score').dataset.rhythm=rhythm;prepareNoteParts(note);
 $('durationLabel').textContent=rhythm==='half'?'Puolinuotti · pitkä ääni':'Neljäsosa · lyhyt ääni';
 $('durationReadout').textContent='';
}
function prepareNoteParts(note){
 const svg=$('score').querySelector('svg'),head=svg.querySelector('.balloon-head'),fixed=svg.querySelector('[mask="url(#head-mask)"]'),defs=svg.querySelector('defs'),ns='http://www.w3.org/2000/svg';
 const make=(tag,attrs={})=>{const el=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))el.setAttribute(k,v);return el;};
 // Resize only the five staff lines. Ledger lines already belong to the original note artwork.
 const lines=[...svg.querySelectorAll(':scope > rect')];
 const dots=make('g',{class:'staff-duration-dots','aria-hidden':'true','pointer-events':'none'});
 for(const line of lines.slice(0,5)){
  line.classList.add('staff-line');
  dots.append(make('circle',{class:'staff-duration-dot',cx:0,cy:Number(line.getAttribute('y'))+Number(line.getAttribute('height'))/2,r:1,fill:'#ffd326',stroke:'#503a00','stroke-width':.3}));
 }
 svg.dataset.staffProgress='0';
 const whole=make('g',{class:'growing-note'}),{x,y}=note.head;
 const burstMask=make('mask',{id:'burst-body-mask',maskUnits:'userSpaceOnUse',x:-100,y:-150,width:500,height:500});burstMask.append(make('rect',{x:-100,y:-150,width:500,height:500,fill:'white'}),make('rect',{x:x-7.5,y:y-6.3,width:15,height:12.6,fill:'black'}));defs.append(burstMask);
 // Keep the original glyphs; each clipped copy carries one intact non-head part.
 const parts=[{name:'accidental',x:-100,w:x-7+100,dx:-32,dy:-20,spin:-155},{name:'stem',x:x-7,w:15,dx:26,dy:-32,spin:135},{name:'ledger',x:x+8,w:250,dx:32,dy:24,spin:190}];
 for(const part of parts){
  const clip=make('clipPath',{id:'piece-'+part.name,clipPathUnits:'userSpaceOnUse'});clip.append(make('rect',{x:part.x,y:-150,width:part.w,height:400}));defs.append(clip);
  const motion=make('g',{class:'note-piece '+part.name}),cut=make('g',{'clip-path':'url(#piece-'+part.name+')'});cut.append(fixed.cloneNode(true));motion.append(cut);
  motion.style.cssText=`--fly-x:${part.dx}px;--fly-y:${part.dy}px;--fly-spin:${part.spin}deg;transform-origin:${x}px ${y}px;`;whole.append(motion);
 }
 fixed.remove();whole.append(head);svg.append(whole);
 for(const el of whole.querySelectorAll('path,rect,ellipse,line,polygon,polyline')){
  const fill=getComputedStyle(el).fill;if(fill!=='none'&&fill!=='rgb(255, 255, 255)')el.style.fill='currentColor';
  const stroke=getComputedStyle(el).stroke;if(stroke==='rgb(0, 0, 0)')el.style.stroke='currentColor';
 }
 whole.style.color='rgb(0, 0, 0)';
 const position=make('g',{class:'note-position'});whole.replaceWith(position);position.append(whole);svg.append(dots);staffSparkles.attach(svg);svg.dataset.originalHeight=svg.viewBox.baseVal.height;layoutNotation();
}
function getNotationBounds(){
 if(notationBounds.has(selected))return notationBounds.get(selected);
 // Use one envelope for every pitch/rhythm of this instrument so the staff stays still.
 const stage=document.createElement('div');stage.style.cssText='position:absolute;left:0;top:0;width:136px;height:88px;visibility:hidden;pointer-events:none;';document.body.append(stage);
 let top=Infinity,bottom=-Infinity;
 try{for(const note of current().notes)for(const markup of [note.svg,note.halfSvg]){
  stage.innerHTML=markup;const svg=stage.firstElementChild;svg.style.width='136px';svg.style.height='88px';
  const box=svg.getBBox();top=Math.min(top,box.y);bottom=Math.max(bottom,box.y+box.height);
 }}finally{stage.remove();}
 const bounds={top:top-1,bottom:bottom+1};notationBounds.set(selected,bounds);return bounds;
}
function layoutNotation(){
 const svg=$('score').querySelector('svg'),note=current().notes.find(n=>n.id===$('score').dataset.note);if(!svg||!note||$('score').hidden)return;
 const available=$('score').clientWidth,areaHeight=$('score').clientHeight;if(!available||!areaHeight)return;
 const width=available*notation.staffWidth/100,padding=Math.min(12,areaHeight/8),bounds=getNotationBounds(),artHeight=bounds.bottom-bounds.top;
 const requestedScale=2.7*notation.noteSize/100*Math.min(available/520,areaHeight/440);
 const scale=Math.min(requestedScale,(areaHeight-2*padding)/artHeight),units=width/scale,viewHeight=areaHeight/scale,centerY=(bounds.top+bounds.bottom)/2;
 const limit=Math.min(500,Math.max(0,Math.floor((areaHeight-2*padding-artHeight*scale)/2)));
 const offsetY=Math.max(-limit,Math.min(limit,profilePositions[profile].noteY));
 // The shared pitch/rhythm bounds keep the card still as notes change or grow.
 const cardMargin=20,artTop=(areaHeight-artHeight*scale)/2+offsetY;
 const cardTop=Math.max(0,artTop-cardMargin),cardBottom=Math.min(areaHeight,artTop+artHeight*scale+cardMargin);
 const scoreArea=$('score').parentElement;
 scoreArea.style.setProperty('--note-card-top',cardTop+'px');
 scoreArea.style.setProperty('--note-card-height',(cardBottom-cardTop)+'px');
 svg.setAttribute('viewBox',`0 ${centerY-viewHeight/2-offsetY/scale} ${units} ${viewHeight}`);svg.style.width=width+'px';svg.style.height=areaHeight+'px';
 for(const line of svg.querySelectorAll(':scope > .staff-line')){line.setAttribute('x','0');line.setAttribute('width',units);}
 svg.querySelector('.note-position').setAttribute('transform',`translate(${units/2-note.head.x+notation.noteOffsetX/scale} 0)`);
 positionStaffDots(svg);positionShortNotice();
 const slider=$('noteOffsetY'),signed=v=>(v>0?'+':'')+Math.round(v)+' px';
 slider.min=-limit;slider.max=limit;slider.value=offsetY;slider.disabled=limit===0;$('noteOffsetYValue').textContent=signed(offsetY);
 const profileSlider=$('profileNoteY');profileSlider.min=-limit;profileSlider.max=limit;profileSlider.value=offsetY;profileSlider.disabled=limit===0;$('profileNoteYValue').textContent=signed(offsetY);
 const messages=[];
 if(scale<requestedScale-.00001)messages.push('Nuotin koko on sovitettu tämän näytön nuottialueeseen.');
 if(offsetY!==profilePositions[profile].noteY)messages.push(`Tallennettu Y-siirto ${signed(profilePositions[profile].noteY)}, tällä näytöllä ${signed(offsetY)}.`);
 if(limit===0)messages.push('Pienennä nuottia, jos haluat siirtää sitä ylös tai alas.');
 $('notationFitHint').textContent=messages.join(' ');$('notationFitHint').hidden=messages.length===0;
}
function updateNotationControls(){$('dotSize').value=notation.dotSize;$('dotSizeValue').textContent=notation.dotSize+' px';for(const key of ['noteSize','staffWidth','noteOffsetX','noteOffsetY']){$(key).value=notation[key];$(key+'Value').textContent=((key==='noteOffsetX'||key==='noteOffsetY')?(notation[key]>0?'+':'')+notation[key]+' px':notation[key]+' %');}layoutNotation();}
function clearSound(){hideShortNotice();shortAudio.stop();paintStaffDuration(0,0);tuner.clear();pitchReading=null;clearTimeout(popTimer);popTimer=null;popping=false;manualNote=null;lastInputLoud=false;duration.reset();document.querySelectorAll('.held').forEach(el=>el.classList.remove('held'));document.querySelectorAll('.particle').forEach(el=>el.remove());$('score').classList.remove('popped');}
function positionStaffDots(svg){
 const scale=svg.getScreenCTM()?.a,units=svg.viewBox.baseVal.width;if(!(scale>0)||!(units>0))return;
 const radius=notation.dotSize/2/scale,inset=radius+.5/scale,progress=Number(svg.dataset.staffProgress)||0;
 const x=units>2*inset?inset+(units-2*inset)*progress:units/2;
 for(const dot of svg.querySelectorAll('.staff-duration-dot')){dot.setAttribute('cx',x);dot.setAttribute('r',radius);dot.setAttribute('stroke-width',1/scale);}
}
function paintStaffDuration(seconds,red){
 const svg=$('score').querySelector('svg');if(!svg)return;
 const goal=$('score').dataset.rhythm==='half'?1.6:.8;
 svg.dataset.staffProgress=String(Math.min(1,Math.max(0,seconds/goal)));
 const blend=seconds>goal?red:0,color=`rgb(${[255,211,38].map((v,i)=>Math.round(v+([220,38,55][i]-v)*blend)).join(', ')})`;
 for(const dot of svg.querySelectorAll('.staff-duration-dot'))dot.setAttribute('fill',color);
 positionStaffDots(svg);
 staffSparkles.setProgress(svg,Number(svg.dataset.staffProgress));
}
function paintNote(seconds){
 const whole=$('score').querySelector('.growing-note'),note=current().notes.find(n=>n.id===game.target);
 const visual=NoteSettings.visual(seconds,effects[game.task?.rhythm||'quarter'],effects.growthEase);
 paintStaffDuration(seconds,visual.red);
 if(whole&&note){const{x,y}=note.head;whole.setAttribute('transform',`translate(${x} ${y}) scale(${visual.scale}) translate(${-x} ${-y})`);whole.style.color=visual.color;}
 return visual;
}
function growHead(amount,seconds){
 const visual=paintNote(seconds);
 if(visual.growth>0)say('Nuotti paisuu… lopeta ääni ajoissa!');
 else if(visual.red>0)say('Nuotti punastuu… valmistaudu lopettamaan.');
}
function popHead(seconds){
 if(popping||!roundActive)return;const soundSeconds=profile==='fun'?burstAudio.play():0;growHead(1,seconds);popping=true;$('score').querySelectorAll('.note-piece [mask]').forEach(el=>el.setAttribute('mask','url(#burst-body-mask)'));$('score').classList.add('popped');
 say('Poks! Liian pitkä ääni. Lopeta ja kokeile uudelleen.');
 const svg=$('score').querySelector('svg'),note=current().notes.find(n=>n.id===game.target),area=document.querySelector('.score-area'),rect=area.getBoundingClientRect();
 const pt=new DOMPoint(note.head.x,note.head.y).matrixTransform(svg.querySelector('.note-position').getScreenCTM());
 for(let i=0;i<16;i++){const el=document.createElement('span');el.className='particle';const angle=i*Math.PI*2/16,distance=45+Math.random()*50;el.style.cssText=`left:${pt.x-rect.left}px;top:${pt.y-rect.top}px;--dx:${Math.cos(angle)*distance}px;--dy:${Math.sin(angle)*distance}px;--spin:${i*45}deg;background:${['#113fca','#ef9b22','#e65486','#3cbdb1'][i%4]}`;area.append(el);}
 popTimer=setTimeout(()=>{popping=false;$('score').classList.remove('popped');document.querySelectorAll('.particle').forEach(el=>el.remove());duration.reset(lastInputLoud);if(roundActive){drawNote(game.target);say(lastInputLoud?'Lopeta ääni ja kokeile uudelleen.':'Kokeile sama nuotti uudelleen.');}},Math.max(effects.flightSeconds,soundSeconds+.12)*1000);
}
function finishSound(result,seconds){
 if(!roundActive||popping)return;paintNote(0);
 if(result==='correct'){
  game.collect();lastWrong=null;
  if(game.phase==='complete'){roundActive=false;card.classList.add('complete');$('score').hidden=true;$('summary').hidden=false;$('prompt').hidden=true;$('durationLabel').textContent='Molemmat korit täynnä!';say('Hienoa! Keräsit molempiin koreihin kahdeksan nuottia.');}
  else{drawNote(game.target);say('');}
  progress();controls();
 }else{if(result==='short'||result==='tiny')playShortFeedback();say(result==='long'?'Ääni oli liian pitkä. Kokeile lyhyempää ääntä.':result==='short'?'Tämä jäi lyhyeksi. Kokeile pidempää ääntä.':result==='tiny'?'Ääni jäi aivan lyhyeksi. Kokeile uudelleen.':result==='wrong'?'Pidä sama oikea sävel äänen loppuun asti.':'Ääni katkesi tunnistuksessa. Lopeta ja kokeile uudelleen.');}
}
function feedSound(time,note,loud,onset=time,end=time){
 lastInputLoud=loud;if(!roundActive||popping)return;
 if(loud)hideShortNotice();
 duration.feed(time,{correct:note===game.target&&loud,wrong:!!note&&note!==game.target,loud,onset,end,rhythm:game.task.rhythm,popAt:NoteSettings.popTime(game.task.rhythm,effects[game.task.rhythm])});
 if(note&&note!==game.target&&lastWrong!==note){lastWrong=note;say('Kokeile vielä. Katso nuotin paikkaa.');}
}
function observeAudio(processor){
 const original=processor.onaudioprocess;audioEnd=null;
 processor.onaudioprocess=event=>{
  if(!engine?.running)return;const input=event.inputBuffer.getChannelData(0),ctx=engine.context,dt=input.length/ctx.sampleRate;
  audioEnd=audioEnd===null?ctx.currentTime:audioEnd+dt;const start=audioEnd-dt;frameNote=null;
  original(event);
  if(source!=='mic'||engineState!=='running')return;
  let first=null,last=null;const gate=Math.max(.0001,engine._gate*.72);
  for(let i=0;i<input.length;i+=64){const n=Math.min(input.length,i+64);let sum=0;for(let j=i;j<n;j++)sum+=input[j]*input[j];if(Math.sqrt(sum/(n-i))>=gate){if(first===null)first=start+i/ctx.sampleRate;last=start+n/ctx.sampleRate;}}
  feedSound(audioEnd,frameNote,last!==null,first??start,last??audioEnd);
 };
}
function progress(){
 for(const rhythm of ['quarter','half']){
  const count=game.counts[rhythm],basket=$(rhythm+'Basket');basket.classList.toggle('active',roundActive&&game.task?.rhythm===rhythm);basket.classList.toggle('full',count===8);
  $(rhythm+'Count').textContent=count+' / 8';
  $(rhythm+'Slots').replaceChildren(...Array.from({length:8},(_,i)=>{const el=document.createElement('span');el.className=i<count?'collected note-icon '+rhythm:'empty-slot';el.textContent=i<count?'':'·';el.setAttribute('aria-hidden','true');return el;}));
 }
 $('roundLabel').textContent=game.phase==='complete'?'16 / 16 valmiina':roundActive?`${game.index+1} / 16`:'16 nuotin kierros';
}
function controls(){
 for(const b of $('instrumentDock').querySelectorAll('button')){b.disabled=opening;b.setAttribute('aria-label',`${NOTE_DATA[b.dataset.instrument].label}: ${opening?'avataan mikrofonia':roundActive?'aloita uusi kierros':'aloita harjoitus'}`);}
 $('instrumentDock').setAttribute('aria-busy',String(opening));
 $('startBtn').hidden=roundActive&&game.phase!=='complete'&&!opening;
 $('startBtn').disabled=opening;
 $('startBtn').textContent=opening?'Avataan mikrofonia…':game.phase==='complete'?'Uusi kierros':engine?.running||source==='test'?'Aloita kierros':'Aloita';
 $('stopBtn').hidden=!(roundActive||opening||engine?.running);
 $('stopBtn').textContent=opening?'Peru':'Lopeta';
 $('testBtn').hidden=source==='test'||roundActive||opening;
 $('testPanel').hidden=source!=='test';$('micModeBtn').hidden=source!=='test';
 $('sourceLabel').textContent=source==='test'?'Hiiritesti':'Vastaa soittamalla';
}
function resetView(){clearSound();roundActive=false;game.reset();lastWrong=null;card.classList.remove('correct','complete');$('score').hidden=false;$('summary').hidden=true;$('prompt').hidden=false;$('prompt').textContent='Soita kuvan nuotti';previewId=current().notes[0].id;drawNote(previewId);progress();controls();}
function beginRound(){
 clearSound();if(!orientationPaused||game.phase!=='playing')game.start(current().notes.map(n=>n.id));orientationPaused=false;roundActive=true;lastWrong=null;duration.reset(source==='mic'&&!!engine?._voiced);
 card.classList.remove('correct','complete');$('score').hidden=false;$('summary').hidden=true;$('prompt').hidden=false;$('prompt').textContent='Soita kuvan nuotti';drawNote(game.target);say(source==='test'?'Pidä oikeaa sävelpainiketta pohjassa äänen ajan.':'Soita nuotti ja lopeta ääni.');progress();controls();
}
function handleSilence(){tuner.clear();pitchReading=null;game.silence();stability?.silence();lastWrong=null;}
function bindAudio(){
 engine.addEventListener('pitch',({detail:d})=>{if(source==='mic')pitchReading={...d,at:performance.now()};});
 engine.addEventListener('input',({detail:d})=>{
  if(source!=='mic')return;
  if(d.accepted){
   const stable=stability.accept(d);if(stable)frameNote=stable.action;
   if(stable&&pitchReading?.anchor===stable.action&&performance.now()-pitchReading.at<160)tuner.update(pitchReading.frequency,engine.targets[stable.action],stable.action);
   else tuner.clear();
  }else if(d.accepted===false){stability.reject();tuner.clear();pitchReading=null;}
 });
 engine.addEventListener('silence',handleSilence);
 engine.addEventListener('state',({detail:d})=>{
  engineState=d.state;
  if(d.state==='requesting-microphone')$('micStatus').textContent='Odotetaan mikrofonilupaa';
  if(d.state==='calibrating'){calibrationView.start();$('micStatus').textContent='Mitataan taustakohinaa';say('Ole hetki hiljaa. Mitataan taustakohina.');}
  if(d.state==='running'){
   $('micStatus').textContent='Mikrofoni auki';
   if(opening)finishOpening();
  }
  if(d.state==='stopped'){calibrationView.cancel();$('micStatus').textContent='Mikrofoni suljettu';handleSilence();}
  controls();
 });
 engine.addEventListener('calibrationprogress',({detail:d})=>{calibrationView.progress(d.progress);$('micStatus').textContent=`Taustakohinan mittaus ${Math.round(d.progress*100)} %`;});
 engine.addEventListener('error',()=>{calibrationView.cancel();$('micStatus').textContent='Mikrofoni ei ole käytössä';});
}
function setupAudio(){
 tuner.clear();pitchReading=null;
 const bank=targets();stability=new ResonatorNoteStability({targets:bank,dynamicsCompression:$('dynamicsCompression').checked});
 if(engine)engine.setTargets(bank);
 else{
  engine=new ResonatorStringEngine({targets:bank,blockSize:256,calibrationMs:1500,responseMs:1.8,toleranceCents:40,centerMatch:0.955,edgeMatch:0.998,minHalfPeriodEnergy:0.32,noiseMarginDb:Number($('margin').value),pitchMeterIntervalMs:22,pitchMeterWindowMs:16,pitchMeterSearchCents:140});bindAudio();
 }
 game.silence();
}
function setInstrument(id){
 if(!NOTE_DATA[id])return;
 if(opening)stop();orientationPaused=false;selected=id;setupAudio();resetView();
 document.querySelectorAll('[data-instrument]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.instrument===id)));
 $('instrumentLabel').textContent=current().label;
 $('transpose').replaceChildren(...configuration[id].map(([v,label])=>{const o=document.createElement('option');o.value=v;o.textContent=label;o.selected=v===transpositions[id];return o;}));
 $('transpose').disabled=configuration[id].length===1;updateTransposeHelp();renderTestNotes();
 say('Valitse nimien näkyvyys ja aloita omaan tahtiin.');persist();
}
function updateTransposeHelp(){
 const shift=transpositions[selected];
 $('transposeHelp').textContent=shift===0?'Kuvan nuotti ja soiva sävel ovat samassa sävelkorkeudessa.':`Tunnistus huomioi vireen automaattisesti. Soiva sävel on ${-shift} puolisävelaskelta kirjoitettua alempana.`;
}
function renderTestNotes(){
 $('testNotes').replaceChildren(...current().notes.map(n=>{
  const b=document.createElement('button');b.textContent=n.label;b.dataset.note=n.id;b.setAttribute('aria-label',`Pidä painettuna: ${n.label}`);
  const down=()=>{if(source!=='test'||!roundActive||popping||manualNote)return;manualNote=n.id;b.classList.add('held');feedSound(performance.now()/1000,n.id,true);};
  const up=()=>{if(manualNote!==n.id)return;const time=performance.now()/1000;feedSound(time,n.id,true);manualNote=null;b.classList.remove('held');feedSound(time,null,false);};
  b.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();b.setPointerCapture(e.pointerId);down();});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,up);
  b.addEventListener('keydown',e=>{if(['Space','Enter'].includes(e.code)){e.preventDefault();if(!e.repeat)down();}});
  b.addEventListener('keyup',e=>{if(['Space','Enter'].includes(e.code)){e.preventDefault();up();}});b.addEventListener('blur',up);return b;
 }));
}
function animate(){staffSparkles.tick();tuner.tick();if(source==='test'&&roundActive)feedSound(performance.now()/1000,manualNote,!!manualNote);requestAnimationFrame(animate);}
async function start(){
 if(opening||landscape.matches)return;$('startError').hidden=true;unlockSounds();
 if(source==='test'){beginRound();return;}
 if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){say('Mikrofoni tarvitsee HTTPS-osoitteen tai paikallisen palvelimen. Voit kokeilla hiiritestiä asetuksista.');$('startError').textContent=$('feedback').textContent;$('startError').hidden=false;return;}
 if(engine.running&&engineState==='running'){beginRound();return;}
 const token=++request;opening=true;roundActive=false;controls();say('Salli mikrofonin käyttö selaimen kysyessä.');
 try{await engine.start();if(token!==request)return;observeAudio(engine.processor);
  // The engine can be running while its initial noise calibration is unfinished.
  if(engineState==='running'&&opening)finishOpening();
 }catch(e){if(token!==request)return;calibrationView.cancel();opening=false;roundActive=false;$('micStatus').textContent='Mikrofoni suljettu';
  say(e.name==='NotAllowedError'?'Mikrofonilupa jäi antamatta. Salli mikrofoni selaimen asetuksista ja yritä uudelleen.':e.name==='NotFoundError'?'Mikrofonia ei löytynyt. Liitä mikrofoni ja yritä uudelleen.':e.name==='AbortError'?'Avaus peruttu.':'Mikrofonia ei saatu auki. Tarkista sen liitäntä ja selaimen lupa.');$('startError').textContent=$('feedback').textContent;$('startError').hidden=false;controls();
 }
}
function stop(){orientationPaused=false;burstAudio.stop();calibrationView.cancel();++request;opening=false;engine?.stop();game.silence();resetView();say('Voit aloittaa uuden kierroksen.');controls();}
$('cancelCalibration').addEventListener('click',stop);
$('calibration').addEventListener('cancel',e=>{e.preventDefault();stop();});
$('startBtn').addEventListener('click',start);$('stopBtn').addEventListener('click',stop);
$('testBtn').addEventListener('click',()=>{if(landscape.matches)return;$('startError').hidden=true;stop();unlockSounds();source='test';$('micStatus').textContent='Hiiritesti · mikrofoni suljettu';beginRound();});
$('micModeBtn').addEventListener('click',()=>{stop();source='mic';$('micStatus').textContent='Mikrofoni suljettu';settings.close();say('Paina soitinkuvaa, niin mikrofoni avataan.');controls();});
document.querySelectorAll('[data-instrument]').forEach(b=>b.addEventListener('click',()=>{
 if(opening||landscape.matches)return;
 if(b.dataset.instrument!==selected)setInstrument(b.dataset.instrument);
 start();
}));
function updateNames(){document.body.classList.toggle('names-hidden',!$('names').checked);$('namesState').textContent=$('names').checked?'näkyvissä':'piilossa';persist();}
$('names').addEventListener('change',updateNames);
const effectNames={colorStart:'Punastuminen alkaa',colorDuration:'Punastumisen kesto',growthStart:'Paisuminen alkaa',growthDuration:'Paisumisen kesto'};
function updateEffectControls(){
 $('growthEase').value=effects.growthEase;$('growthEaseValue').textContent=effects.growthEase.toFixed(1).replace('.',',')+(effects.growthEase===1?' · tasainen':' · kiihtyvä');
 $('flightSeconds').value=effects.flightSeconds;$('flightSecondsValue').textContent=effects.flightSeconds.toFixed(2).replace('.',',')+' s';card.style.setProperty('--burst-duration',effects.flightSeconds+'s');
 for(const rhythm of ['quarter','half']){
  const e=effects[rhythm],limit=NoteSettings.popTime(rhythm,e);
  const ranges={colorStart:[0,10],colorDuration:[.05,5],growthStart:[e.colorStart+e.colorDuration,20],growthDuration:[.05,5]};
  for(const key of Object.keys(effectNames)){const id=rhythm+'_'+key,el=$(id);el.min=Math.max(0,ranges[key][0]).toFixed(2);el.max=ranges[key][1].toFixed(2);el.value=e[key];$(id+'Value').textContent=e[key].toFixed(2).replace('.',',')+' s';}
  $(rhythm+'Timeline').textContent=`Punaiseksi ${e.colorStart.toFixed(2)}–${(e.colorStart+e.colorDuration).toFixed(2)} s · kasvu ${e.growthStart.toFixed(2)}–${(e.growthStart+e.growthDuration).toFixed(2)} s · poks ${limit.toFixed(2)} s`.replaceAll('.',',');
 }
}
for(const rhythm of ['quarter','half'])for(const key of Object.keys(effectNames)){
 const id=rhythm+'_'+key,wrap=document.createElement('label');wrap.className='field';wrap.htmlFor=id;
 const label=document.createElement('span');label.textContent=effectNames[key];const output=document.createElement('output');output.id=id+'Value';output.htmlFor=id;
 const input=document.createElement('input');input.id=id;input.type='range';input.step='.01';input.setAttribute('aria-label',(rhythm==='quarter'?'Neljäsosa: ':'Puolinuotti: ')+effectNames[key]);
 input.addEventListener('input',()=>{const e=effects[rhythm];e[key]=Number(input.value);e.growthStart=Math.max(e.growthStart,Math.round((e.colorStart+e.colorDuration)*100)/100);updateEffectControls();persist();});wrap.append(label,output,input);$(rhythm+'Effects').append(wrap);
}
$('growthEase').addEventListener('input',()=>{effects.growthEase=Number($('growthEase').value);updateEffectControls();persist();});
$('flightSeconds').addEventListener('input',()=>{effects.flightSeconds=Number($('flightSeconds').value);updateEffectControls();persist();});
function showJSON(){$('settingsJson').value=JSON.stringify(allSettings(),null,2);$('jsonStatus').textContent='Nykyiset asetukset JSON-muodossa.';}
function applyJSON(text){
 try{
  const value=NoteSettings.validate(JSON.parse(text));
  if(opening)stop();profile=value.profile;profilePositions=value.profilePositions;effects=value.effects;notation=value.notation;updateProfile();updateNotationControls();transpositions=value.transpositions;$('names').checked=value.names;$('margin').value=value.margin;$('dynamicsCompression').checked=value.dynamicsCompression;engine?.setNoiseMarginDb(value.margin);
  setInstrument(value.selected);updateNames();updateEffectControls();$('marginValue').textContent=`+${value.margin} dB`;persist();showJSON();$('jsonStatus').textContent='Asetukset otettu käyttöön. Aloita uusi kierros.';
 }catch(error){$('jsonStatus').textContent='Asetuksia ei muutettu: '+error.message;}
}
$('showJson').addEventListener('click',showJSON);
$('applyJson').addEventListener('click',()=>applyJSON($('settingsJson').value));
$('downloadJson').addEventListener('click',()=>{showJSON();const url=URL.createObjectURL(new Blob([$('settingsJson').value],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='Nuottiseikkailu_asetukset.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
$('openJson').addEventListener('click',()=>$('jsonFile').click());
$('jsonFile').addEventListener('change',async()=>{const file=$('jsonFile').files[0];if(!file)return;try{if(file.size>100000)throw Error('JSON-tiedosto on liian suuri.');$('settingsJson').value=await file.text();$('jsonStatus').textContent='Tiedosto avattu. Ota asetukset käyttöön Käytä JSON -painikkeella.';}catch(e){$('jsonStatus').textContent=e.message;}$('jsonFile').value='';});
updateEffectControls();updateNotationControls();
for(const key of ['noteSize','staffWidth','noteOffsetX','noteOffsetY'])$(key).addEventListener('input',()=>{notation[key]=Number($(key).value);if(key==='noteOffsetY')profilePositions[profile].noteY=notation[key];updateNotationControls();persist();});
$('dotSize').addEventListener('input',()=>{notation.dotSize=Number($('dotSize').value);$('dotSizeValue').textContent=notation.dotSize+' px';const svg=$('score').querySelector('svg');if(svg)positionStaffDots(svg);persist();});
new ResizeObserver(layoutNotation).observe($('score'));
const landscape=matchMedia('(orientation: landscape)');
function updateOrientation(){
 if(landscape.matches){
  if(roundActive||opening){orientationPaused=game.phase==='playing';++request;opening=false;roundActive=false;burstAudio.stop();calibrationView.cancel();engine?.stop();clearSound();controls();say('Käännä pystyasentoon ja jatka valitun soittimen kuvasta.');}
  if(settings.open)settings.close();
 }
 document.querySelector('.app').inert=landscape.matches;$('orientationNotice').hidden=!landscape.matches;
 if(!landscape.matches)layoutNotation();
}
landscape.addEventListener('change',updateOrientation);updateOrientation();
$('transpose').addEventListener('change',()=>{if(opening)stop();transpositions[selected]=Number($('transpose').value);setupAudio();resetView();updateTransposeHelp();persist();say('Vire vaihdettu. Aloita uusi kierros.');});
$('dynamicsCompression').addEventListener('change',()=>{stability?.setDynamicsCompression($('dynamicsCompression').checked);persist();});
$('margin').addEventListener('input',()=>{$('marginValue').textContent=`+${$('margin').value} dB`;engine.setNoiseMarginDb(Number($('margin').value));persist();});
window.addEventListener('pagehide',stop);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(roundActive||opening))stop();});
requestAnimationFrame(animate);
setInstrument(selected);updateNames();$('marginValue').textContent=`+${$('margin').value} dB`;
})();
