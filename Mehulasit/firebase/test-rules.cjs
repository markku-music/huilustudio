const fs=require('node:fs'),assert=require('node:assert/strict');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const sdk=require('firebase/firestore');
require('../Mehulasit/engine.js');require('../Mehulasit/score.js');
require('../yhteiset/pelimaailma-client.js');
const api=require('../Mehulasit/scoreboard.js');
const uid='test-user-001',run='test-round-000000000001';
function round(ms=30000,breaths={G:1,A:1,H:1,C:1,D:1}){
 return {...MehulasitScore.calculate(ms,breaths),engineVersion:'yin-bench-1.2',playMode:'continuous-v1',gameVersion:'1.9',sampleRate:48000,engineSettings:{...MehulasitEngine.DEFAULTS},targets:{...MehulasitEngine.TARGETS},noteSeconds:{G:5,A:5,H:5,C:5,D:5}};
}
(async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-pelimaailma-test',firestore:{host:'127.0.0.1',port:8086,rules:fs.readFileSync(__dirname+'/firestore.rules','utf8')}});
 try{
  const db=env.authenticatedContext(uid).firestore(),anon=env.unauthenticatedContext().firestore();
  const ref=(database,id=run,board=api.BOARD_ID)=>sdk.doc(database,'scores',uid+'_mehulasit_'+id);
  const base=api.snapshot(round());
  const payload={...base,gameId:'mehulasit',boardId:api.BOARD_ID,rankValue:base.rawPoints,scoreValue:base.points,scoreUnit:'pistettä',uid,clientScoreId:run,playerName:'Koepelaaja',instrumentName:'Huilu',createdAt:sdk.serverTimestamp()};
  await assertFails(sdk.setDoc(ref(anon),payload));
  await assertSucceeds(sdk.setDoc(ref(db),payload));
  await assertSucceeds(sdk.getDoc(ref(db)));await assertFails(sdk.getDoc(ref(anon)));
  await assertFails(sdk.updateDoc(ref(db),{playerName:'Muutos'}));await assertFails(sdk.deleteDoc(ref(db)));
  const collection=sdk.collection(db,'scores');
  await assertSucceeds(sdk.getDocs(sdk.query(collection,sdk.orderBy('rawPoints','desc'),sdk.limit(50))));
  await assertFails(sdk.getDocs(collection));await assertFails(sdk.getDocs(sdk.query(collection,sdk.limit(51))));
  await assertFails(sdk.setDoc(ref(db,run+'x','wrong-version'),{...payload,clientScoreId:run+'x',boardId:'wrong-version'}));
  const bad=[{gameId:'lentokone'},{boardId:'wrong-version'},{rankValue:100},{scoreValue:100},{scoreUnit:'sekuntia'},{points:100},{rawPoints:100},{timePoints:100},{breathTotal:1},{breaths:{G:0,A:1,H:1,C:1,D:1}},
    {uid:'another-user'},{timeMs:1},{timeMs:NaN},{playerName:''},{playerName:' '.repeat(5)},
    {playerName:'x'.repeat(21)},{instrumentName:'Invalid'},{extra:true},{playMode:'paused'},
    {engineSettings:{...payload.engineSettings,tolerance:70}},{targets:{...payload.targets,A:440}},
    {createdAt:sdk.Timestamp.fromMillis(1)},{noteSeconds:{...payload.noteSeconds,G:-1}}];
  for(let i=0;i<bad.length;i++){const id=run+'b'+i;await assertFails(sdk.setDoc(ref(db,id),{...payload,clientScoreId:id,...bad[i]}))}
  for(const [i,ms,breaths] of [[0,25000,{G:1,A:1,H:1,C:1,D:1}],[1,34200,{G:2,A:2,H:1,C:1,D:1}],[2,40000,{G:2,A:2,H:2,C:1,D:1}],[3,30000.1234567,{G:1,A:1,H:1,C:1,D:1}]]){
   const id=run+'ok'+i;await assertSucceeds(sdk.setDoc(ref(db,id),{...payload,...api.snapshot(round(ms,breaths)),rankValue:round(ms,breaths).rawPoints,scoreValue:round(ms,breaths).points,clientScoreId:id}));
  }
  // Run the real service through the real Firestore SDK against the emulator.
  let writes=0,connections=0;
  const adapter={...sdk,getApps:()=>[],initializeApp:()=>({}),getAuth:()=>({authStateReady:async()=>{},currentUser:{uid}}),getFirestore:()=>db,
   runTransaction:async(...args)=>{writes++;return sdk.runTransaction(...args)}};
  const config={apiKey:'emulator-only',projectId:'demo-pelimaailma-test',appId:'emulator-only'};
  const client=new api.Client(config,async()=>{connections++;return adapter}),id=run+'client';
  const [first,again]=await Promise.all([client.save(round(),'  Koepelaaja  ','Huilu',id),client.save(round(),'Koepelaaja','Huilu',id)]);
  assert.equal(first.id,again.id);assert.equal(connections,1);assert.equal(writes,1,'Concurrent save is deduplicated');
  await client.save(round(),'Koepelaaja','Huilu',id);assert.equal((await sdk.getDoc(ref(db,id))).data().playerName,'Koepelaaja');
  const listed=await client.list();assert(listed.length===6);assert(listed.every((r,i)=>i===0||listed[i-1].rawPoints>=r.rawPoints));
  await assert.rejects(client.save(round(31000),'Koepelaaja','Huilu',id),e=>e.code==='id-conflict');
  await assert.rejects(client.save({...round(),playMode:'old'},'Koepelaaja','Huilu',run+'old'),e=>e.code==='invalid-result');
  await assert.rejects(client.save(round(),'   ','Huilu',run+'blank'),e=>e.code==='invalid-name');
  // This is a new project: unrelated collections are closed by default.
  await assertFails(sdk.setDoc(sdk.doc(db,'puhallinstarttiScores',uid+'_'+run),{playerName:'Testi',instrumentName:'Huilu',noteCount:5,timeMs:30000,createdAt:sdk.serverTimestamp()}));
  
  // Missing setup never loads Firebase or contacts any project.
  let loads=0;const empty=new Pelimaailma.Client(null,async()=>{loads++;throw Error('should not load')});
  await assert.rejects(empty.top({gameId:'mehulasit',boardId:api.BOARD_ID}),e=>e.code==='setup-required');assert.equal(loads,0);
  // A simultaneous retry cannot silently change the identity or result.
  const pending=client.save(round(),'Koepelaaja','Huilu',run+'concurrent');
  await assert.rejects(client.save(round(),'Eri nimi','Huilu',run+'concurrent'),e=>e.code==='id-conflict');await pending;
  // Cancellation before connection finishes must not attach a listener.
  let listeners=0;const cancelClient=new Pelimaailma.Client(config,async()=>({...adapter,onSnapshot(){listeners++;return ()=>{}}}));
  cancelClient.watch({recent:true,count:20},()=>{},()=>{})();await cancelClient.connect();await new Promise(r=>setTimeout(r,20));assert.equal(listeners,0);
  // Shared latest feed can include another game; individual tops stay separate.
  await env.withSecurityRulesDisabled(async ctx=>{
   await sdk.setDoc(sdk.doc(ctx.firestore(),'scores','future-game-fixture'),{gameId:'lentokone',boardId:'future-v1',playerName:'Muu peli',rankValue:999,scoreValue:999,scoreUnit:'metriä',createdAt:sdk.Timestamp.fromMillis(Date.now()+10000)});
   await sdk.setDoc(sdk.doc(ctx.firestore(),'scores','old-board-fixture'),{gameId:'mehulasit',boardId:'old-v1',playerName:'Vanha versio',rankValue:999,scoreValue:999,scoreUnit:'pistettä',createdAt:sdk.Timestamp.fromMillis(Date.now()+20000)});
  });
  const own=await client.shared.top({gameId:'mehulasit',boardId:api.BOARD_ID,count:3});assert.equal(own.length,3);assert(own.every(r=>r.gameId==='mehulasit'&&r.boardId===api.BOARD_ID));
  const recent=await client.shared.top({recent:true,count:20});assert.equal(recent[0].boardId,'old-v1');assert.equal(recent[1].gameId,'lentokone');
  await new Promise((resolve,reject)=>{let unsubscribe;const timer=setTimeout(()=>{unsubscribe();reject(Error('Listener timeout'))},5000);unsubscribe=client.shared.watch({recent:true,count:20},(rows,meta)=>{if(!meta.fromCache){clearTimeout(timer);unsubscribe();assert.equal(rows[0].boardId,'old-v1');resolve()}},reject)});

  await env.withSecurityRulesDisabled(async ctx=>sdk.setDoc(sdk.doc(ctx.firestore(),'admins',uid),{}));
  await assertSucceeds(sdk.deleteDoc(ref(db)));
  console.log('PASS: Firestore rules compile; valid scores accepted; invalid/unauthenticated/tampered writes denied; read bounds; immutable records; admin deletion; same-round retry deduplication; real client/SDK round trip; sorted board; new project default-deny; missing config no-network; per-game/version isolation; all-game latest feed; realtime listener and cancellation.');
 }finally{await env.cleanup()}
})().catch(e=>{console.error(e);process.exitCode=1});
