import { AudioEngine } from './audio-engine.js';
import { ScoreModel } from './score-model.js';
import { ScoreRenderer } from './score-renderer.js';
import { PianoKeyboard } from './keyboard.js';
import { StartScreen } from './start-screen.js';
import { ScoreRangeSelection } from './score-range-selection.js';

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

model.subscribe(notes=>renderer.render(notes));

const keyboard=new PianoKeyboard({
  piano:document.querySelector('#piano'),whiteKeys:document.querySelector('#whiteKeys'),viewport:document.querySelector('#keyboardViewport'),
  rail:document.querySelector('#keyboardScrollRail'),track:document.querySelector('#keyboardScrollTrack'),thumb:document.querySelector('#keyboardScrollThumb'),
  onStart:(midi,duration)=>model.addNote({midi,duration}),
  onDuration:(id,duration)=>model.setDuration(id,duration),
  onSoundStart:midi=>audio.noteOn(midi+(settings.transpose||0)),
  onSoundStop:()=>audio.noteOff()
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
// Ainoa oma paperiele on viivaston päältä alkava vaakasuuntainen aluevalinta.
