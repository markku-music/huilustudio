'use strict';

// Both browser audio paths feed identical 256-sample blocks to the Juoksu DSP.
function createFluteInput(rate, targets, send) {
  let sounding = null, candidate = null, evidence = 0, unclear = 0;
  let accepted = null;
  const block = new Float32Array(256);
  const blockMs = block.length * 1000 / rate;
  let used = 0;
  function releaseNote() {
    candidate = null;
    evidence = unclear = 0;
    if (sounding !== null) {
      sounding = null;
      send('release');
    }
  }
  const engine = createJuoksuResonator(rate, targets, (type, detail) => {
    if (type === 'state' && detail.state === 'running') send('ready');
    if (type === 'silence') releaseNote();
    if (type === 'input' && detail.accepted) accepted = Number(detail.action);
  });
  function processBlock() {
    accepted = null;
    engine._process(block);
    if (accepted === null) {
      candidate = null;
      evidence = 0;
      if (sounding !== null && (unclear += blockMs) >= 150) releaseNote();
      return;
    }
    unclear = 0;
    if (accepted !== candidate) {
      candidate = accepted;
      evidence = 0;
    }
    evidence += blockMs;
    if (candidate !== sounding && evidence >= 10) {
      const kind = sounding === null ? 'attack' : 'legato';
      sounding = candidate;
      send(kind, sounding);
    }
  }
  return function push(pcm) {
    for (let i = 0; i < pcm.length;) {
      const count = Math.min(block.length - used, pcm.length - i);
      block.set(pcm.subarray(i, i + count), used);
      used += count;
      i += count;
      if (used === block.length) {
        processBlock();
        used = 0;
      }
    }
  };
}

function registerFluteInput() {
  class FluteInput extends AudioWorkletProcessor {
    constructor(options) {
      super();
      this.push = createFluteInput(sampleRate, options.processorOptions.targets, (kind, midi) => this.port.postMessage({kind, midi}));
      this.running = true;
      this.port.onmessage = e => { if (e.data === 'stop') this.running = false; };
    }
    process(inputs) {
      if (!this.running) return false;
      const pcm = inputs[0]?.[0];
      if (pcm) this.push(pcm);
      return true;
    }
  }
  registerProcessor('tonttupolku-huilu', FluteInput);
}

const fluteModules = new WeakMap();
function loadFluteWorklet(ctx) {
  if (!fluteModules.has(ctx)) {
    const code = [createJuoksuResonator.toString(), createFluteInput.toString(),
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

  async start(ctx, targets) {
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
          s.processor = new AudioWorkletNode(ctx, 'tonttupolku-huilu', {processorOptions:{targets}});
          s.processor.port.onmessage = e => input(e.data.kind, e.data.midi);
          s.processor.onprocessorerror = () => fail('Huilun kuuntelu keskeytyi. Käynnistä se uudelleen.');
        } catch (err) {
          if (!active()) return;
          if (!ctx.createScriptProcessor) throw err;
        }
      }
      if (!s.processor) {
        const push = createFluteInput(ctx.sampleRate, targets, input);
        s.processor = ctx.createScriptProcessor(256, 1, 1);
        s.processor.onaudioprocess = e => {
          if (active()) push(e.inputBuffer.getChannelData(0));
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
