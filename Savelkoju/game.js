(()=>{
'use strict';
const TOTAL=10;
const LEVELS={
  1:{name:'ENSISÄVELET',notes:['G','A','H'],image:'assets/taso_1_ensissavelet.jpg'},
  2:{name:'TASAPAINOTEMPPU',notes:['C','H','A','G'],image:'assets/taso_2_tasapainotemppu.jpg'},
  3:{name:'SORMISIRKUS',notes:['D','C','H','A','G'],image:'assets/taso_3_sormisirkus.jpg'}
};
const POS={C:{cx:312,cy:648},H:{cx:548,cy:648},A:{cx:777,cy:648},G:{cx:996,cy:648},D:{cx:750,cy:365}};
const PITCH_CLASS={0:'C',2:'D',7:'G',9:'A',11:'H'};
const TARGET_PITCH_CLASS={C:0,D:2,G:7,A:9,H:11};
const $=id=>document.getElementById(id);
const stage=$('stage');
const reticle=$('reticle');
const flash=$('flash');
const hitText=$('hitText');
const scoreEl=$('score');
const targetEl=$('targetNote');
const tunerLeds=$('tunerLeds');
const tunerOnlyLeds=$('tunerOnlyLeds');
const tunerNoteName=$('tunerNoteName');
const message=$('message');
const hud=$('hud');
const levelOverlay=$('levelOverlay');
const tunerOverlay=$('tunerOverlay');
const finishOverlay=$('finishOverlay');
const timeResult=$('timeResult');
const finishLevel=$('finishLevel');
const levelNameHud=$('levelNameHud');
const videoOverlay=$('videoOverlay');
const helpVideo=$('helpVideo');
const sessionName=$('sessionName');
const nameDoneBtn=$('nameDoneBtn');
const levelChooser=$('levelChooser');
const saveStatus=$('saveStatus');
const finishScores=$('finishScores');
const scoreboardOverlay=$('scoreboardOverlay');
const scoreboardScores=$('scoreboardScores');
const scoreboardStatus=$('scoreboardStatus');
const adminOverlay=$('adminOverlay');
const adminLogin=$('adminLogin');
const adminControls=$('adminControls');
const adminEmail=$('adminEmail');
const adminPassword=$('adminPassword');
const adminIdentity=$('adminIdentity');
const adminStatus=$('adminStatus');
const adminNewPassword=$('adminNewPassword');
const adminNewPassword2=$('adminNewPassword2');
const finishSemester=$('finishSemester');
const scoreboardSemester=$('scoreboardSemester');
const progressLamps=$('progressLamps');
const fingeringHint=$('fingeringHint');
let gameEngine=null;
let tunerEngine=null;
let gameLedAnalyser=null;
let gameLedTracker=null;
let gameLedBuffer=null;
let gameLedRaf=0;
let gameLedRunning=false;
let gameLedLastSoundTime=0;
let level=LEVELS[1];
let currentLevelId=1;
let target='A';
let score=0;
let running=false;
let accepting=false;
let startedAt=0;
let lastAccepted=0;
let finalTimeMs=0;
let currentBoardLevel=1;
let sessionPlayerName='';
let finaleLightsRunning=false;
let fingeringImg=null;
let fingeringHintVisible=false;
let fingeringGuardActive=false;
let fingeringGuardPitchClass=null;
let gameDominantHz=createDominantHzState();
let standaloneDominantHz=createDominantHzState();
const TUNER_STEP_CENTS=5;
const TUNER_MAX_CENTS=50;
const TUNER_LED_COUNT=21;
const TUNER_CENTER_INDEX=10;
const TUNER_NOTE_NAMES=['C','Cis','D','Dis','E','F','Fis','G','Gis','A','B','H'];
const GAME_TUNER_RMS_GATE=0.001;
const STANDALONE_TUNER_RMS_GATE=0.00025;
const DOMINANT_HZ_WINDOW_SIZE=15;
const FINGERING_HINT_Y_OFFSET=112;
const FINGERING_HINT_IMAGES={
  G:'assets/sormitus_G_savelkoju.png',
  A:'assets/sormitus_A_savelkoju.png',
  H:'assets/sormitus_H_savelkoju.png',
  C:'assets/sormitus_C_savelkoju.png',
  D:'assets/sormitus_D_savelkoju.png'
};

function createDominantHzState(){
  return {
    samples:[],
    counts:new Map(),
    dominantHz:null,
    active:false
  };
}

function resetDominantHzState(state){
  state.samples.length=0;
  state.counts.clear();
  state.dominantHz=null;
  state.active=false;
}

function endDominantHzSegment(state){
  // Äänen lopussa näyttö jää viimeiseen liukuvaan hallitsevaan arvoon.
  // Seuraava uusi ääni aloittaa uuden ikkunan.
  state.active=false;
}

function clearDominantHzWindow(state){
  state.samples.length=0;
  state.counts.clear();
  state.dominantHz=null;
}

function addDominantHzSample(state,hz){
  if(!Number.isFinite(hz))return null;

  if(!state.active){
    clearDominantHzWindow(state);
    state.active=true;
  }

  const integerHz=Math.round(hz);
  state.samples.push(integerHz);
  state.counts.set(integerHz,(state.counts.get(integerHz)||0)+1);

  if(state.samples.length>DOMINANT_HZ_WINDOW_SIZE){
    const oldHz=state.samples.shift();
    const oldCount=(state.counts.get(oldHz)||0)-1;
    if(oldCount<=0)state.counts.delete(oldHz);
    else state.counts.set(oldHz,oldCount);
  }

  let maxCount=0;
  for(const count of state.counts.values()){
    if(count>maxCount)maxCount=count;
  }

  const candidates=[];
  for(const [candidateHz,count] of state.counts){
    if(count===maxCount)candidates.push(candidateHz);
  }

  // Tasatilanteessa pidetään nykyinen arvo, jos se on edelleen ikkunan
  // hallitsevien joukossa. Muuten valitaan uusin havainto lähimpänä oleva
  // hallitseva arvo. Näin mittari on vakaa mutta ei jähmety pitkän äänen aikana.
  if(state.dominantHz!==null&&candidates.includes(state.dominantHz)){
    return state.dominantHz;
  }

  state.dominantHz=candidates.reduce((best,candidate)=>{
    if(best===null)return candidate;
    const bestDistance=Math.abs(best-integerHz);
    const candidateDistance=Math.abs(candidate-integerHz);
    return candidateDistance<bestDistance?candidate:best;
  },null);

  return state.dominantHz;
}

function initFingeringHint(){
  if(!fingeringHint)return;
  fingeringHint.textContent='';
  const img=document.createElement('img');
  img.alt='';
  img.draggable=false;
  img.loading='eager';
  img.setAttribute('aria-hidden','true');
  fingeringHint.appendChild(img);
  fingeringImg=img;
}
function prepareTargetFingeringImage(){
  if(!fingeringImg)return;
  const src=FINGERING_HINT_IMAGES[target];
  if(!src)return;
  if(fingeringImg.getAttribute('src')!==src){
    fingeringImg.src=src;
    if(typeof fingeringImg.decode==='function'){
      fingeringImg.decode().catch(()=>{});
    }
  }
}
function positionFingeringHint(){
  if(!fingeringHint)return;
  const p=POS[target];
  if(!p)return;
  fingeringHint.style.left=p.cx+'px';
  fingeringHint.style.top=(p.cy+FINGERING_HINT_Y_OFFSET)+'px';
}
function hideFingeringHint(){
  fingeringHintVisible=false;
  if(!fingeringHint)return;
  fingeringHint.classList.remove('show');
  fingeringHint.setAttribute('aria-hidden','true');
}
function showTargetFingeringHint(){
  if(!fingeringHint||!fingeringImg)return;
  prepareTargetFingeringImage();
  positionFingeringHint();
  fingeringHint.classList.add('show');
  fingeringHint.setAttribute('aria-hidden','false');
  fingeringHintVisible=true;
}
function registerWrongStablePitch(){
  if(!running||!accepting||fingeringHintVisible)return;
  showTargetFingeringHint();
}
function registerCorrectStablePitch(){
  if(fingeringHintVisible)hideFingeringHint();
}
function midiInfoFromHz(hz){
  if(!Number.isFinite(hz)||hz<=0)return null;
  const midiFloat=69+12*Math.log2(hz/440);
  const midi=Math.round(midiFloat);
  const pitchClass=((midi%12)+12)%12;
  const targetHz=440*Math.pow(2,(midi-69)/12);
  const cents=1200*Math.log2(hz/targetHz);
  return {midi,midiFloat,pitchClass,targetHz,cents};
}
function tunerZone(stepDistance){
  if(stepDistance<=1)return'good';
  if(stepDistance<=5)return'warn';
  return'bad';
}
function tunerContainers(){
  return [tunerLeds,tunerOnlyLeds].filter(Boolean);
}
function createTunerLeds(){
  tunerContainers().forEach(container=>{
    container.textContent='';
    for(let i=0;i<TUNER_LED_COUNT;i++){
      const led=document.createElement('span');
      led.className='tuner-led'+(i===TUNER_CENTER_INDEX?' center':'');
      container.appendChild(led);
    }
  });
}
function clearTunerContainer(container){
  if(!container)return;
  [...container.children].forEach((led,i)=>{
    led.className='tuner-led'+(i===TUNER_CENTER_INDEX?' center':'');
  });
}
function clearTunerLeds(){
  tunerContainers().forEach(clearTunerContainer);
}
function renderTunerCents(cents,container=tunerLeds){
  if(!Number.isFinite(cents)||!container)return;
  clearTunerContainer(container);
  const clipped=Math.max(-TUNER_MAX_CENTS,Math.min(TUNER_MAX_CENTS,cents));
  const steps=Math.round(Math.abs(clipped)/TUNER_STEP_CENTS);
  const direction=Math.sign(clipped);
  const leds=[...container.children];

  leds[TUNER_CENTER_INDEX]?.classList.add('on','good');

  for(let s=1;s<=steps;s++){
    const idx=direction>0?TUNER_CENTER_INDEX+s:TUNER_CENTER_INDEX-s;
    if(idx<0||idx>=leds.length)continue;
    leds[idx].classList.add('on',tunerZone(s));
  }
}
function clearTunerReadout(container=null){
  if(container)clearTunerContainer(container);
  else clearTunerLeds();
}
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

async function playFinaleSoundUntilEnd(){
  try{
    await gameAudio.playFinaleUntilEnd();
  }catch(e){
    console.warn('Finaalimusiikki:',e);
  }finally{
    finaleLightsRunning=false;
  }
}
function fitStage(){
  const scale=Math.min(innerWidth/1536,innerHeight/1024);
  stage.style.transform=`translate(-50%,-50%) scale(${scale})`;
}
addEventListener('resize',fitStage);fitStage();

if(window.visualViewport){
  let lastViewportHeight=window.visualViewport.height;
  window.visualViewport.addEventListener('resize',()=>{
    const currentHeight=window.visualViewport.height;

    // Kun näppäimistö sulkeutuu, visual viewport kasvaa selvästi.
    if(currentHeight > lastViewportHeight + 80){
      setTimeout(()=>{
        window.scrollTo(0,0);
        fitStage();
      },120);
    }

    lastViewportHeight=currentHeight;
  });
}
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
function setLevel(n){
  currentLevelId=Number(n);
  level=LEVELS[currentLevelId];
  stage.style.backgroundImage=`url("${level.image}")`;
  levelNameHud.textContent=level.name;
}
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

  // Viimeisen lampun oma pop näkyviin ensin.
  await new Promise(r=>setTimeout(r,320));

  finaleLightsRunning=true;

  // Käynnistä musiikki ja pidä random-valoshow päällä koko musiikin ajan.
  void playFinaleSoundUntilEnd();

  while(finaleLightsRunning){
    lamps.forEach(l=>{
      const on=Math.random()>.45;
      l.classList.toggle('finale-on',on);
      l.classList.toggle('finale-off',!on);
      l.classList.remove('finale-all');
    });
    await new Promise(r=>setTimeout(r,120+Math.random()*90));
  }

  // Kun musiikki on loppu, jätä kaikki lamput vielä hetkeksi päälle.
  lamps.forEach(l=>{
    l.classList.remove('finale-off');
    l.classList.add('finale-on','finale-all');
  });
  await new Promise(r=>setTimeout(r,420));

  lamps.forEach(l=>l.classList.remove('finale-on','finale-off','finale-all'));
  updateProgressLamps();

  await prepareFinishOverlay();
}

function stopFinaleLights(){
  finaleLightsRunning=false;
  gameAudio.stopFinale();
}

async function changePlayer(){
  stopFinaleLights();
  hideFingeringHint();
  running=false;
  accepting=false;
  reticle.style.opacity='0';

  await pauseMic();
  await stopTunerMic();

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
function setTarget(note){
  hideFingeringHint();

  // Estä edellisen vielä soivan sävelen tulkitseminen uuden tavoitteen virheeksi.
  fingeringGuardPitchClass=TARGET_PITCH_CLASS[target] ?? null;
  fingeringGuardActive=fingeringGuardPitchClass!==null;
  target=note;
  targetEl.textContent=note;
  prepareTargetFingeringImage();

  const p=POS[note];
  reticle.classList.remove('hit');
  reticle.style.left=(p.cx-41)+'px';
  reticle.style.top=(p.cy-41)+'px';
  reticle.style.opacity='.62';

  positionFingeringHint();
  accepting=true;
}
function nextTarget(){
  const choices=level.notes.filter(n=>n!==target);
  setTarget(choices[Math.floor(Math.random()*choices.length)]);
}
function showMessage(text){
  message.textContent=text;
  message.style.display='block';
  clearTimeout(showMessage.timer);
  showMessage.timer=setTimeout(()=>message.style.display='none',650);
}
function hitEffect(){
  const p=POS[target];

  reticle.classList.remove('hit');
  void reticle.offsetWidth;
  reticle.classList.add('hit');

  flash.style.left=p.cx+'px';
  flash.style.top=p.cy+'px';
  flash.classList.remove('show');
  void flash.offsetWidth;
  flash.classList.add('show');

  hitText.style.left=p.cx+'px';
  hitText.style.top=(p.cy-45)+'px';
  hitText.classList.remove('show');
  void hitText.offsetWidth;
  hitText.classList.add('show');
}
function hear(note){
  if(!running||!accepting||note!==target)return;

  hideFingeringHint();

  const now=performance.now();
  if(now-lastAccepted<500)return;

  lastAccepted=now;
  accepting=false;
  score++;
  scoreEl.textContent=score;
  updateProgressLamps();
  playHitSound();
  hitEffect();
  showMessage('Hieno osuma!');

  setTimeout(()=>{
    if(score>=TOTAL)finaleLampShow();
    else nextTarget();
  },500);
}
/* Nuottikompassi ohjaa peliosumia ja nopeaa sormitusvihjettä. */
function gameMicrophoneOutput(output){
  if(
    fingeringGuardActive &&
    (output.status==='waiting' || output.status==='holding')
  ){
    fingeringGuardActive=false;
    fingeringGuardPitchClass=null;
  }

  const pitchStatus=
    output.status==='confirming-note' ||
    output.status==='confirming-octave' ||
    output.status==='signal';

  if(running&&accepting&&pitchStatus){
    let detectedPitchClass=null;

    if(output.status==='signal'&&Number.isInteger(output.pitchClass)){
      detectedPitchClass=output.pitchClass;
    }else if(Number.isFinite(output.frequency)){
      detectedPitchClass=midiInfoFromHz(output.frequency)?.pitchClass ?? null;
    }

    if(detectedPitchClass!==null){
      if(fingeringGuardActive){
        if(detectedPitchClass===fingeringGuardPitchClass){
          // Edellinen tavoitesävel soi vielä: älä näytä vihjettä siitä.
          if(output.status==='signal'){
            const note=PITCH_CLASS[output.pitchClass];
            if(note)hear(note);
          }
          return;
        }

        fingeringGuardActive=false;
        fingeringGuardPitchClass=null;
      }

      const targetPitchClass=TARGET_PITCH_CLASS[target];

      if(detectedPitchClass===targetPitchClass){
        registerCorrectStablePitch();
      }else{
        clearTunerReadout(tunerLeds);
        registerWrongStablePitch();
      }
    }
  }

  // Varsinainen osuma hyväksytään edelleen vain vanhan moottorin signal-tilasta.
  if(output.status!=='signal')return;

  const note=PITCH_CLASS[output.pitchClass];
  if(note)hear(note);
}

/*
  Pelissä on yksi mikrofonistream ja kaksi analyysihaaraa:
  1) inputGainNode -> vanha 2048-analyser -> pelin osumat
  2) sama inputGainNode -> 4096-analyser -> PitchEngine YIN/lukitus -> LEDit
*/
function ensureGameLedTracker(){
  const U=window.PitchEngineUtils;
  const T=window.PitchLockTracker;

  if(!U||!T){
    throw new Error('Hertsimittarin PitchEngine-apufunktioita ei voitu ladata.');
  }

  if(!gameLedTracker){
    gameLedTracker=new T(U.DEFAULTS);
  }

  return {U,T};
}

function handleGameLedStableHz(stableHz){
  if(!Number.isFinite(stableHz))return;

  const tuningInfo=midiInfoFromHz(stableHz);
  if(!tuningInfo)return;

  const targetPitchClass=TARGET_PITCH_CLASS[target];
  const isTargetPitch=tuningInfo.pitchClass===targetPitchClass;

  if(running&&accepting&&!isTargetPitch){
    // Väärälle sävelelle ei näytetä viritysarvoa eikä sitä lasketa mukaan.
    resetDominantHzState(gameDominantHz);
    clearTunerReadout(tunerLeds);
    return;
  }

  const dominantHz=addDominantHzSample(gameDominantHz,stableHz);
  const dominantInfo=midiInfoFromHz(dominantHz);
  if(!dominantInfo)return;

  renderTunerCents(dominantInfo.cents,tunerLeds);
}

function gameLedTick(){
  if(
    !gameLedRunning ||
    !gameLedAnalyser ||
    !gameEngine?.audioContext
  ){
    return;
  }

  const {U}=ensureGameLedTracker();
  const config=U.DEFAULTS;

  gameLedAnalyser.getFloatTimeDomainData(gameLedBuffer);

  const now=performance.now();
  const rms=U.rmsOf(gameLedBuffer);

  if(rms>=GAME_TUNER_RMS_GATE){
    gameLedLastSoundTime=now;
  }

  if(rms<GAME_TUNER_RMS_GATE){
    if(
      gameLedTracker.locked &&
      now-gameLedLastSoundTime>config.silenceReleaseMs
    ){
      // Vapauta sävellukitus ja päätä tämän äänen liukuva Hz-jakso.
      // Viimeinen hallitseva lukema jää silti näyttöön.
      gameLedTracker.reset({keepStable:true});
      endDominantHzSegment(gameDominantHz);
    }else if(!gameLedTracker.locked){
      gameLedTracker.clearCandidates();
    }

    gameLedRaf=requestAnimationFrame(gameLedTick);
    return;
  }

  const rawHz=U.detectPitchYIN(
    gameLedBuffer,
    gameEngine.audioContext.sampleRate,
    config
  );

  if(rawHz!==null){
    const integerHz=Math.round(rawHz);
    const result=gameLedTracker.process(integerHz);

    // Sama kuin PitchEngine._handleTrackerResult:
    // LEDiin päästetään vain lukittu/vakautettu stableHz.
    if(
      result.type==='locked' ||
      result.type==='relocked' ||
      result.type==='pitch'
    ){
      handleGameLedStableHz(result.stableHz);
    }

    // switching-tilassa jätetään edellinen LED-lukema näkyviin,
    // kuten PitchEnginen vakaassa lukituksessa.
  }

  gameLedRaf=requestAnimationFrame(gameLedTick);
}

function startGameLedTracker(){
  if(gameLedRunning)return;

  if(
    !gameEngine?.inputGainNode ||
    !gameEngine?.audioContext
  ){
    throw new Error('Pelin mikrofoniketjua ei ole vielä avattu.');
  }

  const {U}=ensureGameLedTracker();

  gameLedTracker.reset({keepStable:false});
  resetDominantHzState(gameDominantHz);
  clearTunerReadout(tunerLeds);

  const analyser=gameEngine.audioContext.createAnalyser();
  analyser.fftSize=U.DEFAULTS.fftSize;                 // 4096
  analyser.smoothingTimeConstant=U.DEFAULTS.analyserSmoothing; // 0

  // Sama 4× inputGainNode kuin pelin säveltunnistimella; ei toista mikrofonistreamia.
  gameEngine.inputGainNode.connect(analyser);

  gameLedAnalyser=analyser;
  gameLedBuffer=new Float32Array(analyser.fftSize);
  gameLedLastSoundTime=performance.now();
  gameLedRunning=true;
  gameLedRaf=requestAnimationFrame(gameLedTick);
}

function stopGameLedTracker({keepStable=false}={}){
  gameLedRunning=false;

  if(gameLedRaf){
    cancelAnimationFrame(gameLedRaf);
    gameLedRaf=0;
  }

  if(gameLedAnalyser){
    try{
      gameEngine?.inputGainNode?.disconnect(gameLedAnalyser);
    }catch(_){}
    try{
      gameLedAnalyser.disconnect();
    }catch(_){}
  }

  gameLedAnalyser=null;
  gameLedBuffer=null;

  if(gameLedTracker){
    gameLedTracker.reset({keepStable});
  }
  resetDominantHzState(gameDominantHz);

  clearTunerReadout(tunerLeds);
}

function ensureGameEngine(){
  if(gameEngine)return gameEngine;
  const M=window.NuottikompassiMicrophoneEngine;
  if(!M)throw new Error('Vanhaa mikrofonimoottoria ei voitu ladata.');

  gameEngine=new M.MicrophoneEngine(
    {
      ...M.DEFAULTS,
      referenceEnabled:false,
      liveReferenceEnabled:false
    },
    gameMicrophoneOutput
  );

  return gameEngine;
}

async function pauseMic(){
  running=false;
  accepting=false;
  reticle.style.opacity='0';

  // Pysäytä Hertsimittarin rinnakkaishaara ennen AudioContextin suspendia.
  stopGameLedTracker();

  if(!gameEngine)return;

  try{
    if(gameEngine.stream){
      gameEngine.stream.getAudioTracks().forEach(track=>track.enabled=false);
    }
    if(
      gameEngine.audioContext &&
      gameEngine.audioContext.state==='running'
    ){
      await gameEngine.audioContext.suspend();
    }
  }catch(e){
    console.warn(e);
  }
}

async function stopGameMic(){
  running=false;
  accepting=false;
  reticle.style.opacity='0';

  // Irrota rinnakkaishaara ennen kuin vanha moottori sulkee AudioContextin.
  stopGameLedTracker();

  if(!gameEngine)return;

  try{
    await gameEngine.stop();
  }catch(e){
    console.warn(e);
  }
}

async function resumeMic(){
  // Erillinen PitchEngine-viritystila ei saa olla aktiivinen pelin aikana.
  await stopTunerMic();

  const e=ensureGameEngine();
  await e.start();

  try{
    if(e.stream){
      e.stream.getAudioTracks().forEach(track=>track.enabled=true);
    }
    if(
      e.audioContext &&
      e.audioContext.state==='suspended'
    ){
      await e.audioContext.resume();
    }

    // Käynnistä Hertsimittarin 4096-YIN-haara SAMASTA lähteestä.
    startGameLedTracker();
  }catch(err){
    console.warn(err);
  }
}


/* Erillinen VIRITYS-tila käyttää PitchEngine 1.0:aa omalla herkkyysrajalla. */
function tunerPitchOutput(event){
  const dominantHz=addDominantHzSample(standaloneDominantHz,event.hz);
  const info=midiInfoFromHz(dominantHz);
  if(!info)return;

  if(tunerNoteName){
    tunerNoteName.textContent=TUNER_NOTE_NAMES[info.pitchClass]||'';
  }

  renderTunerCents(info.cents,tunerOnlyLeds);
}

function tunerLockOutput(event){
  if(!event)return;

  // Liukuva Hz-jakso päätetään vain oikeaan hiljaisuuteen.
  // Re-lock ei nollaa ikkunaa, joten lyhyt äänen häntä ei yksin kaappaa näyttöä.
  if(event.action==='unlocked'){
    endDominantHzSegment(standaloneDominantHz);
  }
}

function ensureTunerEngine(){
  if(tunerEngine)return tunerEngine;

  const E=window.PitchEngine;
  if(!E)throw new Error('PitchEngine 1.0 -moottoria ei voitu ladata.');

  tunerEngine=new E({rmsGate:STANDALONE_TUNER_RMS_GATE});
  tunerEngine.on('pitch',tunerPitchOutput);
  tunerEngine.on('lock',tunerLockOutput);
  tunerEngine.on('error',e=>console.error(e.error||e));

  return tunerEngine;
}

async function startTunerMic(){
  // Vanha pelimoottori vapauttaa mikrofonin kokonaan.
  await stopGameMic();

  resetDominantHzState(standaloneDominantHz);
  const e=ensureTunerEngine();
  await e.start();
}

async function stopTunerMic(){
  clearTunerReadout(tunerOnlyLeds);
  if(tunerNoteName)tunerNoteName.textContent='';
  resetDominantHzState(standaloneDominantHz);
  if(!tunerEngine)return;

  try{
    await tunerEngine.stop();
  }catch(e){
    console.warn(e);
  }
}

async function startGame(levelNumber=null){
  try{
    stopFinaleLights();
    closeHelp(false);
    closeScoreboard();
    closeAdmin();

    if(levelNumber)setLevel(levelNumber);
    await resumeMic();

    levelOverlay.classList.add('hidden');
    finishOverlay.classList.add('hidden');
    finishOverlay.classList.remove('finale-fade');
    hud.classList.remove('hidden');

    score=0;
    scoreEl.textContent='0';
    updateProgressLamps();
    startedAt=performance.now();
    running=true;
    accepting=true;

    setTarget(level.notes[Math.floor(Math.random()*level.notes.length)]);
  }catch(err){
    alert('Mikrofonia ei voitu avata. Tarkista selaimen mikrofonilupa.');
    console.error(err);
  }
}
function updateSemesterLabels(){
  const s=window.SavelkojuScoreboard.currentSemester();
  if(finishSemester) finishSemester.textContent='· '+s.label;
  if(scoreboardSemester) scoreboardSemester.textContent=s.label;
}
function formatTime(ms){
  return (ms/1000).toFixed(1).replace('.',',')+' s';
}
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
  hideFingeringHint();
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

async function openScoreboard(levelId=currentBoardLevel){
  updateSemesterLabels();
  await pauseMic();
  currentBoardLevel=Number(levelId);
  document.querySelectorAll('.score-tab').forEach(b=>b.classList.toggle('active',Number(b.dataset.scoreLevel)===currentBoardLevel));
  scoreboardOverlay.classList.remove('hidden');
  await loadBoard(currentBoardLevel,scoreboardScores,scoreboardStatus);
}
function closeScoreboard(){
  scoreboardOverlay.classList.add('hidden');
}

async function refreshAdminUI(){
  adminStatus.textContent='';
  try{
    const admin=await window.SavelkojuScoreboard.getCurrentAdmin();
    adminLogin.classList.toggle('hidden',!!admin);
    adminControls.classList.toggle('hidden',!admin);
    adminIdentity.textContent=admin ? admin.email : '';
  }catch(e){
    console.warn(e);
    adminLogin.classList.remove('hidden');
    adminControls.classList.add('hidden');
  }
}

async function openAdmin(){
  await pauseMic();
  closeScoreboard();
  adminOverlay.classList.remove('hidden');
  await refreshAdminUI();
}

function closeAdmin(){
  adminOverlay.classList.add('hidden');
  adminStatus.textContent='';
}

async function adminSignIn(){
  adminStatus.textContent='Kirjaudutaan…';
  try{
    const admin=await window.SavelkojuScoreboard.signInAdmin(adminEmail.value,adminPassword.value);
    adminPassword.value='';
    adminStatus.textContent='';
    adminLogin.classList.add('hidden');
    adminControls.classList.remove('hidden');
    adminIdentity.textContent=admin.email;
  }catch(e){
    console.error(e);
    adminStatus.textContent=e.message||'Kirjautuminen epäonnistui.';
  }
}

async function resetSemesterLevel(levelId){
  const levelName=LEVELS[Number(levelId)]?.name||('Taso '+levelId);
  const s=window.SavelkojuScoreboard.currentSemester();
  if(!confirm(`Nollataanko ${levelName} – ${s.label}?`))return;

  adminStatus.textContent='Poistetaan tuloksia…';
  try{
    const n=await window.SavelkojuScoreboard.deleteCurrentSemesterScores(levelId);
    adminStatus.textContent=`Poistettu ${n} tulosta.`;
  }catch(e){
    console.error(e);
    adminStatus.textContent=e.message||'Nollaus epäonnistui.';
  }
}

async function changeAdminPassword(){
  const p1=adminNewPassword.value;
  const p2=adminNewPassword2.value;

  if(!p1){
    adminStatus.textContent='Kirjoita uusi salasana.';
    adminNewPassword.focus();
    return;
  }
  if(p1!==p2){
    adminStatus.textContent='Salasanat eivät täsmää.';
    adminNewPassword2.focus();
    return;
  }

  adminStatus.textContent='Vaihdetaan salasanaa…';
  try{
    await window.SavelkojuScoreboard.updateAdminPassword(p1);
    adminNewPassword.value='';
    adminNewPassword2.value='';
    adminStatus.textContent='Salasana vaihdettu.';
  }catch(e){
    console.error(e);
    if(e?.code==='auth/requires-recent-login'){
      adminStatus.textContent='Kirjaudu ulos ja takaisin sisään ennen salasanan vaihtoa.';
    }else{
      adminStatus.textContent=e.message||'Salasanan vaihto epäonnistui.';
    }
  }
}

async function resetAllSemesterScores(){
  const s=window.SavelkojuScoreboard.currentSemester();
  if(!confirm(`Nollataanko KAIKKIEN KOLMEN TASON tulokset – ${s.label}?`))return;

  adminStatus.textContent='Poistetaan kaikkien tasojen tuloksia…';
  try{
    let total=0;
    for(const id of [1,2,3]){
      total+=await window.SavelkojuScoreboard.deleteCurrentSemesterScores(id);
    }
    adminStatus.textContent=`Poistettu yhteensä ${total} tulosta.`;
  }catch(e){
    console.error(e);
    adminStatus.textContent=e.message||'Nollaus epäonnistui.';
  }
}

async function openTunerMode(){
  try{
    stopFinaleLights();
    closeHelp(false);
    closeScoreboard();
    closeAdmin();
    running=false;
    accepting=false;
    reticle.style.opacity='0';
    clearTunerReadout(tunerOnlyLeds);

    // VIRITYS-tila käyttää vain PitchEngine 1.0:aa.
    await startTunerMic();

    tunerOverlay.classList.remove('hidden');
    tunerOverlay.setAttribute('aria-hidden','false');
  }catch(err){
    console.error(err);
    alert('Mikrofonia ei voitu avata. Tarkista selaimen mikrofonilupa.');
  }
}
async function closeTunerMode(){
  tunerOverlay.classList.add('hidden');
  tunerOverlay.setAttribute('aria-hidden','true');
  await stopTunerMic();
}

async function chooseLevels(){
  hideFingeringHint();
  stopFinaleLights();
  await pauseMic();
  await stopTunerMic();
  closeScoreboard();
  finishOverlay.classList.add('hidden');
  finishOverlay.classList.remove('finale-fade');
  hud.classList.add('hidden');
  levelOverlay.classList.remove('hidden');
}
async function openHelp(){
  await pauseMic();
  await stopTunerMic();
  helpVideo.currentTime=0;
  videoOverlay.classList.remove('hidden');
  videoOverlay.setAttribute('aria-hidden','false');

  try{
    await helpVideo.play();
  }catch(e){
    console.warn(e);
  }
}
function closeHelp(rewind=true){
  helpVideo.pause();
  if(rewind)helpVideo.currentTime=0;
  videoOverlay.classList.add('hidden');
  videoOverlay.setAttribute('aria-hidden','true');
}
document.querySelectorAll('.level-btn').forEach(btn=>btn.addEventListener('click',async()=>{
  if(!captureSessionName())return;
  await unlockGameAudio();
  await startGame(Number(btn.dataset.level));
}));
$('againBtn').addEventListener('click',async()=>{
  await unlockGameAudio();
  await startGame();
});
$('levelsBtn').addEventListener('click',chooseLevels);
$('changePlayerBtn').addEventListener('click',changePlayer);

function beginNameEntry(){
  levelChooser.classList.add('name-entry-hidden');
}
function restoreViewportAfterKeyboard(){
  // iPad Safari voi jättää visual viewportin hieman väärään kohtaan
  // virtuaalinäppäimistön sulkeuduttua. Palautetaan sekä scroll että stage.
  requestAnimationFrame(()=>{
    window.scrollTo(0,0);
    fitStage();
  });
  setTimeout(()=>{
    window.scrollTo(0,0);
    fitStage();
  },220);
}

function finishNameEntry(){
  const name=sessionName.value.trim();
  if(!name){
    sessionName.classList.add('name-needed');
    sessionName.focus();
    return;
  }
  sessionName.classList.remove('name-needed');
  sessionName.blur();
  levelChooser.classList.remove('name-entry-hidden');
  restoreViewportAfterKeyboard();
}
sessionName.addEventListener('focus',beginNameEntry);
sessionName.addEventListener('keydown',e=>{
  if(e.key==='Enter'){
    e.preventDefault();
    finishNameEntry();
  }
});
nameDoneBtn.addEventListener('click',finishNameEntry);

$('tunerBtn').addEventListener('click',openTunerMode);
$('closeTunerBtn').addEventListener('click',closeTunerMode);
$('helpBtn').addEventListener('click',openHelp);
$('closeVideoBtn').addEventListener('click',()=>closeHelp());
helpVideo.addEventListener('ended',()=>closeHelp());

$('scoreboardBtn').addEventListener('click',()=>openScoreboard(1));
$('closeScoreboardBtn').addEventListener('click',closeScoreboard);

$('adminBtn').addEventListener('click',openAdmin);
$('closeAdminBtn').addEventListener('click',closeAdmin);
$('adminLoginBtn').addEventListener('click',adminSignIn);
$('adminChangePasswordBtn').addEventListener('click',changeAdminPassword);
adminPassword.addEventListener('keydown',e=>{
  if(e.key==='Enter')adminSignIn();
});
adminNewPassword2.addEventListener('keydown',e=>{
  if(e.key==='Enter')changeAdminPassword();
});
document.querySelectorAll('.admin-reset-btn[data-reset-level]').forEach(btn=>
  btn.addEventListener('click',()=>resetSemesterLevel(Number(btn.dataset.resetLevel)))
);
$('resetAllScoresBtn').addEventListener('click',resetAllSemesterScores);
$('adminLogoutBtn').addEventListener('click',async()=>{
  await window.SavelkojuScoreboard.signOutAdmin();
  await refreshAdminUI();
  adminStatus.textContent='Kirjauduttu ulos.';
});

document.querySelectorAll('.score-tab').forEach(btn=>{
  btn.addEventListener('click',()=>openScoreboard(Number(btn.dataset.scoreLevel)));
});
window.SavelkojuScoreboard?.init();
addEventListener('beforeunload',()=>{
  gameEngine?.stop();
  tunerEngine?.stop();
});

initFingeringHint();
createTunerLeds();
clearTunerReadout();
setLevel(1);
})();
