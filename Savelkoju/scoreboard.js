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


async function signInAdmin(email,password){
  if(!init()) throw new Error('Firebase ei latautunut.');
  const cred=await firebase.auth().signInWithEmailAndPassword(String(email||'').trim(),String(password||''));
  const uid=cred.user.uid;
  const adminDoc=await db.collection('admins').doc(uid).get();
  if(!adminDoc.exists){
    await firebase.auth().signOut();
    throw new Error('Tällä käyttäjällä ei ole admin-oikeuksia.');
  }
  return {uid,email:cred.user.email||''};
}

async function signOutAdmin(){
  if(window.firebase?.auth) await firebase.auth().signOut();
}

async function getCurrentAdmin(){
  if(!init()) return null;
  const user=firebase.auth().currentUser;
  if(!user) return null;
  const adminDoc=await db.collection('admins').doc(user.uid).get();
  return adminDoc.exists ? {uid:user.uid,email:user.email||''} : null;
}

async function deleteCurrentSemesterScores(levelId){
  if(!init()) throw new Error('Firebase ei latautunut.');
  const admin=await getCurrentAdmin();
  if(!admin) throw new Error('Admin-kirjautuminen vaaditaan.');

  const semester=currentSemester();
  const T=firebase.firestore.Timestamp;
  const col=db.collection('scoreboards').doc(String(levelId)).collection('scores');

  const snap=await col
    .where('createdAt','>=',T.fromDate(semester.start))
    .where('createdAt','<',T.fromDate(semester.end))
    .get();

  let deleted=0;
  const docs=snap.docs;

  for(let i=0;i<docs.length;i+=450){
    const batch=db.batch();
    docs.slice(i,i+450).forEach(doc=>batch.delete(doc.ref));
    await batch.commit();
    deleted+=Math.min(450,docs.length-i);
  }
  return deleted;
}


async function updateAdminPassword(newPassword){
  if(!init()) throw new Error('Firebase ei latautunut.');
  const user=firebase.auth().currentUser;
  if(!user) throw new Error('Admin-kirjautuminen vaaditaan.');

  const adminDoc=await db.collection('admins').doc(user.uid).get();
  if(!adminDoc.exists) throw new Error('Tällä käyttäjällä ei ole admin-oikeuksia.');

  const password=String(newPassword||'');
  if(password.length<6) throw new Error('Salasanassa pitää olla vähintään 6 merkkiä.');

  await user.updatePassword(password);
}

window.SavelkojuScoreboard={init,saveScore,loadScores,cleanName,currentSemester,signInAdmin,signOutAdmin,getCurrentAdmin,deleteCurrentSemesterScores,updateAdminPassword};
})();