import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, getDocs, updateDoc, deleteDoc, query, where, runTransaction, serverTimestamp, writeBatch } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';
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
const firebaseStatus=$('firebaseStatus'),teacherStatus=$('teacherStatus'),refreshBtn=$('refreshBtn');
const newGroupInput=$('newGroupInput'),createGroupBtn=$('createGroupBtn'),groupsEl=$('groups');
const groupPanel=$('groupPanel'),groupTitle=$('groupTitle'),groupMeta=$('groupMeta'),deleteGroupBtn=$('deleteGroupBtn'),membersEl=$('members');
const editorTitle=$('editorTitle'),playerName=$('playerName'),playerAnimal=$('playerAnimal'),playerCode=$('playerCode'),savePlayerBtn=$('savePlayerBtn'),cancelEditBtn=$('cancelEditBtn'),editorMessage=$('editorMessage');

let app=null,auth=null,db=null,user=null,fbReady=false;
let groups=[],selectedGroupId=null,currentMembers=[],editing=null;

function normalizeGroup(v){return String(v||'').trim().toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,16)}
function animalById(id){return ANIMALS.find(a=>a.id===id)||{face:'❔',name:id}}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]))}
function codeWords(code){return String(code||'').split('').map(x=>x==='L'?'matala':'korkea').join(' – ')}
function shuffle(a){const x=a.slice();for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x}

function fillSelects(){
  playerAnimal.innerHTML=ANIMALS.map(a=>`<option value="${a.id}">${a.face} ${a.name}</option>`).join('');
  playerCode.innerHTML='<option value="AUTO">Arvo vapaa</option>'+CODES.map(c=>`<option value="${c}">${c} · ${codeWords(c)}</option>`).join('');
}
function updateButtons(){
  createGroupBtn.disabled=!(fbReady&&normalizeGroup(newGroupInput.value));
  savePlayerBtn.disabled=!(fbReady&&selectedGroupId&&playerName.value.trim());
}

async function initFirebase(){
  try{
    app=initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app);
    const cred=await signInAnonymously(auth);user=cred.user;fbReady=true;
    firebaseStatus.textContent='Firebase: valmis';firebaseStatus.classList.add('ok');
    teacherStatus.textContent=`Opettajan prototyyppi · selain-ID ${user.uid.slice(0,8)}…`;
    updateButtons();await loadGroups();
  }catch(err){console.error(err);firebaseStatus.textContent='Firebase: yhteys epäonnistui';firebaseStatus.classList.add('bad');teacherStatus.textContent=err.message||String(err)}
}

async function loadGroups(){
  if(!fbReady)return;
  groupsEl.innerHTML='<div class="empty">Ladataan ryhmiä…</div>';
  try{
    const q=query(collection(db,'groups'),where('createdBy','==',user.uid));
    const snap=await getDocs(q);
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
      if(snap.exists()){
        if(snap.data().createdBy!==user.uid)throw new Error('Tämä ryhmätunnus on jo käytössä.');
        return;
      }
      tx.set(ref,{createdAt:serverTimestamp(),createdBy:user.uid});
    });
    newGroupInput.value='';await loadGroups();await selectGroup(id);
  }catch(err){console.error(err);alert(err.message||String(err))}finally{updateButtons()}
}
async function selectGroup(id){selectedGroupId=id;resetEditor();renderGroups();groupPanel.classList.remove('hidden');groupTitle.textContent=id;await loadMembers()}

async function loadMembers(){
  if(!selectedGroupId)return;
  membersEl.innerHTML='<div class="empty">Ladataan jäseniä…</div>';
  try{
    const snap=await getDocs(collection(db,'groups',selectedGroupId,'slots'));
    currentMembers=snap.docs.map(d=>({slotId:d.id,data:d.data()})).sort((a,b)=>String(a.data.name||'').localeCompare(String(b.data.name||''),'fi'));
    renderMembers();
  }catch(err){console.error(err);membersEl.innerHTML=`<div class="empty bad">Jäsenten lataus epäonnistui: ${escapeHtml(err.message||String(err))}</div>`}
}
function renderMembers(){
  const editableCount=currentMembers.filter(m=>m.data.ownerUid===user.uid).length;
  groupMeta.textContent=`${currentMembers.length} pelaajaa · ${editableCount} muokattavissa tällä selaimella`;
  deleteGroupBtn.disabled=currentMembers.some(m=>m.data.ownerUid!==user.uid);
  deleteGroupBtn.title=deleteGroupBtn.disabled?'Ryhmässä on toisella laitteella luotuja profiileja.':'';
  if(!currentMembers.length){membersEl.innerHTML='<div class="empty">Ryhmässä ei vielä ole pelaajia.</div>';return}
  membersEl.innerHTML='';
  for(const m of currentMembers){
    const a=animalById(m.data.animal),canEdit=m.data.ownerUid===user.uid;
    const row=document.createElement('div');row.className='member';
    row.innerHTML=`<div class="face">${a.face}</div><div><div class="member-name">${escapeHtml(m.data.name||'Nimetön')}</div><div class="meta">${escapeHtml(a.name)} · <span class="code-preview">${escapeHtml(m.data.code||'')}</span> · ${escapeHtml(codeWords(m.data.code))}${m.data.verified===true?'':' · ei vahvistettu'}${canEdit?'':' · 🔒 toisella laitteella luotu'}</div></div><div class="actions"><button class="secondary edit">Muokkaa</button><button class="danger del">Poista</button></div>`;
    const edit=row.querySelector('.edit'),del=row.querySelector('.del');edit.disabled=!canEdit;del.disabled=!canEdit;
    edit.addEventListener('click',()=>startEdit(m));del.addEventListener('click',()=>deletePlayer(m));membersEl.appendChild(row);
  }
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
      if(editing.data.ownerUid!==user.uid)throw new Error('Tätä profiilia ei voi muokata tällä selaimella.');
      const oldSlotId=editing.slotId,code=await findFreeCode(animal,requested,oldSlotId),newSlotId=`${animal}_${code}`;
      if(newSlotId===oldSlotId){
        await updateDoc(doc(db,'groups',selectedGroupId,'slots',oldSlotId),{name,animal,code,verified:true,updatedAt:serverTimestamp()});
      }else{
        const created=await createVerifiedSlot(name,animal,code);
        try{await deleteDoc(doc(db,'groups',selectedGroupId,'slots',oldSlotId))}
        catch(err){try{await deleteDoc(created.ref)}catch{}throw err}
      }
    }
    await loadMembers();resetEditor();
  }catch(err){console.error(err);editorMessage.textContent=err.message||String(err);editorMessage.classList.add('bad')}
  finally{updateButtons()}
}
async function deletePlayer(m){
  if(m.data.ownerUid!==user.uid)return;
  if(!confirm(`Poistetaanko pelaaja ${m.data.name}?`))return;
  try{await deleteDoc(doc(db,'groups',selectedGroupId,'slots',m.slotId));if(editing?.slotId===m.slotId)resetEditor();await loadMembers()}
  catch(err){console.error(err);alert(err.message||String(err))}
}
async function deleteGroup(){
  if(!selectedGroupId)return;
  if(currentMembers.some(m=>m.data.ownerUid!==user.uid)){alert('Ryhmässä on toisella laitteella luotuja profiileja, joten tätä ryhmää ei poisteta tässä versiossa.');return}
  if(!confirm(`Poistetaanko ryhmä ${selectedGroupId} ja sen ${currentMembers.length} pelaajaa?`))return;
  try{
    const batch=writeBatch(db);for(const m of currentMembers)batch.delete(doc(db,'groups',selectedGroupId,'slots',m.slotId));batch.delete(doc(db,'groups',selectedGroupId));await batch.commit();
    selectedGroupId=null;groupPanel.classList.add('hidden');await loadGroups();
  }catch(err){console.error(err);alert('Ryhmäpoisto epäonnistui. Julkaise tämän version mukana oleva firestore.rules ja yritä uudelleen.\n\n'+(err.message||String(err)))}
}

newGroupInput.addEventListener('input',()=>{const n=normalizeGroup(newGroupInput.value);if(newGroupInput.value!==n)newGroupInput.value=n;updateButtons()});
createGroupBtn.addEventListener('click',createGroup);refreshBtn.addEventListener('click',loadGroups);savePlayerBtn.addEventListener('click',savePlayer);cancelEditBtn.addEventListener('click',resetEditor);deleteGroupBtn.addEventListener('click',deleteGroup);playerName.addEventListener('input',updateButtons);
fillSelects();resetEditor();initFirebase();
