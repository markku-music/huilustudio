(() => {
  'use strict';
  window.createNotePicker=({onStart,onCancel})=>{
    const music=window.SeaMusic,panel=document.getElementById('notes-panel');
    const presetSelect=document.getElementById('note-preset'),octave=document.getElementById('note-octave');
    const custom=document.getElementById('custom-notes'),grid=document.getElementById('note-grid');
    const count=document.getElementById('note-count'),chosen=document.getElementById('chosen-notes');
    const start=document.getElementById('notes-start'),cancel=document.getElementById('notes-cancel');
    let draft=music.read(),canCancel=false,accepted=false;
    for(const preset of music.presets){const option=document.createElement('option');option.value=preset.id;option.textContent=preset.label+' · '+preset.range;presetSelect.append(option);}
    const option=document.createElement('option');option.value='custom';option.textContent='Omat sävelet';presetSelect.append(option);
    const noteButtons=Array.from({length:12},(_,pitch)=>{
      const button=document.createElement('button');button.type='button';
      button.addEventListener('click',()=>{
        const midi=48+Number(octave.value)*12+pitch;
        if(draft.notes.includes(midi))draft.notes=draft.notes.filter(n=>n!==midi);
        else if(draft.notes.length<8)draft.notes=music.normalize([...draft.notes,midi]);
        render();
      });grid.append(button);return button;
    });
    function render(){
      presetSelect.value=draft.id;custom.hidden=draft.id!=='custom';
      count.textContent=draft.notes.length+'/8';
      chosen.textContent=draft.notes.length?draft.notes.map(music.noteName).join(' · '):'Valitse vähintään yksi sävel.';
      start.disabled=draft.notes.length===0;
      noteButtons.forEach((button,pitch)=>{
        const midi=48+Number(octave.value)*12+pitch,selected=draft.notes.includes(midi);
        button.textContent=music.aliases[pitch];button.setAttribute('aria-label',music.aliases[pitch]+', oktaavi '+octave.value);
        button.setAttribute('aria-pressed',String(selected));button.disabled=!selected&&draft.notes.length>=8;
      });
    }
    presetSelect.addEventListener('change',()=>{
      const preset=music.presets.find(p=>p.id===presetSelect.value);
      draft=preset?{id:preset.id,notes:[...preset.notes]}:{id:'custom',notes:[...draft.notes]};render();
    });
    octave.addEventListener('change',render);
    document.getElementById('notes-clear').addEventListener('click',()=>{draft.notes=[];render();});
    start.addEventListener('click',()=>{
      if(!draft.notes.length)return;
      const choice=music.validate(draft);music.save(choice);accepted=true;panel.close();onStart(choice);
    });
    cancel.addEventListener('click',()=>panel.close());
    panel.addEventListener('cancel',event=>{if(!canCancel)event.preventDefault();});
    panel.addEventListener('close',()=>{if(!accepted&&canCancel)onCancel();});
    return {open(choice,started){draft=music.validate(choice);canCancel=started;accepted=false;cancel.hidden=!started;start.textContent=started?'Aloita uusi matka':'Aloita';render();panel.showModal();}};
  };
})();
