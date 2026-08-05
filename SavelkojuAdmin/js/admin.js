const cfg={apiKey:'AIzaSyCHSTODIddId7jxP41X315gx4s-pfQ1l44',authDomain:'savelkoju.firebaseapp.com',projectId:'savelkoju',storageBucket:'savelkoju.firebasestorage.app',messagingSenderId:'628559357855',appId:'1:628559357855:web:af1896e724516187abbfaa'};
firebase.initializeApp(cfg);const auth=firebase.auth(),db=firebase.firestore();let lastPlayerDoc=null,currentEdit=null,levelCache=[];
const DEFAULT_LEVELS=[{id:'level_hag',name:'Aloittelija',stars:1,order:1,notes:['H','A','G'],unlockNote:'',targetTime:8,requiredPerfectRuns:10,active:true},{id:'level_c',name:'Soittaja',stars:2,order:2,notes:['H','A','G','C'],unlockNote:'C',targetTime:10,requiredPerfectRuns:10,active:true},{id:'level_f',name:'Säveltaitaja',stars:3,order:3,notes:['H','A','G','C','F'],unlockNote:'F',targetTime:12,requiredPerfectRuns:10,active:true},{id:'level_d',name:'Mestari',stars:4,order:4,notes:['H','A','G','C','F','D'],unlockNote:'D',targetTime:14,requiredPerfectRuns:10,active:true},{id:'level_e',name:'Virtuoosi',stars:5,order:5,notes:['H','A','G','C','F','D','E'],unlockNote:'E',targetTime:16,requiredPerfectRuns:10,active:true}];
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));const PLAYER_AVATARS=['🦊','🐼','🐻','🐰','🦉','🐸','🦁','🐧'];function fallbackAvatar(seed=''){let n=0;for(const ch of String(seed))n=(n*31+ch.codePointAt(0))>>>0;return PLAYER_AVATARS[n%PLAYER_AVATARS.length]}function starsFor(p){const n=Number(p.highestStars)||Math.max(1,Array.isArray(p.unlockedLevelIds)?p.unlockedLevelIds.length:1);return '⭐'.repeat(Math.min(9,n))}function rewardPreview(ids=[]){const shown=ids.slice(0,4).map(rewardIcon).join('');return shown+(ids.length>4?' +'+(ids.length-4):'')}
function dateOf(v){return v?.toDate?v.toDate():new Date(Number(v)||0)}function fmt(v){const d=dateOf(v);return isNaN(d)?'–':d.toLocaleString('fi-FI')}function relativeTime(v){const d=dateOf(v);if(isNaN(d))return 'Ei vielä pelannut';const now=new Date(),diff=now-d;const same=now.toDateString()===d.toDateString();const yesterday=new Date(now);yesterday.setDate(now.getDate()-1);const t=d.toLocaleTimeString('fi-FI',{hour:'2-digit',minute:'2-digit'});if(same)return 'Tänään '+t;if(yesterday.toDateString()===d.toDateString())return 'Eilen '+t;const days=Math.floor(diff/86400000);if(days>1&&days<14)return days+' pv sitten';return d.toLocaleDateString('fi-FI')}
function levelForPlayer(p){const stars=Math.max(1,Number(p.highestStars)||Math.max(1,Array.isArray(p.unlockedLevelIds)?p.unlockedLevelIds.length:1));const levels=(levelCache.length?levelCache:DEFAULT_LEVELS).filter(x=>x.active!==false).sort((a,b)=>(Number(a.stars)||1)-(Number(b.stars)||1));return levels.filter(x=>(Number(x.stars)||1)<=stars).at(-1)||levels[0]||{name:'Aloittelija',stars:1}}function startOfWeek(d=new Date()){const x=new Date(d);x.setHours(0,0,0,0);const day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);return x}function sessionStats(sessions=[]){const valid=sessions.filter(x=>!isNaN(dateOf(x.createdAt)));const durations=valid.map(x=>Number(x.durationMs)).filter(x=>Number.isFinite(x)&&x>0);const best=durations.length?Math.min(...durations):null;const weekStart=startOfWeek();const thisWeek=valid.filter(x=>dateOf(x.createdAt)>=weekStart).length;const days=[...new Set(valid.map(x=>{const d=dateOf(x.createdAt);return new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime()}))].sort((a,b)=>b-a);let streak=0;if(days.length){let cursor=new Date();cursor.setHours(0,0,0,0);const today=cursor.getTime(),yesterday=today-86400000;if(days[0]===today||days[0]===yesterday){cursor=new Date(days[0]);for(const day of days){if(day===cursor.getTime()){streak++;cursor.setDate(cursor.getDate()-1)}else if(day<cursor.getTime())break}}}return{best,thisWeek,streak}}function durationText(ms){return Number.isFinite(Number(ms))?(Number(ms)/1000).toFixed(2)+' s':'–'}function sessionClass(misses){const n=Number(misses)||0;return n===0?'sessionGood':n<=2?'sessionOkay':'sessionNeedsWork'}
async function isAdmin(u){return (await db.collection('admins').doc(u.uid).get()).exists}
auth.onAuthStateChanged(async u=>{if(u&&await isAdmin(u)){ $('#login').classList.add('hidden');$('#app').classList.remove('hidden');$('#userLabel').textContent=u.email;await Promise.all([loadOverview(),loadPlayers(true),loadLevels(),loadRewards()]);}else{$('#app').classList.add('hidden');$('#login').classList.remove('hidden');if(u)await auth.signOut();}});
$('#loginBtn').onclick=async()=>{try{$('#loginStatus').textContent='';await auth.signInWithEmailAndPassword($('#email').value.trim(),$('#password').value)}catch(e){$('#loginStatus').textContent='Kirjautuminen epäonnistui: '+e.message}};$('#logoutBtn').onclick=()=>auth.signOut();$('#closePlayerDialog').onclick=()=>$('#playerDialog').close();
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));$('#'+b.dataset.tab).classList.remove('hidden')});
async function loadOverview(){const ps=await db.collection('publicPlayers').get();let rewards=0;ps.forEach(d=>rewards+=Number(d.data().cabinetCount)||0);$('#mPlayers').textContent=ps.size;$('#mRewards').textContent=rewards;const ss=await db.collectionGroup('sessions').orderBy('createdAt','desc').limit(100).get();$('#mSessions').textContent=ss.size;let perfect=0;ss.forEach(d=>{if(d.data().perfect)perfect++});$('#mPerfect').textContent=perfect;$('#recentSessions').innerHTML=ss.docs.slice(0,12).map(d=>{const x=d.data();return `<div class="row"><div><b>${esc(x.displayName||'Pelaaja')}</b><div class="muted">${fmt(x.createdAt)} · ${x.score||0}/${x.targets||10} · virheitä ${x.misses||0}</div></div><span class="badge">${x.perfect?'Virheetön':'Harjoitus'}</span></div>`}).join('')||'<p>Ei harjoituksia vielä.</p>'}
let firstVisiblePlayer=null,searchTimer=null;
async function loadPlayers(reset=false){
  if(reset){lastPlayerDoc=null;firstVisiblePlayer=null;$('#playerList').innerHTML=''}
  let q=db.collection('players');const term=$('#playerSearch').value.trim().toLocaleLowerCase('fi-FI');
  if(term)q=q.orderBy('displayNameLower').startAt(term).endAt(term+'');else q=q.orderBy('lastPlayedAt','desc');
  if(lastPlayerDoc)q=q.startAfter(lastPlayerDoc);
  const s=await q.limit(50).get();lastPlayerDoc=s.docs.at(-1)||null;
  s.docs.forEach((d,index)=>{const p={id:d.id,...d.data()};if(!firstVisiblePlayer&&index===0)firstVisiblePlayer=p;const el=document.createElement('article');el.className='row playerRow';el.tabIndex=0;const avatar=p.avatar||fallbackAvatar(p.id);const rewards=p.cabinetIds||[];el.innerHTML=`<div class="playerAvatar" aria-hidden="true">${esc(avatar)}</div><div class="playerMain"><div class="playerNameLine"><b>${esc(p.displayName)}</b><span class="playerStars" title="Taso">${starsFor(p)}</span></div><div class="playerMeta muted"><span class="rewardPreview">${rewardPreview(rewards)||'Ei palkintoja'}</span><span>${rewards.length} 🏆</span><span>${relativeTime(p.lastPlayedAt)}</span></div></div><div class="openArrow" aria-hidden="true">›</div>`;const open=()=>openPlayer(p);el.addEventListener('click',open);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}});$('#playerList').appendChild(el)});
  if(!s.size&&!$('#playerList').children.length)$('#playerList').innerHTML='<div class="panel muted">Ei hakutuloksia.</div>';
  $('#moreBtn').classList.toggle('hidden',s.size<50)
}
$('#playerSearch').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>loadPlayers(true),180)});
$('#playerSearch').addEventListener('keydown',e=>{if(e.key==='Enter'&&firstVisiblePlayer){e.preventDefault();openPlayer(firstVisiblePlayer)}});
$('#reloadPlayers').onclick=()=>{$('#playerSearch').value='';loadPlayers(true)};$('#moreBtn').onclick=()=>loadPlayers(false);

async function deleteRefsInBatches(refs,status){
  const chunkSize=450;
  for(let i=0;i<refs.length;i+=chunkSize){
    const batch=db.batch();
    refs.slice(i,i+chunkSize).forEach(ref=>batch.delete(ref));
    await batch.commit();
    if(status)status.textContent=`Poistetaan… ${Math.min(i+chunkSize,refs.length)}/${refs.length}`;
  }
}

async function deleteAllPlayers(){
  const btn=$('#deleteAllPlayers'),status=$('#deleteAllStatus');
  if(!confirm('Tämä poistaa pysyvästi kaikki oppilaat, pelikoodit, palkinnot ja harjoitushistorian. Tätä ei voi perua. Jatketaanko?'))return;
  const answer=prompt('Vahvista kirjoittamalla TYHJENNÄ');
  if(answer!=='TYHJENNÄ'){
    status.textContent='Tyhjennys peruttiin.';
    return;
  }
  btn.disabled=true;
  status.classList.remove('error','success');
  status.textContent='Haetaan poistettavat oppilastiedot…';
  try{
    const players=await db.collection('players').get();
    if(players.empty){
      status.textContent='Oppilaslista on jo tyhjä.';
      status.classList.add('success');
      await loadOverview();
      await loadPlayers(true);
      return;
    }
    const sessionRefs=[];
    for(let i=0;i<players.docs.length;i++){
      const playerDoc=players.docs[i];
      status.textContent=`Haetaan harjoitushistoriaa… ${i+1}/${players.docs.length}`;
      const sessions=await playerDoc.ref.collection('sessions').get();
      sessions.docs.forEach(d=>sessionRefs.push(d.ref));
    }
    if(sessionRefs.length){
      status.textContent=`Poistetaan ${sessionRefs.length} harjoitusta…`;
      await deleteRefsInBatches(sessionRefs,status);
    }
    const rootRefs=[];
    players.docs.forEach(d=>{
      const data=d.data();
      rootRefs.push(d.ref,db.collection('publicPlayers').doc(d.id));
      if(data.code!==undefined&&data.code!==null&&String(data.code).trim())rootRefs.push(db.collection('playerCodes').doc(String(data.code)));
    });
    status.textContent='Poistetaan oppilaat ja pelikoodit…';
    await deleteRefsInBatches(rootRefs,status);
    lastPlayerDoc=null;firstVisiblePlayer=null;
    $('#playerSearch').value='';
    await Promise.all([loadPlayers(true),loadOverview()]);
    status.textContent=`Valmis. ${players.size} oppilasta ja ${sessionRefs.length} harjoitusta poistettiin.`;
    status.classList.add('success');
  }catch(e){
    console.error('Kaikkien oppilaiden poisto epäonnistui',e);
    status.textContent='Tyhjennys epäonnistui: '+e.message;
    status.classList.add('error');
  }finally{
    btn.disabled=false;
  }
}
$('#deleteAllPlayers').onclick=deleteAllPlayers;
async function openPlayer(p){
  const fresh=await db.collection('players').doc(p.id).get();
  if(fresh.exists)p={id:fresh.id,...fresh.data()};
  const ss=await db.collection('players').doc(p.id).collection('sessions').orderBy('createdAt','desc').limit(100).get();
  const sessions=ss.docs.map(d=>d.data());
  const avatar=p.avatar||fallbackAvatar(p.id),level=levelForPlayer(p),stats=sessionStats(sessions),rewards=p.cabinetIds||[];
  const sessionRows=sessions.slice(0,30).map(x=>`<div class="sessionRow ${sessionClass(x.misses)}"><div><b>${relativeTime(x.createdAt)}</b><div class="muted">${fmt(x.createdAt)}</div></div><div class="sessionResult">${x.score||0}/${x.targets||10}</div><div class="sessionMisses">${Number(x.misses)||0} virhettä</div><div class="sessionDuration">${durationText(x.durationMs)}</div></div>`).join('')||'<div class="muted">Ei harjoituksia vielä.</div>';
  $('#playerDetail').innerHTML=`
    <div class="detailHero"><div class="detailAvatar">${esc(avatar)}</div><div><h2 style="margin:0">${esc(p.displayName)}</h2><div class="levelTitle">${starsFor(p)} ${esc(level.name||'')}</div><div class="muted lastPlayed">Viimeksi pelannut ${relativeTime(p.lastPlayedAt).toLowerCase()}</div></div></div>
    <div class="studentStats">
      <div class="studentStat"><span>Nykyinen taso</span><b>${'⭐'.repeat(Number(level.stars)||1)}</b></div>
      <div class="studentStat"><span>Paras aika</span><b>${durationText(stats.best)}</b></div>
      <div class="studentStat"><span>Tämän viikon kierrokset</span><b>${stats.thisWeek}</b></div>
      <div class="studentStat"><span>Harjoitteluputki</span><b>🔥 ${stats.streak} pv</b></div>
    </div>
    <div class="detailLayout">
      <div>
        <section class="sectionBlock"><h3>Pelaajan hahmo</h3><div class="avatarAdminChoices">${PLAYER_AVATARS.map(a=>`<button type="button" class="avatarAdminChoice ${a===avatar?'active':''}" data-avatar="${a}" aria-label="Valitse ${a}">${a}</button>`).join('')}</div>
          <div class="codeCard"><div class="codeLabel">Pelaajan koodi</div><div class="codeNumber">${esc(p.code)}</div><div class="codeActions"><button id="copyCode" class="secondary" type="button">Kopioi koodi</button><button id="newCode" class="secondary" type="button">Luo uusi koodi</button></div></div>
          <h3>Palkintokaappi</h3><div class="cabinetShelf">${rewards.length?rewards.map(rewardIcon).join(' '):'<span class="cabinetEmpty">Palkintokaappi on vielä tyhjä.</span>'}</div>
          <details class="settingsGroup"><summary>Pelaajan asetukset</summary><div class="dangerZone"><h4>Vaaralliset toiminnot</h4><div class="actions"><button id="clearCab" class="secondary" type="button">Nollaa palkintokaappi</button><button id="deletePlayer" class="danger" type="button">Poista pelaaja</button></div></div><div class="technicalHint">Tekninen pelaajatunniste on piilotettu normaalista näkymästä.</div></details>
        </section>
        <section class="sectionBlock" style="margin-top:14px"><h3>Opettajan muistiinpanot</h3><textarea id="teacherNotes" class="teacherNotes" placeholder="Kirjoita tähän esimerkiksi seuraavan tunnin muistutus…">${esc(p.teacherNotes||'')}</textarea><div class="actions" style="margin-top:9px"><button id="saveNotes" class="primary" type="button">Tallenna muistiinpanot</button></div><div id="notesStatus" class="notesStatus" aria-live="polite"></div></section>
      </div>
      <section class="sectionBlock"><h3>Viimeisimmät harjoitukset</h3><div class="sessionList">${sessionRows}</div></section>
    </div>`;
  $('#playerDialog').showModal();
  document.querySelectorAll('.avatarAdminChoice').forEach(b=>b.onclick=async()=>{await updatePlayer(p,{avatar:b.dataset.avatar});p.avatar=b.dataset.avatar;$('#playerDialog').close();openPlayer(p);loadPlayers(true)});
  $('#copyCode').onclick=async()=>{try{await navigator.clipboard.writeText(String(p.code));$('#copyCode').textContent='Kopioitu!';setTimeout(()=>$('#copyCode')&&($('#copyCode').textContent='Kopioi koodi'),1200)}catch{prompt('Kopioi pelikoodi:',String(p.code))}};
  $('#newCode').onclick=()=>changeCode(p);
  $('#saveNotes').onclick=async()=>{const btn=$('#saveNotes'),status=$('#notesStatus');btn.disabled=true;status.textContent='Tallennetaan…';try{const notes=$('#teacherNotes').value.trim();await updatePlayer(p,{teacherNotes:notes});p.teacherNotes=notes;status.textContent='Muistiinpanot tallennettu.'}catch(e){status.textContent='Tallennus epäonnistui: '+e.message}finally{btn.disabled=false}};
  $('#clearCab').onclick=async()=>{if(confirm('Tyhjennetäänkö palkintokaappi? Tätä ei voi perua.')){await updatePlayer(p,{cabinetIds:[]});p.cabinetIds=[];$('#playerDialog').close();openPlayer(p);loadPlayers(true)}};
  $('#deletePlayer').onclick=()=>removePlayer(p)
}
let rewardCache={bear:'🧸',train:'🚂',dino:'🦖',frog:'🐸',trumpet:'🎺',star:'⭐',duck:'🦆',crown:'👑',robot:'🤖',gift:'🎁'};function rewardIcon(id){return rewardCache[id]||'🏅'}
async function updatePlayer(p,data){const now=Date.now();await db.collection('players').doc(p.id).set({...data,updatedAt:now},{merge:true});const pub={};if('cabinetIds'in data)pub.cabinetCount=data.cabinetIds.length;if('avatar'in data)pub.avatar=data.avatar;if(Object.keys(pub).length)await db.collection('publicPlayers').doc(p.id).set({...pub,updatedAt:now},{merge:true})}
async function changeCode(p){let code;for(let i=0;i<1000;i++){code=String(Math.floor(100+Math.random()*900));try{await db.runTransaction(async tx=>{const n=db.collection('playerCodes').doc(code),o=db.collection('playerCodes').doc(String(p.code));if((await tx.get(n)).exists)throw Error('taken');tx.set(n,{uid:p.id,createdAt:Date.now()});tx.delete(o);tx.update(db.collection('players').doc(p.id),{code,updatedAt:Date.now()})});break}catch(e){if(e.message!=='taken')throw e}}p.code=code;alert('Uusi pelikoodi: '+code);$('#playerDialog').close();openPlayer(p);loadPlayers(true)}
async function removePlayer(p){if(!confirm('Poistetaanko '+p.displayName+' pysyvästi?'))return;const b=db.batch();b.delete(db.collection('players').doc(p.id));b.delete(db.collection('publicPlayers').doc(p.id));b.delete(db.collection('playerCodes').doc(String(p.code)));await b.commit();$('#playerDialog').close();loadPlayers(true);loadOverview()}
async function loadLevels(){const s=await db.collection('gameConfig').doc('levels').collection('items').orderBy('order').get();levelCache=s.empty?[...DEFAULT_LEVELS]:s.docs.map(d=>({id:d.id,...d.data()}));$('#levelList').innerHTML=s.docs.map(d=>itemRow('level',d.id,d.data())).join('')||'<p>Ei tasoja vielä.</p>';wireEditButtons()}
async function loadRewards(){const s=await db.collection('gameConfig').doc('rewards').collection('items').orderBy('order').get();s.docs.forEach(d=>rewardCache[d.id]=d.data().icon||'🏅');$('#rewardList').innerHTML=s.docs.map(d=>itemRow('reward',d.id,d.data())).join('')||'<p>Ei omia palkintoasetuksia. Pelin oletuspalkinnot ovat käytössä.</p>';wireEditButtons()}
function itemRow(type,id,x){const info=type==='level'?`${'⭐'.repeat(Number(x.stars)||1)} · ${esc((x.notes||[]).join(' '))} · uusi ${esc(x.unlockNote||'–')} · ⚡ ${x.targetTime||'–'} s · ${x.requiredPerfectRuns||0} virheetöntä · ${x.active===false?'piilotettu':'käytössä'}`:`${esc(x.icon||'🏅')} ${esc(x.name||id)}`;return `<div class="row"><div><b>${esc(x.name||id)}</b><div class="muted">${info}</div></div><div class="actions"><button class="secondary editItem" data-type="${type}" data-id="${esc(id)}">Muokkaa</button><button class="danger deleteItem" data-type="${type}" data-id="${esc(id)}">Poista</button></div></div>`}
function wireEditButtons(){document.querySelectorAll('.editItem').forEach(b=>b.onclick=()=>editItem(b.dataset.type,b.dataset.id));document.querySelectorAll('.deleteItem').forEach(b=>b.onclick=()=>deleteItem(b.dataset.type,b.dataset.id))}
$('#addLevel').onclick=()=>editItem('level','');$('#addReward').onclick=()=>editItem('reward','');
async function editItem(type,id){let data={};if(id){const d=await db.collection('gameConfig').doc(type==='level'?'levels':'rewards').collection('items').doc(id).get();data=d.data()||{}}currentEdit={type,id};$('#editTitle').textContent=(id?'Muokkaa ':'Lisää ')+(type==='level'?'taso':'palkinto');$('#editFields').innerHTML=type==='level'?`<div class="formgrid"><label>Tunniste<input id="eId" value="${esc(id)}" ${id?'disabled':''}></label><label>Nimi<input id="eName" value="${esc(data.name||'')}"></label><label>Tähtien määrä<input id="eStars" type="number" min="1" max="9" value="${data.stars||data.order||1}"></label><label>Järjestys<input id="eOrder" type="number" value="${data.order||1}"></label><label>Sävelet pilkuilla<input id="eNotes" value="${esc((data.notes||[]).join(','))}"></label><label>Uutena avautuva sävel<input id="eUnlock" maxlength="1" value="${esc(data.unlockNote||'')}"></label><label>⚡ Pikaylennyksen aika (s)<input id="eTime" type="number" step="0.1" value="${data.targetTime||''}"></label><label>Virheettömiä normaaliin avaukseen<input id="eRuns" type="number" value="${data.requiredPerfectRuns||10}"></label><label class="checkLabel"><input id="eActive" type="checkbox" ${data.active===false?'':'checked'}> Taso käytössä</label></div>`:`<div class="formgrid"><label>Tunniste<input id="eId" value="${esc(id)}" ${id?'disabled':''}></label><label>Nimi<input id="eName" value="${esc(data.name||'')}"></label><label>Emoji<input id="eIcon" value="${esc(data.icon||'🏅')}"></label><label>Järjestys<input id="eOrder" type="number" value="${data.order||1}"></label></div>`;$('#editDialog').showModal()}
$('#cancelEdit').onclick=()=>$('#editDialog').close();$('#saveEdit').onclick=async()=>{const id=$('#eId').value.trim();if(!id)return alert('Tunniste tarvitaan');const x={name:$('#eName').value.trim(),order:Number($('#eOrder').value)||1,updatedAt:Date.now()};if(currentEdit.type==='level'){x.notes=$('#eNotes').value.split(',').map(s=>s.trim().toUpperCase()).filter(Boolean);x.stars=Number($('#eStars').value)||1;x.unlockNote=$('#eUnlock').value.trim().toUpperCase();x.targetTime=Number($('#eTime').value)||null;x.requiredPerfectRuns=Number($('#eRuns').value)||0;x.active=$('#eActive').checked}else x.icon=$('#eIcon').value.trim()||'🏅';await db.collection('gameConfig').doc(currentEdit.type==='level'?'levels':'rewards').collection('items').doc(id).set(x,{merge:true});$('#editDialog').close();currentEdit.type==='level'?loadLevels():loadRewards()}

$('#previewLevels').onclick=async()=>{const s=await db.collection('gameConfig').doc('levels').collection('items').orderBy('order').get();const levels=s.empty?DEFAULT_LEVELS:s.docs.map(d=>({id:d.id,...d.data()}));const box=$('#levelPreview');box.innerHTML='<h3>Pelissä näkyvä eteneminen</h3><div class="previewGrid">'+levels.filter(x=>x.active!==false).map(x=>`<div class="previewLevel"><b>${'⭐'.repeat(Number(x.stars)||1)} ${esc(x.name||x.id)}</b><span>${esc((x.notes||[]).join(' '))}</span><small>${x.unlockNote?'Avaa sävelen '+esc(x.unlockNote):'Aloitustaso'} · ⚡ ${x.targetTime||'–'} s · ${x.requiredPerfectRuns||0} virheetöntä</small></div>`).join('')+'</div>';box.classList.toggle('hidden')};
$('#resetLevels').onclick=async()=>{if(!confirm('Palautetaanko viisi oletustasoa HAG → C → F → D → E?'))return;const col=db.collection('gameConfig').doc('levels').collection('items');const old=await col.get();let batch=db.batch();old.docs.forEach(d=>batch.delete(d.ref));DEFAULT_LEVELS.forEach(x=>{const {id,...data}=x;batch.set(col.doc(id),{...data,updatedAt:Date.now()})});await batch.commit();$('#levelPreview').classList.add('hidden');loadLevels()};
async function deleteItem(type,id){if(!confirm('Poistetaanko tämä määritys?'))return;await db.collection('gameConfig').doc(type==='level'?'levels':'rewards').collection('items').doc(id).delete();type==='level'?loadLevels():loadRewards()}
