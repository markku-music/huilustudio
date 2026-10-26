// Run: node tests/regression.cjs
// Tests actual app functions in a simulated DOM/audio environment. No real microphone.
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const app=fs.readFileSync(path.join(root,'app/js/app.js'),'utf8');
const engine=fs.readFileSync(path.join(root,'app/js/resonator-engine.js'),'utf8');
const worker=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const tests=[];
const test=(name,run)=>tests.push({name,run});
class Classes {
 constructor(){this.values=new Set()}
 add(...xs){xs.forEach(x=>this.values.add(x))}
 remove(...xs){xs.forEach(x=>this.values.delete(x))}
 contains(x){return this.values.has(x)}
 toggle(x,on){if(on??!this.contains(x))this.add(x);else this.remove(x)}
}
const hooks=`
window.__tests={
 beginGame,gameLoop,spawnCollectible,processDualFrame,bouncePlaneFromRock,setRoute,
 completeGameFinish,startMic,stopMic,startFluteGame,loadControlSettings,saveControlSettings,
 isAcceptedOpenHeadjoint,trainCustomControlFromStart,trainDualFromStart,
 trainCustomControlFromSettings,trainDualFromSettings,validStoredRef,
 state:()=>({gameRunning,ctx,stream,timer,analyser,engineGain,engineChainConnected,controlMode,
   savedSingleControlRef,dualControlRef,trainedControlRef,usingBuiltInControlRef,dualCommittedAction,dualPendingAction,
   currentRoute,qualityStarsTotal,durationBonusesTotal,score,collectibles}),
 placeCollectible(){
  spawnCollectible();const item=collectibles[0];
  planeY=routeY(item.lane);routeTransitionTargetY=planeY;item.x=planeXPosition()+10;
  return item;
 },
 prepareDual(committed=null){
  beginGame();controlMode='dual';planeY=31;currentRoute='high';routeTransitionTargetY=31;
  dualCommittedAction=committed;bouncePlaneFromRock();
 },
 input(action){dualLatestAction=action;dualLatestAcceptedAt=performance.now();processDualFrame(performance.now())},
 setDual(){dualControlRef={upHz:440,downHz:415.3047};controlMode='dual'},
 oldActiveTraining(){
  trainedControlRef={f0:440};usingBuiltInControlRef=false;controlMode='dual';
  dualCommittedAction='UP';dualPendingAction='DOWN';
 },
 successfulSamples(kind){
  if(kind==='single')captureAutomaticTrainingSample=async()=>({f0:466.1638,fp8:[1,0,0,0,0,0,0,0]});
  else captureDualTrainingSample=async direction=>direction==='up'?523.2511:466.1638;
 },
 failTeaching(kind){
  if(kind==='single')trainControlSound=async()=>{throw new Error('TEST: single teaching failed')};
  else trainDualControlSound=async()=>{throw new Error('TEST: dual teaching failed')};
 }
};
`;
function environment(stored=null){
 let clock=10000,id=0;
 const timers=new Map(),intervals=new Map(),elements=new Map(),contexts=[],streams=[],storage=new Map();
 if(stored)storage.set('lentokone-flute-harmonic-control-v3',JSON.stringify(stored));
 function element(key=''){
  return {key,style:{setProperty(){}},classList:new Classes(),dataset:{},children:[],textContent:'',value:'70',offsetWidth:80,offsetHeight:80,disabled:false,hidden:false,listeners:{},
   appendChild(child){this.children.push(child);child.parent=this},remove(){this.removed=true;if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this)},setAttribute(){},getBoundingClientRect(){return {left:0,top:0,width:80,height:80}},addEventListener(k,fn){this.listeners[k]=fn},querySelector(s){return get(key+' '+s)},querySelectorAll(){return []},get childElementCount(){return this.children.length}};
 }
 function get(s){if(!elements.has(s))elements.set(s,element(s));return elements.get(s)}
 function audioNode(){
  const param=()=>({value:1,cancelScheduledValues(){},setValueAtTime(v){this.value=v},setTargetAtTime(v){this.value=v},linearRampToValueAtTime(v){this.value=v},exponentialRampToValueAtTime(v){this.value=v}});
  return {gain:param(),frequency:param(),Q:param(),playbackRate:param(),connect(){},disconnect(){this.disconnected=true},start(){this.started=true},stop(){this.stopped=true},getFloatTimeDomainData(a){a.fill(0)},getFloatFrequencyData(a){a.fill(-120)},get frequencyBinCount(){return this.fftSize/2}};
 }
 class FakeAudioContext {
  constructor(){this.state='running';this.sampleRate=48000;this.destination=audioNode();contexts.push(this)}
  get currentTime(){return clock/1000}
  resume(){this.state='running';return Promise.resolve()}
  suspend(){this.state='suspended';return Promise.resolve()}
  close(){this.state='closed';return Promise.resolve()}
  createMediaStreamSource(){return audioNode()}
  createAnalyser(){return audioNode()}
  createGain(){return audioNode()}
  createBiquadFilter(){return audioNode()}
  createBufferSource(){return audioNode()}
  createOscillator(){return audioNode()}
  createScriptProcessor(){return audioNode()}
  decodeAudioData(){return Promise.resolve({duration:1})}
 }
 const sandbox={console,performance:{now:()=>clock},innerWidth:852,innerHeight:393,
  document:{visibilityState:'visible',querySelector:get,querySelectorAll:()=>[],createElement:()=>element(),body:element('body'),documentElement:element('html'),addEventListener(){}},
  navigator:{mediaDevices:{getSupportedConstraints:()=>({}),getUserMedia:async()=>{
   const track={readyState:'live',stop(){this.readyState='ended'}};
   const stream={getTracks:()=>[track],getAudioTracks:()=>[track]};streams.push(stream);return stream;
  }}},
  AudioContext:FakeAudioContext,location:{search:'',href:'https://example.test/game/',replace(){}},history:{replaceState(){}},
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
  Image:class{get complete(){return true}get naturalWidth(){return 10}},
  setTimeout(fn,ms=0){const handle=++id;timers.set(handle,{fn,due:clock+ms});return handle},clearTimeout:id=>timers.delete(id),
  setInterval(fn){const handle=++id;intervals.set(handle,fn);return handle},clearInterval:id=>intervals.delete(id),
  requestAnimationFrame(){},addEventListener(){},URL,EventTarget,CustomEvent,atob,GAME_FX_BASE64:{},ENGINE_AUDIO_BASE64:''};
 sandbox.window=sandbox;vm.createContext(sandbox);vm.runInContext(engine,sandbox);
 const marker='applyResponsiveVisualScale();\n})();';assert(app.includes(marker));
 vm.runInContext(app.replace(marker,'applyResponsiveVisualScale();\n'+hooks+'\n})();'),sandbox);
 async function settle(promise,limit=20000){
  let done=false,result,error;Promise.resolve(promise).then(x=>{done=true;result=x},e=>{done=true;error=e});
  const deadline=clock+limit;
  for(let step=0;step<2000&&!done;step++){
   for(let i=0;i<12;i++)await Promise.resolve();
   if(done)break;
   const next=[...timers.entries()].sort((a,b)=>a[1].due-b[1].due)[0];
   if(next){clock=next[1].due;if(clock>deadline)throw new Error('Test deadline exceeded');timers.delete(next[0]);next[1].fn()}
  }
  assert(done,'Promise did not settle');if(error)throw error;return result;
 }
 return {api:sandbox.__tests,sandbox,get,contexts,streams,storage,intervals,timers,settle,advance:ms=>clock+=ms,now:()=>clock};
}

test('collected rewards are removed after the animation',()=>{
 const e=environment();e.api.beginGame();const item=e.api.placeCollectible();e.api.gameLoop(e.now());
 assert(item.collected);e.advance(200);e.api.gameLoop(e.now());assert(e.api.state().collectibles.includes(item));
 e.advance(120);e.api.gameLoop(e.now());assert(!e.api.state().collectibles.includes(item));assert(item.el.removed);
});
test('dual input blocked by a rock is retried after the lock',()=>{
 const e=environment();e.api.prepareDual();e.api.input('UP');
 assert.equal(e.api.state().dualCommittedAction,null);assert.equal(e.api.state().currentRoute,'low');
 e.advance(600);e.api.input('UP');assert.equal(e.api.state().currentRoute,'high');assert.equal(e.api.state().dualCommittedAction,'UP');
});
test('a held dual input can recover after a forced rock bounce',()=>{
 const e=environment();e.api.prepareDual('UP');e.api.input('UP');assert.equal(e.api.state().currentRoute,'low');
 e.advance(600);e.api.input('UP');assert.equal(e.api.state().currentRoute,'high');
});
test('game finish releases microphone, analysis timer and audio graph',async()=>{
 const e=environment();await e.settle(e.api.startFluteGame());assert(e.api.state().gameRunning);assert.equal(e.streams.length,1);
 e.api.completeGameFinish();assert.equal(e.api.state().ctx,null);assert.equal(e.api.state().stream,null);assert.equal(e.api.state().timer,null);
 assert.equal(e.streams[0].getTracks()[0].readyState,'ended');assert.equal(e.contexts[0].state,'closed');assert.equal(e.intervals.size,0);
});
test('Replay acquires a fresh microphone and rebuilds the audio graph',async()=>{
 const e=environment();await e.settle(e.api.startFluteGame());e.api.completeGameFinish();
 await e.settle(e.get('#replayBtn').listeners.click());
 assert.equal(e.streams.length,2);assert.equal(e.contexts.length,2);assert(e.api.state().gameRunning);assert(e.api.state().engineChainConnected);
 e.api.completeGameFinish();e.get('#finishBtn').listeners.click();assert.equal(e.intervals.size,0);assert.equal(e.get('#startOverlay').style.display,'flex');
});
test('simultaneous microphone opens share one capture',async()=>{
 const e=environment();const a=e.api.startMic(),b=e.api.startMic();assert.equal(a,b);await e.settle(a);assert.equal(e.streams.length,1);e.api.stopMic();
});
test('denied microphone permission closes context and allows retry',async()=>{
 const e=environment();const capture=e.sandbox.navigator.mediaDevices.getUserMedia;
 e.sandbox.navigator.mediaDevices.getUserMedia=async()=>{throw new Error('Permission denied')};
 await assert.rejects(e.settle(e.api.startMic()),/Permission denied/);assert.equal(e.contexts[0].state,'closed');assert.equal(e.api.state().ctx,null);
 e.sandbox.navigator.mediaDevices.getUserMedia=capture;await e.settle(e.api.startMic());assert.equal(e.contexts.length,2);e.api.stopMic();
});
test('a capture arriving after cancellation is stopped',async()=>{
 const e=environment();let resolve;
 e.sandbox.navigator.mediaDevices.getUserMedia=()=>new Promise(r=>resolve=r);
 const pending=e.api.startMic();e.api.stopMic();const track={readyState:'live',stop(){this.readyState='ended'}};
 resolve({getTracks:()=>[track]});await assert.rejects(e.settle(pending),/peruttiin/);assert.equal(track.readyState,'ended');assert.equal(e.intervals.size,0);
});
for(const kind of ['single','dual']){
 test(kind+' teaching failure remains visible and releases capture',async()=>{
  const e=environment();e.api.failTeaching(kind);
  await e.settle(kind==='single'?e.api.trainCustomControlFromSettings():e.api.trainDualFromSettings());
  assert.equal(e.get('#settingsStatus').textContent,'TEST: '+kind+' teaching failed');
  assert(e.get('#settingsOverlay').classList.contains('show'));assert.equal(e.api.state().stream,null);assert.equal(e.intervals.size,0);
 });
 test(kind+' teaching can be cancelled while waiting for a sound',async()=>{
  const e=environment();const button=kind==='single'?'#trainCancelBtn':'#dualTrainCancelBtn';
  e.sandbox.setTimeout(()=>e.get(button).listeners.click(),3000);
  await e.settle(kind==='single'?e.api.trainCustomControlFromStart():e.api.trainDualFromStart());
  assert.equal(e.api.state().stream,null);assert.equal(e.intervals.size,0);assert.equal(e.get('#instrumentFluteBtn').disabled,false);
 });
}
test('overlapping start and teaching actions cannot start two sessions',async()=>{
 const e=environment();const playing=e.api.startFluteGame();
 await e.api.trainDualFromSettings();await e.settle(playing);
 assert(e.api.state().gameRunning);assert.equal(e.streams.length,1);e.api.completeGameFinish();
});
for(const kind of ['single','dual'])test(kind+' cancellation does not hide a later microphone error',async()=>{
 const e=environment();const button=kind==='single'?'#trainCancelBtn':'#dualTrainCancelBtn';
 const train=kind==='single'?e.api.trainCustomControlFromStart:e.api.trainDualFromStart;
 e.sandbox.setTimeout(()=>e.get(button).listeners.click(),3000);await e.settle(train());
 e.sandbox.navigator.mediaDevices.getUserMedia=async()=>{throw new Error('Permission denied after cancel')};
 await e.settle(train());assert.equal(e.get('#startError').textContent,'Permission denied after cancel');
});
test('legacy saved references load without changing default recognition',()=>{
 const e=environment({singleRef:{f0:440,fingerprint:[1,0,0,0,0,0,0]},dualRef:{upHz:440,downHz:415.3047},builtIn:false});
 assert.equal(e.api.state().savedSingleControlRef.f0,440);assert.equal(e.api.state().controlMode,'custom');
 assert.equal(e.api.state().trainedControlRef.f0,837.8248546223447);
 e.api.saveControlSettings();const saved=JSON.parse(e.storage.get('lentokone-flute-harmonic-control-v3'));
 assert.deepEqual(saved.singleRef,{f0:440});assert.equal(saved.dualRef.upHz,440);assert(!('customRef' in saved));
});
test('single-note acceptance keeps the original two MIDI-note bins',()=>{
 const e=environment();const target=Math.round(69+12*Math.log2(e.api.state().trainedControlRef.f0/440));
 for(let midi=0;midi<128;midi++)assert.equal(e.api.isAcceptedOpenHeadjoint({midi}),midi===target||midi===target+1);
 assert(!e.api.validStoredRef({f0:0}));assert(!e.api.validStoredRef({f0:Infinity}));
});
const oldTraining={singleRef:{f0:440},dualRef:{upHz:440,downHz:415.3047},customRef:{f0:440},builtIn:false};
function assertOldTrainingCleared(e){
 const state=e.api.state();
 assert.equal(state.savedSingleControlRef,null);assert.equal(state.dualControlRef,null);
 assert.equal(state.trainedControlRef.f0,837.8248546223447);
 assert.equal(state.usingBuiltInControlRef,true);assert.equal(state.controlMode,'custom');
 assert.equal(state.dualCommittedAction,null);assert.equal(state.dualPendingAction,null);
 assert.deepEqual(JSON.parse(e.storage.get('lentokone-flute-harmonic-control-v3')),{version:4,singleRef:null,dualRef:null});
}
for(const button of ['#instrumentFluteBtn','#startTrainBtn','#startDualTrainBtn']){
 test(button+' clears old training before microphone permission, including failure',async()=>{
  const e=environment(oldTraining);e.api.oldActiveTraining();
  e.storage.set('unrelated-setting','keep');
  e.sandbox.navigator.mediaDevices.getUserMedia=async()=>{
   assertOldTrainingCleared(e);throw new Error('Permission denied');
  };
  await e.settle(e.get(button).listeners.click());
  assertOldTrainingCleared(e);assert.equal(e.storage.get('unrelated-setting'),'keep');
  assert.equal(e.get('#startError').textContent,'Permission denied');assert.equal(e.api.state().gameRunning,false);
  e.api.loadControlSettings();assertOldTrainingCleared(e);
 });
}
test('default menu starts with the built-in sound after an earlier dual lesson',async()=>{
 const e=environment(oldTraining);e.api.oldActiveTraining();
 await e.settle(e.get('#instrumentFluteBtn').listeners.click());
 assertOldTrainingCleared(e);assert.equal(e.api.state().gameRunning,true);e.api.completeGameFinish();
});
for(const kind of ['single','dual']){
 test(kind+' training survives repeated games until a new start-menu choice',async()=>{
  const e=environment();e.api.successfulSamples(kind);
  await e.settle(e.get(kind==='single'?'#startTrainBtn':'#startDualTrainBtn').listeners.click());
  const selection=()=>{
   const s=e.api.state();
   return JSON.stringify({mode:s.controlMode,single:s.trainedControlRef,saved:s.savedSingleControlRef,
     dual:s.dualControlRef,builtIn:s.usingBuiltInControlRef});
  };
  const taught=selection(),saved=e.storage.get('lentokone-flute-harmonic-control-v3');
  for(let round=0;round<2;round++){
   e.api.placeCollectible();e.api.gameLoop(e.now());assert(e.api.state().score>0);
   e.api.completeGameFinish();
   assert.equal(selection(),taught,'Finishing must preserve the active lesson');
   assert.equal(e.api.state().stream,null);assert.equal(e.intervals.size,0);
   await e.settle(e.get('#replayBtn').listeners.click());
   assert.equal(selection(),taught,'Replay must use the same lesson');
   assert.equal(e.api.state().gameRunning,true);assert.equal(e.api.state().score,0);
   assert.equal(e.api.state().engineChainConnected,true);
  }
  assert.equal(e.streams.length,3);assert.equal(e.storage.get('lentokone-flute-harmonic-control-v3'),saved);
  e.api.completeGameFinish();e.get('#finishBtn').listeners.click();
  assert.equal(e.get('#startOverlay').style.display,'flex');assert.equal(e.get('#finishOverlay').style.display,'none');
  assert.equal(selection(),taught,'Returning to the menu alone does not clear teaching');
  assert.equal(e.api.state().stream,null);
  await e.settle(e.get('#instrumentFluteBtn').listeners.click());
  assertOldTrainingCleared(e);assert.equal(e.api.state().gameRunning,true);
  e.api.completeGameFinish();
 });
 test(kind+' menu lesson starts the game with only the newly taught sound',async()=>{
  const e=environment(oldTraining);e.api.oldActiveTraining();e.api.successfulSamples(kind);
  await e.settle(e.get(kind==='single'?'#startTrainBtn':'#startDualTrainBtn').listeners.click());
  const state=e.api.state();assert.equal(state.gameRunning,true);
  assert.equal(e.streams.length,1,'Teaching and playing reuse the same microphone');
  assert.equal(e.contexts.length,1);assert.equal(state.controlMode,kind==='single'?'custom':'dual');
  const saved=JSON.parse(e.storage.get('lentokone-flute-harmonic-control-v3'));
  if(kind==='single'){
   assert.equal(state.trainedControlRef.f0,466.1638);assert.equal(state.usingBuiltInControlRef,false);
   assert.equal(saved.singleRef.f0,466.1638);assert.equal(saved.dualRef,null);
  }else{
   assert.equal(state.dualControlRef.upHz,523.2511);assert.equal(state.dualControlRef.downHz,466.1638);
   assert.equal(saved.dualRef.upHz,523.2511);assert.equal(saved.singleRef,null);
  }
  // A queued second click must not erase the active lesson during a game.
  await e.get('#instrumentFluteBtn').listeners.click();
  assert.equal(e.storage.get('lentokone-flute-harmonic-control-v3'),JSON.stringify(saved));
  e.api.completeGameFinish();assert.equal(e.streams[0].getTracks()[0].readyState,'ended');
 });
 test(kind+' cancellation leaves no earlier training to restore',async()=>{
  const e=environment(oldTraining);e.api.oldActiveTraining();
  e.sandbox.setTimeout(()=>e.get(kind==='single'?'#trainCancelBtn':'#dualTrainCancelBtn').listeners.click(),3000);
  await e.settle(e.get(kind==='single'?'#startTrainBtn':'#startDualTrainBtn').listeners.click());
  assertOldTrainingCleared(e);assert.equal(e.api.state().gameRunning,false);assert.equal(e.api.state().stream,null);
 });
}
test('refresh clears only this installation and updates only its worker',async()=>{
 const e=environment(),deleted=[],updates=[];const scope='https://example.test/game/';
 e.sandbox.caches={keys:async()=>['unrelated','lentokone:https://example.test/other/:6.4.1','lentokone:'+scope+':old'],delete:async k=>deleted.push(k)};
 e.sandbox.navigator.serviceWorker={getRegistration:async url=>({scope:url,update:async()=>updates.push(url)})};
 await e.get('#refreshBtn').listeners.click();assert.deepEqual(deleted,['lentokone:'+scope+':old']);assert.deepEqual(updates,[scope]);
});
function workerEnvironment(){
 const scope='https://example.test/game/',handlers={},deleted=[],requests=[];
 const cache={addAll:async()=>{},match:async()=>undefined,put:async()=>{}};
 const env={console,URL,Promise,self:{registration:{scope},addEventListener:(k,f)=>handlers[k]=f,clients:{claim:async()=>{}},skipWaiting:async()=>{}},
  caches:{keys:async()=>['unrelated','lentokone-pwa-base-6.3.9-selkea-opetus','lentokone:https://example.test/other/:old','lentokone:'+scope+':old','lentokone:'+scope+':6.4.1'],delete:async k=>deleted.push(k),open:async k=>{requests.push(k);return cache}},fetch:async()=>{throw new Error('offline')}};
 vm.createContext(env);vm.runInContext(worker,env);return {scope,handlers,deleted,requests,cache,env};
}
test('worker activation preserves other installations and legacy shared caches',async()=>{
 const w=workerEnvironment();let pending;w.handlers.activate({waitUntil:p=>pending=p});await pending;
 assert.deepEqual(w.deleted,['lentokone:'+w.scope+':old']);
});
test('worker uses its own cache and supports offline navigation',async()=>{
 const w=workerEnvironment(),response={cached:true};w.cache.match=async key=>key===w.scope+'index.html'?response:undefined;
 let pending;w.handlers.fetch({request:{url:w.scope,method:'GET',mode:'navigate'},respondWith:p=>pending=p});
 assert.equal(await pending,response);assert.deepEqual(w.requests,['lentokone:'+w.scope+':6.4.1']);
});
test('worker leaves other paths and origins alone',()=>{
 const w=workerEnvironment();for(const url of ['https://example.test/other/a.js','https://elsewhere.test/a.js']){
  let intercepted=false;w.handlers.fetch({request:{url,method:'GET',mode:'cors'},respondWith(){intercepted=true}});assert(!intercepted);
 }
});
test('all HTML, app-image and precache paths exist',()=>{
 const paths=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(x=>x[1]);
 for(const match of app.matchAll(/['"](app\/assets\/[^'"]+)['"]/g))paths.push(match[1]);
 const shell=worker.slice(worker.indexOf('const APP_SHELL'),worker.indexOf("self.addEventListener('install'"));
 for(const match of shell.matchAll(/'([^']+)'/g))paths.push(match[1]);
 for(const file of paths)assert(fs.existsSync(path.join(root,file)),file);
 for(const match of app.matchAll(/\$\('#([^']+)'\)/g))assert(html.includes('id="'+match[1]+'"'),'Missing element '+match[1]);
});
(async()=>{
 let failed=0;for(const {name,run} of tests){try{await run();console.log('PASS '+name)}catch(error){failed++;console.error('FAIL '+name+'\n'+error.stack)}}
 console.log(`${tests.length-failed}/${tests.length} tests passed`);if(failed)process.exitCode=1;
})();
