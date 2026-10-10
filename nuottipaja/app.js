import {songById} from './songs.js';
import {FluteInput} from './microphone.js';
import { parseInvite, inviteChoice } from './invite.js';
import { createUI } from './ui.js';
import { connectFirebase, explainError } from './firebase-service.js';
let selectedRole=null,service=null,room=null,unsubscribe=null,busy=false,closed=false,activeCode=null,cachedNotice=false;
const SESSION='nuottipaja-room-v3';
const pitchQueue=[];let draining=false,restSilence=0,lastRestKey=null;
async function drainPitch(){if(draining)return;if(busy){setTimeout(drainPitch,35);return;}draining=true;while(pitchQueue.length){const item=pitchQueue.shift();if(!room||room.game.revision!==item.revision||room.game.phase!=='play'||room.game.finished.pitch)continue;await action(async()=>{const next=await service.answer(room.code,item.midi,item.revision,room.game.progress.pitch);if(next){room=next;ui.showRoom(next,service.uid);}});}draining=false;}
const microphone=new FluteInput(midi=>{if(room?.game.phase==='play'&&Date.now()>=room.game.startAt&&room.players[service.uid].role==='pitch'&&!room.game.finished.pitch){pitchQueue.push({midi,revision:room.game.revision});drainPitch();}},midi=>{ui.showHeard(midi);if(midi!==null){restSilence=0;return;}const g=room?.game;if(!g||g.phase!=='play'||Date.now()<g.startAt||room.players[service.uid].role!=='pitch'||g.finished.pitch||songById(g.song).notes[g.progress.pitch]?.pitch!==-1){restSilence=0;return;}const key=g.revision+':'+g.progress.pitch;if(!restSilence)restSilence=performance.now();if(performance.now()-restSilence>180&&lastRestKey!==key){lastRestKey=key;pitchQueue.push({midi:-1,revision:g.revision});drainPitch();}});
async function openMicrophone(){await microphone.start();ui.setMicrophone(true);}

let pendingInvite = parseInvite(window.location.href), inviteUnsubscribe = null, inviteEpoch = 0;
function endInvite(clearURL = false) { inviteEpoch++; inviteUnsubscribe?.(); inviteUnsubscribe = null; pendingInvite = null; if (clearURL) { const url = new URL(window.location.href); url.searchParams.delete('pin'); url.searchParams.delete('v'); history.replaceState(null, '', url.href); } }
async function inspectInvite(code, generation = null) {
  endInvite();
  const epoch = inviteEpoch; pendingInvite = {code, generation}; ui.showInvite(code);
  service = await connectFirebase();
  if (epoch !== inviteEpoch) return;
  inviteUnsubscribe = service.watchInvite(code, (state, meta) => {
    if (epoch !== inviteEpoch || meta.fromCache) return;
    ui.showInvite(code, inviteChoice(state, service.uid, generation));
  }, error => { if (epoch === inviteEpoch) ui.showError(explainError(error)); });
}
const storage={get(){try{return sessionStorage.getItem(SESSION);}catch{return null;}},set(code){try{sessionStorage.setItem(SESSION,code);}catch{}},clear(){try{sessionStorage.removeItem(SESSION);}catch{}}};
async function action(fn){if(busy)return;busy=true;ui.setBusy(true);try{await fn();}catch(error){ui.showError(explainError(error));}finally{busy=false;ui.setBusy(false);}}
function endWatch(){pitchQueue.length=0;restSilence=0;lastRestKey=null;microphone.stop();ui.setMicrophone(false);unsubscribe?.();unsubscribe=null;room=null;activeCode=null;}
function activate(state){endInvite(true);endWatch();closed=false;room=state;activeCode=state.code;selectedRole=state.players[service.uid].role;storage.set(state.code);ui.showRoom(state,service.uid);
 unsubscribe=service.watch(state.code,(state,metadata)=>{
  if(closed)return;
  if(!state&&metadata.fromCache)return;
  if(!state||!state.players?.[service.uid]||state.expiresAt<=Date.now()){
    endWatch();storage.clear();ui.showMenu(selectedRole);ui.showNotice('Pelihuone on suljettu tai vanhentunut. Voit luoda uuden pelin.');return;
  }
  room=state;selectedRole=state.players[service.uid].role;if(state.game?.phase==='done'){microphone.stop();ui.setMicrophone(false);}ui.showRoom(state,service.uid);
  if(metadata.fromCache){cachedNotice=true;ui.showNotice('Varmistetaan yhteyttä. Valinnat vahvistetaan verkon kautta.');}
  else if(cachedNotice){cachedNotice=false;ui.showNotice('');}
 },error=>{ui.showError(explainError(error));});
}
const ui=createUI({
 onMicrophone:()=>action(openMicrophone),
 onChooseSong:(song,revision)=>action(async()=>{if(room)await service.choose(room.code,song,revision);}),
 onApprove:revision=>action(async()=>{if(room){if(room.players[service.uid].role==='pitch')await openMicrophone();await service.approve(room.code,revision);}}),
 onAnswer:(value,revision,index)=>action(async()=>{if(room)await service.answer(room.code,value,revision,index);}),
 onRestart:revision=>action(async()=>{if(room){microphone.reset();await service.restart(room.code,revision);}}),
 onRole(role){endInvite(true);selectedRole=role;ui.showMenu(role);},
 onManualJoin(){endInvite(true);ui.showManualJoin();},
 onInspectInvite:code=>action(()=>inspectInvite(code)),
 onBack(){if(!busy){endInvite(true);selectedRole=null;ui.showHome();}},
 onCreate:role=>action(async()=>{service=await connectFirebase();activate(await service.create(role));}),
 onJoin:(code,role)=>action(async()=>{
   service=await connectFirebase();
   try{activate(await service.join(code,role,pendingInvite?.code === code ? pendingInvite.generation : null));}
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
if (pendingInvite) { const invitation = pendingInvite; action(() => inspectInvite(invitation.code, invitation.generation)); }
else if(/^\d{3}$/.test(remembered||''))action(async()=>{
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
