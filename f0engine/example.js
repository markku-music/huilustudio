// PROFILE FAST 1 - minimiesimerkki
const engine = new F0Engine({ profile: F0_PROFILES.fluteBeginner5 });
engine.addEventListener('pitch', e => console.log(e.detail.note.display, e.detail.outputF0));
engine.addEventListener('profilefastaccept', e => console.log('FAST', e.detail));
engine.start();
