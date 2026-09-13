(() => {
'use strict';

// === Huilun nykyiset koulutetut referenssit ja ydinasetukset ===
const REFS = {
  version:'1.0',
  low:{
    f0:430.20803833421076,
    fingerprint:[
      0.09391629137887444,0.701957182318073,0.07941402810746946,
      0.04534061240603828,0.04522878208440739,0.020297069138826587,
      0.013846034566310759
    ]
  },
  high:{
    f0:837.8248546223447,
    fingerprint:[
      0.6783152252542366,0.17302815688574255,0.05004085182535056,
      0.038840760907468776,0.023742261188500674,0.02629115993507365,
      0.009741584003627188
    ]
  }
};
const FRAME_MS=16;
const HARMONICS=8;
const ACCEPT=50;
const MARGIN=7;
const MIC_CAL_WARMUP_MS=250;
const MIC_CAL_MEASURE_MS=1500;
const MIC_CAL_MARGIN_DB=10;
const UNCERTAIN_DELAY_MS=180;
const SINGLE_REARM_SILENCE_MS=300;
const TRAIN_SAMPLE_COUNT=3;
const TRAIN_MIN_SAMPLE_MS=280;
const TRAIN_MAX_SAMPLE_MS=6000;
const TRAIN_END_SILENCE_MS=260;
const TRAIN_MIN_VALID_FRAMES=5;
const TRAIN_OWN_LOW_SIM=62;
const HS_ANALYSIS_INTERVAL_MS=80;
const HS_MIN_F0=80;
const HS_MAX_F0=2200;
const HS_MAX_HARMONIC_HZ=8000;
const HS_MAX_HARMONICS=8;
const HS_PEAK_GATE_DB=-56;
const HS_CONCENTRATION_MIN_HZ=80;
const HS_CONCENTRATION_MAX_HZ=8000;
const HS_CONCENTRATION_HALF_WIDTH_CENTS=28;
const CONTROL_SETTINGS_KEY='lentokone-flute-harmonic-control-v3';
const QUALITY_DEV_SETTINGS_KEY='lentokone-flute-quality-bonus-v2';
const QUALITY_BONUS_DEFAULT=.70;
const CONTROL_MODES=new Set(['custom']);

const $=s=>document.querySelector(s);
const game=$('#game'),cloudLayer=$('#cloudLayer'),plane=$('#plane'),scoreNum=$('#scoreNum'),gameTimer=$('#gameTimer'),bonus=$('#bonus'),flash=$('#flash');
const qualityStars=$('#qualityStars'),qualityStarCount=$('#qualityStarCount'),qualitySparkles=$('.quality-sparkles');
const durationBonuses=$('#durationBonuses'),durationBonusCount=$('#durationBonusCount');
const loadingOverlay=$('#loadingOverlay'),loadingPercent=$('#loadingPercent'),loadingFill=$('#loadingFill'),loadingStatus=$('#loadingStatus');
const startOverlay=$('#startOverlay'),trainOverlay=$('#trainOverlay'),settingsOverlay=$('#settingsOverlay'),calOverlay=$('#calOverlay'),finishOverlay=$('#finishOverlay'),startError=$('#startError');
const helpOverlay=$('#helpOverlay'),helpImage=$('#helpImage');
const instrumentFluteBtn=$('#instrumentFluteBtn'),instrumentFluteInfoBtn=$('#instrumentFluteInfoBtn'),replayBtn=$('#replayBtn'),finishBtn=$('#finishBtn'),finishScore=$('#finishScore');
const settingsBtn=$('#settingsBtn'),settingsCloseBtn=$('#settingsCloseBtn'),settingsStatus=$('#settingsStatus'),customTrainBtn=$('#customTrainBtn'),customModeTitle=$('#customModeTitle'),controlModeLabel=$('#controlModeLabel');
const devModeBtn=$('#devModeBtn'),qualityDevPanel=$('#qualityDevPanel');
const qualityBonusSlider=$('#qualityBonusSlider');
const qualityBonusValue=$('#qualityBonusValue');
const qualityTestSlider=$('#qualityTestSlider'),qualityTestValue=$('#qualityTestValue'),qualityTestResult=$('#qualityTestResult'),qualityTestBtn=$('#qualityTestBtn');
const controlModeButtons=[...document.querySelectorAll('[data-control-mode]')];
const trainStatus=$('#trainStatus'),trainPulse=$('#trainPulse'),trainDots=[...document.querySelectorAll('.train-dot')];
const calProgressRing=$('#calRingProgress'),calPulse=$('#calPulse'),calDbValue=$('#calDbValue');

let controlMode='custom';
let trainedControlRef=null;
let usingBuiltInControlRef=false;
let trainingSamples=[];
let singleTriggerLocked=false;
let singleLastLoudAt=0;
let liveCustomHistory=[];
let lastHarmonicAnalysisAt=0;

let qualityBonusThreshold=QUALITY_BONUS_DEFAULT;
let developerModeOpen=false;

const QUALITY_EVAL_WINDOW_MS=300;
const QUALITY_REQUIRED_PASS_RATIO=.70;
const QUALITY_MIN_SAMPLES=4;

const DURATION_BONUS_MS=700;

let qualityEvalActive=false;
let qualityEvalStartedAt=0;
let qualityEvalSamples=[];

let durationBonusActive=false;
let durationBonusStartedAt=0;

function validStoredRef(ref){
  return !!(ref&&Number.isFinite(Number(ref.f0))&&Array.isArray(ref.fingerprint)&&ref.fingerprint.length===7&&ref.fingerprint.every(v=>Number.isFinite(Number(v))));
}
function builtInHighControlRef(){
  return {
    f0:Number(REFS.high.f0),
    fingerprint:REFS.high.fingerprint.map(Number)
  };
}
function loadControlSettings(){
  controlMode='custom';
  trainedControlRef=null;
  usingBuiltInControlRef=false;

  try{
    const data=JSON.parse(localStorage.getItem(CONTROL_SETTINGS_KEY)||'null');
    if(data&&validStoredRef(data.customRef)){
      trainedControlRef={
        f0:Number(data.customRef.f0),
        fingerprint:data.customRef.fingerprint.map(Number)
      };
      usingBuiltInControlRef=false;
    }
  }catch{}

  // Jos omaa koulutusta ei ole tallennettu, peli käyttää suoraan
  // vanhan lentokone-appin HIGH-referenssiä.
  if(!trainedControlRef){
    trainedControlRef=builtInHighControlRef();
    usingBuiltInControlRef=true;
  }
}
function saveControlSettings(){
  try{
    localStorage.setItem(CONTROL_SETTINGS_KEY,JSON.stringify({
      mode:controlMode,
      customRef:trainedControlRef,
      builtIn:usingBuiltInControlRef
    }));
  }catch{}
}
function controlModeName(){return 'Avoin suukappaleääni'}

function loadQualityDevSettings(){
  try{
    const data=JSON.parse(localStorage.getItem(QUALITY_DEV_SETTINGS_KEY)||'null');
    if(data){
      const threshold=Number(data.threshold);
      if(Number.isFinite(threshold)&&threshold>=.20&&threshold<=.95){
        qualityBonusThreshold=threshold;
      }
    }
  }catch{}
}
function saveQualityDevSettings(){
  try{
    localStorage.setItem(QUALITY_DEV_SETTINGS_KEY,JSON.stringify({
      threshold:qualityBonusThreshold
    }));
  }catch{}
}
function qualityBonusLabel(points){
  return points===1?'1 lisäpiste':'0 lisäpistettä';
}
function updateQualityDevUi(){
  if(!qualityBonusSlider)return;
  const pct=Math.round(qualityBonusThreshold*100);
  qualityBonusSlider.value=String(pct);
  qualityBonusValue.textContent=`${pct} %`;
  updateQualityTestPreview();
}
function updateQualityTestPreview(){
  if(!qualityTestSlider||!qualityTestResult)return;
  const pct=Number(qualityTestSlider.value)||0;
  qualityTestValue.textContent=`${pct} %`;
  const points=soundQualityBonusPoints(pct/100);
  qualityTestResult.textContent=qualityBonusLabel(points);
  qualityTestResult.dataset.points=String(points);
}
function setDeveloperModeOpen(open){
  developerModeOpen=!!open;
  if(devModeBtn){
    devModeBtn.classList.toggle('active',developerModeOpen);
    devModeBtn.setAttribute('aria-expanded',developerModeOpen?'true':'false');
  }
  if(qualityDevPanel)qualityDevPanel.classList.toggle('show',developerModeOpen);
  if(developerModeOpen)updateQualityDevUi();
}

function updateSettingsUi(){
  for(const btn of controlModeButtons){
    const active=btn.dataset.controlMode===controlMode;
    btn.classList.toggle('active',active);
    btn.setAttribute('aria-checked',active?'true':'false');
  }
  if(customModeTitle){
    customModeTitle.textContent=usingBuiltInControlRef
      ?'Avoin suukappaleääni ✓ valmis'
      :'Avoin suukappaleääni ✓ oma';
  }
  if(customTrainBtn)customTrainBtn.textContent='Kouluta avoin ääni uudelleen';
  if(controlModeLabel)controlModeLabel.textContent='Ohjaus: '+controlModeName();
}
function setControlMode(mode){
  if(!CONTROL_MODES.has(mode))return false;
  if(mode==='custom'&&!trainedControlRef)return false;
  controlMode=mode;
  singleTriggerLocked=false;
  liveCustomHistory=[];
  lastHarmonicAnalysisAt=0;
  clearRecognition();
  saveControlSettings();
  updateSettingsUi();
  return true;
}
loadControlSettings();
loadQualityDevSettings();

const STARTUP_ASSETS=[
  ['app/assets/images/lentokone_sivu.webp',359114],
  ['app/assets/images/pilvi_levea.webp',34046],
  ['app/assets/images/pilvi_keski.webp',17670],
  ['app/assets/images/pilvi_iso.webp',54196],
  ['app/assets/images/kerattava_kolikko.webp',221486],
  ['app/assets/images/kerattava_timantti.webp',158640],
  ['app/assets/images/kerattava_aarrearkku.webp',261388],
  ['app/assets/images/este_lehma.webp',146738],
  ['app/assets/images/este_kivi.webp',84050],
  ['app/assets/images/este_pyorre.webp',142660],
  ['app/assets/images/soitin_huilu.webp',225530]
];
function preloadImageAsset(src){
  return new Promise(resolve=>{
    const img=new Image();
    let settled=false;
    const finish=()=>{
      if(settled)return;
      settled=true;
      resolve();
    };
    img.onload=async()=>{
      try{if(img.decode)await img.decode()}catch{}
      finish();
    };
    img.onerror=finish;
    img.src=src;
    if(img.complete&&img.naturalWidth)img.onload();
  });
}
async function preloadStartupAssets(){
  const totalBytes=STARTUP_ASSETS.reduce((sum,item)=>sum+item[1],0);
  let loadedBytes=0;
  const update=()=>{
    const percent=Math.max(0,Math.min(100,Math.round((loadedBytes/totalBytes)*100)));
    loadingPercent.textContent=percent+' %';
    loadingFill.style.width=percent+'%';
    loadingOverlay.setAttribute('aria-label','Peli latautuu '+percent+' prosenttia');
  };
  update();
  await Promise.all(STARTUP_ASSETS.map(async([src,bytes])=>{
    await preloadImageAsset(src);
    loadedBytes+=bytes;
    update();
  }));
  loadedBytes=totalBytes;
  update();
  loadingStatus.textContent='Valmis!';
  await new Promise(resolve=>setTimeout(resolve,180));
  loadingOverlay.classList.add('done');
}

let ctx=null,stream=null,analyser=null,timer=null;
let timeData=null,freqData=null;
let dbThreshold=-70;
let yinDiffBuffer=null,yinCmndBuffer=null;
let liveLowHistory=[],liveHighHistory=[],liveF0History=[];
let soundStartedAt=null;

// Pelitila
let gameRunning=false;
let gameFinishing=false;
let gameTimerStarted=false;
let gameStartedAt=0;
let gameEndsAt=0;
let finishStartedAt=0;
let lastCountdownTickSecond=null;
const GAME_DURATION_MS=90000;
const GAME_FINISH_EASE_MS=500;
let currentRoute='center';
let planeY=50;
let routeTransitionStartY=50;
let routeTransitionTargetY=50;
let routeTransitionStartedAt=0;
let routeTransitionStartVelocity=0; // %-yksikköä / ms
let routeTransitionEndVelocity=0;
let routePendingTransition=null; // suunnanvaihdon jarrutusvaiheen jälkeinen varsinainen reitti
let routeVelocity=0;
let routeTiltCurrent=0;
const ROUTE_TRANSITION_MS=780;
let routeTransitionDurationMs=ROUTE_TRANSITION_MS;
const FULL_ROUTE_DISTANCE=38;
const ROUTE_HIT_TOLERANCE=5.5;
const ROUTE_START_SPEED=0.55;
const ROUTE_MAX_INHERITED_SLOPE=2.0;
const ROUTE_REVERSAL_BRAKE_MS=280;
const ROUTE_TILT_REFERENCE_SPEED=(FULL_ROUTE_DISTANCE/ROUTE_TRANSITION_MS)*1.5;
const ROUTE_TILT_RESPONSE_MS=120;
let noseTiltAmount=20;
let objectSizePercent=70;
// Kevyt sarjakuvamainen visuaalinen keinunta. Ei muuta koneen todellista planeY-arvoa
// eikä siten vaikuta tunnistukseen tai törmäyslogiikkaan.
let planeSwayRotDeg=0.7;
let planeSwayBobPx=1.1;
let planeSwaySpeedPercent=58;
let engineVolumePercent=18;
let cowVolumePercent=25;
let rockVolumePercent=20;
const PLANE_SWAY_BASE_PERIOD_MS=1850;
// PCM-WAV-äänidata ladataan ennen tätä tiedostoa app/js/audio-data.js:stä.

let gameFxBuffers={coin:null,chest:null,diamond:null,cow:null,rock:null};
let gameAudioMuted=false;
const activeGameFxSources=new Set();
const GAME_FX_GAIN={coin:.92,chest:.82,diamond:.54};
function gameFxGainForKey(key){
  if(key==='cow')return clamp(cowVolumePercent/100,0,1);
  if(key==='rock')return clamp(rockVolumePercent/100,0,1);
  return GAME_FX_GAIN[key]??.9;
}
let gameFxLoading={};
const GAME_FX_KEYS=['coin','chest','diamond','cow','rock'];
async function ensureAudioContextRunning(){
  if(!ctx)return false;
  if(ctx.state!=='running'){
    try{await ctx.resume()}catch(err){console.warn('AudioContextin palautus epäonnistui:',err)}
  }
  return ctx.state==='running';
}
async function loadGameFxBuffer(key){
  if(!ctx||!GAME_FX_BASE64[key])return null;
  if(gameFxBuffers[key])return gameFxBuffers[key];
  if(gameFxLoading[key])return gameFxLoading[key];
  gameFxLoading[key]=(async()=>{
    const arrayBuffer=base64ToArrayBuffer(GAME_FX_BASE64[key]);
    const buffer=await ctx.decodeAudioData(arrayBuffer);
    gameFxBuffers[key]=buffer;
    return buffer;
  })();
  try{return await gameFxLoading[key]}
  finally{delete gameFxLoading[key]}
}
async function preloadGameFx(){
  // iOS/WebKit on luotettavampi, kun lyhyet PCM-WAV-efektit dekoodataan yksi kerrallaan.
  let ok=true;
  for(const key of GAME_FX_KEYS){
    try{await loadGameFxBuffer(key)}
    catch(err){ok=false;console.warn('Peliefektin esilataus epäonnistui:',key,err)}
  }
  return ok;
}
async function playGameFx(key){
  if(gameAudioMuted||!ctx||!GAME_FX_BASE64[key])return;
  try{
    if(!(await ensureAudioContextRunning())||gameAudioMuted)return;
    const buffer=gameFxBuffers[key]||await loadGameFxBuffer(key);
    if(!buffer||!(await ensureAudioContextRunning())||gameAudioMuted)return;
    const source=ctx.createBufferSource();
    const gain=ctx.createGain();
    source.buffer=buffer;
    gain.gain.value=gameFxGainForKey(key);
    source.connect(gain);
    gain.connect(ctx.destination);
    activeGameFxSources.add(source);
    source.start(0);
    source.onended=()=>{
      activeGameFxSources.delete(source);
      try{source.disconnect()}catch{}
      try{gain.disconnect()}catch{}
    };
  }catch(err){
    console.warn('Peliefektin ääni epäonnistui:',key,err);
  }
}

// Moottoriääni toistetaan Web Audio -bufferista. AudioBufferSourceNode.loop on
// sample-tarkka, joten selaimen <audio loop> -elementin pieni tauko poistuu.
let engineBuffer=null;
let engineSource=null;
let engineGain=null;
let engineFilter=null;
let engineMotionGain=null;
let engineImpactGain=null;
let engineChainConnected=false;
let engineFlightState='level';
let engineAudioStarted=false;
let engineLoadingPromise=null;
function ensureEngineGain(){
  if(!ctx)return null;
  if(!engineGain){
    engineGain=ctx.createGain();
    engineGain.gain.value=0;
    engineGain.connect(ctx.destination);
  }
  return engineGain;
}
function ensureEngineProcessingChain(){
  const master=ensureEngineGain();
  if(!master||!ctx)return null;
  if(!engineFilter){
    engineFilter=ctx.createBiquadFilter();
    engineFilter.type='lowpass';
    engineFilter.frequency.value=7800;
    engineFilter.Q.value=.18;
  }
  if(!engineMotionGain){
    engineMotionGain=ctx.createGain();
    engineMotionGain.gain.value=1;
  }
  if(!engineImpactGain){
    engineImpactGain=ctx.createGain();
    engineImpactGain.gain.value=1;
  }
  // source -> filter -> lentotiladynamiikka -> osumarykäisy -> päävoimakkuus
  // Ketju kytketään vain kerran, jotta lentotilan vaihto ei aiheuta ääneen mikrokatkosta.
  if(!engineChainConnected){
    engineFilter.connect(engineMotionGain);
    engineMotionGain.connect(engineImpactGain);
    engineImpactGain.connect(master);
    engineChainConnected=true;
  }
  return {filter:engineFilter,motion:engineMotionGain,impact:engineImpactGain,master};
}
function setEngineFlightState(state,immediate=false){
  if(!ctx)return;
  const chain=ensureEngineProcessingChain();
  if(!chain)return;
  state=(state==='climb'||state==='descend')?state:'level';
  if(state===engineFlightState&&!immediate)return;
  engineFlightState=state;
  const now=ctx.currentTime;
  const targetGain=state==='climb' ? 1.10 : state==='descend' ? .88 : 1;
  const targetFreq=state==='climb'?12000:state==='descend'?4300:7800;
  chain.motion.gain.cancelScheduledValues(now);
  chain.filter.frequency.cancelScheduledValues(now);
  if(immediate){
    chain.motion.gain.setValueAtTime(targetGain,now);
    chain.filter.frequency.setValueAtTime(targetFreq,now);
  }else{
    chain.motion.gain.setTargetAtTime(targetGain,now,.12);
    chain.filter.frequency.setTargetAtTime(targetFreq,now,.10);
  }
}
function triggerEngineRockJolt(){
  if(!ctx||!engineAudioStarted||!engineSource)return;
  const chain=ensureEngineProcessingChain();
  if(!chain)return;
  const now=ctx.currentTime;
  const impact=chain.impact.gain;
  impact.cancelScheduledValues(now);
  impact.setValueAtTime(1,now);
  impact.linearRampToValueAtTime(1.28,now+.045);
  impact.linearRampToValueAtTime(.88,now+.17);
  impact.linearRampToValueAtTime(1,now+.38);

  // Lyhyt sarjakuvamainen moottorin yskähdys, ilman erillistä äänitiedostoa.
  const rate=engineSource.playbackRate;
  rate.cancelScheduledValues(now);
  rate.setValueAtTime(1,now);
  rate.linearRampToValueAtTime(1.075,now+.05);
  rate.linearRampToValueAtTime(.96,now+.18);
  rate.linearRampToValueAtTime(1,now+.40);
}
function applyEngineVolume(){
  const gain=ensureEngineGain();
  if(!gain||!ctx)return;
  const target=gameAudioMuted?0:clamp(engineVolumePercent/100,0,1);
  const now=ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setTargetAtTime(target,now,.025);
}
function base64ToArrayBuffer(base64){
  const binary=atob(base64);
  const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return bytes.buffer;
}
async function loadEngineBuffer(){
  if(engineBuffer)return engineBuffer;
  if(!ctx)return null;
  if(engineLoadingPromise)return engineLoadingPromise;
  engineLoadingPromise=(async()=>{
    const arrayBuffer=base64ToArrayBuffer(ENGINE_AUDIO_BASE64);
    engineBuffer=await ctx.decodeAudioData(arrayBuffer);
    return engineBuffer;
  })();
  try{return await engineLoadingPromise}
  finally{engineLoadingPromise=null}
}
async function startEngineAudioFromBeginning(){
  if(!ctx)return;
  if(ctx.state!=='running')await ctx.resume();
  const buffer=await loadEngineBuffer();
  if(!buffer)return;
  if(engineSource){
    try{engineSource.stop()}catch{}
    try{engineSource.disconnect()}catch{}
  }
  const chain=ensureEngineProcessingChain();
  chain.master.gain.setValueAtTime(0,ctx.currentTime);
  const source=ctx.createBufferSource();
  source.buffer=buffer;
  source.loop=true;
  source.loopStart=0;
  source.loopEnd=buffer.duration;
  source.playbackRate.value=1;
  source.connect(chain.filter);
  source.start(0);
  engineSource=source;
  engineAudioStarted=true;
  engineFlightState='level';
  setEngineFlightState('level',true);
  applyEngineVolume();
}
function stopEngineAudio(){
  if(engineSource){
    try{engineSource.stop()}catch{}
    try{engineSource.disconnect()}catch{}
    engineSource=null;
  }
  engineAudioStarted=false;
}
function setGameAudioMuted(muted){
  gameAudioMuted=!!muted;
  if(!ctx)return;
  const now=ctx.currentTime;

  // Älä luo kalibroinnin vuoksi yhtään uutta audi solmua.
  // Pysäytä vain jo soivat kertaluonteiset efektit ja estä uusien käynnistyminen.
  if(gameAudioMuted){
    for(const source of activeGameFxSources){
      try{source.stop()}catch{}
    }
    activeGameFxSources.clear();
  }

  // Moottori mykistetään vain jos sen gain-solmu on jo olemassa.
  // Näin mikrofonin käynnistys/analyser-ketjuun ei kosketa lainkaan.
  if(engineGain){
    engineGain.gain.cancelScheduledValues(now);
    if(gameAudioMuted)engineGain.gain.setValueAtTime(0,now);
    else applyEngineVolume();
  }
}
async function calibrateWithAllGameAudioMuted(){
  setGameAudioMuted(true);
  try{
    await calibrateMicrophoneNoiseFloor();
  }finally{
    setGameAudioMuted(false);
  }
}
let score=0;
let qualityStarsTotal=0;
let durationBonusesTotal=0;
let collectibles=[];
let obstacles=[];
let rockFragments=[];
let clouds=[];
let lastFrame=0;
let spawnClock=0;
let controlLockUntil=0;
let initialAutoTarget=null;
let initialAutoSeekAuthorized=false;
let initialAutoSeekDone=false;
let lastSpawnLane=null;
let sameLaneCount=0;
// Pyörre: 10 sekunnin turbo. Pelimaailma kiihtyy pehmeästi 1× -> 2×
// ja hidastuu pehmeästi takaisin. Soiton tunnistus ja mikrofonimoottori
// pysyvät täysin ennallaan.
const VORTEX_SPEED_EFFECT_MS=10000;
const VORTEX_SPEED_EASE_MS=1000;
let vortexTurboActive=false;
let vortexSpeedUntil=0;
let vortexSpeedFrom=1;
let vortexSpeedTo=1;
let vortexSpeedTransitionStartedAt=0;
const VORTEX_SCHEDULE_WINDOWS_MS=[
  [12000,28000],
  [38000,58000],
  [65000,82000]
];
let scheduledVortexTimes=[];
let scheduledVortexIndex=0;
// Yksi yhteinen spawn-kello kaikille peliobjekteille.
// 70/30-jako säilyttää suunnilleen aiemman kerättävä/este-rytmin,
// mutta samalla tickillä syntyy aina vain yksi objekti.
const SPAWN_INTERVAL=1300;
const COLLECTIBLE_SPAWN_CHANCE=.70;
const SPAWN_X_OFFSET=100;
const ROCK_BOUNCE_MS=430;
const ROCK_CONTROL_LOCK_MS=560;
const OBSTACLE_HIT_TOLERANCE=7.5;
// Pyörteen varsinainen imuaukko on kuvan yläosassa, ei WebP:n geometrisessa keskellä.
// 0.30 vastaa tumman sinisen suuaukon keskikohtaa kuvan korkeudesta.
const VORTEX_CORE_X_RATIO=.46;
const VORTEX_CORE_Y_RATIO=.30;
const VORTEX_CORE_X_TOLERANCE=34;
const VORTEX_CORE_HIT_TOLERANCE=9.5;
const ROCK_FRAGMENT_GRAVITY=window.innerHeight*1.55;
const ROCK_FRAGMENT_FADE_MS=220;
const ROCK_FRAGMENT_LIFE_MS=980;
const CLOUD_MIN_GAP=34;
const CLOUD_VERTICAL_BANDS=[0.14,0.27,0.40,0.52];
const CLOUD_TYPES=[
  {src:'app/assets/images/pilvi_levea.webp',aspect:620/286,minW:110,maxW:210},
  {src:'app/assets/images/pilvi_keski.webp',aspect:560/255,minW:95,maxW:175},
  {src:'app/assets/images/pilvi_iso.webp',aspect:700/327,minW:140,maxW:250}
];

function mean(a){return a.length?a.reduce((s,x)=>s+x,0)/a.length:0}
function median(a){
  if(!a.length)return 0;
  const b=[...a].sort((x,y)=>x-y),m=b.length>>1;
  return b.length%2?b[m]:(b[m-1]+b[m])/2;
}
function pushLimited(arr,val,max=6){arr.push(val);if(arr.length>max)arr.shift()}
function clamp(x,min,max){return Math.max(min,Math.min(max,x))}
function rand(min,max){return min+Math.random()*(max-min)}
function pick(arr){return arr[Math.floor(Math.random()*arr.length)]}
function planGuaranteedVortexes(){
  scheduledVortexTimes=VORTEX_SCHEDULE_WINDOWS_MS.map(([start,end])=>Math.round(rand(start,end)));
  scheduledVortexIndex=0;
}
function shouldSpawnGuaranteedVortex(now=performance.now()){
  if(!gameTimerStarted)return false;
  if(scheduledVortexIndex>=scheduledVortexTimes.length)return false;
  const elapsed=now-gameStartedAt;
  return elapsed>=scheduledVortexTimes[scheduledVortexIndex];
}
function markGuaranteedVortexSpawned(){
  if(scheduledVortexIndex<scheduledVortexTimes.length)scheduledVortexIndex++;
}
function centsDiff(a,b){return 1200*Math.log2(a/b)}
function rmsDb(buf){
  let s=0;
  for(let i=0;i<buf.length;i++){const v=buf[i];s+=v*v}
  const rms=Math.sqrt(s/buf.length)||1e-12;
  return {rms,db:20*Math.log10(rms)};
}
function yin(buf,sr){
  const n=Math.min(buf.length,4096),minF=75,maxF=1300;
  const minTau=Math.max(2,Math.floor(sr/maxF));
  const maxTau=Math.min(Math.floor(sr/minF),Math.floor(n/2));
  const needed=maxTau+1;
  if(!yinDiffBuffer||yinDiffBuffer.length<needed){
    yinDiffBuffer=new Float32Array(needed);
    yinCmndBuffer=new Float32Array(needed);
  }
  const d=yinDiffBuffer,cmnd=yinCmndBuffer;
  for(let tau=1;tau<=maxTau;tau++){
    let sum=0;
    for(let i=0;i<n-tau;i++){const x=buf[i]-buf[i+tau];sum+=x*x}
    d[tau]=sum;
  }
  cmnd[0]=1;
  let run=0;
  for(let tau=1;tau<=maxTau;tau++){
    run+=d[tau];
    cmnd[tau]=d[tau]*tau/(run||1);
  }
  let tau=-1;
  for(let t=minTau;t<=maxTau;t++){
    if(cmnd[t]<0.13){while(t+1<=maxTau&&cmnd[t+1]<cmnd[t])t++;tau=t;break}
  }
  if(tau<0)return null;
  const x0=Math.max(minTau,tau-1),x2=Math.min(maxTau,tau+1);
  const s0=cmnd[x0],s1=cmnd[tau],s2=cmnd[x2],den=2*s1-s2-s0;
  const better=den?tau+(s2-s0)/(2*den):tau;
  const f=sr/better;
  return (f>=minF&&f<=maxF)?f:null;
}
function harmonicVector(f0){
  if(!f0)return null;
  const ny=ctx.sampleRate/2;
  const binHz=ny/freqData.length;
  const amps=[];
  for(let h=1;h<=HARMONICS;h++){
    const target=f0*h;
    if(target>=ny){amps.push(0);continue}
    const idx=Math.round(target/binHz);
    const radius=Math.max(1,Math.round(12/binHz));
    let best=-Infinity;
    for(let j=Math.max(1,idx-radius);j<=Math.min(freqData.length-1,idx+radius);j++){
      if(freqData[j]>best)best=freqData[j];
    }
    amps.push(Math.pow(10,best/20));
  }
  const vals=amps.slice(1,8);
  const total=vals.reduce((s,x)=>s+x,0);
  if(total<=0)return null;
  return vals.map(x=>x/total);
}

function harmonicH1H8(f0){
  if(!f0)return null;
  const ny=ctx.sampleRate/2;
  const binHz=ny/freqData.length;
  const amps=[];
  for(let h=1;h<=HARMONICS;h++){
    const target=f0*h;
    if(target>=ny){amps.push(0);continue}
    const idx=Math.round(target/binHz);
    const radius=Math.max(1,Math.round(12/binHz));
    let best=-Infinity;
    for(let j=Math.max(1,idx-radius);j<=Math.min(freqData.length-1,idx+radius);j++){
      if(freqData[j]>best)best=freqData[j];
    }
    amps.push(Math.pow(10,best/20));
  }
  const total=amps.reduce((sum,x)=>sum+x,0);
  if(total<=0)return null;
  return amps.map(x=>x/total);
}
function h2h8FromH1H8(fp8){
  if(!fp8||fp8.length<8)return null;
  const vals=fp8.slice(1,8).map(v=>Math.max(0,Number(v)||0));
  const total=vals.reduce((sum,v)=>sum+v,0);
  return total>0?vals.map(v=>v/total):null;
}
function averageFingerprint(fps,length){
  if(!fps.length)return null;
  const out=Array(length).fill(0);
  for(const fp of fps)for(let i=0;i<length;i++)out[i]+=Number(fp[i])||0;
  for(let i=0;i<length;i++)out[i]/=fps.length;
  const total=out.reduce((sum,v)=>sum+v,0)||1;
  return out.map(v=>v/total);
}
function puhFingerprintSimilarity(a,b){
  if(!a||!b||a.length!==8||b.length!==8)return 0;
  let sum=0;
  for(let i=0;i<8;i++){
    const da=20*Math.log10((a[i]||0)+1e-5);
    const db=20*Math.log10((b[i]||0)+1e-5);
    const d=(da-db)/18;
    sum+=d*d;
  }
  return clamp(100*Math.exp(-.78*Math.sqrt(sum/8)),0,100);
}
function aggregateTrainingReference(samples=trainingSamples){
  if(!samples.length)return null;
  const f0=median(samples.map(sample=>sample.f0).filter(Number.isFinite));
  const fp8=averageFingerprint(samples.map(sample=>sample.fp8).filter(Boolean),8);
  const fingerprint=h2h8FromH1H8(fp8);
  return f0&&fingerprint?{f0,fingerprint}:null;
}
function updateTrainingPulse(db){
  if(!trainPulse)return;
  const shown=Number.isFinite(db)?clamp(db,-90,-20):-90;
  const level=clamp((shown+90)/70,0,1);
  const eased=Math.pow(level,.58);
  trainPulse.style.transform=`scale(${(.72+.62*eased).toFixed(3)})`;
  trainPulse.style.opacity=(.26+.68*eased).toFixed(3);
}
function setTrainingDot(index,state){
  const dot=trainDots[index];
  if(!dot)return;
  dot.classList.remove('active','done','retry');
  if(state)dot.classList.add(state);
}
function resetTrainingUi(){
  trainOverlay.classList.remove('complete');
  trainDots.forEach(dot=>dot.classList.remove('active','done','retry'));
  trainStatus.textContent='Puhalla avoin suukappaleääni kolme kertaa.';
  updateTrainingPulse(-90);
}
async function captureAutomaticTrainingSample(index){
  setTrainingDot(index,'active');
  trainStatus.textContent=`Puhallus ${index+1} / ${TRAIN_SAMPLE_COUNT} — puhalla nyt`;
  let startedAt=0;
  let quietSince=0;
  const frames=[];
  while(true){
    analyser.getFloatTimeDomainData(timeData);
    const level=rmsDb(timeData);
    updateTrainingPulse(level.db);
    const loud=level.db>dbThreshold;
    let f0=null,fp8=null;
    if(loud){
      analyser.getFloatFrequencyData(freqData);
      f0=yin(timeData,ctx.sampleRate);
      fp8=f0?harmonicH1H8(f0):null;
    }
    const valid=!!(loud&&f0&&fp8);
    const now=performance.now();
    if(!startedAt){
      if(valid){
        startedAt=now;
        frames.push({f0,fp8,db:level.db});
        trainStatus.textContent=`Puhallus ${index+1} / ${TRAIN_SAMPLE_COUNT} — hyvä, jatka hetki`;
      }
    }else{
      if(valid){
        frames.push({f0,fp8,db:level.db});
        quietSince=0;
      }else if(!loud){
        if(!quietSince)quietSince=now;
        if(now-quietSince>=TRAIN_END_SILENCE_MS)break;
      }
      if(now-startedAt>=TRAIN_MAX_SAMPLE_MS)break;
    }
    await sleepMs(25);
  }
  const duration=startedAt?performance.now()-startedAt:0;
  if(duration<TRAIN_MIN_SAMPLE_MS||frames.length<TRAIN_MIN_VALID_FRAMES){
    setTrainingDot(index,'retry');
    trainStatus.textContent='Näyte oli liian lyhyt. Puhalla uudelleen.';
    await sleepMs(650);
    return null;
  }
  const f0=median(frames.map(frame=>frame.f0));
  const fp8=averageFingerprint(frames.map(frame=>frame.fp8),8);
  if(!f0||!fp8){
    setTrainingDot(index,'retry');
    trainStatus.textContent='Ääntä ei saatu tunnistettua. Puhalla uudelleen.';
    await sleepMs(650);
    return null;
  }
  return {f0,fp8,durationMs:Math.round(duration),frames:frames.length};
}
async function trainControlSound(){
  if(!analyser||!timeData||!freqData)throw new Error('Mikrofoni ei ole valmis koulutusta varten.');
  if(timer){clearInterval(timer);timer=null}
  trainingSamples=[];
  clearRecognition();
  singleTriggerLocked=false;
  resetTrainingUi();
  trainOverlay.classList.add('show');
  try{
    for(let index=0;index<TRAIN_SAMPLE_COUNT;){
      const sample=await captureAutomaticTrainingSample(index);
      if(!sample)continue;
      if(trainingSamples.length>=2){
        const ownFp8=averageFingerprint(trainingSamples.map(s=>s.fp8),8);
        const sameSimilarity=puhFingerprintSimilarity(sample.fp8,ownFp8);
        if(sameSimilarity<TRAIN_OWN_LOW_SIM){
          setTrainingDot(index,'retry');
          trainStatus.textContent='Tuo ääni poikkesi aiemmista. Puhalla avoin ääni uudelleen.';
          await sleepMs(850);
          continue;
        }
      }
      trainingSamples.push(sample);
      setTrainingDot(index,'done');
      trainStatus.textContent=`Hyvä! ${index+1} / ${TRAIN_SAMPLE_COUNT}`;
      index++;
      await sleepMs(index===TRAIN_SAMPLE_COUNT?450:520);
    }
    const ref=aggregateTrainingReference(trainingSamples);
    if(!ref)throw new Error('Avoimen suukappaleäänen referenssiä ei voitu muodostaa.');
    trainedControlRef=ref;
    controlMode='custom';
    usingBuiltInControlRef=false;
  saveControlSettings();
    updateSettingsUi();
    trainOverlay.classList.add('complete');
    trainStatus.textContent='Valmis!';
    updateTrainingPulse(-45);
    await sleepMs(650);
  }finally{
    trainOverlay.classList.remove('show','complete');
    updateTrainingPulse(-90);
    if(!timer&&analyser)timer=setInterval(processFrame,FRAME_MS);
  }
  clearRecognition();
  return true;
}

function fpDistance(a,b){
  let s=0;
  for(let i=0;i<a.length;i++){
    const da=20*Math.log10(a[i]+1e-5),db=20*Math.log10(b[i]+1e-5),d=(da-db)/16;
    s+=d*d;
  }
  return Math.sqrt(s/a.length);
}
function similarity(take,ref){
  const cents=Math.abs(centsDiff(take.f0,ref.f0));
  const pitchPenalty=Math.min(3,cents/110);
  const spectralPenalty=fpDistance(take.fp,ref.fingerprint);
  const combined=Math.sqrt(0.42*pitchPenalty*pitchPenalty+0.58*spectralPenalty*spectralPenalty);
  return Math.max(0,Math.min(100,100*Math.exp(-0.82*combined)));
}


function midiFromFrequency(freq){return Math.round(69+12*Math.log2(freq/440))}
function harmonicSpectrumFromAnalyser(){
  if(!freqData||!ctx)return null;
  const mags=new Float64Array(freqData.length);
  let maxMag=1e-18;
  for(let k=0;k<freqData.length;k++){
    const db=Number.isFinite(freqData[k])?freqData[k]:-120;
    const mag=Math.pow(10,db/20);
    mags[k]=mag;
    if(mag>maxMag)maxMag=mag;
  }
  return {mags,binHz:(ctx.sampleRate/2)/freqData.length,maxMag};
}
function hsRefinePeak(mags,k,binHz){
  if(k<=0||k>=mags.length-1)return {hz:k*binHz};
  const y1=Math.log(Math.max(mags[k-1],1e-18));
  const y2=Math.log(Math.max(mags[k],1e-18));
  const y3=Math.log(Math.max(mags[k+1],1e-18));
  const denom=y1-2*y2+y3;
  let delta=0;
  if(Math.abs(denom)>1e-12){
    delta=.5*(y1-y3)/denom;
    delta=clamp(delta,-.5,.5);
  }
  return {hz:(k+delta)*binHz};
}
function hsCollectPeaks(spectrum){
  const mags=spectrum.mags;
  const minBin=Math.max(2,Math.floor(80/spectrum.binHz));
  const maxBin=Math.min(mags.length-3,Math.ceil(HS_MAX_HARMONIC_HZ/spectrum.binHz));
  const out=[];
  for(let k=minBin;k<=maxBin;k++){
    const m=mags[k];
    if(!(m>mags[k-1]&&m>=mags[k+1]))continue;
    const relDb=20*Math.log10(Math.max(m/spectrum.maxMag,1e-12));
    if(relDb<HS_PEAK_GATE_DB)continue;
    const refined=hsRefinePeak(mags,k,spectrum.binHz);
    out.push({hz:refined.hz,mag:m,relDb});
  }
  return out.sort((a,b)=>b.mag-a.mag).slice(0,100);
}
function hsBuildSubharmonicCandidates(peaks){
  const raw=[];
  for(const p of peaks){
    for(let h=1;h<=HS_MAX_HARMONICS;h++){
      const f0=p.hz/h;
      if(f0>=HS_MIN_F0&&f0<=HS_MAX_F0)raw.push({hz:f0,vote:p.mag/Math.pow(h,.72)});
    }
  }
  raw.sort((a,b)=>a.hz-b.hz);
  const merged=[];
  for(const c of raw){
    const prev=merged[merged.length-1];
    if(prev){
      const cents=Math.abs(1200*Math.log2(c.hz/prev.hz));
      if(cents<22){
        const total=prev.weight+c.vote;
        prev.hz=(prev.hz*prev.weight+c.hz*c.vote)/total;
        prev.weight=total;
        continue;
      }
    }
    merged.push({hz:c.hz,weight:c.vote});
  }
  return merged;
}
function hsFindPeakNear(spectrum,targetHz,centsTolerance){
  const ratio=Math.pow(2,centsTolerance/1200);
  const loHz=targetHz/ratio,hiHz=targetHz*ratio;
  const lo=Math.max(2,Math.floor(loHz/spectrum.binHz));
  const hi=Math.min(spectrum.mags.length-3,Math.ceil(hiHz/spectrum.binHz));
  let bestK=-1,bestMag=0;
  for(let k=lo;k<=hi;k++){
    if(spectrum.mags[k]>bestMag&&spectrum.mags[k]>=spectrum.mags[k-1]&&spectrum.mags[k]>=spectrum.mags[k+1]){
      bestMag=spectrum.mags[k];bestK=k;
    }
  }
  if(bestK<0)return null;
  const refined=hsRefinePeak(spectrum.mags,bestK,spectrum.binHz);
  return {hz:refined.hz,mag:bestMag,cents:1200*Math.log2(refined.hz/targetHz)};
}
function hsEvaluateCandidate(f0,spectrum){
  let score=0,possible=0,matches=0,refineNum=0,refineDen=0;
  for(let h=1;h<=HS_MAX_HARMONICS;h++){
    const target=f0*h;
    if(target>HS_MAX_HARMONIC_HZ)break;
    const w=1/Math.pow(h,.78);
    possible+=w;
    const peak=hsFindPeakNear(spectrum,target,32);
    if(!peak)continue;
    const relDb=20*Math.log10(Math.max(peak.mag/spectrum.maxMag,1e-12));
    if(relDb<HS_PEAK_GATE_DB)continue;
    const closeness=Math.max(0,1-Math.abs(peak.cents)/32);
    const amp=Math.sqrt(peak.mag/spectrum.maxMag);
    score+=w*amp*(.55+.45*closeness);
    matches++;
    refineNum+=(peak.hz/h)*peak.mag*w;
    refineDen+=peak.mag*w;
  }
  const refinedHz=refineDen>0?refineNum/refineDen:f0;
  const rawSupport=possible>0?score/possible:0;
  const matchFactor=Math.min(1,matches/5);
  const support=clamp(rawSupport*(.65+.35*matchFactor),0,1);
  return {hz:refinedHz,score:support,support,matches};
}
function hsChooseBestCandidate(candidates,spectrum){
  let best=null;
  for(const c of candidates){
    const e=hsEvaluateCandidate(c.hz,spectrum);
    if(!best||e.score>best.score)best=e;
  }
  if(!best||best.matches<2||best.support<.10)return null;
  return best;
}
function harmonicConcentration(spectrum,f0){
  if(!spectrum||!Number.isFinite(f0)||f0<=0)return 0;
  const mags=spectrum.mags,binHz=spectrum.binHz;
  const loBin=Math.max(1,Math.floor(HS_CONCENTRATION_MIN_HZ/binHz));
  const hiBin=Math.min(mags.length-1,Math.floor(HS_CONCENTRATION_MAX_HZ/binHz));
  const mask=new Uint8Array(mags.length);
  const ratio=Math.pow(2,HS_CONCENTRATION_HALF_WIDTH_CENTS/1200);
  const maxHarmonic=Math.floor(HS_CONCENTRATION_MAX_HZ/f0);
  for(let h=1;h<=maxHarmonic;h++){
    const center=f0*h;
    let lowHz=center/ratio,highHz=center*ratio;
    const minHalfWidthHz=1.5*binHz;
    lowHz=Math.min(lowHz,center-minHalfWidthHz);
    highHz=Math.max(highHz,center+minHalfWidthHz);
    const a=Math.max(loBin,Math.floor(lowHz/binHz));
    const b=Math.min(hiBin,Math.ceil(highHz/binHz));
    for(let k=a;k<=b;k++)mask[k]=1;
  }
  let harmonicPower=0,totalPower=0;
  for(let k=loBin;k<=hiBin;k++){
    const p=mags[k]*mags[k];
    totalPower+=p;
    if(mask[k])harmonicPower+=p;
  }
  return totalPower>0?clamp(harmonicPower/totalPower,0,1):0;
}
function analyzeHarmonicControl(){
  const spectrum=harmonicSpectrumFromAnalyser();
  if(!spectrum)return null;
  const peaks=hsCollectPeaks(spectrum);
  if(peaks.length<2)return null;
  const candidates=hsBuildSubharmonicCandidates(peaks);
  const best=hsChooseBestCandidate(candidates,spectrum);
  if(!best||!Number.isFinite(best.hz))return null;
  return {
    hz:best.hz,
    midi:midiFromFrequency(best.hz),
    support:best.support,
    matches:best.matches,
    concentration:harmonicConcentration(spectrum,best.hz)
  };
}
function isAcceptedOpenHeadjoint(analysis){
  if(!analysis||!trainedControlRef)return false;
  const targetMidi=midiFromFrequency(trainedControlRef.f0);
  return analysis.midi===targetMidi||analysis.midi===targetMidi+1;
}

function ensureQualitySparkles(){
  if(!qualitySparkles||qualitySparkles.childElementCount)return;
  for(let i=0;i<4;i++){
    const spark=document.createElement('span');
    spark.className='quality-spark';
    qualitySparkles.appendChild(spark);
  }
}
function pulseQualityStarCounter(){
  if(!qualityStars)return;
  qualityStars.classList.remove('star-pulse');
  void qualityStars.offsetWidth;
  qualityStars.classList.add('star-pulse');
}
function triggerPlaneQualityGlow(points){
  if(!plane||points<=0)return;
  plane.classList.remove('quality-glow-1','quality-glow-2');
  void plane.offsetWidth;
  plane.classList.add('quality-glow-1');
  window.setTimeout(()=>{
    plane.classList.remove('quality-glow-1','quality-glow-2');
  },660);
}
function flyQualityStars(points,{preview=false}={}){
  if(points<=0||!plane||!qualityStars)return;

  const planeRect=plane.getBoundingClientRect();
  const targetRect=qualityStars.getBoundingClientRect();
  const sx=planeRect.left+planeRect.width*.58;
  const sy=planeRect.top+planeRect.height*.42;
  const tx=targetRect.left+targetRect.width*.72;
  const ty=targetRect.top+targetRect.height*.48;

  for(let i=0;i<points;i++){
    const star=document.createElement('span');
    star.className='quality-fly-star';
    star.textContent='⭐';
    star.style.setProperty('--sx',`${sx}px`);
    star.style.setProperty('--sy',`${sy}px`);
    star.style.setProperty('--tx',`${tx}px`);
    star.style.setProperty('--ty',`${ty}px`);
    star.style.setProperty('--lift-x',`${(i===0?-18:20)}px`);
    star.style.setProperty('--lift-y',`${-42-(i*8)}px`);
    star.style.setProperty('--flight-delay',`${i*110}ms`);
    star.style.setProperty('--flight-ms',`${700+i*40}ms`);
    document.body.appendChild(star);

    requestAnimationFrame(()=>star.classList.add('fly'));

    window.setTimeout(()=>{
      star.remove();
      pulseQualityStarCounter();
    },840+i*130);
  }
}
function showQualityVisualFeedback(points,{preview=false}={}){
  if(points<=0)return;
  triggerPlaneQualityGlow(points);
  flyQualityStars(points,{preview});
}

function showDurationBonusFeedback(){
  if(!plane)return;

  plane.classList.remove('duration-bonus');
  void plane.offsetWidth;
  plane.classList.add('duration-bonus');

  flyDurationHourglass();

  window.setTimeout(()=>{
    plane.classList.remove('duration-bonus');
  },850);
}
function renderQualityStarCount(){
  if(qualityStarCount)qualityStarCount.textContent=String(qualityStarsTotal);
}

function renderDurationBonusCount(){
  if(durationBonusCount)durationBonusCount.textContent=String(durationBonusesTotal);
}

function pulseDurationBonusCounter(){
  if(!durationBonuses)return;
  durationBonuses.classList.remove('duration-pulse');
  void durationBonuses.offsetWidth;
  durationBonuses.classList.add('duration-pulse');
}

function flyDurationHourglass(){
  if(!plane||!durationBonuses)return;

  const planeRect=plane.getBoundingClientRect();
  const targetRect=durationBonuses.getBoundingClientRect();
  const sx=planeRect.left+planeRect.width*.38;
  const sy=planeRect.top+planeRect.height*.56;
  const tx=targetRect.left+targetRect.width*.72;
  const ty=targetRect.top+targetRect.height*.48;

  const token=document.createElement('span');
  token.className='quality-fly-star duration-fly-token';
  token.textContent='⏳';
  token.style.setProperty('--sx',`${sx}px`);
  token.style.setProperty('--sy',`${sy}px`);
  token.style.setProperty('--tx',`${tx}px`);
  token.style.setProperty('--ty',`${ty}px`);
  token.style.setProperty('--lift-x','-16px');
  token.style.setProperty('--lift-y','-38px');
  token.style.setProperty('--flight-delay','0ms');
  token.style.setProperty('--flight-ms','720ms');
  document.body.appendChild(token);

  requestAnimationFrame(()=>token.classList.add('fly'));

  window.setTimeout(()=>{
    token.remove();
    pulseDurationBonusCounter();
  },840);
}
function qualityMedian(values){
  if(!values.length)return 0;
  const a=[...values].sort((x,y)=>x-y);
  const mid=Math.floor(a.length/2);
  return a.length%2?a[mid]:(a[mid-1]+a[mid])/2;
}

function beginQualityEvaluation(firstConcentration,now=performance.now()){
  qualityEvalActive=true;
  qualityEvalStartedAt=now;
  qualityEvalSamples=[Number.isFinite(firstConcentration)?firstConcentration:0];
}

function cancelQualityEvaluation(){
  qualityEvalActive=false;
  qualityEvalStartedAt=0;
  qualityEvalSamples=[];
}

function addQualityEvaluationSample(concentration){
  if(!qualityEvalActive)return;
  qualityEvalSamples.push(Number.isFinite(concentration)?concentration:0);
}

function finishQualityEvaluation(){
  if(!qualityEvalActive)return;

  const samples=[...qualityEvalSamples];
  cancelQualityEvaluation();

  if(samples.length<QUALITY_MIN_SAMPLES)return;

  const med=qualityMedian(samples);
  const passed=samples.filter(v=>v>=qualityBonusThreshold).length;
  const passRatio=passed/samples.length;

  if(
    med>=qualityBonusThreshold &&
    passRatio>=QUALITY_REQUIRED_PASS_RATIO
  ){
    awardSoundQualityBonus();
  }
}

function beginDurationBonusEvaluation(now=performance.now()){
  durationBonusActive=true;
  durationBonusStartedAt=now;
}

function cancelDurationBonusEvaluation(){
  durationBonusActive=false;
  durationBonusStartedAt=0;
}

function awardSoundDurationBonus(){
  score+=1;
  durationBonusesTotal+=1;

  scoreNum.textContent=score;
  renderDurationBonusCount();
  showDurationBonusFeedback();
}

function updateDurationBonusEvaluation(accepted,now=performance.now()){
  if(!durationBonusActive)return;

  // Kestobonus vaatii, että sama suukappaleääni pysyy koko ajan
  // Harmonic Summation -tunnistuksen hyväksymänä.
  if(!accepted){
    cancelDurationBonusEvaluation();
    return;
  }

  if(now-durationBonusStartedAt>=DURATION_BONUS_MS){
    cancelDurationBonusEvaluation();
    awardSoundDurationBonus();
  }
}

function soundQualityBonusPoints(concentration){
  return concentration>=qualityBonusThreshold?1:0;
}
function awardSoundQualityBonus(){
  // Live-pelissä bonus on ansaittu vasta 300 ms laatumittauksen jälkeen.
  // Bonus on aina täsmälleen yksi piste ja yksi tähti.
  score+=1;
  qualityStarsTotal+=1;

  scoreNum.textContent=score;
  renderQualityStarCount();
  showQualityVisualFeedback(1);
}

function routeY(route){return route==='high'?31:route==='low'?69:50}
function planeXPosition(){return window.innerWidth*.22}
function vortexEaseInOut(t){
  t=clamp(t,0,1);
  return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
}
function vortexTransitionValue(now=performance.now()){
  if(!vortexSpeedTransitionStartedAt)return vortexSpeedTo;
  const t=clamp((now-vortexSpeedTransitionStartedAt)/VORTEX_SPEED_EASE_MS,0,1);
  return vortexSpeedFrom+(vortexSpeedTo-vortexSpeedFrom)*vortexEaseInOut(t);
}
function setVortexSpeedTarget(target,now=performance.now()){
  const current=vortexTransitionValue(now);
  vortexSpeedFrom=current;
  vortexSpeedTo=target;
  vortexSpeedTransitionStartedAt=now;
}
function updateVortexTurboState(now=performance.now()){
  if(vortexTurboActive&&vortexSpeedUntil<=now){
    vortexTurboActive=false;
    vortexSpeedUntil=0;
    setVortexSpeedTarget(1,now);
  }
}
function gameSpeedMultiplier(now=performance.now()){
  updateVortexTurboState(now);
  return vortexTransitionValue(now);
}
function objectSpeedPxPerSec(now=performance.now()){return Math.max(116,window.innerWidth*.19)*gameSpeedMultiplier(now)}
function minimumRouteTimeMs(fromY,toY){
  return ROUTE_TRANSITION_MS*(Math.abs(toY-fromY)/FULL_ROUTE_DISTANCE);
}
function routeMotionAt(now=performance.now()){
  if(!routeTransitionStartedAt){
    return {y:routeTransitionTargetY,velocity:0,done:true};
  }
  const duration=Math.max(1,routeTransitionDurationMs);
  const t=clamp((now-routeTransitionStartedAt)/duration,0,1);
  const t2=t*t,t3=t2*t;
  const p0=routeTransitionStartY;
  const p1=routeTransitionTargetY;
  const m0=routeTransitionStartVelocity*duration;
  const m1=routeTransitionEndVelocity*duration;

  const h00=2*t3-3*t2+1;
  const h10=t3-2*t2+t;
  const h01=-2*t3+3*t2;
  const h11=t3-t2;
  const y=h00*p0+h10*m0+h01*p1+h11*m1;

  const dh00=6*t2-6*t;
  const dh10=3*t2-4*t+1;
  const dh01=-6*t2+6*t;
  const dh11=3*t2-2*t;
  const velocity=(dh00*p0+dh10*m0+dh01*p1+dh11*m1)/duration;
  return {y,velocity,done:t>=1};
}
function beginRouteSegment(startY,targetY,duration,startVelocity=0,endVelocity=0,now=performance.now()){
  planeY=startY;
  routeVelocity=startVelocity;
  routeTransitionStartY=startY;
  routeTransitionTargetY=targetY;
  routeTransitionStartVelocity=startVelocity;
  routeTransitionEndVelocity=endVelocity;
  routeTransitionStartedAt=now;
  routeTransitionDurationMs=Math.max(1,duration);
}
function beginRouteTransition(targetY,duration,now=performance.now(),inheritVelocity=true){
  let startY=planeY;
  let inheritedVelocity=0;

  if(routeTransitionStartedAt){
    const motion=routeMotionAt(now);
    startY=motion.y;
    inheritedVelocity=motion.velocity;
  }
  routePendingTransition=null;

  const safeDuration=Math.max(1,duration);
  const delta=targetY-startY;
  if(Math.abs(delta)<0.00001){
    beginRouteSegment(startY,targetY,1,0,0,now);
    return;
  }

  const reversing=inheritVelocity&&Math.abs(inheritedVelocity)>0.00001&&Math.sign(inheritedVelocity)!==Math.sign(delta);
  if(reversing){
    // Uusi ääni vaikuttaa heti, mutta ei käännä konetta yhdellä framella.
    // Ensin vanha pystynopeus jarrutetaan 280 ms aikana nollaan.
    const brakeDuration=ROUTE_REVERSAL_BRAKE_MS;
    let brakeEndY=startY+inheritedVelocity*brakeDuration*.5;
    brakeEndY=clamp(brakeEndY,13,87);

    // Varsinainen uusi reitti alkaa jarrutuksen jälkeen levosta. Jos alkuperäinen
    // ajoitus oli väljä, se säilyy. Liian myöhäistä komentoa ei kiihdytetä
    // epäluonnollisesti vain siksi, että objektiin ehdittäisiin.
    const remainingRequested=Math.max(1,safeDuration-brakeDuration);
    const remainingNatural=minimumRouteTimeMs(brakeEndY,targetY);
    const goDuration=Math.max(remainingRequested,remainingNatural);
    routePendingTransition={targetY,duration:goDuration};
    beginRouteSegment(startY,brakeEndY,brakeDuration,inheritedVelocity,0,now);
    return;
  }

  let startVelocity=(delta/safeDuration)*ROUTE_START_SPEED;
  if(inheritVelocity&&Math.abs(inheritedVelocity)>0.00001){
    const naturalSpeed=Math.abs(delta)/safeDuration;
    const maxInherited=naturalSpeed*ROUTE_MAX_INHERITED_SLOPE;
    startVelocity=clamp(inheritedVelocity,-maxInherited,maxInherited);
  }
  beginRouteSegment(startY,targetY,safeDuration,startVelocity,0,now);
}
function vortexCoreXPosition(item){
  const width=item.el.offsetWidth||item.el.getBoundingClientRect().width||80;
  return item.x+(VORTEX_CORE_X_RATIO-.5)*width;
}
function vortexCoreYPercent(item){
  // Kohdistetaan kone pyörteen näkyvän suuaukon keskelle. Elementin top/left
  // kuvaavat koko spriteä, joten muutetaan aukon kuvakoordinaatti pelin koordinaateiksi.
  const height=item.el.offsetHeight||item.el.getBoundingClientRect().height||80;
  const coreYpx=item.y+(VORTEX_CORE_Y_RATIO-.5)*height;
  return coreYpx/window.innerHeight*100;
}
function targetXForItem(item){
  return item?.type?.key==='vortex'?vortexCoreXPosition(item):item?.x;
}

function startInitialAutoSeekIfReady(now=performance.now()){
  if(initialAutoSeekDone||!initialAutoSeekAuthorized||!initialAutoTarget)return false;
  if(gameTimerStarted||!gameRunning||gameFinishing)return false;

  const item=initialAutoTarget;
  const targetY=targetYForItem(item);
  const minDuration=minimumRouteTimeMs(planeY,targetY);

  const distancePx=Math.max(0,targetXForItem(item)-planeXPosition());
  const timeToTargetMs=(distancePx/objectSpeedPxPerSec(now))*1000;
  const duration=Math.max(minDuration,timeToTargetMs);

  beginRouteTransition(targetY,duration,now,true);
  currentRoute=item.lane==='high'?'high':'low';
  setEngineFlightState(targetY<planeY?'climb':'descend');

  initialAutoSeekDone=true;
  return true;
}

function maybeAcquireInitialAutoTarget(item){
  if(initialAutoTarget||initialAutoSeekDone||gameTimerStarted||!gameRunning||gameFinishing)return;
  if(!item||item.hit||item.collected)return;

  const key=item?.type?.key;
  const eligible=key==='coin'||key==='diamond'||key==='chest'||key==='vortex';
  if(!eligible)return;

  // Ensimmäinen palkitseva objekti vain muistetaan.
  // Kone ei liiku ennen ensimmäistä onnistunutta suukappaleääntä.
  initialAutoTarget=item;

  // Jos onnistunut ääni tuli jo ennen ensimmäisen sopivan objektin syntyä,
  // liike voidaan käynnistää nyt, koska lähtölupa on jo saatu.
  startInitialAutoSeekIfReady(performance.now());
}
function targetYForItem(item){
  return item?.type?.key==='vortex'?vortexCoreYPercent(item):routeY(item?.lane);
}
function nextTargetOnLane(lane){
  const planeX=planeXPosition();
  let target=null;
  for(const item of collectibles){
    if(item.collected||item.lane!==lane||item.x<=planeX)continue;
    if(!target||targetXForItem(item)<targetXForItem(target))target=item;
  }
  // Pyörre käyttäytyy reitityksen kannalta kuten kerättävä kohde: oikea ääni
  // ajoittaa koneen sen todelliseen imuaukkoon. Lehmä ja kivi jäävät esteiksi.
  for(const item of obstacles){
    if(item.hit||item.type.key!=='vortex'||item.lane!==lane||item.x<=planeX)continue;
    if(!target||targetXForItem(item)<targetXForItem(target))target=item;
  }
  return target;
}
function setRoute(name){
  if(!gameRunning||gameFinishing)return;
  const next=name==='KORKEA'?'high':name==='MATALA'?'low':null;
  if(!next||next===currentRoute)return;

  const now=performance.now();
  if(now<controlLockUntil)return;
  const target=nextTargetOnLane(next);
  // Kolikko/timantti/arkku käyttävät kaistan keskikohtaa. Pyörteelle käytetään
  // sen todellista imuaukkoa, joka on sprite-kuvan keskilinjaa ylempänä.
  const targetY=target?targetYForItem(target):routeY(next);
  const minDuration=minimumRouteTimeMs(planeY,targetY);
  let duration=minDuration;

  if(target){
    const distancePx=Math.max(0,targetXForItem(target)-planeXPosition());
    const timeToTargetMs=(distancePx/objectSpeedPxPerSec())*1000;
    // Ajoissa annettu komento osuu kohteen keskelle juuri sen saapuessa koneelle.
    // Myöhäistä komentoa ei nopeuteta yli normaalin reittivaihdon nopeuden.
    duration=Math.max(minDuration,timeToTargetMs);
  }

  beginRouteTransition(targetY,duration,now,true);
  currentRoute=next;
  setEngineFlightState(targetY<planeY?'climb':'descend');
}

function clearRecognition(){
  liveLowHistory=[];
  liveHighHistory=[];
  liveCustomHistory=[];
  liveF0History=[];
  cancelQualityEvaluation();
  cancelDurationBonusEvaluation();
}
function toggleSingleSoundRoute(){
  if(!gameRunning||gameFinishing)return;
  if(currentRoute==='high')setRoute('MATALA');
  else setRoute('KORKEA');
}
function processFrame(){
  if(!analyser)return;
  analyser.getFloatTimeDomainData(timeData);
  const level=rmsDb(timeData);
  const loud=level.db>dbThreshold;
  plane.classList.toggle('active',loud);
  plane.classList.toggle('idle',!loud);
  const now=performance.now();

  if(!loud){
    soundStartedAt=null;
    liveLowHistory=[];liveHighHistory=[];liveCustomHistory=[];liveF0History=[];
    lastHarmonicAnalysisAt=0;

    if(qualityEvalActive){
      if(now-qualityEvalStartedAt>=QUALITY_EVAL_WINDOW_MS){
        finishQualityEvaluation();
      }else{
        // Liian lyhyt ääni ei voi ansaita laatubonusta.
        cancelQualityEvaluation();
      }
    }

    // Jos puhallus loppuu ennen 700 ms rajaa, kestobonusta ei anneta.
    if(durationBonusActive)cancelDurationBonusEvaluation();

    if(singleTriggerLocked&&now-singleLastLoudAt>=SINGLE_REARM_SILENCE_MS)singleTriggerLocked=false;
    return;
  }
  singleLastLoudAt=now;
  if(soundStartedAt===null)soundStartedAt=now;

  analyser.getFloatFrequencyData(freqData);

  if(controlMode==='custom'){
    if(!gameRunning||gameFinishing)return;
    if(!trainedControlRef)return;

    // Kun ohjaustriggeri on jo lukittu, analyysiä jatketaan vain
    // keskeneräistä 300 ms laatumittausta varten.
    if(singleTriggerLocked&&!qualityEvalActive&&!durationBonusActive)return;

    if(now-lastHarmonicAnalysisAt<HS_ANALYSIS_INTERVAL_MS)return;
    lastHarmonicAnalysisAt=now;

    const analysis=analyzeHarmonicControl();
    const accepted=isAcceptedOpenHeadjoint(analysis);

    if(!singleTriggerLocked){
      if(!accepted)return;

      // Ensimmäinen onnistunut ääni antaa lähtöluvan ensimmäiselle
      // palkitsevalle objektille. Vasta tämän äänen jälkeen kone saa
      // hakeutua sen korkeudelle. Seuraavat äänet käyttävät normaalia
      // ylös/alas-vaihtelua.
      let usedInitialSeek=false;
      if(!initialAutoSeekDone&&!gameTimerStarted){
        initialAutoSeekAuthorized=true;
        usedInitialSeek=startInitialAutoSeekIfReady(now);
      }

      if(initialAutoSeekDone){
        // Jos alkuhakeutuminen käynnistyi nyt, tätä samaa ääntä ei käytetä
        // lisäksi normaaliin reitinvaihtoon.
        if(!usedInitialSeek)toggleSingleSoundRoute();
      }else if(!initialAutoSeekAuthorized){
        toggleSingleSoundRoute();
      }

      singleTriggerLocked=true;

      // Laatupisteen arviointi alkaa samasta hetkestä, mutta piste
      // päätetään vasta koko 300 ms ikkunan jälkeen.
      beginQualityEvaluation(analysis.concentration,now);

      // Erillinen kestobonus alkaa samasta onnistuneesta äänestä.
      // Se ei vaadi concentration-laatua, vain 700 ms jatkuvan
      // hyväksytyn suukappaleäänen.
      beginDurationBonusEvaluation(now);
      return;
    }

    if(qualityEvalActive){
      // Jokainen analyysi-ikkuna lasketaan mukaan. Jos ääntä ei enää
      // tunnisteta avoimeksi suukappaleääneksi, kyseinen mittaus = 0.
      addQualityEvaluationSample(
        accepted&&analysis ? analysis.concentration : 0
      );

      if(now-qualityEvalStartedAt>=QUALITY_EVAL_WINDOW_MS){
        finishQualityEvaluation();
      }
    }

    // Kestobonus on riippumaton concentration-laadusta.
    // Se vaatii vain, että hyväksytty suukappaleääni jatkuu yhtäjaksoisesti.
    updateDurationBonusEvaluation(accepted,now);

    return;
  }

  const f0=yin(timeData,ctx.sampleRate);
  if(!f0)return;
  const fp=harmonicVector(f0);
  if(!fp)return;
  pushLimited(liveF0History,f0);
  const take={f0:median(liveF0History),fp};

  const low=similarity(take,REFS.low);
  const high=similarity(take,REFS.high);
  pushLimited(liveLowHistory,low);
  pushLimited(liveHighHistory,high);
  const lowS=mean(liveLowHistory),highS=mean(liveHighHistory);
  const best=Math.max(lowS,highS),gap=Math.abs(lowS-highS);
  let name='EPÄVARMA';
  if(best>=ACCEPT&&gap>=MARGIN)name=lowS>highS?'MATALA':'KORKEA';
  if(name==='EPÄVARMA'&&now-soundStartedAt<UNCERTAIN_DELAY_MS)return;
  if(name==='EPÄVARMA')return;

  if(controlMode==='both'){
    setRoute(name);
    return;
  }
  if(singleTriggerLocked)return;
  if((controlMode==='high'&&name==='KORKEA')||(controlMode==='low'&&name==='MATALA')){
    toggleSingleSoundRoute();
    singleTriggerLocked=true;
  }
}

function sleepMs(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
function updateCalibrationVisual(db,progress){
  const p=clamp(progress,0,1);
  if(calProgressRing)calProgressRing.style.strokeDashoffset=(414.69-p*414.69).toFixed(2);
  const shown=Number.isFinite(db)?clamp(db,-90,-30):-90;
  const level=clamp((shown+90)/60,0,1);
  const eased=Math.pow(level,.62);
  if(calPulse){
    calPulse.style.transform=`scale(${(0.72+0.34*eased).toFixed(3)})`;
    calPulse.style.opacity=(0.24+0.62*eased).toFixed(3);
  }
  if(calDbValue)calDbValue.textContent=Number.isFinite(db)?`${Math.round(shown)} dB`:'–';
  calOverlay.classList.toggle('complete',p>=.999);
}
async function calibrateMicrophoneNoiseFloor(){
  if(!analyser||!timeData)return false;
  if(timer){clearInterval(timer);timer=null}
  clearRecognition();
  calOverlay.classList.remove('complete','closing');
  calOverlay.classList.add('show');
  updateCalibrationVisual(-90,0);

  const totalMs=MIC_CAL_WARMUP_MS+MIC_CAL_MEASURE_MS;
  const overallStart=performance.now();

  // Lämmittely: näytetään live-taso, mutta näitä näytteitä ei käytetä kynnyksen laskentaan.
  while(performance.now()-overallStart<MIC_CAL_WARMUP_MS){
    analyser.getFloatTimeDomainData(timeData);
    const level=rmsDb(timeData);
    const elapsed=performance.now()-overallStart;
    updateCalibrationVisual(level.db,elapsed/totalMs);
    await sleepMs(33);
  }

  const samples=[];
  const measureStart=performance.now();
  while(performance.now()-measureStart<MIC_CAL_MEASURE_MS){
    analyser.getFloatTimeDomainData(timeData);
    const level=rmsDb(timeData);
    if(Number.isFinite(level.db))samples.push(level.db);
    const elapsed=MIC_CAL_WARMUP_MS+(performance.now()-measureStart);
    updateCalibrationVisual(level.db,elapsed/totalMs);
    await sleepMs(33);
  }

  if(!samples.length){dbThreshold=-70}
  else{
    samples.sort((a,b)=>a-b);
    const mid=Math.floor(samples.length/2);
    const noiseFloor=samples.length%2?samples[mid]:(samples[mid-1]+samples[mid])/2;
    dbThreshold=Math.max(-70,Math.min(-20,Math.round(noiseFloor+MIC_CAL_MARGIN_DB)));
  }
  updateCalibrationVisual(samples.length?samples[Math.floor(samples.length/2)]:-90,1);
  await sleepMs(300);
  calOverlay.classList.add('closing');
  await sleepMs(150);
  timer=setInterval(processFrame,FRAME_MS);
  calOverlay.classList.remove('show','complete','closing');
  return true;
}
async function startMic(){
  if(stream)return true;
  if(!navigator.mediaDevices?.getUserMedia)throw new Error('Selain ei tue mikrofonikäyttöä.');
  ctx=new (window.AudioContext||window.webkitAudioContext)();
  if(ctx.state!=='running')await ctx.resume();
  const supported=navigator.mediaDevices.getSupportedConstraints?navigator.mediaDevices.getSupportedConstraints():{};
  const constraints={echoCancellation:false,noiseSuppression:false,autoGainControl:false};
  if(supported.voiceIsolation)constraints.voiceIsolation=false;
  stream=await navigator.mediaDevices.getUserMedia({audio:constraints});
  const src=ctx.createMediaStreamSource(stream);
  analyser=ctx.createAnalyser();
  analyser.fftSize=8192;
  analyser.smoothingTimeConstant=.08;
  analyser.minDecibels=-110;
  analyser.maxDecibels=-10;
  src.connect(analyser);
  timeData=new Float32Array(analyser.fftSize);
  freqData=new Float32Array(analyser.frequencyBinCount);
  await calibrateMicrophoneNoiseFloor();
  return true;
}

function visualScale(){
  // iPhone 15 landscape (~852x393 CSS px) on vertailutaso 1.0.
  // Käytetään viewportin pienempää suhteellista mittaa, jotta hyvin leveä tai korkea
  // ikkuna ei kasvata elementtejä kohtuuttomasti. Puhelimia ei kutisteta alle 1.0:n.
  const widthScale=window.innerWidth/852;
  const heightScale=window.innerHeight/393;
  return clamp(Math.min(widthScale,heightScale),1,1.75);
}
function applyResponsiveVisualScale(){
  const s=visualScale();
  const w=window.innerWidth;
  const root=document.documentElement;
  const basePlane=clamp(w*.17,84,155);
  const baseStar=clamp(w*.066,34,58);
  const baseScore=clamp(w*.036,19,30);
  const baseFlash=clamp(w*.04,18,32);
  const baseH1=clamp(w*.06,26,42);
  const baseP=clamp(w*.026,13,17);

  const objectScale=objectSizePercent/100;
  root.style.setProperty('--plane-width',(basePlane*s).toFixed(1)+'px');
  root.style.setProperty('--collectible-size',(baseStar*s*objectScale).toFixed(1)+'px');
  root.style.setProperty('--obstacle-size',(baseStar*1.18*s*objectScale).toFixed(1)+'px');
  root.style.setProperty('--score-font-size',Math.min(46,baseScore*s).toFixed(1)+'px');
  root.style.setProperty('--score-min-width',(72*s).toFixed(1)+'px');
  root.style.setProperty('--score-pad-y',(7*s).toFixed(1)+'px');
  root.style.setProperty('--score-pad-y2',(8*s).toFixed(1)+'px');
  root.style.setProperty('--score-pad-x',(13*s).toFixed(1)+'px');
  root.style.setProperty('--top-control-size',Math.min(52,38*s).toFixed(1)+'px');
  root.style.setProperty('--top-control-font-size',Math.min(27,20*s).toFixed(1)+'px');
  root.style.setProperty('--flash-font-size',Math.min(50,baseFlash*s).toFixed(1)+'px');
  root.style.setProperty('--overlay-h1-size',Math.min(56,baseH1*s).toFixed(1)+'px');
  root.style.setProperty('--overlay-p-size',Math.min(24,baseP*s).toFixed(1)+'px');
  return s;
}
function desiredCloudCount(){
  // Pilvimäärä kasvaa näkymän leveyden mukana, mutta ei laitetyyppiin sidotusti.
  const s=visualScale();
  return Math.round(clamp(Math.ceil(window.innerWidth/(320*s))+2,4,7));
}
function cloudSizeScale(){
  // Säilytetään puhelinten nykyinen pilvikoko, mutta kasvatetaan sitä samalla
  // jatkuvalla kertoimella kuin muuta pelikuvaa suuremmilla viewporteilla.
  const phoneHeightFactor=clamp(window.innerHeight/430,.68,1);
  return phoneHeightFactor*visualScale();
}
function cloudMaxGap(){
  return clamp(window.innerWidth*.13,72,155);
}
function createCloudElement(){
  const el=document.createElement('div');
  el.className='cloud';
  const img=document.createElement('img');
  img.alt='';
  img.draggable=false;
  el.appendChild(img);
  cloudLayer.appendChild(el);
  return {el,img,type:null,nominalWidth:0,bandIndex:0,x:0,y:0,width:0,height:0,speed:0,opacity:1};
}
function chooseCloudBand(excludeBand=-1){
  const choices=CLOUD_VERTICAL_BANDS.map((_,i)=>i).filter(i=>i!==excludeBand);
  return pick(choices.length?choices:[0]);
}
function configureCloud(cloud,{keepBand=false,excludeBand=-1}={}){
  if(!cloud.type || Math.random()<.38)cloud.type=pick(CLOUD_TYPES);
  if(!cloud.nominalWidth || Math.random()<.38){
    cloud.nominalWidth=rand(cloud.type.minW,cloud.type.maxW);
  }else{
    cloud.nominalWidth=clamp(cloud.nominalWidth,cloud.type.minW,cloud.type.maxW);
  }
  if(!keepBand)cloud.bandIndex=chooseCloudBand(excludeBand);
  const scale=cloudSizeScale();
  cloud.width=cloud.nominalWidth*scale;
  cloud.height=cloud.width/cloud.type.aspect;
  const centerNorm=CLOUD_VERTICAL_BANDS[cloud.bandIndex]+rand(-.018,.018);
  const minY=window.innerHeight*.025;
  const maxY=Math.max(minY,window.innerHeight*.61-cloud.height);
  cloud.y=clamp(centerNorm*window.innerHeight-cloud.height*.5,minY,maxY);
  cloud.speed=rand(11,22)*clamp(cloud.width/170,.78,1.2);
  cloud.opacity=rand(.66,.94);
  cloud.el.style.width=cloud.width.toFixed(0)+'px';
  cloud.el.style.opacity=cloud.opacity.toFixed(2);
  cloud.img.src=cloud.type.src;
}
function renderCloud(cloud){
  cloud.el.style.transform=`translate(${cloud.x.toFixed(1)}px,${cloud.y.toFixed(1)}px)`;
}
function distributeClouds(){
  if(!clouds.length)return;
  // Järjestetään pilvet tasaisesti vasemman reunan ulkopuolelta oikean reunan yli.
  const totalWidth=clouds.reduce((s,c)=>s+c.width,0);
  const targetSpan=window.innerWidth+clouds[0].width*.55+clouds[clouds.length-1].width*.55;
  const gap=Math.max(CLOUD_MIN_GAP,Math.min(cloudMaxGap(),(targetSpan-totalWidth)/Math.max(1,clouds.length-1)));
  let cursor=-clouds[0].width*.48;
  for(let i=0;i<clouds.length;i++){
    const c=clouds[i];
    if(i>0)cursor+=clouds[i-1].width+gap;
    c.x=cursor;
    renderCloud(c);
  }
}
function initClouds(){
  for(const c of clouds)c.el.remove();
  clouds=[];
  const count=desiredCloudCount();
  let previousBand=-1;
  for(let i=0;i<count;i++){
    const cloud=createCloudElement();
    configureCloud(cloud,{excludeBand:previousBand});
    previousBand=cloud.bandIndex;
    clouds.push(cloud);
  }
  distributeClouds();
}
function respawnCloud(cloud){
  const others=clouds.filter(c=>c!==cloud);
  const rightmost=others.length?others.reduce((a,b)=>(a.x+a.width)>(b.x+b.width)?a:b):null;
  const excludeBand=rightmost?rightmost.bandIndex:-1;
  configureCloud(cloud,{excludeBand});
  const rightEdge=rightmost?rightmost.x+rightmost.width:window.innerWidth;
  cloud.x=Math.max(window.innerWidth+20,rightEdge+CLOUD_MIN_GAP+rand(12,44));
  renderCloud(cloud);
}
function enforceCloudSpacing(){
  const sorted=[...clouds].sort((a,b)=>a.x-b.x);
  const maxGap=cloudMaxGap();
  for(let i=1;i<sorted.length;i++){
    const prev=sorted[i-1],cur=sorted[i];
    const prevRight=prev.x+prev.width;
    const minX=prevRight+CLOUD_MIN_GAP;
    const maxX=prevRight+maxGap;
    if(cur.x<minX)cur.x=minX;
    else if(cur.x>maxX)cur.x=maxX;
  }
}
function updateClouds(dt){
  for(const cloud of clouds)cloud.x-=cloud.speed*(dt/1000);
  // Vasemmalta poistuvat siirretään oikeanpuoleisimman perään, eivät satunnaiseksi ryppääksi.
  const leaving=clouds.filter(c=>c.x<-c.width-45).sort((a,b)=>a.x-b.x);
  for(const cloud of leaving)respawnCloud(cloud);
  enforceCloudSpacing();
  for(const cloud of clouds)renderCloud(cloud);
}
function reflowCloudsForViewport(){
  if(!clouds.length)return;
  const wanted=desiredCloudCount();
  if(wanted!==clouds.length){
    initClouds();
    return;
  }
  for(const cloud of clouds)configureCloud(cloud,{keepBand:true});
  distributeClouds();
}
let cloudResizeTimer=null;
window.addEventListener('resize',()=>{
  applyResponsiveVisualScale();
  clearTimeout(cloudResizeTimer);
  cloudResizeTimer=setTimeout(()=>reflowCloudsForViewport(),70);
});

function chooseLane(){
  let lane=Math.random()<.5?'high':'low';
  if(lane===lastSpawnLane){
    sameLaneCount++;
    if(sameLaneCount>=2){lane=lane==='high'?'low':'high';sameLaneCount=0}
  }else sameLaneCount=0;
  lastSpawnLane=lane;
  return lane;
}
const COLLECTIBLE_TYPES=[
  {key:'coin',src:'app/assets/images/kerattava_kolikko.webp',points:1,weight:78},
  {key:'diamond',src:'app/assets/images/kerattava_timantti.webp',points:2,weight:18},
  {key:'chest',src:'app/assets/images/kerattava_aarrearkku.webp',points:5,weight:4}
];
const TOTAL_COLLECTIBLE_WEIGHT=COLLECTIBLE_TYPES.reduce((sum,type)=>sum+type.weight,0);
function chooseCollectibleType(){
  let roll=Math.random()*TOTAL_COLLECTIBLE_WEIGHT;
  for(const type of COLLECTIBLE_TYPES){
    roll-=type.weight;
    if(roll<=0)return type;
  }
  return COLLECTIBLE_TYPES[0];
}
const OBSTACLE_TYPE_MAP={
  cow:{key:'cow',src:'app/assets/images/este_lehma.webp',weight:50},
  rock:{key:'rock',src:'app/assets/images/este_kivi.webp',weight:40},
  vortex:{key:'vortex',src:'app/assets/images/este_pyorre.webp',weight:18}
};
const OBSTACLE_TYPES=[OBSTACLE_TYPE_MAP.cow,OBSTACLE_TYPE_MAP.rock];
const TOTAL_OBSTACLE_WEIGHT=OBSTACLE_TYPES.reduce((sum,type)=>sum+type.weight,0);
function chooseObstacleType(){
  let roll=Math.random()*TOTAL_OBSTACLE_WEIGHT;
  for(const type of OBSTACLE_TYPES){
    roll-=type.weight;
    if(roll<=0)return type;
  }
  return OBSTACLE_TYPES[0];
}
function spawnObstacle(forcedTypeKey=null){
  const lane=chooseLane();
  const type=forcedTypeKey?OBSTACLE_TYPE_MAP[forcedTypeKey]:chooseObstacleType();
  const el=document.createElement('div');
  el.className=`obstacle ${type.key}`;
  const img=document.createElement('img');
  img.src=type.src;
  img.alt='';
  img.draggable=false;
  el.appendChild(img);
  game.appendChild(el);
  const y=window.innerHeight*(routeY(lane)/100);
  const item={
    el,lane,type,
    x:window.innerWidth+SPAWN_X_OFFSET,y,
    hit:false,rotation:0,rotationSpeed:0,
    vx:0,vy:0,ageAfterHit:0,opacity:1,
    dead:false
  };
  obstacles.push(item);
  maybeAcquireInitialAutoTarget(item);
}
function spawnRockFragments(item,speed){
  const rect=item.el.getBoundingClientRect();
  const width=Math.max(26,rect.width||item.el.offsetWidth||56);
  const height=Math.max(22,rect.height||item.el.offsetHeight||42);
  const layouts=[
    {x:0.00,y:0.00,w:0.38,h:0.38},
    {x:0.38,y:0.00,w:0.29,h:0.34},
    {x:0.67,y:0.00,w:0.33,h:0.39},
    {x:0.00,y:0.38,w:0.34,h:0.28},
    {x:0.34,y:0.34,w:0.31,h:0.31},
    {x:0.65,y:0.39,w:0.35,h:0.28},
    {x:0.08,y:0.66,w:0.35,h:0.34},
    {x:0.43,y:0.65,w:0.57,h:0.35}
  ];
  const basePush=Math.max(220,speed*.52);
  const upwardBase=Math.max(180,window.innerHeight*.18);
  for(const cell of layouts){
    const fragW=Math.max(10,width*cell.w);
    const fragH=Math.max(10,height*cell.h);
    const centerX=item.x+(cell.x+cell.w*.5-.5)*width;
    const centerY=item.y+(cell.y+cell.h*.5-.5)*height;
    const dirX=((cell.x+cell.w*.5)-.5)*1.9 + rand(-.16,.16);
    const dirY=((cell.y+cell.h*.5)-.5)*1.4 + rand(-.12,.12);

    const el=document.createElement('div');
    el.className='rock-fragment';
    el.style.width=fragW.toFixed(1)+'px';
    el.style.height=fragH.toFixed(1)+'px';

    const img=document.createElement('img');
    img.src=item.type.src;
    img.alt='';
    img.draggable=false;
    img.style.width=width.toFixed(1)+'px';
    img.style.height=height.toFixed(1)+'px';
    img.style.left=(-cell.x*width).toFixed(1)+'px';
    img.style.top=(-cell.y*height).toFixed(1)+'px';
    el.appendChild(img);
    game.appendChild(el);

    rockFragments.push({
      el,x:centerX,y:centerY,
      vx:dirX*basePush + rand(-46,46),
      vy:dirY*upwardBase - rand(120,220),
      rotation:rand(-18,18),
      rotationSpeed:dirX*rand(220,430),
      gravity:ROCK_FRAGMENT_GRAVITY*rand(.9,1.08),
      age:0,opacity:1,
      life:ROCK_FRAGMENT_LIFE_MS + rand(-80,100),
      fade:ROCK_FRAGMENT_FADE_MS
    });
  }
}
function showScoreFlash(text,penalty=false){
  flash.textContent=text;
  flash.style.color=penalty?'#fff0b3':'#fff';
  flash.classList.remove('pop');
  void flash.offsetWidth;
  flash.classList.add('pop');
}
function bouncePlaneFromRock(){
  const now=performance.now();
  const otherLane=planeY<50?'low':'high';
  const bounceTargetY=routeY(otherLane);
  beginRouteTransition(bounceTargetY,ROCK_BOUNCE_MS,now,false);
  currentRoute=otherLane;
  controlLockUntil=now+ROCK_CONTROL_LOCK_MS;
  setEngineFlightState(routeTransitionTargetY<planeY?'climb':'descend');
}
function updateBonusIndicator(now=performance.now()){
  updateVortexTurboState(now);
  if(!vortexTurboActive){
    bonus.classList.remove('active');
    bonus.textContent='NOPEUS ×2 · PISTEET ×2 · 10 s';
    return;
  }
  const remaining=Math.max(0,vortexSpeedUntil-now);
  const seconds=Math.max(0,Math.ceil(remaining/1000));
  bonus.textContent=`NOPEUS ×2 · PISTEET ×2 · ${seconds} s`;
  bonus.classList.add('active');
}
function hitVortex(){
  const now=performance.now();
  updateVortexTurboState(now);
  // Pyörre toimii toggle-tyyppisesti. Ensimmäinen osuma käynnistää 10 s turbon
  // pehmeällä ease-inillä. Uusi pyörre turbon aikana katkaisee bonuksen heti,
  // mutta pelinopeus liukuu takaisin normaaliksi ease-outilla.
  if(vortexTurboActive){
    vortexTurboActive=false;
    vortexSpeedUntil=0;
    setVortexSpeedTarget(1,now);
  }else{
    vortexTurboActive=true;
    vortexSpeedUntil=now+VORTEX_SPEED_EFFECT_MS;
    setVortexSpeedTarget(2,now);
  }
  updateBonusIndicator(now);

}

function hitObstacle(item,speed){
  if(item.hit)return;
  startGameTimerOnFirstObjectHit(performance.now());
  item.hit=true;
  item.el.classList.add('hit');

  if(item.type.key==='vortex'){
    hitVortex();
    item.dead=true;
    item.opacity=0;
    return;
  }

  if(item.type.key==='rock'){
    playGameFx('rock');
    score=Math.max(0,score-2);
    scoreNum.textContent=score;
    showScoreFlash('-2',true);
    spawnRockFragments(item,speed);
    item.dead=true;
    item.opacity=0;
    triggerEngineRockJolt();
    bouncePlaneFromRock();
    return;
  }

  // Lehmä: yksi piste pois vain kerran ja sen jälkeen törmäys pois käytöstä.
  playGameFx('cow');
  score=Math.max(0,score-1);
  scoreNum.textContent=score;
  showScoreFlash('-1',true);
  item.vx=-speed*1.65;
  item.vy=-rand(window.innerHeight*.28,window.innerHeight*.42);
  item.rotationSpeed=pick([-1,1])*rand(560,760);
  item.ageAfterHit=0;
}
function clearRockFragments(){
  for(const piece of rockFragments)piece.el.remove();
  rockFragments=[];
}
function clearObstacles(){
  for(const item of obstacles)item.el.remove();
  obstacles=[];
  clearRockFragments();
}

function spawnCollectible(){
  const lane=chooseLane();
  const type=chooseCollectibleType();
  const el=document.createElement('div');
  el.className=`collectible ${lane} ${type.key}`;
  const img=document.createElement('img');
  img.src=type.src;
  img.alt='';
  el.appendChild(img);
  game.appendChild(el);
  const item={el,lane,x:window.innerWidth+SPAWN_X_OFFSET,collected:false,type,points:type.points};
  collectibles.push(item);
  maybeAcquireInitialAutoTarget(item);
}
function collectCollectible(item){
  if(item.collected)return;
  const now=performance.now();
  startGameTimerOnFirstObjectHit(now);
  item.collected=true;
  updateVortexTurboState(now);
  const pointMultiplier=vortexTurboActive?2:1;
  const gained=item.points*pointMultiplier;
  score+=gained;
  scoreNum.textContent=score;
  item.el.classList.add('collected');
  showScoreFlash('+'+gained,false);
  if(item.type.key==='coin')playGameFx('coin');
  else if(item.type.key==='diamond')playGameFx('diamond');
  else if(item.type.key==='chest')playGameFx('chest');
}
function formatGameTime(ms){
  const totalSeconds=Math.max(0,Math.ceil(ms/1000));
  const minutes=Math.floor(totalSeconds/60);
  const seconds=totalSeconds%60;
  return `${minutes}:${String(seconds).padStart(2,'0')}`;
}
function playCountdownTick(){
  if(gameAudioMuted||!ctx||ctx.state!=='running')return;
  try{
    const now=ctx.currentTime;
    const osc=ctx.createOscillator();
    const gain=ctx.createGain();
    osc.type='sine';
    osc.frequency.setValueAtTime(720,now);
    gain.gain.setValueAtTime(.0001,now);
    gain.gain.exponentialRampToValueAtTime(.045,now+.008);
    gain.gain.exponentialRampToValueAtTime(.0001,now+.075);
    osc.connect(gain);gain.connect(ctx.destination);
    osc.start(now);osc.stop(now+.085);
    osc.onended=()=>{try{osc.disconnect()}catch{}try{gain.disconnect()}catch{}};
  }catch{}
}
function startGameTimerOnFirstObjectHit(now=performance.now()){
  if(gameTimerStarted||!gameRunning||gameFinishing)return;

  gameTimerStarted=true;
  gameStartedAt=now;
  gameEndsAt=now+GAME_DURATION_MS;
  lastCountdownTickSecond=null;
  updateGameTimer(now);
}

function updateGameTimer(now=performance.now()){
  if(!gameEndsAt){
    gameTimer.textContent='1:30';
    gameTimer.classList.remove('warning','urgent');
    return;
  }
  const remaining=Math.max(0,gameEndsAt-now);
  const seconds=Math.max(0,Math.ceil(remaining/1000));
  gameTimer.textContent=formatGameTime(remaining);
  gameTimer.classList.toggle('warning',seconds<=10&&seconds>5);
  gameTimer.classList.toggle('urgent',seconds<=5);
  if(!gameFinishing&&seconds<=5&&seconds>0&&seconds!==lastCountdownTickSecond){
    lastCountdownTickSecond=seconds;
    playCountdownTick();
  }
}
function startGameFinish(now=performance.now()){
  if(gameFinishing)return;
  gameFinishing=true;
  finishStartedAt=now;
  vortexTurboActive=false;
  vortexSpeedUntil=0;
  setVortexSpeedTarget(1,now);
  bonus.classList.remove('active');
  gameTimer.textContent='0:00';
  gameTimer.classList.remove('warning');
  gameTimer.classList.add('urgent');
  if(ctx&&engineGain){
    try{
      const audioNow=ctx.currentTime;
      const current=Math.max(.0001,engineGain.gain.value||.0001);
      engineGain.gain.cancelScheduledValues(audioNow);
      engineGain.gain.setValueAtTime(current,audioNow);
      engineGain.gain.linearRampToValueAtTime(0,audioNow+GAME_FINISH_EASE_MS/1000);
    }catch{}
  }
}
function completeGameFinish(){
  if(!gameRunning)return;
  gameRunning=false;
  gameFinishing=false;
  stopEngineAudio();
  finishScore.textContent=String(score);
  finishOverlay.style.display='flex';
}
function resetScore(){
  score=0;
  qualityStarsTotal=0;
  durationBonusesTotal=0;
  scoreNum.textContent='0';
  renderQualityStarCount();
  renderDurationBonusCount();
}
function clearCollectibles(){for(const item of collectibles)item.el.remove();collectibles=[]}
function spawnGameObject(now=performance.now()){
  if(shouldSpawnGuaranteedVortex(now)){
    markGuaranteedVortexSpawned();
    spawnObstacle('vortex');
    return;
  }
  if(Math.random()<COLLECTIBLE_SPAWN_CHANCE)spawnCollectible();
  else spawnObstacle();
}
function beginGame(){
  clearCollectibles();
  clearObstacles();
  initClouds();
  resetScore();
  vortexTurboActive=false;
  vortexSpeedUntil=0;
  vortexSpeedFrom=1;
  vortexSpeedTo=1;
  vortexSpeedTransitionStartedAt=0;
  updateBonusIndicator();
  finishOverlay.style.display='none';
  gameFinishing=false;
  finishStartedAt=0;
  lastCountdownTickSecond=null;
  const startY=50;
  currentRoute='center';planeY=startY;
  routeTransitionStartY=startY;
  routeTransitionTargetY=startY;
  routeTransitionStartedAt=0;
  routeTransitionStartVelocity=0;
  routeTransitionEndVelocity=0;
  routePendingTransition=null;
  routeVelocity=0;
  routeTiltCurrent=0;
  routeTransitionDurationMs=ROUTE_TRANSITION_MS;
  singleTriggerLocked=false;
  singleLastLoudAt=0;
  clearRecognition();
  plane.classList.remove('active');
  plane.classList.add('idle');
  spawnClock=0;
  controlLockUntil=0;
  initialAutoTarget=null;
  initialAutoSeekAuthorized=false;
  initialAutoSeekDone=false;
  gameRunning=true;
  gameTimerStarted=false;
  gameStartedAt=0;
  gameEndsAt=0;
  planGuaranteedVortexes();
  lastFrame=performance.now();
  updateGameTimer(lastFrame);
  requestAnimationFrame(gameLoop);
}
function gameLoop(now){
  if(!gameRunning)return;
  const dt=Math.min(40,Math.max(0,now-lastFrame));
  lastFrame=now;
  if(gameTimerStarted&&!gameFinishing&&now>=gameEndsAt)startGameFinish(now);
  updateGameTimer(now);
  const finishT=gameFinishing?clamp((now-finishStartedAt)/GAME_FINISH_EASE_MS,0,1):0;
  const finishSpeedScale=gameFinishing?1-vortexEaseInOut(finishT):1;

  if(routeTransitionStartedAt){
    const motion=routeMotionAt(now);
    planeY=motion.y;
    routeVelocity=motion.velocity;
    if(motion.done){
      planeY=routeTransitionTargetY;
      routeVelocity=routeTransitionEndVelocity;
      routeTransitionStartedAt=0;
      routeTransitionStartVelocity=0;
      routeTransitionEndVelocity=0;

      if(routePendingTransition){
        const pending=routePendingTransition;
        routePendingTransition=null;
        const pendingStartY=planeY;
        beginRouteSegment(pendingStartY,pending.targetY,pending.duration,0,0,now);
        setEngineFlightState(pending.targetY<pendingStartY?'climb':'descend');
      }else{
        setEngineFlightState('level');
      }
    }
  }else{
    planeY=routeTransitionTargetY;
    routeVelocity=0;
  }

  // Nokka seuraa todellista pystynopeutta. Kun suunta vaihtuu, kallistus
  // kulkee ensin vaakatasoon ja vasta sitten vastakkaiseen suuntaan.
  const targetRouteTilt=clamp(routeVelocity/ROUTE_TILT_REFERENCE_SPEED,-1,1)*noseTiltAmount;
  const tiltAlpha=1-Math.exp(-dt/ROUTE_TILT_RESPONSE_MS);
  routeTiltCurrent+=(targetRouteTilt-routeTiltCurrent)*tiltAlpha;
  if(!routeTransitionStartedAt&&Math.abs(routeTiltCurrent)<0.02)routeTiltCurrent=0;

  const speedMultiplier=gameSpeedMultiplier(now)*finishSpeedScale;
  const planeX=planeXPosition();
  const speed=objectSpeedPxPerSec(now)*finishSpeedScale; // px/s
  updateBonusIndicator(now);

  const swayPeriod=PLANE_SWAY_BASE_PERIOD_MS/(planeSwaySpeedPercent/100);
  const swayPhase=(now%swayPeriod)/swayPeriod*Math.PI*2;
  // Pääaalto + pieni toinen harmoninen tekee keinunnasta piirroselokuvamaisen,
  // mutta jättää reitinvaihdon nokkakallistuksen selvästi hallitsevaksi.
  // Toinen harmoninen skaalautuu kulmasäätimen mukana, joten 0° pysäyttää kallistelun täysin.
  const swayRotation=(Math.sin(swayPhase)+Math.sin(swayPhase*2+.8)*.19)*planeSwayRotDeg;
  const swayBob=Math.sin(swayPhase+.35)*planeSwayBobPx;
  const tilt=routeTiltCurrent+swayRotation;
  const planeTopPercent=clamp(planeY,13,87);
  plane.style.top=planeTopPercent+'%';
  plane.style.transform=`translate(-50%,-50%) translateY(${swayBob.toFixed(1)}px) rotate(${tilt.toFixed(1)}deg)`;
  updateClouds(dt*speedMultiplier);

  if(!gameFinishing)spawnClock+=dt*speedMultiplier;
  if(!gameFinishing&&spawnClock>=SPAWN_INTERVAL){
    spawnClock-=SPAWN_INTERVAL;
    spawnGameObject(now);
  }
  for(let i=collectibles.length-1;i>=0;i--){
    const s=collectibles[i];
    if(!s.collected)s.x-=speed*(dt/1000);
    s.el.style.left=s.x+'px';
    const horizontalHit=Math.abs(s.x-planeX)<Math.max(34,window.innerWidth*.035);
    const verticalHit=Math.abs(planeY-routeY(s.lane))<=ROUTE_HIT_TOLERANCE;
    if(!gameFinishing&&!s.collected&&horizontalHit&&verticalHit){
      collectCollectible(s);
    }
    if(s.x<-80||s.collected&&s.x<planeX-30){
      s.el.remove();
      collectibles.splice(i,1);
    }
  }

  const dtSec=dt/1000;
  for(let i=rockFragments.length-1;i>=0;i--){
    const piece=rockFragments[i];
    piece.age+=dt;
    piece.x+=piece.vx*dtSec;
    piece.y+=piece.vy*dtSec;
    piece.vy+=piece.gravity*dtSec;
    piece.rotation+=piece.rotationSpeed*dtSec;
    const fadeStart=Math.max(0,piece.life-piece.fade);
    if(piece.age>=fadeStart){
      piece.opacity=clamp(1-(piece.age-fadeStart)/piece.fade,0,1);
    }
    piece.el.style.left=piece.x+'px';
    piece.el.style.top=piece.y+'px';
    piece.el.style.opacity=piece.opacity.toFixed(2);
    piece.el.style.transform=`translate(-50%,-50%) rotate(${piece.rotation.toFixed(1)}deg)`;
    if(piece.age>=piece.life||piece.x<-220||piece.x>window.innerWidth+220||piece.y>window.innerHeight+220||piece.y<-220){
      piece.el.remove();
      rockFragments.splice(i,1);
    }
  }

  for(let i=obstacles.length-1;i>=0;i--){
    const o=obstacles[i];
    if(o.dead){
      o.el.remove();
      obstacles.splice(i,1);
      continue;
    }

    if(o.type.key==='cow'&&o.hit){
      // Osuttu lehmä irtoaa normaalilta lentoradalta, kieppuu ja kaartaa pois ruudusta.
      o.ageAfterHit+=dt;
      o.x+=o.vx*dtSec;
      o.y+=o.vy*dtSec;
      o.vy+=window.innerHeight*.18*dtSec;
      o.rotation+=o.rotationSpeed*dtSec;
      if(o.ageAfterHit>650)o.opacity=clamp(1-(o.ageAfterHit-650)/650,0,1);
    }else{
      o.x-=speed*dtSec;
      o.y=window.innerHeight*(routeY(o.lane)/100);
    }

    o.el.style.left=o.x+'px';
    o.el.style.top=o.y+'px';
    o.el.style.opacity=o.opacity.toFixed(2);
    o.el.style.transform=`translate(-50%,-50%) rotate(${o.rotation.toFixed(1)}deg)`;

    if(!gameFinishing&&!o.hit){
      const obstacleHalfWidth=Math.max(22,o.el.offsetWidth*.34);
      const planeHalfWidth=Math.max(30,plane.offsetWidth*.32);
      const obstacleTargetX=o.type.key==='vortex'?vortexCoreXPosition(o):o.x;
      const horizontalTolerance=o.type.key==='vortex'?VORTEX_CORE_X_TOLERANCE:obstacleHalfWidth+planeHalfWidth;
      const horizontalHit=Math.abs(obstacleTargetX-planeX)<horizontalTolerance;
      const obstacleTargetY=o.type.key==='vortex'?vortexCoreYPercent(o):routeY(o.lane);
      const hitTolerance=o.type.key==='vortex'?VORTEX_CORE_HIT_TOLERANCE:OBSTACLE_HIT_TOLERANCE;
      const verticalHit=Math.abs(planeY-obstacleTargetY)<=hitTolerance;
      if(horizontalHit&&verticalHit){
        hitObstacle(o,speed);
        if(o.dead){
          o.el.remove();
          obstacles.splice(i,1);
          continue;
        }
      }
    }

    const cowGone=o.type.key==='cow'&&o.hit&&(o.ageAfterHit>1350||o.x<-180||o.y<-180||o.y>window.innerHeight+180);
    const normalGone=o.x<-180;
    if(cowGone||normalGone){
      o.el.remove();
      obstacles.splice(i,1);
    }
  }
  if(gameFinishing&&finishT>=1){
    completeGameFinish();
    return;
  }
  requestAnimationFrame(gameLoop);
}

function setStartButtonDisabled(disabled){
  instrumentFluteBtn.disabled=disabled;
  instrumentFluteInfoBtn.disabled=disabled;
}
async function startFluteGame(){
  startError.textContent='';
  controlMode='custom';
  setStartButtonDisabled(true);
  startOverlay.style.display='none';
  try{
    await startMic();
    await preloadGameFx();
    beginGame();
    await startEngineAudioFromBeginning();
  }catch(err){
    stopEngineAudio();
    startOverlay.style.display='flex';
    startError.textContent=err?.message||'Mikrofonia ei saatu käyttöön.';
    calOverlay.classList.remove('show','complete','closing');
  }finally{
    setStartButtonDisabled(false);
  }
}
function openInstrumentHelp(){
  helpImage.src='app/assets/images/ohje_huilu.png';
  helpImage.alt='Huilun peliohje';
  helpOverlay.classList.add('show');
}
function closeInstrumentHelp(){helpOverlay.classList.remove('show')}
function openSettings(){
  settingsStatus.textContent='';
  updateSettingsUi();
  updateQualityDevUi();
  settingsOverlay.classList.add('show');
}
function closeSettings(){settingsOverlay.classList.remove('show')}
async function trainCustomControlFromSettings(){
  if(gameRunning){
    settingsStatus.textContent='Kouluta avoin suukappaleääni ennen seuraavaa peliä.';
    return;
  }
  customTrainBtn.disabled=true;
  settingsStatus.textContent='Valmistellaan mikrofonia…';
  closeSettings();
  try{
    await startMic();
    await trainControlSound();
    settingsStatus.textContent='Avoin suukappaleääni koulutettu.';
  }catch(err){
    settingsStatus.textContent=err?.message||'Koulutus epäonnistui.';
  }finally{
    customTrainBtn.disabled=false;
    updateSettingsUi();
    openSettings();
  }
}

instrumentFluteInfoBtn.addEventListener('click',(event)=>{
  event.preventDefault();
  event.stopPropagation();
  openInstrumentHelp();
});
helpOverlay.addEventListener('click',closeInstrumentHelp);
instrumentFluteBtn.addEventListener('click',startFluteGame);
settingsBtn.addEventListener('click',openSettings);
settingsCloseBtn.addEventListener('click',closeSettings);
settingsOverlay.addEventListener('click',(event)=>{if(event.target===settingsOverlay)closeSettings()});
for(const btn of controlModeButtons){
  btn.addEventListener('click',async()=>{
    const mode=btn.dataset.controlMode;
    if(mode==='custom'&&!trainedControlRef){
      await trainCustomControlFromSettings();
      return;
    }
    setControlMode(mode);
    settingsStatus.textContent='Käytössä: '+controlModeName();
  });
}
customTrainBtn.addEventListener('click',trainCustomControlFromSettings);

devModeBtn.addEventListener('click',()=>{
  setDeveloperModeOpen(!developerModeOpen);
});

qualityBonusSlider.addEventListener('input',()=>{
  qualityBonusThreshold=(Number(qualityBonusSlider.value)||70)/100;
  saveQualityDevSettings();
  updateQualityDevUi();
});

qualityTestSlider.addEventListener('input',updateQualityTestPreview);

qualityTestBtn.addEventListener('click',()=>{
  updateQualityTestPreview();
  const previewPoints=soundQualityBonusPoints((Number(qualityTestSlider.value)||0)/100);

  qualityTestResult.classList.remove('test-pop');
  void qualityTestResult.offsetWidth;
  qualityTestResult.classList.add('test-pop');

  // Kehittäjätesti näyttää saman kone- ja tähtiefektin,
  // mutta ei lisää oikeita pisteitä eikä tähtilaskuria.
  showQualityVisualFeedback(previewPoints,{preview:true});
});

qualityTestResult.addEventListener('animationend',()=>{
  qualityTestResult.classList.remove('test-pop');
});
document.addEventListener('keydown',(event)=>{
  if(event.key!=='Escape')return;
  if(helpOverlay.classList.contains('show'))closeInstrumentHelp();
  else if(settingsOverlay.classList.contains('show'))closeSettings();
});
replayBtn.addEventListener('click',async()=>{
  finishOverlay.style.display='none';
  beginGame();
  await startEngineAudioFromBeginning();
});
finishBtn.addEventListener('click',()=>{
  finishOverlay.style.display='none';
  clearCollectibles();
  clearObstacles();
  startOverlay.style.display='flex';
  startError.textContent='';
  setStartButtonDisabled(false);
  gameTimer.textContent='1:30';
  gameTimer.classList.remove('warning','urgent');
});
$('#refreshBtn').addEventListener('click',async()=>{
  const btn=$('#refreshBtn');
  if(btn.classList.contains('updating'))return;
  btn.classList.add('updating');
  btn.disabled=true;
  try{
    if('caches' in window){
      const keys=await caches.keys();
      await Promise.all(keys.map(key=>caches.delete(key)));
    }
    if('serviceWorker' in navigator){
      const regs=await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(reg=>reg.update().catch(()=>null)));
    }
  }finally{
    const url=new URL(location.href);
    url.searchParams.set('_refresh',Date.now().toString());
    location.replace(url.href);
  }
});
$('#recalBtn').addEventListener('click',async()=>{if(analyser)await calibrateWithAllGameAudioMuted()});

// iOS voi keskeyttää Web Audio -kontekstin väliaikaisesti sovelluksen vaihtaessa tilaa.
// Palautetaan sama jo käyttäjän Start-painalluksella avattu konteksti näkyviin palatessa.
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible')void ensureAudioContextRunning();
});
window.addEventListener('pageshow',()=>{void ensureAudioContextRunning()});

void preloadStartupAssets();

clearRecognition();
ensureQualitySparkles();
renderQualityStarCount();
renderDurationBonusCount();
updateSettingsUi();
updateQualityDevUi();
setDeveloperModeOpen(false);
applyResponsiveVisualScale();
})();

// PWA / päivitys
if (location.search.includes('_refresh=')) {
  const cleanUrl=new URL(location.href);
  cleanUrl.searchParams.delete('_refresh');
  history.replaceState(null,'',cleanUrl.pathname+(cleanUrl.search||'')+cleanUrl.hash);
}
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.warn('Service workerin rekisteröinti epäonnistui:', err);
    });
  });
}
