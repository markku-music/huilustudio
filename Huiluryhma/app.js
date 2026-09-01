import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import { getFirestore, doc, getDoc, runTransaction, updateDoc, deleteDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const CODES=['LLH','LHL','LHH','HLL','HLH','HHL'];
const ANIMALS=[
  {id:'dog',face:'🐶',name:'Koira'},
  {id:'fox',face:'🦊',name:'Kettu'},
  {id:'rabbit',face:'🐰',name:'Pupu'},
  {id:'owl',face:'🦉',name:'Pöllö'},
  {id:'panda',face:'🐼',name:'Panda'}
];
const INTER_NOTE_LOCK_MS=2000;
const POST_LOCK_SILENCE_FRAMES=3;
const MIN_CODE_GAP_CENTS=90;

const $=id=>document.getElementById(id);
const setupPanel=$('setupPanel'),firebaseStatus=$('firebaseStatus'),micStatus=$('micStatus'),micBtn=$('micBtn'),levelBar=$('levelBar');
const groupInput=$('groupInput'),loginTab=$('loginTab'),createTab=$('createTab'),loginPanel=$('loginPanel'),createPanel=$('createPanel');
const loginAnimals=$('loginAnimals'),createAnimals=$('createAnimals'),loginListenBtn=$('loginListenBtn'),loginClearBtn=$('loginClearBtn');
const nameInput=$('nameInput'),reserveBtn=$('reserveBtn'),releaseBtn=$('releaseBtn');
const capturePanel=$('capturePanel'),captureHeading=$('captureHeading'),assignedWrap=$('assignedWrap'),assignedCode=$('assignedCode');
const gate=$('gate'),gateIcon=$('gateIcon'),gateTitle=$('gateTitle'),gateSub=$('gateSub'),heard=$('heard'),captureMessage=$('captureMessage'),retryBtn=$('retryBtn'),resultPanel=$('resultPanel');

let app=null,auth=null,db=null,user=null,fbReady=false;
let micEngine=null;
let screenMode='login';
let selectedLoginAnimal=null,selectedCreateAnimal=null;
let captureMode=null; // login | verify
let currentNotes=[];
let captureLocked=false,interNoteLockUntil=0,lockNeedsSilence=false,postLockSilenceFrames=0;
let reserved=null; // {groupId,animal,code,slotId,name,ref}

function firebaseConfigLooksReal(){
  return firebaseConfig?.apiKey && !String(firebaseConfig.apiKey).includes('PASTE_') && firebaseConfig?.projectId && !String(firebaseConfig.projectId).includes('PASTE_');
}

async function initFirebase(){
  if(!firebaseConfigLooksReal()){
    setupPanel.classList.remove('hidden');
    firebaseStatus.textContent='Firebase: asetukset puuttuvat';
    firebaseStatus.classList.add('bad');
    updateButtons();
    return;
  }
  try{
    app=initializeApp(firebaseConfig);
    auth=getAuth(app);
    db=getFirestore(app);
    const cred=await signInAnonymously(auth);
    user=cred.user;
    fbReady=true;
    firebaseStatus.textContent='Firebase: valmis';
    firebaseStatus.classList.add('ok');
    updateButtons();
  }catch(err){
    console.error(err);
    firebaseStatus.textContent='Firebase: yhteys epäonnistui';
    firebaseStatus.classList.add('bad');
    setupPanel.classList.remove('hidden');
    setupPanel.querySelector('.small').textContent='Tarkista firebase-config.js, Firestore ja että Anonymous Authentication on otettu käyttöön.';
  }
}

function normalizeGroup(v){return String(v||'').trim().toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,16)}
function groupId(){const g=normalizeGroup(groupInput.value);if(groupInput.value!==g)groupInput.value=g;return g}
function animalById(id){return ANIMALS.find(a=>a.id===id)}
function codeWords(code){return code.split('').map(x=>x==='L'?'matala':'korkea').join(' – ')}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]))}
function shuffle(a){const x=a.slice();for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x}

function renderAnimalButtons(container,kind){
  container.innerHTML='';
  for(const a of ANIMALS){
    const b=document.createElement('button');b.className='animal';b.type='button';b.dataset.animal=a.id;
    b.innerHTML=`<span class="face">${a.face}</span><span class="name">${a.name}</span>`;
    b.addEventListener('click',()=>{
      if(kind==='login')selectedLoginAnimal=a.id;else selectedCreateAnimal=a.id;
      [...container.children].forEach(x=>x.classList.toggle('selected',x.dataset.animal===a.id));
      hideResult();updateButtons();
    });
    container.appendChild(b);
  }
}

function renderCode(el,code,done=0){
  el.innerHTML='';
  code.split('').forEach((v,i)=>{const d=document.createElement('div');d.className='tone '+(v==='H'?'high':'low')+(i<done?' done':'');d.setAttribute('aria-label',v==='H'?'korkea':'matala');el.appendChild(d)});
}
function renderHeard(){
  heard.innerHTML='';currentNotes.forEach((n,i)=>{const d=document.createElement('div');d.className='heard-note';d.innerHTML=`${i+1}. ääni<b>${Math.round(n.hz)} Hz</b>`;heard.appendChild(d)});
}

function decodeRelativeCode(notes){
  if(notes.length!==3)return {ok:false,reason:'Tarvitaan kolme säveltä.'};
  const logs=notes.map(n=>Math.log2(n.hz));
  const sorted=logs.map((v,i)=>({v,i})).sort((a,b)=>a.v-b.v);
  const gap1=sorted[1].v-sorted[0].v,gap2=sorted[2].v-sorted[1].v;
  const split=gap1>=gap2?1:2;
  const cents=Math.max(gap1,gap2)*1200;
  if(cents<MIN_CODE_GAP_CENTS)return {ok:false,reason:'Matala ja korkea olivat liian lähellä toisiaan.',cents};
  const code=['H','H','H'];for(let k=0;k<split;k++)code[sorted[k].i]='L';
  return {ok:true,code:code.join(''),cents};
}

function resetCapture(){
  currentNotes=[];captureLocked=false;interNoteLockUntil=0;lockNeedsSilence=false;postLockSilenceFrames=0;renderHeard();updateGate();
}
function startLock(){interNoteLockUntil=performance.now()+INTER_NOTE_LOCK_MS;lockNeedsSilence=true;postLockSilenceFrames=0;updateGate()}
function updateGate(){
  if(!captureMode){capturePanel.classList.add('hidden');return}
  capturePanel.classList.remove('hidden');
  if(captureLocked && currentNotes.length>=3){gate.classList.remove('locked');gateIcon.textContent='✅';gateTitle.textContent='Koodi valmis';gateSub.textContent='Kolme säveltä vastaanotettu.';return}
  const remain=Math.max(0,interNoteLockUntil-performance.now());
  if(remain>0||lockNeedsSilence){gate.classList.add('locked');gateIcon.textContent='🔒';gateTitle.textContent='Odota';gateSub.textContent=remain>0?`Seuraava sävel noin ${(Math.ceil(remain/100)/10).toFixed(1)} s kuluttua.`:'Päästä ääni loppuun ennen seuraavaa säveltä.';return}
  gate.classList.remove('locked');gateIcon.textContent='🎵';gateTitle.textContent=`Anna ${currentNotes.length+1}. sävel`;gateSub.textContent='Peli kuuntelee nyt.';
}

function micIsRunning(){return Boolean(micEngine?.running)}
function updateButtons(){
  const g=Boolean(groupId());
  loginListenBtn.disabled=!(fbReady&&micIsRunning()&&g&&selectedLoginAnimal);
  loginClearBtn.disabled=!captureMode;
  reserveBtn.disabled=!(fbReady&&g&&selectedCreateAnimal&&nameInput.value.trim()&&!reserved);
}

function ensureMicrophoneEngine(){
  if(micEngine)return micEngine;
  const M=window.NuottikompassiMicrophoneEngine;
  if(!M)throw new Error('Sävelkojun mikrofonimoottoria ei voitu ladata.');
  micEngine=new M.MicrophoneEngine({...M.DEFAULTS,referenceEnabled:false,liveReferenceEnabled:false,reactionSpeed:5},microphoneOutput);
  return micEngine;
}
async function startMic(){
  try{const e=ensureMicrophoneEngine();await e.start();if(!e.running)return;micBtn.disabled=true;micBtn.textContent='Mikrofoni päällä';micStatus.textContent='Sävelkojun mikrofonimoottori kuuntelee.';updateButtons()}
  catch(err){console.error(err);micStatus.textContent='Mikrofonia ei saatu käyttöön. Käytä HTTPS-sivua ja anna mikrofonilupa.'}
}

function microphoneOutput(output){
  const dbv=Number(output.db);if(Number.isFinite(dbv))levelBar.style.width=Math.max(0,Math.min(100,(dbv+80)/70*100))+'%';
  if(output.status==='error'){micStatus.textContent=output.error||'Mikrofonivirhe';return}
  const now=performance.now();
  const silent=output.active===false&&(output.status==='waiting'||output.status==='holding');
  if(lockNeedsSilence&&now>=interNoteLockUntil){if(silent){postLockSilenceFrames++;if(postLockSilenceFrames>=POST_LOCK_SILENCE_FRAMES){lockNeedsSilence=false;postLockSilenceFrames=0}}else postLockSilenceFrames=0}
  updateGate();
  if(!captureMode||captureLocked||now<interNoteLockUntil||lockNeedsSilence)return;
  if(output.status!=='signal'||!output.active||!Number.isFinite(output.frequency))return;
  currentNotes.push({hz:output.frequency,confidence:Number(output.confidence)||0});renderHeard();
  if(currentNotes.length<3){startLock();captureMessage.textContent='Hyvä. Odota lukon avautumista.';if(captureMode==='verify'&&reserved)renderCode(assignedCode,reserved.code,currentNotes.length)}
  else{captureLocked=true;interNoteLockUntil=0;lockNeedsSilence=false;updateGate();finishCapturedCode()}
}

async function reserveRandomCode(){
  const g=groupId(),name=nameInput.value.trim(),animal=selectedCreateAnimal;if(!fbReady||!g||!name||!animal)return;
  reserveBtn.disabled=true;reserveBtn.textContent='Varataan…';hideResult();
  try{
    const order=shuffle(CODES);const groupRef=doc(db,'groups',g);const refs=order.map(c=>({code:c,ref:doc(db,'groups',g,'slots',`${animal}_${c}`)}));
    const picked=await runTransaction(db,async tx=>{
      const groupSnap=await tx.get(groupRef);
      const snaps=[];for(const item of refs)snaps.push(await tx.get(item.ref));
      const free=[];for(let i=0;i<refs.length;i++)if(!snaps[i].exists())free.push(refs[i]);
      if(!free.length)throw new Error('Tämän eläimen kaikki kuusi koodia ovat jo käytössä tässä ryhmässä.');
      const item=free[Math.floor(Math.random()*free.length)];
      if(!groupSnap.exists())tx.set(groupRef,{createdAt:serverTimestamp(),createdBy:user.uid});
      tx.set(item.ref,{name,animal,code:item.code,verified:false,ownerUid:user.uid,createdAt:serverTimestamp()});
      return {code:item.code,slotId:`${animal}_${item.code}`};
    });
    reserved={groupId:g,animal,code:picked.code,slotId:picked.slotId,name,ref:doc(db,'groups',g,'slots',picked.slotId)};
    releaseBtn.classList.remove('hidden');
    assignedWrap.classList.remove('hidden');renderCode(assignedCode,reserved.code);captureHeading.textContent=`${animalById(animal).face} ${name}: soita arvottu koodi`;
    captureMessage.textContent=codeWords(reserved.code);captureMode='verify';resetCapture();
  }catch(err){console.error(err);showResult('❌','Koodia ei voitu varata',err.message||String(err),'bad')}
  finally{reserveBtn.textContent='Arvo vapaa sävelkoodi';updateButtons()}
}

async function releaseReservation(){
  if(!reserved)return;
  try{await deleteDoc(reserved.ref)}catch(err){console.error(err)}
  reserved=null;captureMode=null;releaseBtn.classList.add('hidden');assignedWrap.classList.add('hidden');capturePanel.classList.add('hidden');captureMessage.textContent='';updateButtons();
}

function startLoginCapture(){
  hideResult();captureMode='login';assignedWrap.classList.add('hidden');captureHeading.textContent=`${animalById(selectedLoginAnimal).face} Soita kolmen sävelen koodisi`;captureMessage.textContent='';resetCapture();loginClearBtn.disabled=false;
}

async function finishCapturedCode(){
  const decoded=decodeRelativeCode(currentNotes);
  if(!decoded.ok){captureMessage.textContent=decoded.reason+' Yritä uudelleen.';setTimeout(resetCapture,1200);return}
  captureMessage.textContent=`Kuulin koodin ${decoded.code}.`;
  if(captureMode==='verify'){
    if(!reserved)return;
    if(decoded.code!==reserved.code){captureMessage.textContent=`Kuulin ${decoded.code}, mutta arvottu koodi on ${reserved.code}. Yritä uudelleen.`;setTimeout(()=>{resetCapture();renderCode(assignedCode,reserved.code)},1500);return}
    try{await updateDoc(reserved.ref,{verified:true,verifiedAt:serverTimestamp()});const a=animalById(reserved.animal);showResult(a.face,`${reserved.name} on valmis!`,`Ryhmä ${reserved.groupId} · ${a.name} · ${reserved.code}`,'ok');captureMode=null;capturePanel.classList.add('hidden');releaseBtn.classList.add('hidden');reserved=null;updateButtons()}
    catch(err){console.error(err);showResult('❌','Profiilia ei voitu vahvistaa',err.message||String(err),'bad')}
    return;
  }
  if(captureMode==='login'){
    const g=groupId(),animal=selectedLoginAnimal,slotId=`${animal}_${decoded.code}`;
    try{
      const snap=await getDoc(doc(db,'groups',g,'slots',slotId));
      if(!snap.exists()||snap.data().verified!==true){showResult('🔐','Tunnusta ei löytynyt',`${animalById(animal).name} + ${decoded.code} ei ole vahvistettu ryhmässä ${g}.`,'bad')}
      else{const p=snap.data(),a=animalById(animal);showResult(a.face,`Hei ${p.name}!`,`Ryhmä ${g} · ${a.name} · ${decoded.code}`,'ok')}
    }catch(err){console.error(err);showResult('❌','Firebase-haku epäonnistui',err.message||String(err),'bad')}
    captureMode=null;capturePanel.classList.add('hidden');loginClearBtn.disabled=true;
  }
}

function showResult(face,title,meta,kind=''){
  resultPanel.classList.remove('hidden');resultPanel.innerHTML=`<div class="face">${face}</div><div class="who ${kind}">${escapeHtml(title)}</div><div class="meta">${escapeHtml(meta)}</div>`;
}
function hideResult(){resultPanel.classList.add('hidden');resultPanel.innerHTML=''}
function switchMode(mode){
  screenMode=mode;loginTab.classList.toggle('active',mode==='login');createTab.classList.toggle('active',mode==='create');loginPanel.classList.toggle('hidden',mode!=='login');createPanel.classList.toggle('hidden',mode!=='create');captureMode=null;capturePanel.classList.add('hidden');hideResult();updateButtons();
}

renderAnimalButtons(loginAnimals,'login');renderAnimalButtons(createAnimals,'create');
loginTab.addEventListener('click',()=>switchMode('login'));createTab.addEventListener('click',()=>switchMode('create'));
groupInput.addEventListener('input',()=>{groupId();hideResult();updateButtons()});nameInput.addEventListener('input',updateButtons);
micBtn.addEventListener('click',startMic);reserveBtn.addEventListener('click',reserveRandomCode);releaseBtn.addEventListener('click',releaseReservation);
loginListenBtn.addEventListener('click',startLoginCapture);loginClearBtn.addEventListener('click',()=>{captureMode=null;capturePanel.classList.add('hidden');loginClearBtn.disabled=true});
retryBtn.addEventListener('click',()=>{if(captureMode){resetCapture();if(captureMode==='verify'&&reserved)renderCode(assignedCode,reserved.code)}});
window.addEventListener('pagehide',()=>{if(micEngine)micEngine.stop().catch(()=>{})});

initFirebase();updateButtons();
