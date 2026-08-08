(()=>{
'use strict';
const TOTAL=10;
const LEVELS={
  1:{name:'ENSISÄVELET',notes:['G','A','H'],image:'taso_1_ensissavelet.png'},
  2:{name:'TASAPAINOTEMPPU',notes:['C','H','A','G'],image:'taso_2_tasapainotemppu.png'},
  3:{name:'SORMISIRKUS',notes:['D','C','H','A','G'],image:'taso_3_sormisirkus.png'}
};
const POS={C:{cx:312,cy:648},H:{cx:548,cy:648},A:{cx:777,cy:648},G:{cx:996,cy:648},D:{cx:750,cy:365}};
const PITCH_CLASS={0:'C',2:'D',7:'G',9:'A',11:'H'};
const $=id=>document.getElementById(id);
const stage=$('stage'),reticle=$('reticle'),flash=$('flash'),hitText=$('hitText'),scoreEl=$('score'),targetEl=$('targetNote'),heardEl=$('heard'),message=$('message'),hud=$('hud'),levelOverlay=$('levelOverlay'),finishOverlay=$('finishOverlay'),timeResult=$('timeResult'),finishLevel=$('finishLevel'),levelNameHud=$('levelNameHud'),videoOverlay=$('videoOverlay'),helpVideo=$('helpVideo'),sessionName=$('sessionName'),levelChooser=$('levelChooser'),saveStatus=$('saveStatus'),finishScores=$('finishScores'),scoreboardOverlay=$('scoreboardOverlay'),scoreboardScores=$('scoreboardScores'),scoreboardStatus=$('scoreboardStatus'),finishSemester=$('finishSemester'),scoreboardSemester=$('scoreboardSemester'),progressLamps=$('progressLamps');
let engine=null,level=LEVELS[1],currentLevelId=1,target='A',score=0,running=false,accepting=false,startedAt=0,lastAccepted=0,finalTimeMs=0,currentBoardLevel=1,sessionPlayerName='',finaleLightsRunning=false;
const gameAudio=new window.SavelkojuAudioManager({
  hit:'Lamppu.wav',
  finale:'Sirkusmusa.wav'
});

async function unlockGameAudio(){
  try{
    await gameAudio.unlock();
    await gameAudio.ready();
  }catch(e){
    console.warn('Peliäänien avaus epäonnistui:',e);
  }
}

function playHitSound(){
  gameAudio.playHit();
}

function playFinaleSound(){
  gameAudio.playFinale();
}
function fitStage(){const scale=Math.min(innerWidth/1536,innerHeight/1024);stage.style.transform=`translate(-50%,-50%) scale(${scale})`;}
addEventListener('resize',fitStage);fitStage();
function captureSessionName(){
  const name=window.SavelkojuScoreboard.cleanName(sessionName.value);
  if(!name){
    sessionName.classList.remove('name-needed');
    void sessionName.offsetWidth;
    sessionName.classList.add('name-needed');
    sessionName.focus();
    return false;
  }
  sessionPlayerName=name;
  return true;
}
function setLevel(n){currentLevelId=Number(n);level=LEVELS[currentLevelId];stage.style.backgroundImage=`url("${level.image}")`;levelNameHud.textContent=level.name;}
function updateProgressLamps(){
  const lamps=progressLamps.querySelectorAll('span');
  lamps.forEach((lamp,i)=>{
    lamp.classList.toggle('on',i<score);
    lamp.classList.toggle('just-on',i===score-1);
  });
  clearTimeout(updateProgressLamps.timer);
  updateProgressLamps.timer=setTimeout(()=>lamps.forEach(l=>l.classList.remove('just-on')),260);
}
async function finaleLampShow(){
  const lamps=[...progressLamps.querySelectorAll('span')];
  accepting=false;

  // Anna viimeisen normaalin lampun pop-animaation näkyä ensin.
  await new Promise(r=>setTimeout(r,320));

  // Musiikki, valoshow ja loppulätkän feidaus käynnistyvät yhdessä.
  playFinaleSound();
  prepareFinishOverlay();

  finaleLightsRunning=true;

  // Jatkuva rauhallinen satunnaisvilkutus.
  while(finaleLightsRunning){
    lamps.forEach(l=>{
      const on=Math.random()>.45;
      l.classList.toggle('finale-on',on);
      l.classList.toggle('finale-off',!on);
      l.classList.remove('finale-all');
    });
    await new Promise(r=>setTimeout(r,120+Math.random()*90));
  }

  // Kun pelaaja jatkaa, palauta lamput normaaliin pelitilaan.
  lamps.forEach(l=>l.classList.remove('finale-on','finale-off','finale-all'));
  updateProgressLamps();
}

function stopFinaleLights(){
  finaleLightsRunning=false;
  gameAudio.stopFinale();
}

async function changePlayer(){
  stopFinaleLights();
  running=false;
  accepting=false;
  reticle.style.opacity='0';

  try{
    if(engine?.stream) engine.stream.getAudioTracks().forEach(track=>track.enabled=false);
    if(engine?.audioContext && engine.audioContext.state==='running') await engine.audioContext.suspend();
  }catch(e){console.warn(e);}

  sessionPlayerName='';
  sessionName.value='';
  sessionName.classList.remove('name-needed');

  finishOverlay.classList.add('hidden');
  finishOverlay.classList.remove('finale-fade');
  hud.classList.add('hidden');
  levelOverlay.classList.remove('hidden');

  score=0;
  scoreEl.textContent='0';
  updateProgressLamps();

  requestAnimationFrame(()=>sessionName.focus());
}
function setTarget(note){target=note;targetEl.textContent=note;const p=POS[note];reticle.classList.remove('hit');reticle.style.left=(p.cx-41)+'px';reticle.style.top=(p.cy-41)+'px';reticle.style.opacity='.62';accepting=true;}
function nextTarget(){const choices=level.notes.filter(n=>n!==target);setTarget(choices[Math.floor(Math.random()*choices.length)]);}
function showMessage(text){message.textContent=text;message.style.display='block';clearTimeout(showMessage.timer);showMessage.timer=setTimeout(()=>message.style.display='none',650);}
function hitEffect(){const p=POS[target];reticle.classList.remove('hit');void reticle.offsetWidth;reticle.classList.add('hit');flash.style.left=p.cx+'px';flash.style.top=p.cy+'px';flash.classList.remove('show');void flash.offsetWidth;flash.classList.add('show');hitText.style.left=p.cx+'px';hitText.style.top=(p.cy-45)+'px';hitText.classList.remove('show');void hitText.offsetWidth;hitText.classList.add('show');}
function hear(note){if(!running||!accepting||note!==target)return;const now=performance.now();if(now-lastAccepted<500)return;lastAccepted=now;accepting=false;score++;scoreEl.textContent=score;updateProgressLamps();playHitSound();hitEffect();showMessage('Hieno osuma!');setTimeout(()=>{if(score>=TOTAL){finaleLampShow();}else nextTarget();},500);}
function microphoneOutput(output){if(output.status==='signal'){const note=PITCH_CLASS[output.pitchClass];heardEl.textContent=note?`KUULEN: ${note}`:'KUUNTELEN…';if(note)hear(note);return;}if(output.status==='opening')heardEl.textContent='AVATAAN MIKROFONIA…';else if(output.status==='error')heardEl.textContent='MIKROFONIVIRHE';else heardEl.textContent='KUUNTELEN…';}
function ensureEngine(){if(engine)return engine;const M=window.NuottikompassiMicrophoneEngine;if(!M)throw new Error('Mikrofonimoottoria ei voitu ladata.');engine=new M.MicrophoneEngine({...M.DEFAULTS,referenceEnabled:false,liveReferenceEnabled:false},microphoneOutput);return engine;}
async function pauseMic(){
  running=false;
  accepting=false;
  reticle.style.opacity='0';
  if(!engine)return;
  try{
    if(engine.stream)engine.stream.getAudioTracks().forEach(track=>track.enabled=false);
    if(engine.audioContext&&engine.audioContext.state==='running')await engine.audioContext.suspend();
  }catch(e){console.warn(e);}
}
async function resumeMic(){
  const e=ensureEngine();
  await e.start();
  try{
    if(e.stream)e.stream.getAudioTracks().forEach(track=>track.enabled=true);
    if(e.audioContext&&e.audioContext.state==='suspended')await e.audioContext.resume();
  }catch(err){console.warn(err);}
}
async function startGame(levelNumber=null){try{stopFinaleLights();closeHelp(false);closeScoreboard();if(levelNumber)setLevel(levelNumber);await resumeMic();levelOverlay.classList.add('hidden');finishOverlay.classList.add('hidden');finishOverlay.classList.remove('finale-fade');hud.classList.remove('hidden');score=0;scoreEl.textContent='0';updateProgressLamps();startedAt=performance.now();running=true;accepting=true;setTarget(level.notes[Math.floor(Math.random()*level.notes.length)]);}catch(err){heardEl.textContent='MIKROFONIA EI SAATU AUKI';alert('Mikrofonia ei voitu avata. Tarkista selaimen mikrofonilupa.');console.error(err);}}
function updateSemesterLabels(){
  const s=window.SavelkojuScoreboard.currentSemester();
  if(finishSemester) finishSemester.textContent='· '+s.label;
  if(scoreboardSemester) scoreboardSemester.textContent=s.label;
}
function formatTime(ms){return (ms/1000).toFixed(1).replace('.',',')+' s';}
function renderScores(list,el,highlightId='',highlightRow=null){
  el.innerHTML='';
  if(!list.length){
    const li=document.createElement('li');
    li.className='empty';
    li.textContent='Ei tuloksia vielä.';
    el.appendChild(li);
    return;
  }
  list.forEach(row=>{
    const li=document.createElement('li');
    if(highlightId && row.id===highlightId) li.classList.add('current-score');
    const name=document.createElement('span');
    name.textContent=row.playerName||'Pelaaja';
    const time=document.createElement('span');
    time.className='score-time';
    time.textContent=formatTime(row.timeMs);
    li.append(name,time);
    el.appendChild(li);
  });

  if(highlightId && highlightRow && !list.some(row=>row.id===highlightId)){
    const li=document.createElement('li');
    li.className='current-score own-outside-top';
    const name=document.createElement('span');
    name.textContent=highlightRow.playerName||'Pelaaja';
    const time=document.createElement('span');
    time.className='score-time';
    time.textContent=formatTime(highlightRow.timeMs);
    li.append(name,time);
    el.appendChild(li);
  }
}
async function loadBoard(levelId,el,statusEl,highlightId='',highlightRow=null){
  statusEl.textContent='Ladataan…';
  try{
    const rows=await window.SavelkojuScoreboard.loadScores(levelId,10);
    renderScores(rows,el,highlightId,highlightRow);
    statusEl.textContent='';
  }catch(err){
    console.error(err);
    el.innerHTML='';
    statusEl.textContent='Tulostaulua ei saatu ladattua.';
  }
}
async function prepareFinishOverlay(){
  updateSemesterLabels();
  running=false;
  accepting=false;
  reticle.style.opacity='0';
  finalTimeMs=Math.round(performance.now()-startedAt);
  timeResult.textContent=formatTime(finalTimeMs);
  finishLevel.textContent=level.name+' · 10 osumaa';
  saveStatus.textContent='Tallennetaan tulosta…';

  finishOverlay.classList.remove('hidden');
  finishOverlay.classList.remove('finale-fade');
  void finishOverlay.offsetWidth;
  finishOverlay.classList.add('finale-fade');

  try{
    const saved=await window.SavelkojuScoreboard.saveScore({
      playerName:sessionPlayerName,
      levelId:currentLevelId,
      levelName:level.name,
      timeMs:finalTimeMs
    });
    const newId=saved?.id || '';
    await loadBoard(
      currentLevelId,
      finishScores,
      saveStatus,
      newId,
      {id:newId,playerName:sessionPlayerName,timeMs:finalTimeMs}
    );
    if(!newId) saveStatus.textContent='Tulos tallennettu.';
  }catch(err){
    console.error(err);
    saveStatus.textContent='Tuloksen tallennus epäonnistui.';
    await loadBoard(currentLevelId,finishScores,saveStatus);
  }
}

async function finishGame(){
  await prepareFinishOverlay();
}
async function openScoreboard(levelId=currentBoardLevel){
  updateSemesterLabels();
  await pauseMic();
  currentBoardLevel=Number(levelId);
  document.querySelectorAll('.score-tab').forEach(b=>b.classList.toggle('active',Number(b.dataset.scoreLevel)===currentBoardLevel));
  scoreboardOverlay.classList.remove('hidden');
  await loadBoard(currentBoardLevel,scoreboardScores,scoreboardStatus);
}
function closeScoreboard(){scoreboardOverlay.classList.add('hidden');}
async function chooseLevels(){stopFinaleLights();await pauseMic();closeScoreboard();finishOverlay.classList.add('hidden');hud.classList.add('hidden');levelOverlay.classList.remove('hidden');}
async function openHelp(){await pauseMic();helpVideo.currentTime=0;videoOverlay.classList.remove('hidden');videoOverlay.setAttribute('aria-hidden','false');try{await helpVideo.play();}catch(e){console.warn(e);}}
function closeHelp(rewind=true){helpVideo.pause();if(rewind)helpVideo.currentTime=0;videoOverlay.classList.add('hidden');videoOverlay.setAttribute('aria-hidden','true');}
document.querySelectorAll('.level-btn').forEach(btn=>btn.addEventListener('click',async()=>{
  if(!captureSessionName())return;
  await unlockGameAudio();
  await startGame(Number(btn.dataset.level));
}));
$('againBtn').addEventListener('click',async()=>{await unlockGameAudio();await startGame();});
$('levelsBtn').addEventListener('click',chooseLevels);
$('changePlayerBtn').addEventListener('click',changePlayer);
$('helpBtn').addEventListener('click',openHelp);
$('closeVideoBtn').addEventListener('click',()=>closeHelp());
helpVideo.addEventListener('ended',()=>closeHelp());

$('scoreboardBtn').addEventListener('click',()=>openScoreboard(1));
$('closeScoreboardBtn').addEventListener('click',closeScoreboard);
document.querySelectorAll('.score-tab').forEach(btn=>btn.addEventListener('click',()=>openScoreboard(Number(btn.dataset.scoreLevel))));
window.SavelkojuScoreboard?.init();
addEventListener('beforeunload',()=>engine?.stop());setLevel(1);
})();
