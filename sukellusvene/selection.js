(() => {
  'use strict';
  window.createNotePicker=({onStart,onCancel})=>{
    const panel=document.getElementById('notes-panel');
    const start=document.getElementById('notes-start'),cancel=document.getElementById('notes-cancel');
    let canCancel=false,accepted=false;
    start.addEventListener('click',()=>{
      accepted=true;panel.close();onStart(window.SeaMusic.read());
    });
    cancel.addEventListener('click',()=>panel.close());
    panel.addEventListener('cancel',event=>{if(!canCancel)event.preventDefault();});
    panel.addEventListener('close',()=>{if(!accepted&&canCancel)onCancel();});
    return {open(choice,started){
      canCancel=started;accepted=false;cancel.hidden=!started;
      start.textContent=started?'Aloita uusi matka':'Aloita';panel.showModal();
    }};
  };
})();
