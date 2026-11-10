/* Pelimaailma shared Firebase transport v1. Game adapters validate their own metrics. */
(function(root){
  'use strict';
  const SDK='https://www.gstatic.com/firebasejs/13.2.0/';
  const fail=(message,code)=>Object.assign(new Error(message),{code});
  const validId=id=>typeof id==='string'&&/^[a-z0-9][a-z0-9-]{0,63}$/.test(id);
  const cleanName=value=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().replace(/\s+/g,' ').slice(0,20).replace(/[\uD800-\uDBFF]$/,'');
  const canonical=value=>JSON.stringify(value&&typeof value==='object'&&!Array.isArray(value)?Object.fromEntries(Object.keys(value).sort().map(key=>[key,JSON.parse(canonical(value[key]))])):value);
  function configured(config){return Boolean(config&&['apiKey','projectId','appId'].every(key=>typeof config[key]==='string'&&config[key].trim()&&!/^(YOUR_|LISAA_|REPLACE_)/.test(config[key])));}
  function bounded(promise,ms=12000){let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(fail('Yhteys ei vastannut ajoissa. Yritä uudelleen.','timeout')),ms)})]).finally(()=>clearTimeout(timer));}
  async function loadSdk(){const modules=await Promise.all(['app','auth','firestore'].map(name=>import(SDK+'firebase-'+name+'.js')));return Object.assign({},...modules);}
  function message(error){
    const code=String(error?.code||'');
    if(code==='setup-required')return 'Pelimaailman tulospalvelua ei ole vielä yhdistetty.';
    if(code.includes('permission-denied'))return 'Pelimaailman tietokantasäännöt eivät vielä salli tätä toimintoa.';
    if(code.includes('failed-precondition'))return 'Tulostaulun tietokantaindeksi puuttuu tai valmistuu vielä.';
    if(code.includes('operation-not-allowed'))return 'Pelimaailman anonyymi kirjautuminen pitää ottaa käyttöön.';
    if(code.includes('invalid-api-key')||code.includes('project-not-found'))return 'Pelimaailman Firebase-asetukset on tarkistettava.';
    if(code.startsWith('invalid-')||['id-conflict','timeout','auth-required'].includes(code))return error.message;
    return 'Yhteys tulospalveluun ei onnistunut. Tarkista verkkoyhteys ja yritä uudelleen.';
  }
  class Client{
    constructor(config,loader=loadSdk){this.config=config;this.loader=loader;this.connection=null;this.inflight=new Map();}
    async connect(){
      if(!configured(this.config))throw fail(message({code:'setup-required'}),'setup-required');
      if(!this.connection)this.connection=(async()=>{
        const sdk=await this.loader(),appName='pelimaailma';
        const app=sdk.getApps().find(item=>item.name===appName)||sdk.initializeApp(this.config,appName);
        if(app.options?.projectId&&app.options.projectId!==this.config.projectId)throw fail('Pelimaailman projektiasetus on vaihtunut. Lataa sivu uudelleen.','invalid-project');
        const auth=sdk.getAuth(app);await auth.authStateReady();if(!auth.currentUser)await sdk.signInAnonymously(auth);
        return {sdk,auth,db:sdk.getFirestore(app)};
      })().catch(error=>{this.connection=null;throw error});
      return this.connection;
    }
    async saveScore({gameId,boardId,clientScoreId,playerName,instrumentName,payload}){
      const name=cleanName(playerName);
      if(!validId(gameId)||!validId(boardId))throw fail('Pelin tai tulostaulun tunniste ei kelpaa.','invalid-game');
      if(!/^[A-Za-z0-9-]{20,64}$/.test(clientScoreId))throw fail('Tuloksen tunniste ei kelpaa.','invalid-id');
      if(!name)throw fail('Kirjoita nimimerkki.','invalid-name');
      if(typeof instrumentName!=='string'||!instrumentName||instrumentName.length>30)throw fail('Valitse soitin.','invalid-instrument');
      if(!payload||!Number.isFinite(payload.rankValue)||!Number.isFinite(payload.scoreValue)||typeof payload.scoreUnit!=='string'||!payload.scoreUnit||payload.scoreUnit.length>20)throw fail('Tulostiedot eivät kelpaa.','invalid-result');
      if(['gameId','boardId','clientScoreId','uid','playerName','instrumentName','createdAt'].some(key=>key in payload))throw fail('Tuloksessa on varattu kenttä.','invalid-result');
      const data=JSON.parse(JSON.stringify(payload)),key=gameId+':'+clientScoreId;
      const signature=canonical({data,boardId,playerName:name,instrumentName});
      if(this.inflight.has(key)&&this.inflight.get(key).signature!==signature)throw fail('Tämän kierroksen tallennus on jo kesken eri tiedoilla.','id-conflict');
      if(!this.inflight.has(key)){
        const saving=(async()=>{
          const {sdk,auth,db}=await this.connect();if(!auth.currentUser)throw fail('Kirjautuminen katkesi. Lataa sivu uudelleen.','auth-required');
          const uid=auth.currentUser.uid,id=uid+'_'+gameId+'_'+clientScoreId;
          const ref=sdk.doc(db,'scores',id);
          const immutable={...data,gameId,boardId,clientScoreId,uid,playerName:name,instrumentName};
          await sdk.runTransaction(db,async tx=>{
            const previous=await tx.get(ref);
            if(previous.exists()){
              const saved=previous.data();if(!Object.entries(immutable).every(([k,v])=>canonical(saved[k])===canonical(v)))throw fail('Tällä tunnisteella on jo eri tulos.','id-conflict');
            }else tx.set(ref,{...immutable,createdAt:sdk.serverTimestamp()});
          });
          return {id,clientScoreId};
        })();
        this.inflight.set(key,{promise:saving,signature});saving.finally(()=>{if(this.inflight.get(key)?.promise===saving)this.inflight.delete(key)}).catch(()=>{});
      }
      return bounded(this.inflight.get(key).promise);
    }
    makeQuery(connection,{gameId,boardId,count=50,recent=false}={}){
      const {sdk,db}=connection;if(!Number.isInteger(count)||count<1||count>50)throw fail('Tulosten määrä ei kelpaa.','invalid-limit');
      const constraints=[];
      if(recent){constraints.push(sdk.orderBy('createdAt','desc'));}
      else{
        if(!validId(gameId)||!validId(boardId))throw fail('Valitse peli ja tulostaulu.','invalid-game');
        constraints.push(sdk.where('gameId','==',gameId),sdk.where('boardId','==',boardId),sdk.orderBy('rankValue','desc'));
      }
      return sdk.query(sdk.collection(db,'scores'),...constraints,sdk.limit(count));
    }
    rows(snapshot){return snapshot.docs.map(doc=>({...doc.data(),id:doc.id})).filter(row=>validId(row.gameId)&&validId(row.boardId)&&typeof row.playerName==='string'&&Number.isFinite(row.scoreValue)&&Number.isFinite(row.rankValue)&&typeof row.scoreUnit==='string');}
    async top(options){return bounded((async()=>{const connection=await this.connect();return this.rows(await connection.sdk.getDocsFromServer(this.makeQuery(connection,options)))})());}
    watch(options,onData,onError){
      let closed=false,unsubscribe=null;
      bounded(this.connect()).then(connection=>{
        if(closed)return;
        unsubscribe=connection.sdk.onSnapshot(this.makeQuery(connection,options),{includeMetadataChanges:true},snapshot=>{
          if(!closed)onData(this.rows(snapshot),{fromCache:snapshot.metadata.fromCache});
        },error=>{if(!closed)onError(error)});
      }).catch(error=>{if(!closed)onError(error)});
      return ()=>{closed=true;unsubscribe?.()};
    }
  }
  const api=Object.freeze({Client,configured,cleanName,message});root.Pelimaailma=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
