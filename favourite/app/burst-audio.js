(function(global){
'use strict';
class BurstAudio{
 constructor(sounds){this.sounds=sounds;this.buffers=[];this.context=null;this.loading=null;this.active=null;this.last=-1;}
 unlock(){
  try{
   if(!this.context){const AC=global.AudioContext||global.webkitAudioContext;if(!AC)return;this.context=new AC();}
   if(this.context.state==='suspended')this.context.resume().catch(()=>{});
   if(!this.loading)this.loading=Promise.all(this.sounds.map(sound=>{const bytes=Uint8Array.from(atob(sound.audio),c=>c.charCodeAt(0));return this.context.decodeAudioData(bytes.buffer);})).then(buffers=>{this.buffers=buffers;}).catch(()=>{this.loading=null;});
  }catch{}
 }
 play(){
  if(!this.buffers.length||this.context?.state!=='running')return 0;
  try{
   this.stop();const choices=this.buffers.map((_,i)=>i).filter(i=>i!==this.last||this.buffers.length===1);
   const index=choices[Math.floor(Math.random()*choices.length)],source=this.context.createBufferSource();
   source.buffer=this.buffers[index];source.connect(this.context.destination);source.onended=()=>{source.disconnect();if(this.active===source)this.active=null;};
   source.start();this.last=index;this.active=source;return source.buffer.duration;
  }catch{return 0;}
 }
 stop(){if(this.active){try{this.active.stop();this.active.disconnect();}catch{}this.active=null;}}
}
global.BurstAudio=BurstAudio;
})(window);
