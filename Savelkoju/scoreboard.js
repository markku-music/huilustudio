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
  return String(name||'')
    .trim()
    .replace(/\s+/g,' ')
    .slice(0,20);
}

async function saveScore({playerName,levelId,levelName,timeMs}){
  if(!init()) throw new Error('Firebase ei latautunut.');
  const name=cleanName(playerName);
  if(!name) throw new Error('Pelaajan nimi puuttuu.');
  const ms=Math.round(Number(timeMs));
  if(!Number.isFinite(ms) || ms<1000 || ms>600000) throw new Error('Virheellinen aika.');

  const ref=await db.collection('scoreboards').doc(String(levelId)).collection('scores').add({
    playerName:name,
    levelName:String(levelName),
    timeMs:ms,
    createdAt:firebase.firestore.FieldValue.serverTimestamp()
  });
  return {id:ref.id,playerName:name};
}

function currentSemester(now=new Date()){
  const year=now.getFullYear();
  const autumn=now.getMonth()>=7; // elokuu = 7
  const start=autumn ? new Date(year,7,1,0,0,0,0) : new Date(year,0,1,0,0,0,0);
  const end=autumn ? new Date(year+1,0,1,0,0,0,0) : new Date(year,7,1,0,0,0,0);
  return {
    key:(autumn?'syksy':'kevat')+'-'+year,
    label:(autumn?'Syksy ':'Kevät ')+year,
    start,
    end
  };
}

async function loadScores(levelId,limit=10){
  if(!init()) throw new Error('Firebase ei latautunut.');
  const semester=currentSemester();
  const T=firebase.firestore.Timestamp;

  const snap=await db.collection('scoreboards').doc(String(levelId)).collection('scores')
    .where('createdAt','>=',T.fromDate(semester.start))
    .where('createdAt','<',T.fromDate(semester.end))
    .get();

  return snap.docs
    .map(doc=>({id:doc.id,...doc.data()}))
    .filter(row=>Number.isFinite(Number(row.timeMs)))
    .sort((a,b)=>Number(a.timeMs)-Number(b.timeMs))
    .slice(0,limit);
}

window.SavelkojuScoreboard={init,saveScore,loadScores,cleanName,currentSemester};
})();