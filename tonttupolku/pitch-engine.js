
// PCM in [-1, 1]. One instance per uninterrupted mono audio stream.
// The detector has no access to the game's target note.
function createFluteEngine(sampleRate, options = {}) {
  if (!Number.isFinite(sampleRate) || sampleRate < 16000 || sampleRate > 192000)
    throw new RangeError("Näytetaajuuden pitää olla 16–192 kHz.");
  const hop = Math.round(sampleRate * 0.004);
  const frameSize = Math.round(sampleRate * 0.040);
  const stride = Math.max(1, Math.round(sampleRate / 24000));
  const rate = sampleRate / stride;
  const ring = new Float32Array(frameSize);
  const frame = new Float32Array(Math.floor(frameSize / stride));
  const recentSize = Math.round(sampleRate * 0.016);
  const recentStart = frame.length - Math.round(recentSize / stride);
  const maxLag = Math.ceil(rate / 110);
  const minLag = Math.max(2, Math.floor(rate / 3600));
  const similarity = new Float64Array(maxLag + 2);
  const energy = new Float64Array(frame.length + 1);
  let total = 0, cursor = 0, next = recentSize;
  let gate = Number.isFinite(options.gateDb) ? options.gateDb : -54;
  let candidate = null, since = 0, quietSince = null, locked = false;
  let lastMidi = null, lastSeen = -Infinity;
  let levelOnset = null;
  let clearSince = 0, clearHz = 0, lastClearSample = -Infinity;
  let pitches = [];
  const noise = [];
  let calibrating = options.calibrate !== false;

  const hann = length => Float64Array.from({length}, (_,i) =>
    0.5 - 0.5*Math.cos(2*Math.PI*i/(length-1)));
  const longWindow = hann(frame.length), shortWindow = hann(frame.length-recentStart);

  function resolveRegister(peaks, lower, start) {
    const lowHz = rate/lower.lag;
    const lowMidi = Math.round(69 + 12*Math.log2(lowHz/440));
    // d¹–cis² and their upper partners d²–cis³ on the concert flute.
    if (lowMidi < 62 || lowMidi > 73) return lower;
    const upper = peaks.find(p => Math.abs(1200*Math.log2(lower.lag/(2*p.lag))) <= 32);
    if (!upper) return lower;
    const establishedUpper = locked && lastMidi === lowMidi+12;
    const closeScores = upper.score >= 0.88 && lower.score-upper.score <= 0.14;
    if (!closeScores && !(establishedUpper && upper.score >= 0.78)) return lower;

    // Shared partials (2f, 4f, 6f) support both interpretations. Odd partials
    // of the lower note (f, 3f, 5f) give independent evidence for that register.
    const window = start === 0 ? longWindow : shortWindow;
    let oddPower = 0, evenPower = 0, higherOddPower = 0;
    for (let h = 1; h <= 6; h++) {
      const coefficient = 2*Math.cos(2*Math.PI*h*lowHz/rate);
      let prev = 0, older = 0;
      for (let i = 0; i < window.length; i++) {
        const current = frame[start+i]*window[i] + coefficient*prev - older;
        older = prev;
        prev = current;
      }
      const power = Math.max(0, prev*prev + older*older - coefficient*prev*older);
      if (h === 3 || h === 5) higherOddPower += power;
      if (h % 2) oddPower += power;
      else evenPower += power;
    }
    const totalPower = Math.max(1e-15, oddPower+evenPower);
    const oddShare = oddPower / totalPower;
    // A brief component at f can coexist with an established upper note.
    // Carry both measured periods into the time decision if f alone supports
    // a marginal downward change. Strong lows and their odd overtones pass directly.
    if (establishedUpper && oddShare >= 0.045 && oddShare <= 0.105 &&
        higherOddPower/totalPower < 0.008) lower.competingUpper = upper;
    // In a marginal mixture retain an established register. After silence
    // or on a new pitch wait for stronger evidence instead of inventing a note.
    if (oddShare >= 0.045) return lower;
    if (oddShare <= 0.024) return upper;
    if (locked && lastMidi === lowMidi+12) return upper;
    if (locked && lastMidi === lowMidi) return lower;
    return null;
  }

  let curve=null;
  function estimate(start = 0) {
    const end = frame.length - maxLag - 1;
    let best = 0;
    for (let lag = minLag - 1; lag <= maxLag + 1; lag++) {
      let dot = 0;
      for (let i = start; i < end; i++) dot += frame[i] * frame[i + lag];
      const norm = energy[end] - energy[start] + energy[lag + end] - energy[lag + start];
      similarity[lag] = 2 * dot / Math.max(1e-15, norm);
    }
    // Compare interpolated maxima so rounding a short period to an integer
    // cannot give a longer multiple an artificial advantage.
    const peaks = [];
    for (let i = minLag; i <= maxLag; i++) {
      const l = similarity[i-1], m = similarity[i], r = similarity[i+1];
      if (m < 0.76 || m <= l || m < r) continue;
      const d = (l-r) / (2*(l-2*m+r));
      const score = Math.min(1, m - 0.25 * (l-r) * d);
      peaks.push({lag: i+d, score});
      best = Math.max(best, score);
    }
    curve = Float32Array.from({length:96},(_,i)=>similarity[minLag+Math.round(i*(maxLag-minLag)/95)]);
    if (best < 0.88) return null;
    const first = peaks.find(p => p.score >= best - 0.017);
    const peak = resolveRegister(peaks, first, start);
    if (!peak) return null;
    const pitch = {hz: rate / peak.lag, clarity: peak.score};
    if (peak.competingUpper) {
      pitch.competingUpper = {hz: rate/peak.competingUpper.lag, clarity: peak.competingUpper.score};
    }
    return pitch;
  }

  function describePitch({hz,clarity}) {
    const exact = 69 + 12*Math.log2(hz/440);
    const midi = Math.round(exact);
    return {hz,clarity,midi,cents:100*(exact-midi)};
  }

  function analyze() {
    let mean = 0, pos = cursor;
    for (let i = 0; i < frame.length; i++) {
      let sum = 0;
      for (let j = 0; j < stride; j++) {
        sum += ring[pos];
        if (++pos === frameSize) pos = 0;
      }
      frame[i] = sum / stride;
      mean += frame[i];
    }
    mean /= frame.length;
    for (let i = 0; i < frame.length; i++) {
      frame[i] -= mean;
      energy[i+1] = energy[i] + frame[i] * frame[i];
    }
    const db = 10*Math.log10(Math.max(1e-12, energy[frame.length]/frame.length));
    const time = total / sampleRate * 1000;
    const result = {time, db, gate, phase: 'quiet', pitch: null, event: null, octaveChange: null, legatoChange: null};
    curve=null;
    const span=Math.min(frame.length,Math.round(rate*.006));
    result.raw=new Float32Array(96);
    result.cleaned=new Float32Array(96);
    for(let k=0;k<96;k++){
      const offset=Math.round(k*(span-1)/95);
      result.raw[k]=ring[(cursor+frameSize-span*stride+offset*stride)%frameSize];
      result.cleaned[k]=frame[frame.length-span+offset];
    }
    result.threshold = gate - (locked ? 3 : 0);
    if (calibrating) {
      noise.push(db);
      result.phase = 'calibration';
      if (time >= 1500) {
        noise.sort((a,b) => a-b);
        gate = Math.max(-66, noise[Math.floor(noise.length * 0.85)] + 9);
        result.gate = gate;
        calibrating = false;
      }
      return result;
    }
    if (db < gate - (locked ? 3 : 0)) {
      quietSince ??= time;
      levelOnset = null;
      if (time - quietSince >= 70) locked = false;
      candidate = null;
      return result;
    }
    quietSince = null;
    levelOnset ??= time;
    // Clear pitches can be followed on 16 ms of audio; the longer window
    // remains available when the recent signal is weak or irregular.
    const recentPower = (energy[frame.length]-energy[recentStart])/(frame.length-recentStart);
    let pitch = null, fastOctave = false, clear = false;
    if (recentPower >= 10**(gate/10)) {
      const recent = estimate(recentStart);
      if (recent && recent.clarity >= 0.95) {
        const recentMidi = Math.round(69 + 12*Math.log2(recent.hz/440));
        fastOctave = time-lastSeen <= 750 && Math.abs(recentMidi-lastMidi) === 12;
        clear = !recent.competingUpper;
        if (clear || fastOctave || (locked && recentMidi === lastMidi)) pitch = recent;
      }
    }
    result.windowMs = pitch ? 16 : 40;
    pitch ??= estimate();
    result.curve=curve; result.lagMin=minLag/rate*1000;result.lagMax=maxLag/rate*1000;
    result.phase = 'uncertain';
    if (pitch) {
      result.pitch = describePitch(pitch);
      result.estimate = result.pitch;
      const midi = result.pitch.midi;
      if (midi < 60 || midi > 96) result.phase = 'range';
      else if (Math.abs(result.pitch.cents) > 44) result.phase = 'boundary';
      else {
        result.phase = locked ? 'held' : 'candidate';
        if (midi === lastMidi) lastSeen = time;
        const distance = Math.abs(midi - lastMidi);
        const melodicChange = locked && distance > 0 && distance !== 12;
        if (!locked || fastOctave || pitch.competingUpper || melodicChange) {
          if (locked) result.phase = melodicChange ? 'legatoCandidate' : 'octaveCandidate';
          if (candidate !== midi) {
            candidate = midi;
            pitches = [];
            since = time;
            lastClearSample = -Infinity;
          }
          pitches.push(pitch.hz);
          let confirmationMs = fastOctave ? 20 : 32;
          if (pitch.competingUpper) confirmationMs = 60;
          if (melodicChange) confirmationMs = 48;
          let quickLock = false;
          if (clear && Math.abs(result.pitch.cents) <= 40) {
            if (total-lastClearSample !== hop || Math.abs(1200*Math.log2(pitch.hz/clearHz)) > 20) {
              clearSince = time;
              clearHz = pitch.hz;
            }
            lastClearSample = total;
            const quickMs = fastOctave ? 12 : melodicChange ? 20 : 16;
            result.fastElapsed=time-clearSince;result.fastRequired=quickMs;
            quickLock = time-clearSince >= quickMs - 0.001;
          }
          result.elapsed = time-since;
          result.required = confirmationMs;
          result.quick = quickLock;
          if (quickLock || time - since >= confirmationMs - 0.001) {
            const sorted = [...pitches].sort((a,b) => a-b);
            const hz = sorted[Math.floor(sorted.length/2)];
            const confirmation = {midi, hz, cents: 1200*Math.log2(hz/(440*2**((midi-69)/12))), time, stableMs: time-since, fromGateMs: time-levelOnset};
            // A legato change updates the readout without generating another attack.
            if (melodicChange) {
              result.legatoChange = confirmation;
              result.phase = 'legatoLocked';
            } else if (locked) {
              result.octaveChange = confirmation;
              result.phase = 'octaveLocked';
            } else {
              result.event = confirmation;
              result.phase = 'locked';
            }
            locked = true;
            lastMidi = midi;
            lastSeen = time;
            candidate = null;
          } else if (pitch.competingUpper) {
            result.pitch = describePitch(pitch.competingUpper);
          }
        } else candidate = null;
        return result;
      }
    }
    candidate = null;
    return result;
  }

  // Short-window envelope and high-frequency transient, independent of the pitch lock.
  let articulationMidi = null, readyAfter = 0, levelReference = -120;
  let brightnessReference = -45, dip = null;
  let nextSoftTime = 0;
  function observeArticulation(result) {
    const length = Math.min(frame.length-2, Math.round(rate*.006));
    const start = frame.length-length;
    let curvature = 0;
    for(let i=start;i<frame.length;i++){
      const difference = frame[i]-2*frame[i-1]+frame[i-2];
      curvature += difference*difference;
    }
    const power = Math.max(1e-12,(energy[frame.length]-energy[start])/length);
    const level = 10*Math.log10(power);
    const brightness = 10*Math.log10(Math.max(1e-10,curvature/(length*power)));
    result.shortDb = level;
    result.reattack = null;
    // Min/max of the raw PCM since the preceding analysis, for the time display.
    let low=1, high=-1;
    for(let i=0;i<hop;i++){
      const sample=ring[(cursor+frameSize-hop+i)%frameSize];
      low=Math.min(low,sample);high=Math.max(high,sample);
    }
    result.waveLow=low;result.waveHigh=high;
    classifyArticulation(result, level, brightness);
  }

  function classifyArticulation(result, level, brightness) {
    const {time,pitch}=result;
    if(!locked || result.event || result.legatoChange || result.octaveChange){
      articulationMidi=locked?lastMidi:null;
      readyAfter=time+48;
      levelReference=level;
      brightnessReference=brightness;
      dip=null;
      return;
    }
    if(time<readyAfter || articulationMidi===null) return;
    const faithful = result.phase==='held' && pitch?.midi===articulationMidi && pitch.clarity>=.9;
    result.levelRefDb = dip ? dip.reference : levelReference;
    result.brightDeltaDb = brightness - brightnessReference;
    const brightBurst = level>gate+3 && brightness>brightnessReference+7;
    // A short drop must be followed by a prompt recovery on the original note.
    // A shallow drop also needs a change in the transient spectrum.
    if(!dip && levelReference-level>=4.5){
      dip={since:time,reference:levelReference,min:level,bottom:time,burst:false,
        recovery:null,deepAt:null,lastLow:null,
        lowestLevel:level,lowestTime:time,brightnessAtMinimum:result.brightDeltaDb,
        peakBrightness:result.brightDeltaDb};
    }
    if(dip){
      dip.burst ||= brightBurst;
      // Inspect the spectrum at the energy trough separately from a later air accent.
      if(level<dip.lowestLevel){
        dip.lowestLevel=level;
        dip.lowestTime=time;
        dip.brightnessAtMinimum=result.brightDeltaDb;
        dip.peakBrightness=result.brightDeltaDb;
      }
      dip.peakBrightness=Math.max(dip.peakBrightness,result.brightDeltaDb);
      if(level<dip.min-.3){dip.min=level;dip.bottom=time;dip.recovery=null;}
      const depth=dip.reference-dip.min;
      result.dipDepthDb = depth;
      // A clearly interrupted tone may develop a longer tail in a room.
      // Require both a prompt fall and a steep final rise for the extended window.
      if(depth>=12 && dip.deepAt===null)dip.deepAt=time;
      if(level<=dip.reference-12)dip.lastLow=time;
      const deepBreak=depth>=18 && dip.deepAt-dip.since<=55;
      const rebound = level>=dip.reference-3 && level-dip.min>=4;
      if(rebound && dip.recovery===null)dip.recovery=time;
      const expired=time-dip.since>(deepBreak?220:115);
      const changed=pitch && pitch.midi!==articulationMidi && pitch.clarity>.94;
      // Confirmed note changes always reset this observer above.
      if(expired || (changed && !deepBreak)){
        result.artDecision = expired ? 'dip-expired' : 'pitch-changed';
        dip=null;levelReference=level;
      }else if(dip.recovery!==null && time-dip.recovery>=12){
        const fastRecovery=dip.recovery-dip.bottom<=24 && dip.bottom-dip.since<=64;
        const steepReturn=deepBreak && dip.lastLow!==null &&
          dip.recovery>=dip.lastLow && dip.recovery-dip.lastLow<=48;
        const sharp=fastRecovery || steepReturn;
        const standard=sharp && (depth>=13 || dip.burst);
        const recoveryMs=dip.recovery-dip.lowestTime;
        // Require a substantial dip, a short return, and a spectral transient.
        // For slower returns the transient must already be present at the trough.
        const softShape=recoveryMs>=0 && dip.lowestTime-dip.since<=48 &&
          depth>=10 && dip.peakBrightness>=3 &&
          (recoveryMs<=20.1 || (recoveryMs<=32.1 && dip.brightnessAtMinimum>=7));
        const soft=softShape && time>=nextSoftTime && level>=gate+6;
        if(faithful && rebound && (standard || soft)){
          result.artDecision=standard?'confirmed':'confirmed-soft';
          result.reattack={midi:pitch.midi,hz:pitch.hz,cents:pitch.cents,time,
            onsetTime:dip.recovery,depthDb:depth,method:standard?'standard':'soft',
            recoveryMs,brightnessAtMinimumDb:dip.brightnessAtMinimum};
          // Extra markers leave the original classifier's baseline intact.
          if(standard)readyAfter=time+48;
          nextSoftTime=time+48;
        }
        if(faithful || time-dip.recovery>28){
          if(!result.reattack){
            if(!faithful)result.artDecision='pitch-unconfirmed';
            else if(!rebound)result.artDecision='incomplete-recovery';
            else if(!sharp)result.artDecision='slow-recovery';
            else result.artDecision='insufficient-transient';
          }
          dip=null;levelReference=level;
        }
      }
    }else if(faithful){
      brightnessReference+=.065*(brightness-brightnessReference);
    }
    // Slow release tracks playing dynamics while retaining a local pre-dip reference.
    if(!dip)levelReference=Math.max(level,levelReference-.65);
  }

  return {
    push(samples, onFrame) {
      for (let i = 0; i < samples.length; i++) {
        ring[cursor] = samples[i];
        if (++cursor === frameSize) cursor = 0;
        if (++total === next) {
          next += hop;
          const result=analyze();
          observeArticulation(result);
          onFrame(result);
        }
      }
    }
  };
}
if (typeof module !== 'undefined') module.exports = {createFluteEngine};

