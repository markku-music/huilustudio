(function(global){
'use strict';
const defaults={"schema":"Nuottiseikkailu.Settings/1","profile":"concert","profilePositions":{"concert":{"noteY":-250,"backgroundY":0,"tunerY":0},"fun":{"noteY":-250,"backgroundY":0,"tunerY":0},"home":{"noteY":-250,"backgroundY":0,"tunerY":0}},"selected":"flute","transpositions":{"flute":0,"clarinet":-2,"sax":-9,"trumpet":-2,"trombone":0},"names":true,"margin":10,"dynamicsCompression":true,"notation":{"noteSize":178,"staffWidth":90,"noteOffsetX":50,"noteOffsetY":-250,"dotSize":14},"effects":{"growthEase":2,"flightSeconds":0.65,"quarter":{"colorStart":0.8,"colorDuration":0.2,"growthStart":1,"growthDuration":0.2},"half":{"colorStart":1.6,"colorDuration":0.2,"growthStart":1.8,"growthDuration":0.2}}};
const copy=x=>JSON.parse(JSON.stringify(x));
function validate(value){
 if(value&&typeof value==='object'&&!Array.isArray(value)&&!Object.hasOwn(value,'profile'))value={...value,profile:defaults.profile};
 if(value&&typeof value==='object'&&!Array.isArray(value)&&!Object.hasOwn(value,'dynamicsCompression'))value={...value,dynamicsCompression:true};
 if(value&&typeof value==='object'&&!Array.isArray(value)&&!Object.hasOwn(value,'notation'))value={...value,notation:copy(defaults.notation)};
 if(value?.notation&&typeof value.notation==='object'&&!Array.isArray(value.notation)&&!Object.hasOwn(value.notation,'noteOffsetX'))value={...value,notation:{...value.notation,noteOffsetX:0}};
 if(value?.notation&&typeof value.notation==='object'&&!Array.isArray(value.notation)&&!Object.hasOwn(value.notation,'noteOffsetY'))value={...value,notation:{...value.notation,noteOffsetY:0}};
 if(value?.notation&&typeof value.notation==='object'&&!Array.isArray(value.notation)&&!Object.hasOwn(value.notation,'dotSize'))value={...value,notation:{...value.notation,dotSize:defaults.notation.dotSize}};
 if(value&&typeof value==='object'&&!Array.isArray(value)&&!Object.hasOwn(value,'profilePositions')){const positions=copy(defaults.profilePositions);for(const p of Object.values(positions))p.noteY=value.notation?.noteOffsetY??defaults.notation.noteOffsetY;value={...value,profilePositions:positions};}
 const object=(x,label)=>{if(!x||typeof x!=='object'||Array.isArray(x))throw Error(label+': tarvitaan JSON-objekti.');};
 const number=(v,min,max,label)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<min-1e-8||v>max+1e-8)throw Error(label+': arvon pitää olla '+min+'–'+max+'.');};
 const keys=(x,allowed,label)=>{object(x,label);for(const key of Object.keys(x))if(!allowed.includes(key))throw Error(label+': tuntematon asetus '+key);for(const key of allowed)if(!(key in x))throw Error(label+': puuttuva asetus '+key);};
 keys(value,Object.keys(defaults),'Asetukset');if(value.schema!==defaults.schema)throw Error('JSONin schema ei ole '+defaults.schema+'.');
 if(!['concert','fun','home'].includes(value.profile))throw Error('Tuntematon taustaprofiili.');
 keys(value.profilePositions,['concert','fun','home'],'Profiilien sijainnit');
 for(const [profile,position] of Object.entries(value.profilePositions)){keys(position,['noteY','backgroundY','tunerY'],profile);for(const [key,v] of Object.entries(position))number(v,-500,500,profile+' '+key);}
 const allowed={flute:[0],clarinet:[-2,-3,0],sax:[-9,-14,-2,-21],trumpet:[-2,0],trombone:[0]};
 if(!Object.hasOwn(allowed,value.selected))throw Error('Tuntematon soitin.');keys(value.transpositions,Object.keys(allowed),'Vireet');for(const key of Object.keys(allowed))if(!allowed[key].includes(value.transpositions[key]))throw Error('Virheellinen vire: '+key);
 if(typeof value.dynamicsCompression!=='boolean')throw Error('dynamicsCompression: käytä true tai false.');
 if(typeof value.names!=='boolean')throw Error('names: käytä true tai false.');number(value.margin,4,10,'Kohinaraja');if(!Number.isInteger(value.margin))throw Error('Kohinarajan on oltava kokonaisluku.');
 keys(value.notation,['noteSize','staffWidth','noteOffsetX','noteOffsetY','dotSize'],'Nuottinäkymä');number(value.notation.noteSize,60,400,'Nuotin koko');number(value.notation.staffWidth,50,100,'Viivaston leveys');number(value.notation.noteOffsetX,-250,250,'Nuotin X-siirto');number(value.notation.noteOffsetY,-500,500,'Nuotin Y-siirto');number(value.notation.dotSize,4,40,'Merkkien koko');
 keys(value.effects,['growthEase','flightSeconds','quarter','half'],'Efektit');number(value.effects.growthEase,1,5,'Kiihtyvyys');number(value.effects.flightSeconds,.15,2,'Osien lentoaika');
 for(const rhythm of ['quarter','half']){
  const e=value.effects[rhythm];
  keys(e,['colorStart','colorDuration','growthStart','growthDuration'],rhythm);
  number(e.colorStart,0,10,'Punastumisen alku');number(e.colorDuration,.05,5,'Punastumisen kesto');number(e.growthStart,.05,20,'Paisumisen alku');number(e.growthDuration,.05,5,'Paisumisen kesto');
  if(e.colorStart+e.colorDuration>e.growthStart+1e-8)throw Error('Punastumisen pitää päättyä ennen paisumista ('+rhythm+').');
 }
 return copy(value);
}
function visual(seconds,e,ease){const clamp=x=>Math.min(1,Math.max(0,x)),red=clamp((seconds-e.colorStart)/e.colorDuration),growth=clamp((seconds-e.growthStart)/e.growthDuration);return{red,growth,scale:1+Math.pow(growth,ease)*1.1,color:`rgb(${Math.round(220*red)}, ${Math.round(38*red)}, ${Math.round(55*red)})`};}
function popTime(rhythm,e){return Math.max(rhythm==='half'?2:1.2,e.growthStart+e.growthDuration);}
global.NoteSettings={defaults,copy,validate,visual,popTime};
})(typeof window==='undefined'?globalThis:window);
