'use strict';
// Import earlier calibration on first use and store animated settings separately.
const ASETUSAVAIN='tonttupolku.leukakoe.v9';
const AVAINRUUDUT_V8='tonttupolku.leukakoe.v8';
const AVAINRUUDUT_V7='tonttupolku.leukakoe.v7';
const VANHA_ASETUSAVAIN='tonttupolku.nosturi.v1';
const SAADOT=[
  {group:'crane',key:'offsetY',label:'Nosturin korkeus',unit:'px',min:-80,max:80,step:1,initial:0},
  {group:'crane',key:'rotationDeg',label:'Nosturin kierto',unit:'°',min:-45,max:45,step:.1,initial:0},
  {group:'shadow',key:'offsetY',label:'Reen varjon Y-siirto',unit:'px',min:-50,max:50,step:1,initial:0},
  {group:'jaws',key:'offsetX',label:'Leukojen X-siirto levossa',unit:'px',min:-60,max:60,step:.5,initial:0,since:5},
  {group:'jaws',key:'openWidth',label:'Avoimien leukojen vähimmäisleveys',unit:'px',min:0,max:200,step:.1,initial:88},
  {group:'stack',key:'offsetX',label:'Pinon X-siirto',unit:'px',min:-120,max:120,step:1,initial:0,since:4},
  {group:'stack',key:'offsetY',label:'Pinon Y-siirto',unit:'px',min:-80,max:24,step:1,initial:0,since:4},
  {group:'stack',key:'depth',label:'Laatan syvyys',unit:'px',min:6,max:46,step:.5,initial:23},
  {group:'stack',key:'skew',label:'Takareunan sivusiirto',unit:'px',min:-24,max:24,step:.5,initial:0},
  {group:'stack',key:'backWidth',label:'Takareunan leveys',unit:'px',min:18,max:62,step:.5,initial:40},
  {group:'pallet',key:'offsetX',label:'Lavan X-siirto',unit:'px',min:-120,max:120,step:1,initial:0,since:4},
  {group:'pallet',key:'offsetY',label:'Lavan Y-siirto',unit:'px',min:-80,max:24,step:1,initial:0,since:4},
  {group:'pallet',key:'shadowX',label:'Lavan varjon X-siirto',unit:'px',min:-60,max:60,step:1,initial:0,since:6},
  {group:'pallet',key:'shadowY',label:'Lavan varjon Y-siirto',unit:'px',min:-50,max:50,step:1,initial:0,since:6},
];
function oletusAsetukset(){
  return {
    version:9,
    crane:{offsetY:17,rotationDeg:1.5},
    jaws:{offsetX:1,openWidth:53},
    shadow:{offsetY:14},
    stack:{offsetX:32,offsetY:-29,depth:6,skew:-5,backWidth:36},
    pallet:{offsetX:29,offsetY:-33,shadowX:0,shadowY:-3}
  };
}
// Older files omit controls that did not exist yet. Use their original geometry.
function aiemmatOletusAsetukset(){
  const config={version:9,crane:{},jaws:{},shadow:{},stack:{},pallet:{}};
  for(const s of SAADOT)config[s.group][s.key]=s.initial;
  return config;
}
function lueAsetukset(text,upgradeStoredDefaults=false){
  let obj;
  try{obj=JSON.parse(text)}catch{throw Error('Tarkista JSONin kirjoitusasu.')}
  if(![1,2,3,4,5,6,7,8,9].includes(obj?.version))throw Error('Asetustiedoston version täytyy olla väliltä 1–9.');
  const legacy=obj.version===1;
  const config=aiemmatOletusAsetukset();
  for(const s of SAADOT){
    if(legacy&&s.group==='shadow'&&obj.shadow===undefined)continue;
    if(obj.version<3&&s.group==='stack'&&obj.stack===undefined)continue;
    const value=obj[s.group]?.[s.key];
    if(obj.version<s.since&&value===undefined)continue;
    if(!Number.isFinite(value)||value<s.min||value>s.max)
      throw Error(s.label+' vaatii lukuarvon väliltä '+s.min+' … '+s.max+' '+s.unit+'.');
    const snapped=Math.round(value/s.step)*s.step;
    if(Math.abs(snapped-value)>1e-7)throw Error(s.label+' säädetään '+s.step.toLocaleString('fi-FI')+' '+s.unit+' askelin.');
    config[s.group][s.key]=Number(snapped.toFixed(1));
  }
  // Keep the v1 to v2 storage migration independent of the current preset.
  if(legacy&&upgradeStoredDefaults&&config.jaws.openWidth===53)config.jaws.openWidth=88;
  return config;
}
function kaytetytAsetukset(){
  try{return lueAsetukset(localStorage.getItem(ASETUSAVAIN)??localStorage.getItem(AVAINRUUDUT_V8)??localStorage.getItem(AVAINRUUDUT_V7)??localStorage.getItem(VANHA_ASETUSAVAIN),true)}catch{return oletusAsetukset()}
}
let nosturinAsetukset=kaytetytAsetukset();
const KIERTOAKSELI={x:-203,y:330};
function nosturinPiste(x,y){
  const {offsetY,rotationDeg}=nosturinAsetukset.crane;
  const a=rotationDeg*Math.PI/180,dx=x-KIERTOAKSELI.x,dy=y-KIERTOAKSELI.y;
  return {x:KIERTOAKSELI.x+Math.cos(a)*dx-Math.sin(a)*dy,
    y:KIERTOAKSELI.y+offsetY+Math.sin(a)*dx+Math.cos(a)*dy};
}
// 0 = open for a slab, 1 = holding it, 2 = folded for travel or waiting.
const LEUKOJEN_LEPOASENTO=2;
function reenVarjoY(){return KIERTOAKSELI.y+nosturinAsetukset.shadow.offsetY}
