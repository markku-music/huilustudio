(() => {
'use strict';
const ns='http://www.w3.org/2000/svg';
const colors=['#3287ff','#00aabd','#31af68','#f4a51c','#a15de8','#ef67a2','#fff8d5'];
const starPath=Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,r=i%2 ? 0.44 : 1;return(i?'L':'M')+(Math.cos(a)*r).toFixed(4)+' '+(Math.sin(a)*r).toFixed(4);}).join(' ')+' Z';
class StaffSparkles {
 constructor(){this.svg=null;this.layer=null;this.stars=[];this.progress=0;this.lastEmit=-Infinity;this.sequence=0;this.glow=null;this.reduced=matchMedia('(prefers-reduced-motion: reduce)');}
 attach(svg){
  if(this.svg===svg)return;
  this.layer?.remove();this.svg=svg;this.stars=[];this.progress=0;this.lastEmit=-Infinity;
  this.layer=document.createElementNS(ns,'g');this.layer.setAttribute('class','staff-sparkles');this.layer.setAttribute('aria-hidden','true');this.layer.setAttribute('pointer-events','none');
  const filter=document.createElementNS(ns,'filter');filter.id='staff-sparkle-glow';filter.setAttribute('x','-20%');filter.setAttribute('y','-20%');filter.setAttribute('width','140%');filter.setAttribute('height','140%');
  this.glow=document.createElementNS(ns,'feDropShadow');this.glow.setAttribute('dx','0');this.glow.setAttribute('dy','0');this.glow.setAttribute('stdDeviation','.4');this.glow.setAttribute('flood-color','#fff7d1');this.glow.setAttribute('flood-opacity','.85');filter.append(this.glow);svg.querySelector('defs').append(filter);this.layer.setAttribute('filter','url(#staff-sparkle-glow)');
  svg.insertBefore(this.layer,svg.querySelector(':scope > .staff-line'));
 }
 clear(){this.stars=[];this.layer?.replaceChildren();this.progress=0;this.lastEmit=-Infinity;}
 setProgress(svg,progress,now=performance.now()){
  this.attach(svg);
  if(progress<=0||this.reduced.matches){this.clear();return;}
  const previous=this.progress;this.progress=progress;
  if(progress>=1&&previous<1)this.emit(progress,now,true);
  else if(progress<1&&progress>previous&&now-this.lastEmit>=45){this.emit(progress,now,false);this.lastEmit=now;}
 }
 emit(progress,now,goal){
  const dots=[...this.svg.querySelectorAll('.staff-duration-dot')];
  for(let i=0;i<dots.length;i++)for(let j=0;j<(goal?4:2);j++){
   const el=document.createElementNS(ns,'path');el.setAttribute('d',starPath);el.setAttribute('class','staff-star');el.dataset.kind=goal?'goal':'trail';el.setAttribute('fill',colors[(this.sequence+i+j)%colors.length]);el.setAttribute('stroke','#3c4058');el.setAttribute('stroke-opacity','.45');el.setAttribute('stroke-width','.14');el.setAttribute('stroke-linejoin','round');
   this.layer.append(el);
   const sign=j%2?1:-1;
   this.stars.push({el,line:i,progress,born:now,life:goal?480:650,size:goal?4.5+Math.random()*3:2.5+Math.random()*3.5,dx:goal?-8-Math.random()*20:-10-Math.random()*14,dy:sign*(goal?10+Math.random()*14:7+Math.random()*12),angle:Math.random()*90-45,spin:sign*(90+Math.random()*90),goal});
  }
  this.sequence++;
  while(this.stars.length>120)this.stars.shift().el.remove();
  this.tick(now);
 }
 tick(now=performance.now()){
  if(!this.svg?.isConnected||this.reduced.matches){if(this.stars.length)this.clear();return;}
  if(!this.stars.length)return;
  const scale=this.svg.getScreenCTM()?.a,units=this.svg.viewBox.baseVal.width;if(!(scale>0))return;
  this.glow?.setAttribute('stdDeviation',1.3/scale);
  const dots=[...this.svg.querySelectorAll('.staff-duration-dot')],inset=Number(dots[0]?.getAttribute('r')||0)+.5/scale;
  this.stars=this.stars.filter(star=>{
   const age=(now-star.born)/star.life;
   if(age>=1){star.el.remove();return false;}
   const dot=dots[star.line];if(!dot){star.el.remove();return false;}
   const drift=Math.sin(age*Math.PI/2);
   const x=inset+Math.max(0,units-2*inset)*star.progress+star.dx*drift/scale,y=Number(dot.getAttribute('cy'))+(star.dy*drift+7*age*age)/scale;
   const radius=star.size*(star.goal?1+.2*age:1-.3*age)/scale;
   star.el.setAttribute('transform',`translate(${x} ${y}) rotate(${star.angle+age*star.spin}) scale(${radius})`);
   star.el.setAttribute('opacity',String((star.goal ? 1 : 0.95)*Math.pow(1-age,.8)));return true;
  });
 }
}
window.StaffSparkles=StaffSparkles;
})();
