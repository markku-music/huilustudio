(() => {
  'use strict';
  const names=['C','C♯','D','Es','E','F','F♯','G','As','A','B','H'];
  const aliases=['C','C♯ / Des','D','Dis / Es','E','F','Fis / Ges','G','Gis / As','A','Ais / B','H'];
  const subs=['₀','₁','₂','₃','₄'];
  const noteName=midi=>names[midi%12]+subs[Math.floor(midi/12)-4];
  // Same tonic pitches and octave ranges as Asteikkospurtti's scales.js.
  const presets=[['F','F-duuri',65],['G','G-duuri',67],['D1','D-duuri',62],['D2','D-duuri',74],['B','B-duuri',70],['C','C-duuri',72]].map(([id,label,tonic])=>{
    const notes=[0,2,4,5,7,9,11,12].map(n=>tonic+n);
    return {id,label,notes,range:noteName(notes[0])+'–'+noteName(notes[7])};
  });
  const normalize=notes=>Array.isArray(notes)?[...new Set(notes.filter(n=>Number.isInteger(n)&&n>=48&&n<=107))].sort((a,b)=>a-b).slice(0,8):[];
  const validate=value=>{
    const preset=presets.find(p=>p.id===value?.id);
    if(preset)return {id:preset.id,notes:[...preset.notes]};
    const notes=normalize(value?.notes);
    return value?.id==='custom'&&notes.length?{id:'custom',notes}:{id:'F',notes:[...presets[0].notes]};
  };
  window.SeaMusic={presets,noteName,pitchName:midi=>names[midi%12],aliases,normalize,validate,
    level(index,count){return 8-count+index;},
    read(){try{return validate(JSON.parse(localStorage.getItem('Sukellusmeri.notes.v1')));}catch{return validate(null);}},
    save(choice){try{localStorage.setItem('Sukellusmeri.notes.v1',JSON.stringify(validate(choice)));}catch{}}
  };
})();
