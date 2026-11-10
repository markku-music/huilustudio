/* Mehulasit scoring v1. Keep this rule version stable for comparable results. */
(function(root){
  'use strict';
  const RULES=Object.freeze({version:'mehulasit-score-v1',
    notes:Object.freeze(['G','A','H','C','D']),targetSeconds:25,targetBreaths:5,
    timeWeight:.5,breathWeight:.5,maxPoints:100});

  function calculate(durationMs,breaths){
    if(!Number.isFinite(durationMs)||durationMs<=0||!breaths)return null;
    const counts={};
    for(const key of RULES.notes){
      if(!Number.isSafeInteger(breaths[key])||breaths[key]<1)return null;
      counts[key]=breaths[key];
    }
    const breathTotal=Object.values(counts).reduce((sum,n)=>sum+n,0);
    if(!Number.isSafeInteger(breathTotal))return null;
    const timePoints=Math.min(100,100*RULES.targetSeconds/(durationMs/1000));
    const breathPoints=Math.min(100,100*RULES.targetBreaths/breathTotal);
    const rawPoints=timePoints*RULES.timeWeight+breathPoints*RULES.breathWeight;
    return Object.freeze({rulesVersion:RULES.version,points:Math.round(rawPoints),
      rawPoints,timePoints,breathPoints,durationMs,breathTotal,breaths:Object.freeze(counts)});
  }

  const api=Object.freeze({RULES,calculate});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.MehulasitScore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
