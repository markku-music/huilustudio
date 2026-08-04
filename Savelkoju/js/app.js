(()=>{
'use strict';

let NOTES=['H','A','G'];
const ALL_NOTES=['H','A','G','C','F','D','E'];
const positions={
  H:{x:323,y:550,cx:364,cy:591},
  A:{x:587,y:550,cx:628,cy:591},
  G:{x:852,y:550,cx:893,cy:591},
  C:{x:1116,y:550,cx:1157,cy:591},
  F:{x:323,y:279,cx:364,cy:320},
  D:{x:587,y:279,cx:628,cy:320},
  E:{x:852,y:279,cx:893,cy:320}
};
const pitchClassToFinnish={11:'H',9:'A',7:'G',0:'C',5:'F',2:'D',4:'E'};
const reticle=document.getElementById('reticle');
const spark=document.getElementById('spark');
const targetFlash=document.getElementById('targetFlash');
const pling=document.getElementById('pling');
const targetZones={
  H:document.getElementById('zoneH'),
  A:document.getElementById('zoneA'),
  G:document.getElementById('zoneG'),
  C:document.getElementById('zoneC'),
  F:document.getElementById('zoneF'),
  D:document.getElementById('zoneD'),
  E:document.getElementById('zoneE')
};
const targetLabel=document.getElementById('targetLabel');
const scoreValue=document.getElementById('scoreValue');
const roundValue=document.getElementById('roundValue');
const cabinetCount=document.getElementById('cabinetCount');
const message=document.getElementById('message');
const meter=document.getElementById('meter');
const listen=document.getElementById('listen');
const stage=document.getElementById('stage');

const prizeCatalog=[
  {id:'bear',icon:'🧸',name:'Nalle'},
  {id:'train',icon:'🚂',name:'Pieni veturi'},
  {id:'dino',icon:'🦖',name:'Dinosaurus'},
  {id:'frog',icon:'🐸',name:'Sammakko'},
  {id:'trumpet',icon:'🎺',name:'Trumpetti'},
  {id:'star',icon:'⭐',name:'Kultatähti'},
  {id:'duck',icon:'🦆',name:'Kumiankka'},
  {id:'crown',icon:'👑',name:'Kruunu'},
  {id:'robot',icon:'🤖',name:'Robotti'},
  {id:'gift',icon:'🎁',name:'Yllätyspaketti'}
];


const DEFAULT_LEVELS=[
  {id:'level_hag',name:'Aloittelija',stars:1,order:1,notes:['H','A','G'],unlockNote:null,targetTime:8,requiredPerfectRuns:10,active:true},
  {id:'level_c',name:'Soittaja',stars:2,order:2,notes:['H','A','G','C'],unlockNote:'C',targetTime:10,requiredPerfectRuns:10,active:true},
  {id:'level_f',name:'Säveltaitaja',stars:3,order:3,notes:['H','A','G','C','F'],unlockNote:'F',targetTime:12,requiredPerfectRuns:10,active:true},
  {id:'level_d',name:'Mestari',stars:4,order:4,notes:['H','A','G','C','F','D'],unlockNote:'D',targetTime:14,requiredPerfectRuns:10,active:true},
  {id:'level_e',name:'Virtuoosi',stars:5,order:5,notes:['H','A','G','C','F','D','E'],unlockNote:'E',targetTime:16,requiredPerfectRuns:10,active:true}
];
let levelConfig=DEFAULT_LEVELS.map(x=>({...x,notes:[...x.notes]}));
let currentLevel=levelConfig[0];
let currentPlayerProgress={};
let currentUnlockedLevelIds=['level_hag'];
let teacherPlayMode=false;
let teacherAdminUid=null;

let target='A';
let cabinetWasOpenedDuringGame=false;
let cabinetOpenedFromPrize=false;
let pausedBeforeCabinet=false;
let score=0;
let round=1;
let running=false;
let paused=false;
let accepting=true;
let aimTime=0;
let microphoneEngine=null;
let lastAccepted=0;
let roundStartedAt=0;
let missCount=0;

let currentPlayerName='';
let currentPlayerKey='';
let currentPlayerId='';
let currentPlayerCode='';
let currentPlayerAuthEmail='';
let cabinet=[];
let pendingPlayer=null;

// Lisää uuden Sävelkoju-Firebase-projektin asetukset tähän.
const FIREBASE_CONFIG={
  apiKey:'AIzaSyCHSTODIddId7jxP41X315gx4s-pfQ1l44',
  authDomain:'savelkoju.firebaseapp.com',
  projectId:'savelkoju',
  storageBucket:'savelkoju.firebasestorage.app',
  messagingSenderId:'628559357855',
  appId:'1:628559357855:web:af1896e724516187abbfaa'
};
const firebaseReady=Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId && window.firebase);
let db=null;
let auth=null;
let persistenceEnabled=false;
if(firebaseReady){
  if(!firebase.apps.length)firebase.initializeApp(FIREBASE_CONFIG);
  db=firebase.firestore();
  auth=firebase.auth();
  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(console.warn);
  db.enablePersistence({synchronizeTabs:true}).then(()=>{
    persistenceEnabled=true;
    const badge=document.getElementById('syncBadge');
    if(badge)badge.textContent='☁️ Firebase + offline-välimuisti';
  }).catch(err=>{
    console.warn('Firestoren offline-välimuistia ei voitu ottaa käyttöön',err);
  });
}

document.getElementById('syncBadge').textContent=firebaseReady?'☁️ Firebase käytössä':'💾 Paikallinen testitila';

function normalizePlayerKey(name){
  return name.trim().toLocaleLowerCase('fi-FI').replace(/\s+/g,' ').normalize('NFKC');
}
function randomCode(){ return String(Math.floor(100+Math.random()*900)); }
async function uniqueRandomCode(){
  const local=await localPlayers();
  const used=new Set(local.map(p=>String(p.code)));
  for(let i=0;i<1000;i++){const code=randomCode();if(!used.has(code))return code;}
  throw new Error('Vapaita kolminumeroisia pelikoodeja ei löytynyt.');
}
function randomId(){ return (crypto.randomUUID?.() || ('p_'+Date.now()+'_'+Math.random().toString(36).slice(2))); }
const LOCAL_PLAYERS_KEY='savelkojuPlayersV2';
const LEGACY_PLAYERS_KEY='savelkojuPlayers';
const DB_NAME='SavelkojuLocalDB';
const DB_STORE='data';
let memoryStore={players:[],recent:[]};
function compactCabinet(cabinet){
  if(!Array.isArray(cabinet))return [];
  return cabinet.map(item=>{
    if(typeof item==='string')return item;
    if(item&&typeof item==='object'&&item.id)return String(item.id);
    return null;
  }).filter(Boolean).slice(0,500);
}
function expandCabinet(cabinetIds){
  const byId=new Map(prizeCatalog.map(p=>[String(p.id),p]));
  return compactCabinet(cabinetIds).map(id=>byId.get(String(id))).filter(Boolean);
}
const PLAYER_AVATARS=['🦊','🐼','🐻','🐰','🦉','🐸','🦁','🐧'];
function fallbackAvatar(seed=''){let n=0;for(const ch of String(seed))n=(n*31+ch.codePointAt(0))>>>0;return PLAYER_AVATARS[n%PLAYER_AVATARS.length];}
let selectedNewAvatar=PLAYER_AVATARS[0];
function renderAvatarChoices(){const box=document.getElementById('avatarChoices');if(!box)return;box.innerHTML='';PLAYER_AVATARS.forEach((avatar,i)=>{const b=document.createElement('button');b.type='button';b.className='avatarChoice'+(avatar===selectedNewAvatar?' selected':'');b.textContent=avatar;b.setAttribute('aria-label','Valitse hahmo '+avatar);b.setAttribute('aria-pressed',avatar===selectedNewAvatar?'true':'false');b.addEventListener('click',()=>{selectedNewAvatar=avatar;renderAvatarChoices()});box.appendChild(b)});}
function compactPlayer(player){
  return {
    id:String(player.id||randomId()),
    displayName:String(player.displayName||'Pelaaja').slice(0,60),
    displayNameLower:normalizePlayerKey(player.displayNameLower||player.displayName||'Pelaaja'),
    code:String(player.code||randomCode()).replace(/\D/g,'').slice(0,3),
    avatar:String(player.avatar||fallbackAvatar(player.id||player.displayName)).slice(0,4),
    cabinetIds:compactCabinet(Array.isArray(player.cabinet)?player.cabinet:player.cabinetIds),
    createdAt:Number(player.createdAt)||Date.now(),
    lastPlayedAt:Number(player.lastPlayedAt)||Date.now(),
    updatedAt:Number(player.updatedAt)||Date.now(),
    currentLevelId:String(player.currentLevelId||'level_hag'),
    unlockedLevelIds:Array.isArray(player.unlockedLevelIds)&&player.unlockedLevelIds.length?player.unlockedLevelIds.map(String):['level_hag'],
    levelProgress:(player.levelProgress&&typeof player.levelProgress==='object')?player.levelProgress:{}
  };
}
function hydratePlayer(player){
  const compact=compactPlayer(player);
  return {...player,...compact,cabinet:expandCabinet(compact.cabinetIds)};
}
function openLocalDb(){
  return new Promise((resolve,reject)=>{
    if(!('indexedDB' in window))return reject(new Error('IndexedDB ei ole käytettävissä'));
    const req=indexedDB.open(DB_NAME,1);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(DB_STORE))req.result.createObjectStore(DB_STORE);};
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('Tietokantaa ei voitu avata'));
  });
}
async function dbGet(key,fallback){
  try{
    const db=await openLocalDb();
    return await new Promise((resolve,reject)=>{
      const tx=db.transaction(DB_STORE,'readonly');
      const req=tx.objectStore(DB_STORE).get(key);
      req.onsuccess=()=>resolve(req.result===undefined?fallback:req.result);
      req.onerror=()=>reject(req.error);
      tx.oncomplete=()=>db.close();
    });
  }catch(e){console.warn(e);return memoryStore[key]??fallback;}
}
async function dbSet(key,value){
  memoryStore[key]=value;
  try{
    const db=await openLocalDb();
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(DB_STORE,'readwrite');
      tx.objectStore(DB_STORE).put(value,key);
      tx.oncomplete=resolve;
      tx.onerror=()=>reject(tx.error);
      tx.onabort=()=>reject(tx.error);
    });
    db.close();
  }catch(e){console.warn('IndexedDB-tallennus epäonnistui, käytetään muistia',e);}
}
let migrationDone=false;
async function migrateOldLocalStorage(){
  if(migrationDone)return;
  migrationDone=true;
  let migrated=[];
  try{
    const raw=localStorage.getItem(LOCAL_PLAYERS_KEY)||localStorage.getItem(LEGACY_PLAYERS_KEY);
    if(raw)migrated=(JSON.parse(raw)||[]).map(compactPlayer);
  }catch(e){console.warn('Vanhaa pelaajatietoa ei voitu lukea',e);}
  try{
    localStorage.removeItem(LOCAL_PLAYERS_KEY);
    localStorage.removeItem(LEGACY_PLAYERS_KEY);
    localStorage.removeItem('savelkojuRecentPlayers');
  }catch(e){}
  const existing=await dbGet('players',[]);
  if((!existing||!existing.length)&&migrated.length)await dbSet('players',migrated);
}
async function localPlayers(){
  await migrateOldLocalStorage();
  return (await dbGet('players',[])).map(hydratePlayer);
}
async function saveLocalPlayers(players){
  await migrateOldLocalStorage();
  await dbSet('players',players.map(compactPlayer));
}
function playerAuthEmail(id){
  return `player-${String(id).replace(/[^a-zA-Z0-9_-]/g,'')}@savelkoju.app`;
}
function playerPassword(code){ return `Skj!${String(code).replace(/\D/g,'').slice(0,3)}`; }
function publicPlayer(player){
  const p=compactPlayer(player);
  return {
    displayName:p.displayName,
    displayNameLower:p.displayNameLower,
    avatar:p.avatar,
    authEmail:String(player.authEmail||playerAuthEmail(p.id)),
    cabinetCount:p.cabinetIds.length,
    lastPlayedAt:p.lastPlayedAt,
    createdAt:p.createdAt,
    updatedAt:p.updatedAt,
    currentLevelId:p.currentLevelId,
    highestStars:Math.max(1,...p.unlockedLevelIds.map(id=>levelConfig.find(l=>l.id===id)?.stars||1))
  };
}
async function searchPublicPlayers(prefix, pageSize=20, afterDoc=null){
  if(!db){
    const q=normalizePlayerKey(prefix||'');
    return {players:(await localPlayers()).filter(p=>!q||p.displayNameLower.startsWith(q)).slice(0,pageSize),lastDoc:null};
  }
  let qref=db.collection('publicPlayers').orderBy('displayNameLower');
  const q=normalizePlayerKey(prefix||'');
  if(q)qref=qref.startAt(q).endAt(q+'\uf8ff');
  if(afterDoc)qref=qref.startAfter(afterDoc);
  const snap=await qref.limit(pageSize).get();
  return {players:snap.docs.map(d=>hydratePlayer({id:d.id,...d.data(),cabinetIds:[]})),lastDoc:snap.docs.at(-1)||null};
}
async function allPlayers(options={}){
  if(db){
    if(!auth?.currentUser)throw new Error('Kirjaudu opettajana nähdäksesi kaikki pelaajat.');
    let q=db.collection('players');
    if(options.search){
      const n=normalizePlayerKey(options.search);
      q=q.orderBy('displayNameLower').startAt(n).endAt(n+'\uf8ff');
    }else q=q.orderBy('lastPlayedAt','desc');
    if(options.afterDoc)q=q.startAfter(options.afterDoc);
    const snap=await q.limit(options.limit||50).get();
    return {players:snap.docs.map(d=>hydratePlayer({id:d.id,...d.data()})),lastDoc:snap.docs.at(-1)||null};
  }
  const list=await localPlayers();
  return {players:list,lastDoc:null};
}
async function getPlayer(id){
  if(db){
    const d=await db.collection('players').doc(id).get();
    return d.exists?hydratePlayer({id:d.id,...d.data()}):null;
  }
  const list=await localPlayers();
  return list.find(p=>p.id===id)||null;
}
async function writePlayer(player){
  player.updatedAt=Date.now();
  if(db){
    if(!auth?.currentUser)throw new Error('Pelaajaistunto ei ole aktiivinen.');
    if(auth.currentUser.uid!==player.id&&!teacherPlayMode)throw new Error('Pelaajaistunto ei ole aktiivinen.');
    const compact=compactPlayer(player);
    compact.authEmail=String(player.authEmail||playerAuthEmail(player.id));
    const batch=db.batch();
    batch.set(db.collection('players').doc(player.id),compact,{merge:true});
    batch.set(db.collection('publicPlayers').doc(player.id),publicPlayer({...player,...compact}),{merge:true});
    await batch.commit();
    return;
  }
  const list=await localPlayers();
  const i=list.findIndex(p=>p.id===player.id);
  if(i>=0)list[i]=player;else list.push(player);
  await saveLocalPlayers(list);
}
async function adminWritePlayer(player){
  player.updatedAt=Date.now();
  const compact=compactPlayer(player);
  compact.authEmail=String(player.authEmail||playerAuthEmail(player.id));
  const batch=db.batch();
  batch.set(db.collection('players').doc(player.id),compact,{merge:true});
  batch.set(db.collection('publicPlayers').doc(player.id),publicPlayer({...player,...compact}),{merge:true});
  await batch.commit();
}
async function deletePlayer(id,code){
  if(db){
    const batch=db.batch();
    batch.delete(db.collection('players').doc(id));
    batch.delete(db.collection('publicPlayers').doc(id));
    if(code)batch.delete(db.collection('playerCodes').doc(String(code)));
    await batch.commit();
    return;
  }
  const list=await localPlayers();
  await saveLocalPlayers(list.filter(p=>p.id!==id));
}
async function reserveUniqueCode(uid){
  for(let i=0;i<1000;i++){
    const code=randomCode();
    try{
      await db.runTransaction(async tx=>{
        const ref=db.collection('playerCodes').doc(code);
        const snap=await tx.get(ref);
        if(snap.exists)throw new Error('CODE_TAKEN');
        tx.set(ref,{uid,createdAt:Date.now()});
      });
      return code;
    }catch(err){
      if(err?.message!=='CODE_TAKEN')throw err;
    }
  }
  throw new Error('Vapaita kolminumeroisia pelikoodeja ei löytynyt.');
}
async function recentIds(){ await migrateOldLocalStorage(); return await dbGet('recent',[]); }
async function rememberRecent(id){
  const old=await recentIds();
  const ids=[id,...old.filter(x=>x!==id)].slice(0,10);
  await dbSet('recent',ids);
}
async function renderRecent(){
  const box=document.getElementById('recentPlayers'); box.innerHTML='';
  const ids=await recentIds();
  const recent=[];
  for(const id of ids){
    try{
      if(db){
        const d=await db.collection('publicPlayers').doc(id).get();
        if(d.exists)recent.push(hydratePlayer({id:d.id,...d.data(),cabinetIds:[]}));
      }else{
        const p=await getPlayer(id); if(p)recent.push(p);
      }
    }catch(e){console.warn(e);}
  }
  document.getElementById('recentSection').style.display=recent.length?'block':'none';
  recent.forEach(p=>box.appendChild(playerButton(p)));
}
function playerButton(p){
  const b=document.createElement('button'); b.className='playerPick'; b.type='button';
  b.innerHTML=`${escapeHtml(p.displayName)}<small>${Number.isFinite(p.cabinetCount)?p.cabinetCount:(p.cabinet||[]).length} palkintoa</small>`;
  b.addEventListener('click',()=>askCode(p)); return b;
}
function escapeHtml(v){const d=document.createElement('div');d.textContent=String(v??'');return d.innerHTML;}
function showStartView(id){
  ['homeView','searchView','newView'].forEach(x=>document.getElementById(x).classList.toggle('hidden',x!==id));
  if(id==='homeView')renderRecent();
}
function askCode(player){
  pendingPlayer=player;
  document.getElementById('generatedCode').classList.add('hidden');
  document.getElementById('playerCode').classList.remove('hidden');
  document.getElementById('codeCancel').classList.remove('hidden');
  document.getElementById('codeContinue').textContent='Jatka peliä';
  document.getElementById('codeTitle').textContent='Anna pelikoodisi';
  document.getElementById('codeHelp').textContent=player.displayName;
  document.getElementById('playerCode').value=''; document.getElementById('codeError').textContent='';
  document.getElementById('codeOverlay').style.display='grid'; document.getElementById('playerCode').focus();
}
async function selectPlayer(player){
  currentPlayerId=player.id; currentPlayerName=player.displayName; currentPlayerKey=normalizePlayerKey(currentPlayerName);
  currentPlayerCode=player.code; currentPlayerAuthEmail=String(player.authEmail||playerAuthEmail(player.id)); cabinet=Array.isArray(player.cabinet)?player.cabinet:[];
  cabinetCount.textContent=cabinet.length; await rememberRecent(player.id);
  normalizeProgress(player);updatePlayerBadge();
  player.lastPlayedAt=Date.now(); await writePlayer(player);
}

for(let i=0;i<14;i++){
  const b=document.createElement('span');
  b.className='bar';
  meter.appendChild(b);
}

async function loadLevelConfig(){
  if(!db){levelConfig=DEFAULT_LEVELS.map(x=>({...x,notes:[...x.notes]}));return levelConfig;}
  try{
    const snap=await db.collection('gameConfig').doc('levels').collection('items').orderBy('order').get();
    if(!snap.empty){
      levelConfig=snap.docs.map(d=>({id:d.id,...d.data()}))
        .filter(x=>x.active!==false&&Array.isArray(x.notes)&&x.notes.length)
        .map((x,i)=>({name:'Taso '+(i+1),stars:i+1,requiredPerfectRuns:10,targetTime:null,active:true,...x,notes:x.notes.map(String)}))
        .sort((a,b)=>(a.order||0)-(b.order||0));
    }else levelConfig=DEFAULT_LEVELS.map(x=>({...x,notes:[...x.notes]}));
  }catch(err){console.warn('Tasomäärityksiä ei voitu ladata, käytetään oletuksia',err);levelConfig=DEFAULT_LEVELS.map(x=>({...x,notes:[...x.notes]}));}
  return levelConfig;
}
function normalizeProgress(player){
  currentPlayerProgress=(player?.levelProgress&&typeof player.levelProgress==='object')?structuredClone(player.levelProgress):{};
  currentUnlockedLevelIds=Array.isArray(player?.unlockedLevelIds)&&player.unlockedLevelIds.length?[...new Set(player.unlockedLevelIds.map(String))]:[levelConfig[0]?.id||'level_hag'];
  const first=levelConfig[0]?.id||'level_hag';if(!currentUnlockedLevelIds.includes(first))currentUnlockedLevelIds.unshift(first);
  const wanted=levelConfig.find(l=>l.id===player?.currentLevelId&&currentUnlockedLevelIds.includes(l.id));
  currentLevel=wanted||[...levelConfig].reverse().find(l=>currentUnlockedLevelIds.includes(l.id))||levelConfig[0];
}
function starsForPlayer(){return Math.max(1,...currentUnlockedLevelIds.map(id=>levelConfig.find(l=>l.id===id)?.stars||1));}
function updatePlayerBadge(){
  if(!currentPlayerName)return;
  const label=document.getElementById('currentPlayer');
  label.innerHTML=escapeHtml(currentPlayerName)+' · '+cabinet.length+' palkintoa <span class="rankStars">'+('⭐'.repeat(starsForPlayer()))+'</span>';
  label.style.display='block';
}
function applyLevel(level){
  currentLevel=level||levelConfig[0];NOTES=[...currentLevel.notes];
  ALL_NOTES.forEach(note=>{
    const active=NOTES.includes(note);
    const zone=targetZones[note];if(zone&&zone.classList.contains('extraTarget'))zone.classList.toggle('active',active);
    const btn=document.getElementById('btn'+note);if(btn&&btn.classList.contains('extraNoteBtn'))btn.classList.toggle('active',active);
  });
  if(!NOTES.includes(target))target=NOTES[0]||'H';setTarget(target);
}
async function showLevelChooser(){
  await loadLevelConfig();
  const p=currentPlayerId?await getPlayer(currentPlayerId):null;if(p)normalizeProgress(p);
  const box=document.getElementById('levelChoices');box.innerHTML='';
  document.getElementById('levelPlayerSummary').textContent=currentPlayerName+' · '+('⭐'.repeat(starsForPlayer()));
  levelConfig.forEach(level=>{
    const unlocked=currentUnlockedLevelIds.includes(level.id);
    const progress=currentPlayerProgress[level.id]||{};
    const b=document.createElement('button');b.className='levelChoice'+(unlocked?'':' locked');b.disabled=!unlocked;
    b.innerHTML='<span class="levelStars">'+('⭐'.repeat(Number(level.stars)||1))+'</span><strong>'+escapeHtml(level.name||level.id)+'</strong><small>Sävelet: '+escapeHtml(level.notes.join(' '))+'</small><small>'+(unlocked?((progress.perfectRuns||0)+' / '+(level.requiredPerfectRuns||10)+' virheetöntä'):'🔒 Lukittu')+'</small>';
    if(currentLevel?.id===level.id&&unlocked)b.innerHTML+='<span class="levelActiveBadge">Nykyinen</span>';
    if(unlocked)b.addEventListener('click',()=>startSelectedLevel(level));box.appendChild(b);
  });
  document.getElementById('levelOverlay').style.display='grid';
}
async function startSelectedLevel(level){
  applyLevel(level);document.getElementById('levelOverlay').style.display='none';
  if(currentPlayerId){const p=await getPlayer(currentPlayerId);if(p){p.currentLevelId=level.id;p.unlockedLevelIds=currentUnlockedLevelIds;p.levelProgress=currentPlayerProgress;await writePlayer(p);}}
  if(!microphoneEngine||!microphoneEngine.running)await startMic();resetGame();
}
async function updateLevelProgress(durationMs){
  if(!currentPlayerId||!currentLevel)return null;
  const perfect=missCount===0;const id=currentLevel.id;
  const progress={perfectRuns:0,bestTimeMs:null,speedPromotion:false,...(currentPlayerProgress[id]||{})};
  if(perfect)progress.perfectRuns=(Number(progress.perfectRuns)||0)+1;
  if(Number.isFinite(durationMs)&&(progress.bestTimeMs==null||durationMs<progress.bestTimeMs))progress.bestTimeMs=durationMs;
  const speed=perfect&&Number(currentLevel.targetTime)>0&&durationMs<=Number(currentLevel.targetTime)*1000;
  if(speed)progress.speedPromotion=true;currentPlayerProgress[id]=progress;
  const idx=levelConfig.findIndex(l=>l.id===id);const next=levelConfig[idx+1];
  let promotion=null;
  if(next&&!currentUnlockedLevelIds.includes(next.id)&&(speed||progress.perfectRuns>=Number(currentLevel.requiredPerfectRuns||10))){
    currentUnlockedLevelIds.push(next.id);promotion={next,speed};
  }
  const p=await getPlayer(currentPlayerId);
  if(p){p.cabinet=cabinet;p.currentLevelId=promotion?.next?.id||currentLevel.id;p.unlockedLevelIds=currentUnlockedLevelIds;p.levelProgress=currentPlayerProgress;p.lastPlayedAt=Date.now();await writePlayer(p);}
  updatePlayerBadge();return promotion;
}

function fitStage(){
  const s=Math.min(innerWidth/1536,innerHeight/1024);
  stage.style.transform=`translate(-50%,-50%) scale(${s})`;
}
addEventListener('resize',fitStage);
fitStage();

async function saveCabinet(){
  cabinetCount.textContent=cabinet.length;
  if(currentPlayerName)updatePlayerBadge();
  if(currentPlayerId){
    const p=await getPlayer(currentPlayerId);
    if(p){p.cabinet=cabinet;p.currentLevelId=currentLevel?.id||p.currentLevelId;p.unlockedLevelIds=currentUnlockedLevelIds;p.levelProgress=currentPlayerProgress;p.lastPlayedAt=Date.now();await writePlayer(p);}
  }
}

cabinetCount.textContent='0';

function showMessage(text){
  message.textContent=text;
  message.style.display='block';
  clearTimeout(showMessage.t);
  showMessage.t=setTimeout(()=>message.style.display='none',850);
}

function setTarget(note){
  target=note;
  targetLabel.textContent=note;
  const p=positions[note];
  reticle.classList.remove('hit');
  reticle.style.left=p.x+'px';
  reticle.style.top=p.y+'px';
  reticle.style.opacity='.55';
  reticle.style.transform='scale(1)';
  accepting=true;
  aimTime=0;
}

function nextTarget(){
  const choices=NOTES.filter(n=>n!==target);
  setTarget(choices[Math.floor(Math.random()*choices.length)]);
}

function animateReticle(now){
  if(running&&!paused){
    aimTime+=.016;
    const p=positions[target];
    const dx=Math.sin(now*.0031)*1.8+Math.sin(now*.0067)*.7;
    const dy=Math.cos(now*.0027)*1.5+Math.sin(now*.0053)*.6;
    const rot=Math.sin(now*.0024)*.7;
    const scale=1+Math.sin(now*.004)*.008;
    reticle.style.left=(p.x+dx)+'px';
    reticle.style.top=(p.y+dy)+'px';
    if(!reticle.classList.contains('hit')){
      reticle.style.transform=`rotate(${rot}deg) scale(${scale})`;
    }
  }
  requestAnimationFrame(animateReticle);
}
requestAnimationFrame(animateReticle);

function showSpark(note){
  const p=positions[note];
  spark.style.left=(p.cx-9)+'px';
  spark.style.top=(p.cy-9)+'px';
  spark.classList.remove('show');
  void spark.offsetWidth;
  spark.classList.add('show');
}

function targetColor(note){
  return {H:'#d6543d',A:'#efbd39',G:'#4e91bb',C:'#8d6cc4',F:'#61a85b',D:'#e98545',E:'#d56c91'}[note] || '#efbd39';
}

function playHitEffects(note){
  const p=positions[note];
  const layer=document.getElementById('targetingLayer');

  targetZones[note].classList.remove('hitPulse');
  void targetZones[note].offsetWidth;
  targetZones[note].classList.add('hitPulse');

  targetFlash.style.left=p.cx+'px';
  targetFlash.style.top=p.cy+'px';
  targetFlash.style.setProperty('--effectColor',targetColor(note));
  targetFlash.classList.remove('show');
  void targetFlash.offsetWidth;
  targetFlash.classList.add('show');

  pling.style.left=p.cx+'px';
  pling.style.top=(p.cy-70)+'px';
  pling.classList.remove('show');
  void pling.offsetWidth;
  pling.classList.add('show');

  layer.querySelectorAll('.hitStar').forEach(el=>el.remove());
  const angles=[-150,-115,-75,-35,5,45,85,125];
  angles.forEach((deg,i)=>{
    const rad=deg*Math.PI/180;
    const star=document.createElement('i');
    star.className='hitStar';
    star.style.left=p.cx+'px';
    star.style.top=p.cy+'px';
    star.style.setProperty('--sx',(Math.cos(rad)*(55+(i%3)*14))+'px');
    star.style.setProperty('--sy',(Math.sin(rad)*(55+(i%2)*18))+'px');
    star.style.setProperty('--sr',((-160+i*47))+'deg');
    layer.appendChild(star);
    requestAnimationFrame(()=>star.classList.add('show'));
    setTimeout(()=>star.remove(),750);
  });
}

function playMissEffect(){
  reticle.classList.remove('miss');
  void reticle.offsetWidth;
  reticle.classList.add('miss');
}

function hitTarget(note){
  if(document.getElementById('cabinetOverlay').style.display==='grid') return;
  const now=performance.now();
  if(!running||paused||!accepting||now-lastAccepted<500)return;
  lastAccepted=now;

  if(note===target){
    accepting=false;
    score++;
    scoreValue.textContent=score;
    reticle.classList.remove('hit');
    void reticle.offsetWidth;
    reticle.classList.add('hit');
    showSpark(note);
    playHitEffects(note);
    showMessage('+1  Hieno osuma!');
    setTimeout(()=>{
      reticle.classList.remove('hit');
      if(round>=10)finishGame();
      else{
        round++;
        roundValue.textContent=round;
        nextTarget();
      }
    },620);
  }else{
    missCount++;
    playMissEffect();
    showMessage('Ohi! Soita '+target);
  }
}

function choosePrize(){
  const ownedIds=new Set(cabinet.map(p=>p.id));
  const unseen=prizeCatalog.filter(p=>!ownedIds.has(p.id));
  if(unseen.length)return unseen[Math.floor(Math.random()*unseen.length)];
  return prizeCatalog[Math.floor(Math.random()*prizeCatalog.length)];
}

function buildConfetti(){
  const layer=document.getElementById('confettiLayer');
  layer.innerHTML='';
  const colors=['#d6543d','#efbd39','#4e91bb','#5ba45a','#a56ac7','#f08e45'];
  for(let i=0;i<70;i++){
    const c=document.createElement('i');
    c.className='confetti';
    c.style.left=(Math.random()*100)+'%';
    c.style.background=colors[i%colors.length];
    c.style.setProperty('--dur',(1.6+Math.random()*1.5)+'s');
    c.style.setProperty('--delay',(Math.random()*.45)+'s');
    c.style.setProperty('--drift',(-90+Math.random()*180)+'px');
    c.style.setProperty('--spin',(-540+Math.random()*1080)+'deg');
    c.style.width=(8+Math.random()*8)+'px';
    c.style.height=(12+Math.random()*14)+'px';
    layer.appendChild(c);
  }
}

async function saveSession(prize){
  if(!db||!currentPlayerId)return;
  const now=Date.now();
  const data={
    playerId:currentPlayerId,
    displayName:currentPlayerName,
    gameId:'savelkoju',
    levelId:currentLevel?.id||'level_hag',
    levelName:currentLevel?.name||'Aloittelija',
    stars:Number(currentLevel?.stars)||1,
    score:Number(score)||0,
    targets:10,
    misses:Number(missCount)||0,
    perfect:(Number(missCount)||0)===0,
    durationMs:roundStartedAt?Math.max(0,now-roundStartedAt):null,
    prizeId:prize?.id||null,
    createdAt:now
  };
  try{await db.collection('players').doc(currentPlayerId).collection('sessions').add(data);}
  catch(err){console.warn('Harjoituskerran tallennus epäonnistui',err);}
}

async function finishGame(){
  running=false;
  accepting=false;
  reticle.style.opacity='0';

  const prize=choosePrize();
  const durationMs=roundStartedAt?Math.max(0,Date.now()-roundStartedAt):null;
  cabinet.push(prize);
  cabinetCount.textContent=cabinet.length;
  if(currentPlayerName)updatePlayerBadge();

  // Näytä palkinto ja jatkopainikkeet heti. Pilvitallennus ei saa koskaan
  // pysäyttää pelin loppunäkymää verkkokatkon, kirjautumisvirheen tai hitaan
  // Firestore-yhteyden vuoksi.
  document.getElementById('prizeIcon').textContent=prize.icon;
  document.getElementById('prizeTitle').textContent='Sait palkinnon: '+prize.name+'!';
  document.getElementById('prizeInfo').textContent='Palkintokaapissa on nyt '+cabinet.length+' palkintoa.';
  const progressPromise=updateLevelProgress(durationMs);
  progressPromise.then(promotion=>{
    if(!promotion)return;
    document.getElementById('prizeTitle').textContent=(promotion.speed?'⚡ PIKAYLENNYS! ':'UUSI TASO! ')+('⭐'.repeat(Number(promotion.next.stars)||1));
    document.getElementById('prizeInfo').textContent='Uusi sävel '+(promotion.next.unlockNote||promotion.next.notes.at(-1))+' avattu. Sait myös palkinnon: '+prize.name+'.';
  }).catch(err=>console.warn('Tasojen tallennus epäonnistui',err));

  const scene=document.getElementById('prizeScene');
  buildConfetti();
  scene.classList.remove('animate');
  document.getElementById('prizeOverlay').style.display='grid';
  requestAnimationFrame(()=>{
    scene.classList.add('animate');
    // Varmistus: painikkeet jäävät näkyviin, vaikka animaatio ei käynnistyisi.
    setTimeout(()=>{document.getElementById('prizeButtons').style.opacity='1';},1500);
  });

  // Tallenna taustalla. Mahdollinen virhe ilmoitetaan konsolissa, mutta
  // Pelaa uudelleen -painike toimii aina.
  Promise.allSettled([progressPromise,saveSession(prize)]).then(results=>{
    results.forEach(r=>{if(r.status==='rejected')console.warn('Kierroksen tallennus epäonnistui',r.reason);});
  });
}

function resetGame(){
  document.getElementById('prizeButtons').style.opacity='';
  roundStartedAt=Date.now();
  missCount=0;
  score=0;
  round=1;
  scoreValue.textContent='0';
  roundValue.textContent='1';
  paused=false;
  running=true;
  accepting=true;
  document.getElementById('pauseBtn').textContent='Ⅱ';
  setTarget(NOTES[Math.floor(Math.random()*NOTES.length)]);
}

function renderCabinet(){
  document.querySelector('#cabinetCard h2').textContent=
    currentPlayerName ? currentPlayerName+'n palkintokaappi' : 'Oma palkintokaappi';
  const grid=document.getElementById('cabinetGrid');
  grid.innerHTML='';
  const latestById=new Map();
  cabinet.forEach(p=>latestById.set(p.id,p));
  prizeCatalog.forEach(p=>{
    const slot=document.createElement('div');
    const owned=latestById.has(p.id);
    slot.className='prizeSlot'+(owned?'':' empty');
    slot.innerHTML=owned?`<div><span>${p.icon}</span>${p.name}</div>`:`<div><span>❔</span>???</div>`;
    grid.appendChild(slot);
  });
}

function openCabinet(source='game'){
  if(!currentPlayerKey){
    document.getElementById('startOverlay').style.display='grid';
    document.getElementById('playerName').focus();
    return;
  }

  cabinetOpenedFromPrize = source === 'prize';
  cabinetWasOpenedDuringGame = source === 'game' && running;
  pausedBeforeCabinet = paused;

  if(cabinetWasOpenedDuringGame){
    paused = true;
  }

  renderCabinet();
  document.getElementById('cabinetOverlay').style.display='grid';
}
function closeCabinet(){
  document.getElementById('cabinetOverlay').style.display='none';

  if(cabinetOpenedFromPrize){
    cabinetOpenedFromPrize = false;
    cabinetWasOpenedDuringGame = false;
    document.getElementById('prizeOverlay').style.display='none';
    resetGame();
    return;
  }

  if(cabinetWasOpenedDuringGame){
    paused = pausedBeforeCabinet;
    document.getElementById('pauseBtn').textContent = paused ? '▶' : 'Ⅱ';
  }

  cabinetWasOpenedDuringGame = false;
}

function updateMicrophoneUi(output){
  const bars=[...meter.children];
  const db=Number(output.db ?? -160);
  const level=Math.max(0,Math.min(1,(db+70)/55));
  const count=Math.round(level*bars.length);
  bars.forEach((bar,i)=>bar.classList.toggle('on',i<count));

  const statusNames={
    idle:'MIKROFONI POIS',opening:'AVATAAN MIKROFONIA…',waiting:'KUUNTELEN…',
    holding:'KUUNTELEN…',unstable:'VAKAUTETAAN ÄÄNTÄ…',
    'confirming-note':'VARMISTETAAN SÄVELTÄ…','confirming-octave':'VARMISTETAAN OKTAAVIA…',
    signal:'KUUNTELEN…',reference:'REFERENSSIÄÄNI',error:'MIKROFONIVIRHE'
  };

  if(output.status==='signal'){
    const finnishNote=pitchClassToFinnish[output.pitchClass] || output.display || '–';
    listen.firstChild.textContent=`KUULEN: ${finnishNote}`;
    if(['G','A','H'].includes(finnishNote)) hitTarget(finnishNote);
  }else{
    listen.firstChild.textContent=statusNames[output.status] || 'KUUNTELEN…';
  }

  if(output.status==='error' && output.error) showMessage(output.error);
}

function ensureMicrophoneEngine(){
  if(microphoneEngine)return microphoneEngine;
  const M=window.NuottikompassiMicrophoneEngine;
  if(!M){
    showMessage('Microphone Engineä ei voitu ladata.');
    return null;
  }
  microphoneEngine=new M.MicrophoneEngine({
    ...M.DEFAULTS,
    referenceEnabled:false,
    liveReferenceEnabled:false
  },updateMicrophoneUi);
  return microphoneEngine;
}

async function startMic(){
  const engine=ensureMicrophoneEngine();
  if(!engine)return;
  await engine.start();
}

async function startForNamedPlayer(){
  const input=document.getElementById('playerName');
  const error=document.getElementById('nameError');
  const button=document.getElementById('startBtn');
  const name=input.value.trim().replace(/\s+/g,' ');
  if(!name){error.textContent='Anna nimi.';input.focus();return;}
  error.textContent=''; button.disabled=true; button.textContent='Luodaan…';
  let createdUser=null;
  try{
    if(db&&auth){
      if(auth.currentUser)await auth.signOut();
      const provisionalId=randomId();
      const provisionalEmail=playerAuthEmail(provisionalId);
      const provisionalCode=randomCode();
      const cred=await auth.createUserWithEmailAndPassword(provisionalEmail,playerPassword(provisionalCode));
      createdUser=cred.user;
      let code=provisionalCode;
      try{
        await db.runTransaction(async tx=>{
          const ref=db.collection('playerCodes').doc(code);
          const snap=await tx.get(ref);
          if(snap.exists)throw new Error('CODE_TAKEN');
          tx.set(ref,{uid:createdUser.uid,createdAt:Date.now()});
        });
      }catch(e){
        code=await reserveUniqueCode(createdUser.uid);
        await createdUser.updatePassword(playerPassword(code));
      }
      const player={id:createdUser.uid,authEmail:provisionalEmail,displayName:name,displayNameLower:normalizePlayerKey(name),avatar:selectedNewAvatar,code,cabinet:[],createdAt:Date.now(),lastPlayedAt:Date.now()};
      await writePlayer(player);
      await selectPlayer(player);
      pendingPlayer=player;
    }else{
      const code=await uniqueRandomCode();
      const player={id:randomId(),displayName:name,displayNameLower:normalizePlayerKey(name),avatar:selectedNewAvatar,code,cabinet:[],createdAt:Date.now(),lastPlayedAt:Date.now()};
      await writePlayer(player); await selectPlayer(player); pendingPlayer=player;
    }
    document.getElementById('codeTitle').textContent='Pelaaja luotu!';
    document.getElementById('codeHelp').textContent=name+'n pelikoodi on';
    const generated=document.getElementById('generatedCode'); generated.textContent=pendingPlayer.code; generated.classList.remove('hidden');
    document.getElementById('playerCode').classList.add('hidden');
    document.getElementById('codeError').textContent='Kirjoita koodi talteen.';
    document.getElementById('codeContinue').textContent='Aloita peli';
    document.getElementById('codeCancel').classList.add('hidden');
    document.getElementById('startOverlay').style.display='none'; document.getElementById('codeOverlay').style.display='grid';
  }catch(err){
    console.error(err);
    try{if(createdUser)await createdUser.delete();}catch(e){}
    error.textContent='Pelaajaa ei voitu luoda: '+(err?.message||'tuntematon virhe');
  }finally{button.disabled=false;button.textContent='Luo pelaaja';}
}
async function beginGame(){
  document.getElementById('startOverlay').style.display='none';
  document.getElementById('codeOverlay').style.display='none';
  document.getElementById('generatedCode').classList.add('hidden');
  document.getElementById('playerCode').classList.remove('hidden'); document.getElementById('codeCancel').classList.remove('hidden'); document.getElementById('codeContinue').textContent='Jatka peliä';
  await showLevelChooser();
}

renderAvatarChoices();
document.getElementById('showSearchBtn').addEventListener('click',()=>{showStartView('searchView');document.getElementById('playerSearch').focus();});
document.getElementById('showNewBtn').addEventListener('click',()=>{showStartView('newView');document.getElementById('playerName').focus();});
document.querySelectorAll('[data-back]').forEach(b=>b.addEventListener('click',()=>showStartView('homeView')));
document.getElementById('startBtn').addEventListener('click',startForNamedPlayer);
document.getElementById('playerName').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();startForNamedPlayer();}});
document.getElementById('playerSearch').addEventListener('input',async e=>{
  const q=normalizePlayerKey(e.target.value); const box=document.getElementById('searchResults'); box.innerHTML='';
  if(!q)return;
  try{
    const result=await searchPublicPlayers(q,20);
    result.players.forEach(p=>box.appendChild(playerButton(p)));
    if(!result.players.length)box.textContent='Pelaajaa ei löytynyt.';
  }catch(err){box.textContent='Hakua ei voitu tehdä: '+(err?.message||'virhe');}
});
document.getElementById('codeContinue').addEventListener('click',async()=>{
  if(!document.getElementById('generatedCode').classList.contains('hidden')){await beginGame();return;}
  const code=document.getElementById('playerCode').value.replace(/\D/g,'');
  if(!pendingPlayer){document.getElementById('codeError').textContent='Valitse pelaaja uudelleen.';return;}
  try{
    let player=pendingPlayer;
    if(db&&auth){
      const email=String(pendingPlayer.authEmail||playerAuthEmail(pendingPlayer.id));
      if(auth.currentUser?.uid===pendingPlayer.id){
        const cached=await getPlayer(pendingPlayer.id);
        if(cached&&String(cached.code)!==code)throw new Error('Pelikoodi ei täsmää.');
        player=cached||pendingPlayer;
      }else{
        if(auth.currentUser)await auth.signOut();
        const cred=await auth.signInWithEmailAndPassword(email,playerPassword(code));
        player=await getPlayer(cred.user.uid);
      }
    }else if(code!==String(pendingPlayer.code))throw new Error('Pelikoodi ei täsmää.');
    await selectPlayer(player); await beginGame();
  }catch(err){
    console.error(err);
    document.getElementById('codeError').textContent=(err?.code==='auth/invalid-credential'||err?.code==='auth/wrong-password')?'Pelikoodi ei täsmää.':(err?.message||'Kirjautuminen epäonnistui.');
  }
});
document.getElementById('playerCode').addEventListener('input',e=>e.target.value=e.target.value.replace(/\D/g,'').slice(0,3));
document.getElementById('playerCode').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('codeContinue').click();});
document.getElementById('codeCancel').addEventListener('click',()=>{document.getElementById('codeOverlay').style.display='none';document.getElementById('startOverlay').style.display='grid';pendingPlayer=null;});

let teacherCursor=null;
let teacherLoading=false;
let teacherReturnPlayer=null;
async function renderTeacherList(reset=true){
  if(teacherLoading)return; teacherLoading=true;
  const q=normalizePlayerKey(document.getElementById('teacherSearch').value);
  const box=document.getElementById('teacherList');
  if(reset){box.innerHTML='';teacherCursor=null;}
  try{
    const result=await allPlayers({search:q,afterDoc:teacherCursor,limit:50});
    teacherCursor=result.lastDoc;
    result.players.forEach(p=>{
      const row=document.createElement('div'); row.className='teacherRow';
      const when=p.lastPlayedAt?new Date(p.lastPlayedAt).toLocaleDateString('fi-FI'):'–';
      row.innerHTML=`<div><strong>${escapeHtml(p.displayName)}</strong><small>Koodi: ${p.code} · Palkintoja: ${(p.cabinet||[]).length} · Viimeksi: ${when}</small></div><div class="rowButtons"></div>`;
      const buttons=row.querySelector('.rowButtons');
      const clear=document.createElement('button');clear.className='miniBtn';clear.textContent='Nollaa kaappi';clear.addEventListener('click',async()=>{if(confirm('Nollataanko '+p.displayName+'n palkintokaappi?')){p.cabinet=[];await adminWritePlayer(p);renderTeacherList(true);}});
      const del=document.createElement('button');del.className='miniBtn danger';del.textContent='Poista pelitiedot';del.addEventListener('click',async()=>{if(confirm('Poistetaanko '+p.displayName+'n pelitiedot? Firebase Auth -tunnus jää vielä Authentication-listaan.')){await deletePlayer(p.id,p.code);renderTeacherList(true);renderRecent();}});
      buttons.append(clear,del); box.appendChild(row);
    });
    if(reset&&!result.players.length)box.textContent='Ei oppilaita.';
    document.getElementById('teacherMoreBtn').classList.toggle('hidden',result.players.length<50);
  }catch(err){box.textContent='Oppilaslistaa ei voitu avata: '+(err?.message||'virhe');}
  finally{teacherLoading=false;}
}
document.getElementById('settingsBtn').addEventListener('click',()=>{
  teacherReturnPlayer=currentPlayerId?{id:currentPlayerId,email:currentPlayerAuthEmail,code:currentPlayerCode}:null;
  document.getElementById('teacherOverlay').style.display='grid';
  document.getElementById('teacherLogin').classList.remove('hidden');
  document.getElementById('teacherPanel').classList.add('hidden');
  document.getElementById('teacherEmail').value='';document.getElementById('teacherPassword').value='';document.getElementById('teacherError').textContent='';
});
document.getElementById('teacherLoginBtn').addEventListener('click',async()=>{
  const email=document.getElementById('teacherEmail').value.trim();
  const password=document.getElementById('teacherPassword').value;
  const error=document.getElementById('teacherError'); error.textContent='';
  try{
    if(!auth)throw new Error('Firebase Authentication ei ole käytössä.');
    if(auth.currentUser)await auth.signOut();
    await auth.signInWithEmailAndPassword(email,password);
    const adminDoc=await db.collection('admins').doc(auth.currentUser.uid).get();
    if(!adminDoc.exists){await auth.signOut();throw new Error('Tällä tunnuksella ei ole opettajan oikeuksia.');}
    document.getElementById('teacherLogin').classList.add('hidden');document.getElementById('teacherPanel').classList.remove('hidden');renderTeacherList(true);
  }catch(err){console.error(err);error.textContent=err?.message||'Kirjautuminen epäonnistui.';}
});
document.getElementById('teacherSearch').addEventListener('input',()=>renderTeacherList(true));
document.getElementById('teacherMoreBtn').addEventListener('click',()=>renderTeacherList(false));
document.getElementById('teacherCancelBtn').addEventListener('click',()=>document.getElementById('teacherOverlay').style.display='none');
document.getElementById('teacherCloseBtn').addEventListener('click',async()=>{
  document.getElementById('teacherOverlay').style.display='none';
  if(auth?.currentUser)await auth.signOut();
  if(teacherReturnPlayer?.email&&teacherReturnPlayer?.code){
    try{await auth.signInWithEmailAndPassword(teacherReturnPlayer.email,playerPassword(teacherReturnPlayer.code));}catch(e){console.warn('Pelaajaistuntoa ei voitu palauttaa',e);}
  }
  teacherReturnPlayer=null;
});

document.getElementById('btnH').addEventListener('click',()=>hitTarget('H'));
document.getElementById('btnA').addEventListener('click',()=>hitTarget('A'));
document.getElementById('btnG').addEventListener('click',()=>hitTarget('G'));
['C','F','D','E'].forEach(n=>document.getElementById('btn'+n).addEventListener('click',()=>hitTarget(n)));
document.getElementById('levelCancelBtn').addEventListener('click',()=>{document.getElementById('levelOverlay').style.display='none';document.getElementById('startOverlay').style.display='grid';showStartView('homeView');});

addEventListener('keydown',e=>{
  if(typeof e.key !== 'string') return;
  const n=e.key.toUpperCase();
  if(NOTES.includes(n))hitTarget(n);
});

document.getElementById('pauseBtn').addEventListener('click',()=>{
  if(document.getElementById('cabinetOverlay').style.display==='grid') return;
  paused=!paused;
  document.getElementById('pauseBtn').textContent=paused?'▶':'Ⅱ';
  showMessage(paused?'Tauko':'Peli jatkuu');
});

document.getElementById('soundBtn').addEventListener('click',e=>{
  e.currentTarget.textContent=e.currentTarget.textContent==='🔊'?'🔇':'🔊';
});

document.getElementById('continueBtn').addEventListener('click',async()=>{
  document.getElementById('prizeOverlay').style.display='none';
  await showLevelChooser();
});
document.getElementById('cabinetBtn').addEventListener('click',()=>openCabinet('game'));
document.getElementById('openCabinetFromPrize').addEventListener('click',()=>{
  openCabinet('prize');
});
document.getElementById('closeCabinet').addEventListener('click',closeCabinet);

function waitForFirebaseUser(timeoutMs=6000){
  if(!auth)return Promise.resolve(null);
  if(auth.currentUser)return Promise.resolve(auth.currentUser);
  return new Promise(resolve=>{
    let done=false;
    const finish=user=>{if(done)return;done=true;clearTimeout(timer);unsub?.();resolve(user||null)};
    const unsub=auth.onAuthStateChanged(finish,()=>finish(null));
    const timer=setTimeout(()=>finish(auth.currentUser),timeoutMs);
  });
}

loadLevelConfig().then(async()=>{
  applyLevel(levelConfig[0]);
  const q=new URLSearchParams(location.search);
  const pid=q.get('playerId'),code=q.get('code'),teacher=q.get('teacher')==='1';
  if(pid&&teacher&&db&&auth){
    try{
      const user=await waitForFirebaseUser();
      if(!user)throw new Error('Kirjaudu ensin Huilustudio Adminiin.');
      const adminDoc=await db.collection('admins').doc(user.uid).get();
      if(!adminDoc.exists)throw new Error('Kirjautuneella käyttäjällä ei ole opettajan oikeuksia.');
      teacherPlayMode=true;teacherAdminUid=user.uid;
      const full=await getPlayer(pid);
      if(!full)throw new Error('Pelaajaprofiilia ei löytynyt.');
      document.getElementById('startOverlay').style.display='none';
      await selectPlayer(full);
      await beginGame();
      history.replaceState({},'',location.pathname);
    }catch(e){
      console.error('Opettajan oppilasnäkymä epäonnistui',e);
      alert('Oppilaan peliä ei voitu avata automaattisesti: '+(e.message||'virhe'));
    }
  }else if(pid&&code&&db&&auth){
    try{
      const pub=await db.collection('publicPlayers').doc(pid).get();
      if(!pub.exists)throw new Error('Pelaajaa ei löytynyt');
      const player=hydratePlayer({id:pub.id,...pub.data()});
      if(auth.currentUser)await auth.signOut();
      const cred=await auth.signInWithEmailAndPassword(String(player.authEmail||playerAuthEmail(pid)),playerPassword(code));
      const full=await getPlayer(cred.user.uid);
      if(!full)throw new Error('Pelaajaprofiilia ei löytynyt');
      document.getElementById('startOverlay').style.display='none';
      await selectPlayer(full);await beginGame();history.replaceState({},'',location.pathname);
    }catch(e){console.error('Admin-käynnistys epäonnistui',e);alert('Oppilaan peliä ei voitu avata automaattisesti: '+(e.message||'virhe'));}
  }
}).catch(console.warn);
setTarget('A');
showStartView('homeView');
ensureMicrophoneEngine();
addEventListener('beforeunload',()=>microphoneEngine?.stop());
})();
