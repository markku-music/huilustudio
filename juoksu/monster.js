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
 let enabled=true,speed=35,progress=-105,state='idle',clock=0,lastPlayerProgress=0;
 const timings={idle:[600,180,100,500],run:[110,110,110,110],reach:[120,120,120,120],hop:[150,120,200,150],pant:[350,350,350,350]};
 const rows={idle:0,run:1,reach:2,hop:3,pant:4};
 try{const saved=JSON.parse(localStorage.getItem('asteikkospurtti-chase-v1'));if(saved){enabled=saved.enabled!==false;if(Number.isFinite(saved.speed))speed=Math.max(10,Math.min(100,saved.speed));}}catch{}
 $('chaseEnabled').checked=enabled;$('chaseSpeed').value=speed;
 function sync(){ $('chaseSpeedValue').textContent=speed;group.style.display=enabled?'':'none'; }
 function save(){try{localStorage.setItem('asteikkospurtti-chase-v1',JSON.stringify({enabled,speed}));}catch{}}
 $('chaseEnabled').onchange=()=>{enabled=$('chaseEnabled').checked;sync();save();reset();};
 $('chaseSpeed').oninput=()=>{speed=Number($('chaseSpeed').value);sync();save();reset();};
 function setState(next){if(next!==state){state=next;clock=0;}}
 window.monsterChase={
  reset(){progress=-105;state='idle';clock=0;lastPlayerProgress=0;bubble.style.display='none';},
  update({dt,phase,playerPath,sprinting=false,direction,startPath,trackX,facingAt}){
   if(!enabled){group.style.display='none';return;}
   group.style.display='';
   const sign=direction==='down'?-1:1;
   const playerProgress=Math.max(0,(playerPath-startPath)*sign);
   const playerDelta=Math.max(0,playerProgress-lastPlayerProgress);
   lastPlayerProgress=playerProgress;
   // Follow the actual eased motion, including sound-driven stopping.
   const boost=sprinting?playerDelta*.65:0;
   const chasing=phase==='racing'||(phase==='finished'&&boost>0);
   if(chasing){
    const limit=playerProgress-65;
    progress=Math.min(progress+speed*Math.max(0,dt)/1000+boost,limit);
    const gap=playerProgress-progress;
    setState(gap<=65.1?'hop':gap<120?'reach':'run');
   }else if(phase==='finished')setState('pant');
   else if(phase!=='paused'){progress=-105;setState('idle');}
   if(phase!=='paused')clock+=Math.max(0,dt)*(chasing&&boost>0?1.8:1);
   const times=timings[state],total=times.reduce((a,b)=>a+b,0);let t=clock%total,frame=0;
   while(frame<times.length-1&&t>=times[frame])t-=times[frame++];
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
