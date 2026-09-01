import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, getDocs, updateDoc, deleteDoc, runTransaction, serverTimestamp, writeBatch, setDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const CODES=['LLH','LHL','LHH','HLL','HLH','HHL'];
const ANIMALS=[
  {id:'dog',face:'🐶',name:'Koira'},
  {id:'fox',face:'🦊',name:'Kettu'},
  {id:'rabbit',face:'🐰',name:'Pupu'},
  {id:'owl',face:'🦉',name:'Pöllö'},
  {id:'panda',face:'🐼',name:'Panda'}
];
const $=id=>document.getElementById(id);
const firebaseStatus=$('firebaseStatus'),teacherStatus=$('teacherStatus');
const loginPanel=$('loginPanel'),teacherApp=$('teacherApp'),teacherEmail=$('teacherEmail'),teacherPassword=$('teacherPassword'),loginBtn=$('loginBtn'),logoutBtn=$('logoutBtn'),authMessage=$('authMessage');
const refreshBtn=$('refreshBtn'),newGroupInput=$('newGroupInput'),createGroupBtn=$('createGroupBtn'),groupsEl=$('groups');
const groupPanel=$('groupPanel'),groupTitle=$('groupTitle'),groupMeta=$('groupMeta'),deleteGroupBtn=$('deleteGroupBtn'),membersEl=$('members');
const editorTitle=$('editorTitle'),playerName=$('playerName'),playerAnimal=$('playerAnimal'),playerCode=$('playerCode'),savePlayerBtn=$('savePlayerBtn'),cancelEditBtn=$('cancelEditBtn'),editorMessage=$('editorMessage');
const loginRequestsEl=$('loginRequests'),requestCount=$('requestCount');

let app=null,auth=null,db=null,user=null,fbReady=false;
let groups=[],selectedGroupId=null,currentMembers=[],editing=null;
let currentHomeCodes=new Map(),loginRequests=[],requestsUnsub=null;
let authMessageLocked=false;

function normalizeGroup(v){return String(v||'').trim().toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,16)}
function animalById(id){return ANIMALS.find(a=>a.id===id)||{face:'❔',name:id}}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]))}
function codeWords(code){return String(code||'').split('').map(x=>x==='L'?'matala':'korkea').join(' – ')}
function shuffle(a){const x=a.slice();for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x}
function setAuthMessage(text,bad=false){authMessage.textContent=text||'';authMessage.classList.toggle('bad',bad)}
function normalizeHomeCode(v){return String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8)}
function formatHomeCode(v){const raw=normalizeHomeCode(v);return raw.slice(0,4)+'-'+raw.slice(4)}
function generateHomeCode(){const alphabet='23456789ABCDEFGHJKLMNPQRSTUVWXYZ';const bytes=new Uint8Array(8);crypto.getRandomValues(bytes);return [...bytes].map(b=>alphabet[b%alphabet.length]).join('')}
async function sha256Hex(text){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(text)));return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('')}

function fillSelects(){
  playerAnimal.innerHTML=ANIMALS.map(a=>`<option value="${a.id}">${a.face} ${a.name}</option>`).join('');
  playerCode.innerHTML='<option value="AUTO">Arvo vapaa</option>'+CODES.map(c=>`<option value="${c}">${c} · ${codeWords(c)}</option>`).join('');
}
function updateButtons(){
  createGroupBtn.disabled=!(fbReady&&normalizeGroup(newGroupInput.value));
  savePlayerBtn.disabled=!(fbReady&&selectedGroupId&&playerName.value.trim());
}
function showLoggedOut(){
  if(requestsUnsub){requestsUnsub();requestsUnsub=null}loginRequests=[];renderLoginRequests();
  user=null;fbReady=false;teacherApp.classList.add('hidden');loginPanel.classList.remove('hidden');logoutBtn.classList.add('hidden');groupPanel.classList.add('hidden');selectedGroupId=null;groups=[];currentMembers=[];updateButtons();
  firebaseStatus.textContent='Firebase: valmis';firebaseStatus.classList.add('ok');
  teacherStatus.textContent='Kirjaudu opettajatunnuksella.';
  if(!authMessageLocked)setAuthMessage('');
  authMessageLocked=false;
}
async function authorize(current){
  try{
    const teacherSnap=await getDoc(doc(db,'teachers',current.uid));
    if(!teacherSnap.exists()){
      authMessageLocked=true;setAuthMessage('Tällä tunnuksella ei ole opettajan oikeuksia.',true);await signOut(auth);return;
    }
    user=current;fbReady=true;loginPanel.classList.add('hidden');teacherApp.classList.remove('hidden');logoutBtn.classList.remove('hidden');
    firebaseStatus.textContent='Firebase: valmis';firebaseStatus.classList.add('ok');
    teacherStatus.textContent=`Opettaja: ${current.email||current.uid}`;
    setAuthMessage('');updateButtons();startLoginRequestListener();await loadGroups();
  }catch(err){
    console.error(err);authMessageLocked=true;setAuthMessage('Opettajan oikeuksien tarkistus epäonnistui: '+(err.message||String(err)),true);await signOut(auth);
  }
}
async function initFirebase(){
  try{
    app=initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app);
    firebaseStatus.textContent='Firebase: valmis';firebaseStatus.classList.add('ok');
    onAuthStateChanged(auth,async current=>{
      if(!current){showLoggedOut();return}
      if(current.isAnonymous){await signOut(auth);return}
      await authorize(current);
    });
  }catch(err){console.error(err);firebaseStatus.textContent='Firebase: yhteys epäonnistui';firebaseStatus.classList.add('bad');teacherStatus.textContent=err.message||String(err)}
}
async function loginTeacher(){
  const email=teacherEmail.value.trim(),password=teacherPassword.value;
  if(!email||!password){setAuthMessage('Anna sähköposti ja salasana.',true);return}
  loginBtn.disabled=true;setAuthMessage('Kirjaudutaan…');
  try{await signInWithEmailAndPassword(auth,email,password);teacherPassword.value=''}
  catch(err){console.error(err);setAuthMessage('Kirjautuminen epäonnistui. Tarkista sähköposti ja salasana.',true)}
  finally{loginBtn.disabled=false}
}

function startLoginRequestListener(){
  if(requestsUnsub)requestsUnsub();
  requestsUnsub=onSnapshot(collection(db,'loginRequests'),snap=>{
    loginRequests=snap.docs.map(d=>({id:d.id,...d.data()})).filter(r=>r.status==='pending');
    loginRequests.sort((a,b)=>{const at=a.createdAt?.toMillis?.()||0,bt=b.createdAt?.toMillis?.()||0;return bt-at});
    renderLoginRequests();
  },err=>{console.error(err);loginRequestsEl.innerHTML=`<div class="empty bad">Kirjautumispyyntöjen kuuntelu epäonnistui: ${escapeHtml(err.message||String(err))}</div>`});
}
function renderLoginRequests(){
  if(!loginRequestsEl||!requestCount)return;
  requestCount.textContent=String(loginRequests.length);
  if(!loginRequests.length){loginRequestsEl.innerHTML='<div class="empty">Ei odottavia kirjautumisia.</div>';return}
  loginRequestsEl.innerHTML='';
  for(const r of loginRequests){
    const a=animalById(r.animal);
    const card=document.createElement('div');card.className='request-card';
    card.innerHTML=`<div class="face">${a.face}</div><div><div class="who">${escapeHtml(r.playerName||'Pelaaja')}?</div><div class="meta">Ryhmä ${escapeHtml(r.groupId||'')} · ${escapeHtml(a.name)} · ${escapeHtml(r.code||'')}</div></div><div class="actions"><button class="approve">Hyväksy</button><button class="danger reject">Hylkää</button></div>`;
    card.querySelector('.approve').addEventListener('click',()=>decideLoginRequest(r,'approved'));
    card.querySelector('.reject').addEventListener('click',()=>decideLoginRequest(r,'rejected'));
    loginRequestsEl.appendChild(card);
  }
}
async function decideLoginRequest(r,status){
  try{await updateDoc(doc(db,'loginRequests',r.id),{status,decidedAt:serverTimestamp(),decidedBy:user.uid})}
  catch(err){console.error(err);alert('Kirjautumispyyntöä ei voitu käsitellä: '+(err.message||String(err)))}
}

async function loadGroups(){
  if(!fbReady)return;
  groupsEl.innerHTML='<div class="empty">Ladataan ryhmiä…</div>';
  try{
    const snap=await getDocs(collection(db,'groups'));
    groups=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.id.localeCompare(b.id,'fi'));
    renderGroups();
    if(selectedGroupId&&!groups.some(g=>g.id===selectedGroupId)){selectedGroupId=null;groupPanel.classList.add('hidden')}
    if(selectedGroupId)await loadMembers();
  }catch(err){console.error(err);groupsEl.innerHTML=`<div class="empty bad">Ryhmien lataus epäonnistui: ${escapeHtml(err.message||String(err))}</div>`}
}
function renderGroups(){
  if(!groups.length){groupsEl.innerHTML='<div class="empty">Ei vielä ryhmiä. Luo ensimmäinen yllä.</div>';return}
  groupsEl.innerHTML='';
  for(const g of groups){
    const b=document.createElement('button');b.type='button';b.className='group-card'+(g.id===selectedGroupId?' active':'');
    b.innerHTML=`<span><b>${escapeHtml(g.id)}</b><div class="small">Avaa jäsenet</div></span><span>›</span>`;
    b.addEventListener('click',()=>selectGroup(g.id));groupsEl.appendChild(b);
  }
}
async function createGroup(){
  const id=normalizeGroup(newGroupInput.value);if(!fbReady||!id)return;
  createGroupBtn.disabled=true;
  try{
    const ref=doc(db,'groups',id);
    await runTransaction(db,async tx=>{
      const snap=await tx.get(ref);
      if(snap.exists())throw new Error('Tämä ryhmätunnus on jo käytössä.');
      tx.set(ref,{createdAt:serverTimestamp(),createdBy:user.uid,createdByTeacher:true});
    });
    newGroupInput.value='';await loadGroups();await selectGroup(id);
  }catch(err){console.error(err);alert(err.message||String(err))}finally{updateButtons()}
}
async function selectGroup(id){selectedGroupId=id;resetEditor();renderGroups();groupPanel.classList.remove('hidden');groupTitle.textContent=id;await loadMembers()}

async function loadMembers(){
  if(!selectedGroupId)return;
  membersEl.innerHTML='<div class="empty">Ladataan jäseniä…</div>';
  try{
    const [snap,homeSnap]=await Promise.all([
      getDocs(collection(db,'groups',selectedGroupId,'slots')),
      getDocs(collection(db,'groups',selectedGroupId,'homeCodes'))
    ]);
    currentMembers=snap.docs.map(d=>({slotId:d.id,data:d.data()})).sort((a,b)=>String(a.data.name||'').localeCompare(String(b.data.name||''),'fi'));
    currentHomeCodes=new Map(homeSnap.docs.map(d=>[d.id,d.data()]));
    renderMembers();
  }catch(err){console.error(err);membersEl.innerHTML=`<div class="empty bad">Jäsenten lataus epäonnistui: ${escapeHtml(err.message||String(err))}</div>`}
}
function renderMembers(){
  groupMeta.textContent=`${currentMembers.length} pelaajaa`;
  deleteGroupBtn.disabled=false;deleteGroupBtn.title='';
  if(!currentMembers.length){membersEl.innerHTML='<div class="empty">Ryhmässä ei vielä ole pelaajia.</div>';return}
  membersEl.innerHTML='';
  for(const m of currentMembers){
    const a=animalById(m.data.animal);
    const row=document.createElement('div');row.className='member';
    const home=currentHomeCodes.get(m.slotId);
    row.innerHTML=`<div class="face">${a.face}</div><div><div class="member-name">${escapeHtml(m.data.name||'Nimetön')}</div><div class="meta">${escapeHtml(a.name)} · <span class="code-preview">${escapeHtml(m.data.code||'')}</span> · ${escapeHtml(codeWords(m.data.code))}${m.data.verified===true?'':' · ei vahvistettu'} · <span class="home-state">kotikoodi ${home?'valmis':'puuttuu'}</span></div></div><div class="actions"><button class="secondary home">${home?'Näytä kotikoodi':'Luo kotikoodi'}</button>${home?'<button class="secondary regen">Uusi koodi</button>':''}<button class="secondary edit">Muokkaa</button><button class="danger del">Poista</button></div>`;
    row.querySelector('.home').addEventListener('click',()=>showOrCreateHomeCode(m));
    row.querySelector('.regen')?.addEventListener('click',()=>regenerateHomeCode(m));
    row.querySelector('.edit').addEventListener('click',()=>startEdit(m));row.querySelector('.del').addEventListener('click',()=>deletePlayer(m));membersEl.appendChild(row);
  }
}
async function writeHomeCode(m,raw){
  const hash=await sha256Hex(normalizeHomeCode(raw));
  await setDoc(doc(db,'groups',selectedGroupId,'homeCodes',m.slotId),{code:formatHomeCode(raw),hash,updatedAt:serverTimestamp(),updatedBy:user.uid});
  currentHomeCodes.set(m.slotId,{code:formatHomeCode(raw),hash});
}
async function showOrCreateHomeCode(m){
  const existing=currentHomeCodes.get(m.slotId);
  if(existing?.code){alert(`${m.data.name}

Kotikoodi: ${existing.code}`);return}
  try{const raw=generateHomeCode();await writeHomeCode(m,raw);renderMembers();alert(`${m.data.name}

Uusi kotikoodi: ${formatHomeCode(raw)}`)}
  catch(err){console.error(err);alert('Kotikoodia ei voitu luoda: '+(err.message||String(err)))}
}
async function regenerateHomeCode(m){
  if(!confirm(`Luodaanko pelaajalle ${m.data.name} uusi kotikoodi? Vanha koodi lakkaa toimimasta uusien laitteiden käyttöönotossa.`))return;
  try{const raw=generateHomeCode();await writeHomeCode(m,raw);renderMembers();alert(`${m.data.name}

Uusi kotikoodi: ${formatHomeCode(raw)}`)}
  catch(err){console.error(err);alert('Kotikoodia ei voitu vaihtaa: '+(err.message||String(err)))}
}

function resetEditor(){
  editing=null;editorTitle.textContent='Lisää pelaaja';savePlayerBtn.textContent='Lisää pelaaja';playerName.value='';playerAnimal.value='dog';playerCode.value='AUTO';cancelEditBtn.classList.add('hidden');editorMessage.textContent='';editorMessage.classList.remove('bad');updateButtons();
}
function startEdit(m){
  editing=m;editorTitle.textContent='Muokkaa pelaajaa';savePlayerBtn.textContent='Tallenna muutokset';playerName.value=m.data.name||'';playerAnimal.value=m.data.animal;playerCode.value=m.data.code;cancelEditBtn.classList.remove('hidden');editorMessage.textContent='';editorMessage.classList.remove('bad');updateButtons();playerName.focus();
}
async function findFreeCode(animal,preferred,ignoreSlotId=null){
  const order=preferred&&preferred!=='AUTO'?[preferred]:shuffle(CODES);
  for(const code of order){
    const slotId=`${animal}_${code}`;
    if(slotId===ignoreSlotId)return code;
    const snap=await getDoc(doc(db,'groups',selectedGroupId,'slots',slotId));
    if(!snap.exists())return code;
  }
  throw new Error(preferred&&preferred!=='AUTO'?'Valittu eläin + sävelkoodi on jo käytössä.':'Tämän eläimen kaikki kuusi koodia ovat jo käytössä tässä ryhmässä.');
}
async function createVerifiedSlot(name,animal,code){
  const slotId=`${animal}_${code}`,ref=doc(db,'groups',selectedGroupId,'slots',slotId);
  await runTransaction(db,async tx=>{
    const snap=await tx.get(ref);if(snap.exists())throw new Error('Valittu eläin + sävelkoodi on jo käytössä.');
    tx.set(ref,{name,animal,code,verified:false,ownerUid:user.uid,createdAt:serverTimestamp(),createdByTeacherView:true});
  });
  try{await updateDoc(ref,{verified:true,verifiedAt:serverTimestamp()})}
  catch(err){try{await deleteDoc(ref)}catch{}throw err}
  return {slotId,ref};
}
async function savePlayer(){
  const name=playerName.value.trim();if(!name||!selectedGroupId)return;
  const animal=playerAnimal.value,requested=playerCode.value;
  savePlayerBtn.disabled=true;editorMessage.textContent='Tallennetaan…';editorMessage.classList.remove('bad');
  try{
    if(!editing){
      const code=await findFreeCode(animal,requested);await createVerifiedSlot(name,animal,code);
    }else{
      const oldSlotId=editing.slotId,code=await findFreeCode(animal,requested,oldSlotId),newSlotId=`${animal}_${code}`;
      if(newSlotId===oldSlotId){
        await updateDoc(doc(db,'groups',selectedGroupId,'slots',oldSlotId),{name,animal,code,verified:true,updatedAt:serverTimestamp()});
      }else{
        const created=await createVerifiedSlot(name,animal,code);
        try{
          const oldHome=currentHomeCodes.get(oldSlotId);
          if(oldHome){await setDoc(doc(db,'groups',selectedGroupId,'homeCodes',newSlotId),{...oldHome,updatedAt:serverTimestamp(),updatedBy:user.uid});await deleteDoc(doc(db,'groups',selectedGroupId,'homeCodes',oldSlotId))}
          await deleteDoc(doc(db,'groups',selectedGroupId,'slots',oldSlotId));
        }
        catch(err){try{await deleteDoc(created.ref)}catch{}throw err}
      }
    }
    await loadMembers();resetEditor();
  }catch(err){console.error(err);editorMessage.textContent=err.message||String(err);editorMessage.classList.add('bad')}
  finally{updateButtons()}
}
async function deletePlayer(m){
  if(!confirm(`Poistetaanko pelaaja ${m.data.name}?`))return;
  try{
    const batch=writeBatch(db);batch.delete(doc(db,'groups',selectedGroupId,'slots',m.slotId));batch.delete(doc(db,'groups',selectedGroupId,'homeCodes',m.slotId));await batch.commit();
    if(editing?.slotId===m.slotId)resetEditor();await loadMembers();
  }
  catch(err){console.error(err);alert(err.message||String(err))}
}
async function deleteGroup(){
  if(!selectedGroupId)return;
  if(!confirm(`Poistetaanko ryhmä ${selectedGroupId} ja sen ${currentMembers.length} pelaajaa?`))return;
  try{
    const batch=writeBatch(db);for(const m of currentMembers){batch.delete(doc(db,'groups',selectedGroupId,'slots',m.slotId));batch.delete(doc(db,'groups',selectedGroupId,'homeCodes',m.slotId))}batch.delete(doc(db,'groups',selectedGroupId));await batch.commit();
    selectedGroupId=null;groupPanel.classList.add('hidden');await loadGroups();
  }catch(err){console.error(err);alert('Ryhmäpoisto epäonnistui.\n\n'+(err.message||String(err)))}
}

newGroupInput.addEventListener('input',()=>{const n=normalizeGroup(newGroupInput.value);if(newGroupInput.value!==n)newGroupInput.value=n;updateButtons()});
createGroupBtn.addEventListener('click',createGroup);refreshBtn.addEventListener('click',loadGroups);savePlayerBtn.addEventListener('click',savePlayer);cancelEditBtn.addEventListener('click',resetEditor);deleteGroupBtn.addEventListener('click',deleteGroup);playerName.addEventListener('input',updateButtons);
loginBtn.addEventListener('click',loginTeacher);teacherPassword.addEventListener('keydown',e=>{if(e.key==='Enter')loginTeacher()});logoutBtn.addEventListener('click',()=>signOut(auth));
fillSelects();resetEditor();initFirebase();
