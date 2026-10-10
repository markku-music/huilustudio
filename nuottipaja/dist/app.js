import { createUI } from './ui.js';
import { connectFirebase, explainError } from './firebase-service.js';
let selectedRole=null,service=null,room=null,unsubscribe=null,busy=false,closed=false,activeCode=null,cachedNotice=false;
const SESSION='nuottipaja-room-v1';
const storage={get(){try{return sessionStorage.getItem(SESSION);}catch{return null;}},set(code){try{sessionStorage.setItem(SESSION,code);}catch{}},clear(){try{sessionStorage.removeItem(SESSION);}catch{}}};
async function action(fn){if(busy)return;busy=true;ui.setBusy(true);try{await fn();}catch(error){ui.showError(explainError(error));}finally{busy=false;ui.setBusy(false);}}
function endWatch(){unsubscribe?.();unsubscribe=null;room=null;activeCode=null;}
function activate(state){endWatch();closed=false;room=state;activeCode=state.code;selectedRole=state.players[service.uid].role;storage.set(state.code);ui.showRoom(state,service.uid);
 unsubscribe=service.watch(state.code,(state,metadata)=>{
  if(closed)return;
  if(!state&&metadata.fromCache)return;
  if(!state||!state.players?.[service.uid]||state.expiresAt<=Date.now()){
    endWatch();storage.clear();ui.showMenu(selectedRole);ui.showNotice('Pelihuone on suljettu tai vanhentunut. Voit luoda uuden pelin.');return;
  }
  room=state;selectedRole=state.players[service.uid].role;ui.showRoom(state,service.uid);
  if(metadata.fromCache){cachedNotice=true;ui.showNotice('Varmistetaan yhteyttä. Valinnat vahvistetaan verkon kautta.');}
  else if(cachedNotice){cachedNotice=false;ui.showNotice('');}
 },error=>{ui.showError(explainError(error));});
}
const ui=createUI({
 onRole(role){selectedRole=role;ui.showMenu(role);},
 onBack(){if(!busy){selectedRole=null;ui.showHome();}},
 onCreate:role=>action(async()=>{service=await connectFirebase();activate(await service.create(role));}),
 onJoin:(code,role)=>action(async()=>{
   service=await connectFirebase();
   try{activate(await service.join(code,role));}
   catch(error){if(error.code==='role-taken'){ui.showRoleConflict(code,role);return;}throw error;}
 }),
 onLeave:()=>action(async()=>{if(!service||!room)return;await service.leave(room.code);closed=true;endWatch();storage.clear();selectedRole=null;ui.showHome();ui.showNotice('Poistuit pelihuoneesta.');}),
 onSendPitch:value=>action(async()=>{if(room)await service.send(room.code,'pitch',value,room.round);}),
 onSendDuration:value=>action(async()=>{if(room)await service.send(room.code,'duration',value,room.round);}),
 onReset:()=>action(async()=>{if(room)await service.reset(room.code,room.round);}),
 onChangeRole:role=>action(async()=>{if(room)await service.changeRole(room.code,role);})
});
ui.showHome();
window.addEventListener('offline',()=>ui.showNotice('Verkkoyhteys katkesi. Huone odottaa yhteyden palaamista.'));
window.addEventListener('online',()=>ui.showNotice('Verkko palasi. Yhteys pelihuoneeseen palautuu automaattisesti.'));
const remembered=storage.get();
if(/^\d{6}$/.test(remembered||''))action(async()=>{
 service=await connectFirebase();activeCode=remembered;
 await new Promise((resolve,reject)=>{
   let release,finished=false;
   const timer=setTimeout(()=>{release?.();reject(new Error('restore-timeout'));},15000);
   release=service.watch(remembered,(state,meta)=>{
     if(meta.fromCache)return;if(finished)return;finished=true;clearTimeout(timer);release?.();
     if(state?.players?.[service.uid]&&state.expiresAt>Date.now())activate(state);else storage.clear();resolve();
   },error=>{clearTimeout(timer);release?.();reject(error);});
 });
});
// Refresh keeps the anonymous tab identity and room. Leaving uses the explicit button.
