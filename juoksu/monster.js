/* Cosmetic chase only: does not alter pitch recognition, race times or records. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id), ns='http://www.w3.org/2000/svg';
 function node(tag,attrs,parent){const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);parent.appendChild(e);return e;}
 const group=node('g',{'aria-hidden':'true',id:'monster'},$('arenaSvg'));
 // Put the monster behind the runners and their result bubble.
 $('arenaSvg').insertBefore(group,$('playerLayout'));
 const body=node('g',{},group);
 const sprite=node('svg',{viewBox:'0 0 256 256',x:-56,y:-98,width:112,height:112,overflow:'hidden'},body);
 node('image',{href:'assets/monster-sheet.png',width:1024,height:1280},sprite);
 const bubble=node('g',{},group);
 node('rect',{x:-63,y:-115,width:126,height:29,rx:12,fill:'#fffdf5',stroke:'#593976'},bubble);
 node('text',{x:0,y:-95,'text-anchor':'middle','font-size':15,fill:'#593976','font-family':'system-ui'},bubble).textContent='Soita, soita!';
 const LEVELS=[
  {id:'unikeko',name:'Unikeko',bpm:30},
  {id:'tallustelija',name:'Tallustelija',bpm:45},
  {id:'vipeltaja',name:'Vipeltäjä',bpm:60},
  {id:'turbotassu',name:'Turbotassu',bpm:90}
 ];
 const STORAGE='asteikkospurtti-chase-tempo-v1';
 const validBpm=value=>Number.isInteger(value)&&value>=10&&value<=240;
 let enabled=true,selected=0,bpms=LEVELS.map(level=>level.bpm);
 let progress=-105,state='idle',clock=0,startedAt=null,lastBeatDistance=0;
 const timings={idle:[600,180,100,500],run:[110,110,110,110],reach:[120,120,120,120],hop:[150,120,200,150],pant:[350,350,350,350]};
 const rows={idle:0,run:1,reach:2,hop:3,pant:4};
 try{
  const saved=JSON.parse(localStorage.getItem(STORAGE));
  if(saved){
   enabled=saved.enabled!==false;
   const choice=LEVELS.findIndex(level=>level.id===saved.level);
   if(choice>=0)selected=choice;
   bpms=LEVELS.map((level,i)=>validBpm(saved.bpms?.[i])?saved.bpms[i]:level.bpm);
  }else{
   const old=JSON.parse(localStorage.getItem('asteikkospurtti-chase-v1'));
   if(old)enabled=old.enabled!==false;
  }
 }catch{}
 function sync(){
  $('chaseEnabled').checked=enabled;
  group.style.display=enabled?'':'none';
  $('again').parentElement.classList.toggle('chase-off',!enabled);
  LEVELS.forEach((level,i)=>{
   $('level-'+level.id).setAttribute('aria-pressed',String(i===selected));
   $('tempo-'+level.id).value=String(bpms[i]);
  });
 }
 function save(){try{localStorage.setItem(STORAGE,JSON.stringify({enabled,level:LEVELS[selected].id,bpms}));}catch{}}
 $('chaseEnabled').onchange=()=>{enabled=$('chaseEnabled').checked;sync();save();reset();};
 LEVELS.forEach((level,i)=>{
  $('level-'+level.id).onclick=()=>{
   if(selected===i&&enabled)return;
   selected=i;enabled=true;sync();save();reset();
  };
  $('tempo-'+level.id).onchange=()=>{
   const value=Number($('tempo-'+level.id).value);
   if(!validBpm(value)){
    $('chaseTempoStatus').textContent='Anna kokonaisluku väliltä 10–240 BPM.';
    $('tempo-'+level.id).value=String(bpms[i]);return;
   }
   if(value===bpms[i])return;
   bpms[i]=value;sync();save();reset();
   $('chaseTempoStatus').textContent=level.name+': '+value+' BPM tallennettu.';
  };
 });
 // One beat travels one note interval at constant speed.
 // Only the leg animation follows beat phases; travel never eases at a beat.
 function beatDistance(beats){
  return 120*beats;
 }
 function setState(next){if(next!==state){state=next;clock=0;}}
 window.monsterChase={
  reset(){progress=-105;state='idle';clock=0;startedAt=null;lastBeatDistance=0;bubble.style.display='none';},
  update({now,dt,phase,playerPath,direction,startPath,trackX,facingAt}){
   if(!enabled){group.style.display='none';return;}
   group.style.display='';
   const sign=direction==='down'?-1:1;
   const playerProgress=Math.max(0,(playerPath-startPath)*sign);
   let beats=0;
   if(phase==='racing'){
    if(startedAt===null)startedAt=now;
    beats=Math.max(0,now-startedAt)*bpms[selected]/60000;
    const distance=beatDistance(beats);
    const advance=Math.max(0,distance-lastBeatDistance);
    lastBeatDistance=distance;
    const limit=playerProgress-65;
    // Discard blocked movement: no accumulated leap after being caught.
    progress=Math.min(progress+advance,limit);
    const gap=playerProgress-progress;
    setState(gap<=65.1?'hop':gap<120?'reach':'run');
   }else if(phase==='finished')setState('pant');
   else if(phase!=='paused'){progress=-105;startedAt=null;lastBeatDistance=0;setState('idle');}
   if(phase!=='paused')clock+=Math.max(0,dt);
   const times=timings[state],total=times.reduce((a,b)=>a+b,0);let t=clock%total,frame=0;
   while(frame<times.length-1&&t>=times[frame])t-=times[frame++];
   if(phase==='racing'&&(state==='run'||state==='reach'))frame=Math.floor((beats%1)*4);
   sprite.setAttribute('viewBox',`${frame*256} ${rows[state]*256} 256 256`);
   const path=startPath+sign*progress;
   const layout=window.raceLayout,scale=(layout?.runnerHeight||78)/78;
   const pos=Math.max(48*scale,Math.min(1100-48*scale,trackX(path)));
   group.setAttribute('transform',`translate(${pos} ${layout?.playerY||358}) scale(${scale})`);
   body.setAttribute('transform',`scale(${facingAt(path)} 1)`);
   bubble.style.display=state==='hop'?'':'none';
  }
 };
 sync();
})();
