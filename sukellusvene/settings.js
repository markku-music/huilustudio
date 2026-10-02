(() => {
  'use strict';
  const defaults={startSize:100,startX:0,startY:0,endSize:100,endX:0,endY:0};
  const limits={startSize:[85,150],endSize:[85,150],startX:[-25,25],endX:[-25,25],startY:[-15,45],endY:[-15,45]};
  const key='Sukellusmeri.settings.v1';
  window.SeaSettings={defaults,
    read(){
      const result={...defaults};
      try{
        const saved=JSON.parse(localStorage.getItem(key)||'{}');
        for(const [name,[min,max]] of Object.entries(limits)){
          if(typeof saved[name]==='number'&&Number.isFinite(saved[name]))result[name]=Math.round(Math.max(min,Math.min(max,saved[name])));
        }
      }catch{}
      return result;
    },
    save(settings){try{localStorage.setItem(key,JSON.stringify(settings));}catch{}}
  };
})();
