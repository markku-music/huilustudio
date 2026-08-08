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

async function loadScores(levelId,limit=10){
  if(!init()) throw new Error('Firebase ei latautunut.');
  const snap=await db.collection('scoreboards').doc(String(levelId)).collection('scores')
    .orderBy('timeMs','asc')
    .limit(limit)
    .get();

  return snap.docs.map(doc=>({id:doc.id,...doc.data()}));
}

window.SavelkojuScoreboard={init,saveScore,loadScores,cleanName};
})();