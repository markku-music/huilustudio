(function () {
  'use strict';

  // Samat kalibrointiarvot ja visuaalinen käyttäytyminen kuin
  // Puhaltimet 0.3.9 -sovelluksessa.
  const MIC_CAL_WARMUP_MS = 250;
  const MIC_CAL_MEASURE_MS = 1500;
  const MIC_CAL_MARGIN_DB = 10;
  const DB_MIN = -70;
  const DB_MAX = -20;
  const RING_CIRCUMFERENCE = 414.69;

  let lastResult = null;
  let activePromise = null;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function median(values) {
    if (!values || !values.length) return NaN;
    const sorted = values.slice().sort(function (a, b) { return a - b; });
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2
      ? sorted[middle]
      : (sorted[middle - 1] + sorted[middle]) / 2;
  }

  function rmsDb(buffer) {
    let sum = 0;
    for (let i = 0; i < buffer.length; i += 1) {
      const value = buffer[i];
      sum += value * value;
    }
    const rms = Math.sqrt(sum / buffer.length) || 1e-12;
    return 20 * Math.log10(rms);
  }

  function sleep(ms) {
    return new Promise(function (resolve) { window.setTimeout(resolve, ms); });
  }

  function elements() {
    return {
      overlay: document.getElementById('micCalibrationOverlay'),
      progress: document.getElementById('micCalibrationRingProgress'),
      pulse: document.getElementById('micCalibrationPulse'),
      db: document.getElementById('micCalibrationDbValue')
    };
  }

  function updateVisual(dbValue, progressValue) {
    const els = elements();
    if (!els.overlay) return;

    const progress = clamp(progressValue, 0, 1);
    if (els.progress) {
      els.progress.style.strokeDashoffset = (RING_CIRCUMFERENCE - progress * RING_CIRCUMFERENCE).toFixed(2);
    }

    const shown = Number.isFinite(dbValue) ? clamp(dbValue, -90, -30) : -90;
    const level = clamp((shown + 90) / 60, 0, 1);
    const eased = Math.pow(level, 0.62);

    if (els.pulse) {
      els.pulse.style.transform = 'scale(' + (0.72 + 0.34 * eased).toFixed(3) + ')';
      els.pulse.style.opacity = (0.24 + 0.62 * eased).toFixed(3);
    }
    if (els.db) {
      els.db.textContent = Number.isFinite(dbValue) ? Math.round(shown) + ' dB' : '–';
    }
    els.overlay.classList.toggle('complete', progress >= 0.999);
  }

  async function runCalibration() {
    const els = elements();
    if (!els.overlay || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return null;
    }

    let stream = null;
    let context = null;

    els.overlay.classList.remove('complete', 'closing');
    els.overlay.classList.add('show');
    updateVisual(-90, 0);

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error('AudioContext ei ole käytettävissä.');

      context = new AudioContextClass();
      if (context.state !== 'running') {
        try { await context.resume(); } catch (_) {}
      }

      const supported = navigator.mediaDevices.getSupportedConstraints
        ? navigator.mediaDevices.getSupportedConstraints()
        : {};
      const constraints = {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      };
      if (supported.voiceIsolation) constraints.voiceIsolation = false;

      stream = await navigator.mediaDevices.getUserMedia({ audio: constraints });
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 8192;
      analyser.smoothingTimeConstant = 0.08;
      analyser.minDecibels = -110;
      analyser.maxDecibels = -10;
      source.connect(analyser);

      const timeData = new Float32Array(analyser.fftSize);
      const total = MIC_CAL_WARMUP_MS + MIC_CAL_MEASURE_MS;
      const start = performance.now();

      while (performance.now() - start < MIC_CAL_WARMUP_MS) {
        analyser.getFloatTimeDomainData(timeData);
        const level = rmsDb(timeData);
        updateVisual(level, (performance.now() - start) / total);
        await sleep(33);
      }

      const values = [];
      const measureStart = performance.now();
      while (performance.now() - measureStart < MIC_CAL_MEASURE_MS) {
        analyser.getFloatTimeDomainData(timeData);
        const level = rmsDb(timeData);
        if (Number.isFinite(level)) values.push(level);
        updateVisual(level, (MIC_CAL_WARMUP_MS + performance.now() - measureStart) / total);
        await sleep(33);
      }

      const noiseFloorDb = values.length ? median(values) : -80;
      const thresholdDb = values.length
        ? clamp(Math.round(noiseFloorDb + MIC_CAL_MARGIN_DB), DB_MIN, DB_MAX)
        : DB_MIN;

      lastResult = {
        noiseFloorDb: noiseFloorDb,
        thresholdDb: thresholdDb,
        measuredAt: new Date().toISOString()
      };

      updateVisual(noiseFloorDb, 1);
      await sleep(300);
      els.overlay.classList.add('closing');
      await sleep(150);
      return Object.assign({}, lastResult);
    } catch (error) {
      console.warn('Pohjakohinan mittaus ohitettiin:', error);
      return null;
    } finally {
      if (stream) {
        stream.getTracks().forEach(function (track) {
          try { track.stop(); } catch (_) {}
        });
      }
      if (context && context.state !== 'closed') {
        try { await context.close(); } catch (_) {}
      }
      els.overlay.classList.remove('show', 'complete', 'closing');
    }
  }

  function calibrate() {
    if (activePromise) return activePromise;
    activePromise = runCalibration().finally(function () { activePromise = null; });
    return activePromise;
  }

  window.PikakirjoitinMicCalibration = {
    calibrate: calibrate,
    getLastResult: function () {
      return lastResult ? Object.assign({}, lastResult) : null;
    }
  };
})();
