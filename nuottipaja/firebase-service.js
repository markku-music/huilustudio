import {chooseSong,approveSong,answerGame,restartGame} from './game-state.js';
import { firebaseConfig, ROOM_COLLECTION } from './firebase-config.js';
import { createRoomState, joinRoomState, changeRoleState, sendAnswerState, resetRoomState, leaveRoomState, RoomError } from './room-state.js';
const SDK_BASE = 'https://www.gstatic.com/firebasejs/10.12.5/';
const scripts = new Map();
function loadScript(file) {
  if (!scripts.has(file)) scripts.set(file, new Promise((resolve,reject) => {
    const script = document.createElement('script'); script.src = SDK_BASE + file; script.crossOrigin = 'anonymous';
    const timer = setTimeout(() => { script.remove(); scripts.delete(file); reject(new RoomError('sdk-timeout','Yhteyden valmistelu kesti liian kauan. Tarkista verkkoyhteys ja yritä uudelleen.')); }, 18000);
    script.onload = () => { clearTimeout(timer); resolve(); };
    script.onerror = () => { clearTimeout(timer); scripts.delete(file); reject(new RoomError('sdk-load','Firebase-yhteys ei latautunut. Tarkista verkkoyhteys.')); };
    document.head.append(script);
  }));
  return scripts.get(file);
}
let initialization = null;
export async function connectFirebase() {
  if (!navigator.onLine) throw new RoomError('offline','Verkkoyhteys puuttuu. Yhdistä verkkoon ja kokeile uudelleen.');
  if (!initialization) initialization = (async () => {
    await loadScript('firebase-app-compat.js');
    await Promise.all([loadScript('firebase-auth-compat.js'), loadScript('firebase-firestore-compat.js')]);
    const app = window.firebase.apps.find(a => a.name === 'nuottipaja') || window.firebase.initializeApp(firebaseConfig, 'nuottipaja');
    const auth = app.auth();
    await auth.setPersistence(window.firebase.auth.Auth.Persistence.SESSION);
    let stop;
    try { await new Promise((resolve,reject) => { const timer = setTimeout(() => reject(new Error('auth-timeout')),15000); stop = auth.onAuthStateChanged(() => {clearTimeout(timer);resolve();},reject); }); }
    finally { stop?.(); }
    const user = auth.currentUser || (await auth.signInAnonymously()).user;
    const db = app.firestore();
    const roomRef = code => db.collection(ROOM_COLLECTION).doc(code);
    const randomCode = () => { const a = new Uint32Array(1); do { crypto.getRandomValues(a); } while(a[0] >= 4294967000); return String(a[0] % 1000).padStart(3,'0'); };
    async function create(role) {
      for(let attempt=0;attempt<100;attempt++) {
        const code=randomCode(); const reference=roomRef(code);
        const state=await db.runTransaction(async tx => {
          const snapshot=await tx.get(reference);
          if(snapshot.exists && snapshot.data().expiresAt > Date.now())return null;
          const fresh=createRoomState(code,user.uid,role,Date.now());tx.set(reference,fresh);return fresh;
        });
        if(state)return state;
      }
      throw new RoomError('code-collision','Vapaan koodin luominen ei onnistunut. Yritä uudelleen.');
    }
    async function transform(code,fn) {
      if(!navigator.onLine)throw new RoomError('offline','Verkkoyhteys puuttuu. Valintaa ei lähetetty.');
      const reference=roomRef(code);
      return db.runTransaction(async tx => {
        const snapshot=await tx.get(reference);const current=snapshot.exists?snapshot.data():null;
        const next=fn(current,Date.now());
        if(next!==current) {if(next===null)tx.delete(reference);else tx.set(reference,next);}
        return next;
      });
    }
    return {
      uid:user.uid,
      choose:(code,song,revision)=>transform(code,(room,now)=>chooseSong(room,user.uid,song,revision,now)),
      approve:(code,revision)=>transform(code,(room,now)=>approveSong(room,user.uid,revision,now)),
      answer:(code,value,revision,index)=>transform(code,(room,now)=>answerGame(room,user.uid,value,revision,index,now)),
      restart:(code,revision)=>transform(code,(room,now)=>restartGame(room,user.uid,revision,now)),
      create,
      join:(code,role,generation)=>transform(code,(room,now)=>{if(generation != null && room?.createdAt !== generation)throw new RoomError('old-invite','Tämä kutsu on vanhentunut. Pyydä parilta uusi QR-koodi.');return joinRoomState(room,user.uid,role,now);}),
      watchInvite:(code,onRoom,onError)=>roomRef(code).onSnapshot({includeMetadataChanges:true},snapshot=>onRoom(snapshot.exists?snapshot.data():null,{fromCache:snapshot.metadata.fromCache}),onError),
      changeRole:(code,role)=>transform(code,(room,now)=>changeRoleState(room,user.uid,role,now)),
      send:(code,kind,value,round)=>transform(code,(room,now)=>sendAnswerState(room,user.uid,kind,value,round,now)),
      reset:(code,round)=>transform(code,(room,now)=>resetRoomState(room,user.uid,round,now)),
      leave:code=>transform(code,(room,now)=>leaveRoomState(room,user.uid,now)),
      watch:(code,onRoom,onError)=>roomRef(code).onSnapshot({includeMetadataChanges:true},snapshot=>onRoom(snapshot.exists?snapshot.data():null,{fromCache:snapshot.metadata.fromCache}),onError)
    };
  })().catch(error=>{initialization=null;throw error;});
  return initialization;
}
export function explainError(error) {
  const code=String(error?.code||'');
  if(code.includes('permission-denied'))return 'Nuottipajan huoneita ei ole vielä sallittu Firebase-projektissa. Avaa käyttöönotto-ohje: tämän sivun osoite + /kayttoonotto.html.';
  if(code.includes('operation-not-allowed')||code.includes('admin-restricted-operation'))return 'Firebase-projektissa pitää ottaa anonyymi kirjautuminen käyttöön.';
  if(code.includes('unauthorized-domain'))return 'Tämän pelisivun osoite pitää sallia Firebase-projektissa.';
  if(code.includes('unavailable')||code.includes('deadline-exceeded'))return 'Yhteys Firebaseen katkesi. Tarkista verkko ja kokeile uudelleen.';
  if(error instanceof RoomError)return error.message;
  return 'Yhteyttä ei saatu valmiiksi. Tarkista verkko ja yritä uudelleen.';
}
