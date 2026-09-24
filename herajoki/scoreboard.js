(()=>{
'use strict';

const FIREBASE_CONFIG={
  apiKey:'AIzaSyCHSTODIddId7jxP41X315gx4s-pfQ1l44',
  authDomain:'savelkoju.firebaseapp.com',
  projectId:'savelkoju',
  storageBucket:'savelkoju.firebasestorage.app',
  messagingSenderId:'628559357855',
  appId:'1:628559357855:web:af1896e724516187abbfaa'
};

let db=null;

function init(){
  if(db) return true;
  if(!window.firebase) return false;
  if(!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
  db=firebase.firestore();
  return true;
}

function cleanName(name){
  return String(name||'').trim().replace(/\s+/g,' ').slice(0,20);
}

function currentSemester(now=new Date()){
  const year=now.getFullYear();
  const autumn=now.getMonth()>=7;
  const start=autumn ? new Date(year,7,1,0,0,0,0) : new Date(year,0,1,0,0,0,0);
  const end=autumn ? new Date(year+1,0,1,0,0,0,0) : new Date(year,7,1,0,0,0,0);
  return {
    key:(autumn?'syksy':'kevat')+'-'+year,
    label:(autumn?'Syksy ':'Kevät ')+year,
    start,end
  };
}

async function saveScore({playerName,instrumentName,noteCount,timeMs}){
  if(!init()) throw new Error('Firebase ei latautunut.');
  const name=cleanName(playerName);
  if(!name) throw new Error('Pelaajan nimi puuttuu.');
  const instrument=String(instrumentName||'').trim().slice(0,30);
  const count=Math.round(Number(noteCount));
  const ms=Math.round(Number(timeMs));
  if(!instrument) throw new Error('Soitin puuttuu.');
  if(![3,4,5].includes(count)) throw new Error('Virheellinen sävelten määrä.');
  if(!Number.isFinite(ms) || ms<1000 || ms>600000) throw new Error('Virheellinen aika.');

  const ref=await db.collection('savelkojuScores').add({
    playerName:name,
    instrumentName:instrument,
    noteCount:count,
    timeMs:ms,
    createdAt:firebase.firestore.FieldValue.serverTimestamp()
  });
  return {id:ref.id,playerName:name};
}

async function loadScores(limit=250){
  if(!init()) throw new Error('Firebase ei latautunut.');
  const semester=currentSemester();
  const T=firebase.firestore.Timestamp;
  const snap=await db.collection('savelkojuScores')
    .where('createdAt','>=',T.fromDate(semester.start))
    .where('createdAt','<',T.fromDate(semester.end))
    .get();

  return snap.docs
    .map(doc=>({id:doc.id,...doc.data()}))
    .filter(row =>
      Number.isFinite(Number(row.timeMs)) &&
      [3,4,5].includes(Number(row.noteCount)) &&
      typeof row.instrumentName === 'string'
    )
    .sort((a,b)=>Number(a.timeMs)-Number(b.timeMs))
    .slice(0,Math.max(1,Number(limit)||250));
}

window.SavelkojuScoreboard={
  init,saveScore,loadScores,cleanName,currentSemester
};
})();