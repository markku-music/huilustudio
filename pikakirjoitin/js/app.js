import { AudioEngine } from './audio-engine.js';
import { ScoreModel } from './score-model.js';
import { ScoreRenderer } from './score-renderer.js';
import { PianoKeyboard } from './keyboard.js';
import { StartScreen } from './start-screen.js';
import { ScoreRangeSelection } from './score-range-selection.js';
import { ThumbRail } from './thumb-rail.js';
import { TupletController } from './tuplet-controller.js';
import { SelectionEditor } from './selection-editor.js';
import { applyAccidental, moveDiatonic } from './pitch-spelling.js';

const app=document.querySelector('#app');
app.inert=true;
app.setAttribute('aria-hidden','true');

const model=new ScoreModel();
const renderer=new ScoreRenderer(document.querySelector('#osmdContainer'));
const audio=new AudioEngine();
const selection=new ScoreRangeSelection({
  viewport:document.querySelector('#scoreViewport'),
  container:document.querySelector('#osmdContainer')
});
renderer.subscribeRendered(snapshot=>selection.refresh(snapshot));
let settings={transpose:0,keyboardStartMidi:60};
let thumbState={dot:false,rest:false,tie:false,tuplet:0};
let warningTimer=0;
let keyboardEditAction=null;

model.subscribe(notes=>renderer.render(notes));

function selectedExistingIds() {
  return selection.selectedIds.filter(id => model.getEntry(id));
}

function editSelectedNotes(updater) {
  const ids=selectedExistingIds();
  if(!ids.length) return false;
  return model.updateEntries(ids,(entry,index,all)=>{
    if(entry.kind!=='note') return null;
    return updater(entry,index,all);
  });
}

const selectionEditor=new SelectionEditor({
  onFlat:()=>editSelectedNotes((entry,index,all)=>applyAccidental(entry.midi,'flat',{index,notes:all,settings})),
  onSharp:()=>editSelectedNotes((entry,index,all)=>applyAccidental(entry.midi,'sharp',{index,notes:all,settings})),
  onUp:()=>editSelectedNotes((entry,index,all)=>moveDiatonic(entry.midi,1,{index,notes:all,settings})),
  onDown:()=>editSelectedNotes((entry,index,all)=>moveDiatonic(entry.midi,-1,{index,notes:all,settings})),
  onDelete:()=>{
    const ids=selectedExistingIds();
    if(!ids.length)return;
    if(model.deleteEntries(ids)){
      selection.clear();
      tuplet.syncFromModel();
    }
  },
  onCopyToEnd:()=>{
    const ids=selectedExistingIds();
    if(ids.length<2)return;
    const copied=model.copyEntriesToEnd(ids);
    if(copied.length) tuplet.syncFromModel();
  },
  onBeam:()=>{
    const ids=selectedExistingIds();
    if(ids.length<2)return;
    model.toggleManualBeamGroup(ids);
  }
});

selection.subscribe(state=>{
  const entries=state.selectedIds.map(id=>model.getEntry(id)).filter(Boolean);
  const noteCount=entries.filter(entry=>entry.kind==='note').length;
  selectionEditor.update({
    visible:Boolean(entries.length && state.anchor),
    x:state.anchor?.x||0,
    staffTop:state.anchor?.staffTop||0,
    staffBottom:state.anchor?.staffBottom||0,
    noteCount,
    selectionCount:entries.length
  });
});

const warning=document.querySelector('#tupletWarning');
function showTupletWarning(message){
  if(!warning)return;
  window.clearTimeout(warningTimer);
  warning.textContent=message;
  const tripletRect=document.querySelector('#tripletButton')?.getBoundingClientRect();
  warning.style.top=`${Math.max(42,Math.min(window.innerHeight-70,(tripletRect?.top||70)+8))}px`;
  warning.hidden=false;
  requestAnimationFrame(()=>warning.classList.add('visible'));
  warningTimer=window.setTimeout(()=>{
    warning.classList.remove('visible');
    window.setTimeout(()=>{if(!warning.classList.contains('visible'))warning.hidden=true;},150);
  },1450);
}

let thumbRail;
const tuplet=new TupletController({
  model,
  onStateChange:state=>thumbRail?.setTuplet(state.active?state.size:0),
  onWarning:showTupletWarning
});

thumbRail=new ThumbRail({
  rail:document.querySelector('#thumbRail'),
  boundsElement:document.querySelector('#scoreViewport'),
  onChange:state=>{ thumbState=state; },
  onTupletRequest:size=>tuplet.request(size)
});

const keyboard=new PianoKeyboard({
  piano:document.querySelector('#piano'),whiteKeys:document.querySelector('#whiteKeys'),viewport:document.querySelector('#keyboardViewport'),
  rail:document.querySelector('#keyboardScrollRail'),track:document.querySelector('#keyboardScrollTrack'),thumb:document.querySelector('#keyboardScrollThumb'),
  onStart:(midi,duration)=>{
    const selectedIds=selectedExistingIds();
    if(selectedIds.length){
      model.beginAction();
      const singleNote = selectedIds.length === 1 ? model.getEntry(selectedIds[0]) : null;
      keyboardEditAction={ids:[...selectedIds],singleNote:Boolean(singleNote?.kind==='note')};

      if(singleNote?.kind==='note'){
        // Yksittäisen valitun nuotin editoinnissa kosketin määrää korkeuden
        // ja kosketinele aika-arvon. Uuden korkeuden kirjoitusasu palautetaan
        // sävellajin normaaliin enharmoniseen logiikkaan.
        model.updateEntries(selectedIds,{
          midi:Number(midi),
          duration,
          spellingPreference:null,
          spellingOverride:null
        });
        return { id:selectedIds[0], sound:true };
      }

      // Aluevalinnassa kosketinele voi edelleen muuttaa yhteistä aika-arvoa,
      // mutta yhtä kosketinta ei tulkita koko alueen yhteiseksi sävelkorkeudeksi.
      model.updateEntries(selectedIds,{duration});
      return { id:selectedIds[0], sound:false };
    }

    model.beginAction();
    const tieWasArmed=Boolean(thumbState.tie);
    if(tieWasArmed) thumbRail.setToggle('tie',false);
    const tupletMeta=tuplet.metadataForNewEntry();
    if(thumbState.rest){
      return { id:model.addRest({duration,dotted:thumbState.dot,tuplet:tupletMeta}), sound:false };
    }
    const previous=model.notes.at(-1);
    const tieFromPrevious=Boolean(tieWasArmed && previous?.kind==='note' && Number(previous.midi)===Number(midi));
    return { id:model.addNote({midi,duration,dotted:thumbState.dot,tieFromPrevious,tuplet:tupletMeta}), sound:true };
  },
  onDuration:(id,duration)=>{
    if(keyboardEditAction) model.updateEntries(keyboardEditAction.ids,{duration});
    else model.setDuration(id,duration);
  },
  onSoundStart:midi=>audio.noteOn(midi+(settings.transpose||0)),
  onSoundStop:()=>audio.noteOff(),
  onFinish:id=>{
    if(keyboardEditAction){
      model.endAction();
      keyboardEditAction=null;
      return;
    }
    const result=tuplet.finishEntry(id);
    if(!result.ok){ model.cancelAction(); return; }
    model.endAction();
    if(result.completed && result.historyGroup){
      model.collapseRecentActions(result.historyGroup.actionCount,result.historyGroup.beforeSnapshot);
    }
  }
});

const undoButton=document.querySelector('#undoButton');
const redoButton=document.querySelector('#redoButton');

model.subscribeHistory(({canUndo,canRedo})=>{
  undoButton.disabled=!canUndo;
  redoButton.disabled=!canRedo;
});

undoButton.addEventListener('click',()=>{
  if(model.undo()){ selection.clear(); tuplet.syncFromModel(); }
});
redoButton.addEventListener('click',()=>{
  if(model.redo()){ selection.clear(); tuplet.syncFromModel(); }
});

new StartScreen({
  audio,
  onStart:async nextSettings=>{
    settings={...nextSettings};
    renderer.setSettings(settings);
    await renderer.render(model.notes);
    requestAnimationFrame(()=>keyboard.scrollToMidi(settings.keyboardStartMidi));
  }
});

// Nuottialueen pystyscrollaus on edelleen täysin natiivi.
