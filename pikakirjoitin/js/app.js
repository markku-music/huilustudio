import { AudioEngine } from './audio-engine.js';
import { ScoreModel } from './score-model.js';
import { ScoreRenderer } from './score-renderer.js';
import { PianoKeyboard } from './keyboard.js';

const model = new ScoreModel();
const renderer = new ScoreRenderer(document.querySelector('#osmdContainer'));
const audio = new AudioEngine();

model.subscribe(notes => renderer.render(notes));
renderer.render(model.notes);

new PianoKeyboard({
  piano: document.querySelector('#piano'),
  whiteKeys: document.querySelector('#whiteKeys'),
  viewport: document.querySelector('#keyboardViewport'),
  rail: document.querySelector('#keyboardScrollRail'),
  track: document.querySelector('#keyboardScrollTrack'),
  thumb: document.querySelector('#keyboardScrollThumb'),
  onStart: (midi, duration) => model.addNote({ midi, duration }),
  onDuration: (id, duration) => model.setDuration(id, duration),
  onSoundStart: midi => audio.noteOn(midi),
  onSoundStop: () => audio.noteOff()
});

// Tarkoituksella ei yhtään pointer-, touch- tai scroll-listeneria nuottialueelle.
