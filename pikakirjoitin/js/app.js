import { AudioEngine } from './audio-engine.js';
import { ScoreModel } from './score-model.js';
import { ScoreRenderer } from './score-renderer.js';
import { PianoKeyboard } from './keyboard.js';
import { StartScreen } from './start-screen.js';
import { ScoreRangeSelection } from './score-range-selection.js';
import { ThumbRail } from './thumb-rail.js';

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
let thumbState={dot:false,rest:false,tie:false};

model.subscribe(notes=>renderer.render(notes));

const thumbRail=new ThumbRail({
  rail:document.querySelector('#thumbRail'),
  boundsElement:document.querySelector('#scoreViewport'),
  onChange:state=>{ thumbState=state; }
});

const keyboard=new PianoKeyboard({
  piano:document.querySelector('#piano'),whiteKeys:document.querySelector('#whiteKeys'),viewport:document.querySelector('#keyboardViewport'),
  rail:document.querySelector('#keyboardScrollRail'),track:document.querySelector('#keyboardScrollTrack'),thumb:document.querySelector('#keyboardScrollThumb'),
  onStart:(midi,duration)=>{
    model.beginAction();
    const tieWasArmed=Boolean(thumbState.tie);
    // Vanhan Pikakirjoittimen logiikka: sidekaari on kertakäyttöinen.
    // Se kulutetaan heti seuraavaan syötettyyn tapahtumaan.
    if(tieWasArmed) thumbRail.setToggle('tie',false);
    if(thumbState.rest){
      return { id:model.addRest({duration,dotted:thumbState.dot}), sound:false };
    }
    const previous=model.notes.at(-1);
    const tieFromPrevious=Boolean(tieWasArmed && previous?.kind==='note' && Number(previous.midi)===Number(midi));
    return { id:model.addNote({midi,duration,dotted:thumbState.dot,tieFromPrevious}), sound:true };
  },
  onDuration:(id,duration)=>model.setDuration(id,duration),
  onSoundStart:midi=>audio.noteOn(midi+(settings.transpose||0)),
  onSoundStop:()=>audio.noteOff(),
  onFinish:()=>model.endAction()
});


const undoButton=document.querySelector('#undoButton');
const redoButton=document.querySelector('#redoButton');

model.subscribeHistory(({canUndo,canRedo})=>{
  undoButton.disabled=!canUndo;
  redoButton.disabled=!canRedo;
});

undoButton.addEventListener('click',()=>{
  if(model.undo()) selection.clear();
});
redoButton.addEventListener('click',()=>{
  if(model.redo()) selection.clear();
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
// Paperilla: kosketus tapahtumaan valitsee heti, vaakaveto laajentaa valintaa,
// pystysuuntainen veto jää selaimen natiiviksi scrollaukseksi.
