/* Mehulasit: game adapter for the shared Pelimaailma service. No microphone or game-loop dependencies. */
(function(root){
  'use strict';
  const BOARD_ID='yin12-continuous-v1';
  const NOTES=['G','A','H','C','D'];
  const INSTRUMENTS=Object.freeze(['Huilu','Saksofoni','Klarinetti','Trumpetti','Käyrätorvi','Pasuuna']);
  const fail=(message,code)=>Object.assign(new Error(message),{code});
  function cleanName(value){return String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().replace(/\s+/g,' ').slice(0,20).replace(/[\uD800-\uDBFF]$/,'');}
  function newId(){
    if(root.crypto?.randomUUID)return root.crypto.randomUUID();
    if(root.crypto?.getRandomValues){const bytes=root.crypto.getRandomValues(new Uint8Array(16));return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');}
    return Date.now().toString(36)+Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2);
  }
  function snapshot(result){
    if(!result||result.rulesVersion!=='mehulasit-score-v1'||result.engineVersion!=='yin-bench-1.2'||result.playMode!=='continuous-v1')throw fail('Tämä tulos kuuluu eri peliversioon.','invalid-result');
    const calculated=root.MehulasitScore.calculate(result.durationMs,result.breaths);
    if(!calculated||result.durationMs<24900||result.durationMs>86400000)throw fail('Tulos on keskeneräinen tai sen aika ei kelpaa.','invalid-result');
    const settings=result.engineSettings,defaults=root.MehulasitEngine.DEFAULTS;
    if(!settings||Object.keys(defaults).some(key=>key!=='gateDb'&&settings[key]!==defaults[key])||!Number.isFinite(settings.gateDb)||settings.gateDb< -70||settings.gateDb> -20)throw fail('Tunnistusasetukset eivät vastaa tulostaulun sääntöjä.','invalid-result');
    if(!Number.isFinite(result.sampleRate)||result.sampleRate<8000||result.sampleRate>384000)throw fail('Näytetaajuus puuttuu.','invalid-result');
    if(NOTES.some(key=>!Number.isFinite(result.noteSeconds?.[key])||result.noteSeconds[key]<0||result.noteSeconds[key]>result.durationMs/1000||result.targets?.[key]!==root.MehulasitEngine.TARGETS[key]))throw fail('Lasikohtaiset tulostiedot eivät kelpaa.','invalid-result');
    return Object.freeze({timeMs:calculated.durationMs,points:calculated.points,rawPoints:calculated.rawPoints,timePoints:calculated.timePoints,breathPoints:calculated.breathPoints,
      breathTotal:calculated.breathTotal,breaths:{...calculated.breaths},noteSeconds:{...result.noteSeconds},
      rulesVersion:calculated.rulesVersion,engineVersion:result.engineVersion,playMode:result.playMode,gameVersion:String(result.gameVersion),
      sampleRate:result.sampleRate,engineSettings:{...settings},targets:{...result.targets}});
  }
  class Client{
    constructor(config,loader){this.shared=new root.Pelimaailma.Client(config,loader);}
    async save(result,playerName,instrumentName,clientScoreId){
      const data=snapshot(result);
      if(!INSTRUMENTS.includes(instrumentName))throw fail('Valitse soitin.','invalid-instrument');
      return this.shared.saveScore({gameId:'mehulasit',boardId:BOARD_ID,clientScoreId,playerName,instrumentName,
        payload:{...data,rankValue:data.rawPoints,scoreValue:data.points,scoreUnit:'pistettä'}});
    }
    async list(){return this.shared.top({gameId:'mehulasit',boardId:BOARD_ID,count:50});}
  }
  const message=error=>root.Pelimaailma.message(error);
  const api=Object.freeze({Client,BOARD_ID,INSTRUMENTS,cleanName,newId,snapshot,message});
  root.MehulasitBoard=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
