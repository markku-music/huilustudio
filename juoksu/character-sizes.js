/* Visual size preferences only; live changes never reset a race. */
(() => {
  'use strict';
  const KEY='asteikkospurtti-character-sizes-v1';
  const el=id=>document.getElementById(id);
  const valid=n=>Number.isFinite(n)&&n>=.5&&n<=1.8&&Math.abs(n*20-Math.round(n*20))<1e-7;
  let runner=1,monster=1;
  try {
    const saved=JSON.parse(localStorage.getItem(KEY));
    if(valid(saved?.runner))runner=saved.runner;
    if(valid(saved?.monster))monster=saved.monster;
  } catch {}
  function sync() {
    for(const [name,value] of [['runner',runner],['monster',monster]]) {
      const percent=Math.round(value*100);
      el(name+'Size').value=String(percent);
      el(name+'SizeValue').textContent=percent+' %';
    }
  }
  window.characterSizes={
    get runner(){return runner;},
    get monster(){return monster;},
    set(values) {
      const nextRunner=values.runner??runner,nextMonster=values.monster??monster;
      if(!valid(nextRunner)||!valid(nextMonster))throw Error('Hahmon koko: 50–180 %, askel 5 %.');
      runner=nextRunner;monster=nextMonster;
      try{localStorage.setItem(KEY,JSON.stringify({runner,monster}));}catch{}
      sync();
      window.dispatchEvent(new Event('character-size-change'));
    }
  };
  for(const name of ['runner','monster'])el(name+'Size').oninput=()=>{
    window.characterSizes.set({[name]:Number(el(name+'Size').value)/100});
  };
  el('resetCharacterSizes').onclick=()=>window.characterSizes.set({runner:1,monster:1});
  sync();
})();
