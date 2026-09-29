(function(global){
'use strict';
class NoteGame {
 constructor(random=Math.random){this.random=random;this.reset();}
 reset(){this.phase='ready';this.queue=[];this.index=0;this.score=0;this.counts={quarter:0,half:0};}
 start(ids){
  if(ids.length<1)throw Error('Sävelvalikoima puuttuu');this.reset();
  const rhythms=[...Array(8).fill('quarter'),...Array(8).fill('half')];
  for(let i=rhythms.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[rhythms[i],rhythms[j]]=[rhythms[j],rhythms[i]];}
  let last=null,bag=[];
  for(const rhythm of rhythms){if(!bag.length)bag=[...ids];let choices=bag.filter(id=>id!==last);if(!choices.length)choices=ids.filter(id=>id!==last);if(!choices.length)choices=ids;const id=choices[Math.floor(this.random()*choices.length)];bag=bag.filter(n=>n!==id);this.queue.push({id,rhythm});last=id;}
  this.phase='playing';
 }
 get task(){return this.queue[this.index]||null;}
 get target(){return this.task?.id||null;}
 collect(){if(this.phase!=='playing')return;this.counts[this.task.rhythm]++;this.score++;this.index++;if(this.index===this.queue.length)this.phase='complete';}
 silence(){}
}
// Time is supplied by the audio blocks (or the pointer test), never animation frames.
class NoteDuration {
 constructor({onGrow=()=>{},onFinish=()=>{},onPop=()=>{}}={}){Object.assign(this,{onGrow,onFinish,onPop});this.reset();}
 reset(blocked=false){this.state=blocked?'blocked':'idle';this.start=null;this.lastValid=null;this.lastLoud=-Infinity;this.quietStart=null;}
 feed(time,{correct=false,wrong=false,loud=false,onset=time,end=time,rhythm='quarter',popAt=null}={}){
  if(!Number.isFinite(time))return;
  if(loud){this.lastLoud=end;this.quietStart=null;}else if(this.quietStart===null)this.quietStart=time;
  if(this.state==='blocked'){
   if(!loud&&time-this.quietStart>=.060)this.reset();return;
  }
  if(this.state==='idle'){
   if(correct){this.state='sounding';this.start=onset;this.lastValid=end;}
   else return;
  }
  if(this.state!=='sounding')return;
  if(wrong){this.state='blocked';this.onFinish('wrong',0);return;}
  if(correct)this.lastValid=end;
  const seconds=Math.max(0,this.lastValid-this.start),goal=rhythm==='half'?1.6:.8,min=goal-.2,burstFloor=rhythm==='half'?2:1.2;
  const burstAt=Math.max(burstFloor,Number.isFinite(popAt)?popAt:burstFloor);
  if(correct&&seconds>=burstAt-1e-8){this.state='blocked';this.onPop(seconds);return;}
  this.onGrow(Math.max(0,Math.min(1,(seconds-goal)/(burstFloor-goal))),seconds);
  if(time-this.lastValid>=.060){
   // A short breath tail may outlast the pitched note. Only wait when the
   // measured pitch duration is already valid; don't count this tail as pitch.
   // Persistent noise still fails, and a confirmed wrong pitch fails above.
   if(loud&&seconds>=min-1e-8&&seconds<burstAt-1e-8&&time-this.lastValid<.120)return;
   this.state=loud?'blocked':'idle';
   // A sustained unrecognized sound cannot count as a clean note ending.
   const result=loud?'unclear':seconds>=burstAt-1e-8?'long':seconds<.2?'tiny':seconds<min-1e-8?'short':'correct';
   this.start=null;this.lastValid=null;this.onFinish(result,seconds);
  }
 }
}
global.NoteGame=NoteGame;global.NoteDuration=NoteDuration;
})(typeof window==='undefined'?globalThis:window);
