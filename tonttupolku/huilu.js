'use strict';

// Huilututka 0.7.2 supplies confirmed attacks and connected pitch changes.
// Send gestures across the audio thread boundary, not its diagnostic graphs.
function fluteGestures(send) {
  let ready = false, sounding = null, quietSince = null, unclearSince = null;

  return function consume(frame) {
    if (frame.phase === 'calibration') return;
    if (!ready) {
      ready = true;
      send('ready');
    }

    const change = frame.legatoChange || frame.octaveChange;
    const event = frame.event || frame.reattack || change;
    if (event) {
      const kind = change && sounding !== null ? 'legato' : 'attack';
      sounding = event.midi;
      quietSince = unclearSince = null;
      send(kind, sounding);
      return;
    }

    if (frame.phase === 'held' && (sounding === null || frame.pitch.midi === sounding)) {
      if (sounding === null) {
        // After sustained unpitched noise the detector may retain its old lock.
        sounding = frame.pitch.midi;
        send('attack', sounding);
      }
      quietSince = unclearSince = null;
      return;
    }
    if (sounding === null) return;

    if (frame.phase === 'quiet') quietSince ??= frame.time;
    else quietSince = null;
    unclearSince ??= frame.time;
    // Match the engine's 70 ms quiet reset. Also release in a noisy room when
    // no pitch remains, allowing a brief uncertain frame during a finger change.
    if ((quietSince !== null && frame.time - quietSince >= 70) || frame.time - unclearSince >= 150) {
      sounding = quietSince = unclearSince = null;
      send('release');
    }
  };
}

function registerFluteInput() {
  class FluteInput extends AudioWorkletProcessor {
    constructor() {
      super();
      this.engine = createFluteEngine(sampleRate);
      this.consume = fluteGestures((kind, midi) => this.port.postMessage({kind, midi}));
      this.running = true;
      this.port.onmessage = e => { if (e.data === 'stop') this.running = false; };
    }
    process(inputs) {
      if (!this.running) return false;
      const pcm = inputs[0]?.[0];
      if (pcm) this.engine.push(pcm, this.consume);
      return true;
    }
  }
  registerProcessor('tonttupolku-huilu', FluteInput);
}

const fluteModules = new WeakMap();
function loadFluteWorklet(ctx) {
  if (!fluteModules.has(ctx)) {
    const code = [createFluteEngine.toString(), fluteGestures.toString(),
      '(' + registerFluteInput.toString() + ')()'].join(';\n');
    const url = URL.createObjectURL(new Blob([code], {type:'text/javascript'}));
    const loaded = ctx.audioWorklet.addModule(url)
      .catch(error => { fluteModules.delete(ctx); throw error; })
      .finally(() => URL.revokeObjectURL(url));
    fluteModules.set(ctx, loaded);
  }
  return fluteModules.get(ctx);
}

class Huilumikrofoni {
  constructor(onEvent, onError) {
    this.onEvent = onEvent;
    this.onError = onError;
    this.session = null;
  }

  async start(ctx) {
    this.stop();
    const s = {ctx};
    this.session = s;
    const active = () => this.session === s;
    const fail = message => {
      if (!active()) return;
      this.stop();
      this.onError(message);
    };
    const input = (kind, midi) => {
      if (!active()) return;
      if (kind === 'ready') {
        clearTimeout(s.timeout);
        if (s.stream.getAudioTracks()[0].muted) {
          fail('Mikrofoni on mykistetty. Avaa mikrofoni ja kokeile uudelleen.');
          return;
        }
      }
      this.onEvent(kind, midi);
    };
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw Error('Mikrofoni tarvitsee HTTPS- tai localhost-osoitteen. Voit myös valita näppäimet ja kosketuksen.');
      }
      // Start both requests inside the start button's user gesture.
      const capture = navigator.mediaDevices.getUserMedia({audio:{
        channelCount:1, echoCancellation:false, noiseSuppression:false, autoGainControl:false
      }}).then(stream => {
        if (!active()) { for (const track of stream.getTracks()) track.stop(); return; }
        s.stream = stream;
        const [track] = stream.getAudioTracks();
        if (!track || track.readyState === 'ended') throw Error('Mikrofoniyhteys katkesi. Kokeile uudelleen.');
        track.onended = () => fail('Mikrofoniyhteys katkesi. Tarkista mikrofoni ja kokeile uudelleen.');
      });
      await Promise.all([capture, ctx.state === 'running' ? undefined : ctx.resume()]);
      if (!active()) return;
      s.source = ctx.createMediaStreamSource(s.stream);
      if (ctx.audioWorklet && typeof AudioWorkletNode !== 'undefined') {
        try {
          await loadFluteWorklet(ctx);
          if (!active()) return;
          s.processor = new AudioWorkletNode(ctx, 'tonttupolku-huilu');
          s.processor.port.onmessage = e => input(e.data.kind, e.data.midi);
          s.processor.onprocessorerror = () => fail('Huilututkan kuuntelu keskeytyi. Käynnistä se uudelleen.');
        } catch (err) {
          if (!active()) return;
          if (!ctx.createScriptProcessor) throw err;
        }
      }
      if (!s.processor) {
        const engine = createFluteEngine(ctx.sampleRate), consume = fluteGestures(input);
        s.processor = ctx.createScriptProcessor(512, 1, 1);
        s.processor.onaudioprocess = e => {
          if (active()) engine.push(e.inputBuffer.getChannelData(0), consume);
        };
      }
      s.mute = ctx.createGain();
      s.mute.gain.value = 0;
      const [track] = s.stream.getAudioTracks();
      track.onmute = () => fail('Mikrofoni mykistyi. Tarkista mikrofoni ja kokeile uudelleen.');
      s.stateChanged = () => {
        if (ctx.state !== 'running') fail('Huilun kuuntelu keskeytyi. Voit jatkaa peliä tuvasta.');
      };
      ctx.addEventListener('statechange', s.stateChanged);
      s.timeout = setTimeout(() => fail('Mikrofonista ei tullut ääntä. Tarkista mikrofoni ja kokeile uudelleen.'), 8000);
      input('calibrating');
      s.source.connect(s.processor).connect(s.mute).connect(ctx.destination);
    } catch (err) {
      const messages = {
        NotAllowedError:'Salli mikrofoni selaimen sivustoasetuksista tai valitse näppäimet ja kosketus.',
        NotFoundError:'Mikrofonia ei löytynyt. Liitä mikrofoni tai valitse näppäimet ja kosketus.',
        NotReadableError:'Mikrofonia ei voitu avata. Tarkista, onko se toisen sovelluksen käytössä.'
      };
      fail(messages[err.name] || err.message || 'Mikrofonin avaaminen epäonnistui.');
    }
  }

  stop() {
    const s = this.session;
    this.session = null;
    if (!s) return;
    clearTimeout(s.timeout);
    if (s.stateChanged) s.ctx.removeEventListener('statechange', s.stateChanged);
    if (s.processor?.port) {
      s.processor.port.onmessage = null;
      s.processor.port.postMessage('stop');
      s.processor.port.close();
      s.processor.onprocessorerror = null;
    }
    if (s.processor && 'onaudioprocess' in s.processor) s.processor.onaudioprocess = null;
    for (const track of s.stream?.getTracks() || []) {
      track.onmute = track.onended = null;
      track.stop();
    }
    for (const node of [s.source, s.processor, s.mute]) node?.disconnect();
  }
}
