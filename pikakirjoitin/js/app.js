import { AudioEngine } from './audio-engine.js';
import { ScoreModel } from './score-model.js';
import { ScoreRenderer } from './score-renderer.js';
import { PianoKeyboard } from './keyboard.js';
import { StartScreen } from './start-screen.js';
import { ScoreRangeSelection } from './score-range-selection.js';
import { ThumbRail } from './thumb-rail.js';
import { TupletController } from './tuplet-controller.js';
import { ScoreZoomController } from './score-zoom.js';

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
const zoomController=new ScoreZoomController({
  viewport:document.querySelector('#scoreViewport'),
  documentElement:document.querySelector('.score-document'),
  renderer,
  selection,
  minZoom:1,
  maxZoom:1.5
});
let settings={transpose:0,keyboardStartMidi:60};
let thumbState={dot:false,rest:false,tie:false,tuplet:0};
let warningTimer=0;

model.subscribe(notes=>renderer.render(notes));

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
  onDuration:(id,duration)=>model.setDuration(id,duration),
  onSoundStart:midi=>audio.noteOn(midi+(settings.transpose||0)),
  onSoundStop:()=>audio.noteOff(),
  onFinish:id=>{
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
