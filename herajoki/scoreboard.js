/* Puhallinstartti v23.1. The game never waits for a network write. */
(() => {
  'use strict';
  const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyBeu0qvjp5PE4IpLhAaNXAXEkjsHnKT5Ek',
    authDomain: 'puhallinstartti.firebaseapp.com', projectId: 'puhallinstartti',
    storageBucket: 'puhallinstartti.firebasestorage.app', messagingSenderId: '422306502286',
    appId: '1:422306502286:web:cc65de4b618683d8379bdf'
  };
  const INSTRUMENTS = ['Huilu', 'Saksofoni', 'Klarinetti', 'Trumpetti', 'Käyrätorvi', 'Pasuuna'];
  const COLLECTION = 'savelkojuScores';
  const SDK_BASE = 'https://www.gstatic.com/firebasejs/10.12.5/';
  const APP_NAME = 'puhallinstartti';
  let scope = '/';
  try { scope = new URL('./', window.location?.href || 'https://local.invalid/').pathname; } catch (_) {}
  const PREFIX = 'puhallinstartti-v23.1:' + encodeURIComponent(scope) + ':';
  const OUTBOX_PREFIX = PREFIX + 'result:';
  const CACHE_KEY = PREFIX + 'leaderboard';
  const memory = new Map();
  const inflight = new Map();
  const listeners = new Set();
  const scriptLoads = new Map();
  let db = null, auth = null, sdkPromise = null, authPromise = null;
  let flushPromise = null;
  let cacheMemory = null;

  function error(message, code) { return Object.assign(new Error(message), { code }); }
  function timeout(promise, ms, message = 'Verkkoyhteys ei vastannut ajoissa.') {
    let timer;
    return Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => reject(error(message, 'timeout')), ms);
    })]).finally(() => clearTimeout(timer));
  }
  function online() { return !window.navigator || window.navigator.onLine !== false; }
  function cleanName(name) {
    return String(name || '').replace(/[\u0000-\u001F\u007F]/g, ' ').trim().replace(/\s+/g, ' ').slice(0, 20).replace(/[\uD800-\uDBFF]$/, '');
  }
  function newId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    if (window.crypto?.getRandomValues) {
      const bytes = window.crypto.getRandomValues(new Uint8Array(16));
      return Array.from(bytes, n => n.toString(16).padStart(2, '0')).join('');
    }
    return (Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)).padEnd(24, '0');
  }
  // All devices use Finnish school-term boundaries, including devices with
  // a different system timezone. January and August have known UTC offsets.
  function currentSemester(now = new Date()) {
    let year = now.getFullYear(), month = now.getMonth() + 1;
    try {
      const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Helsinki', year: 'numeric', month: 'numeric' }).formatToParts(now);
      year = Number(parts.find(p => p.type === 'year').value);
      month = Number(parts.find(p => p.type === 'month').value);
    } catch (_) {}
    const autumn = month >= 8;
    return {
      key: (autumn ? 'syksy-' : 'kevat-') + year,
      label: (autumn ? 'Syksy ' : 'Kevät ') + year,
      start: new Date(autumn ? `${year}-08-01T00:00:00+03:00` : `${year}-01-01T00:00:00+02:00`),
      end: new Date(autumn ? `${year + 1}-01-01T00:00:00+02:00` : `${year}-08-01T00:00:00+03:00`)
    };
  }
  function validate(score) {
    const payload = {
      playerName: cleanName(score.playerName), instrumentName: String(score.instrumentName || ''),
      noteCount: Number(score.noteCount), timeMs: Math.round(Number(score.timeMs))
    };
    if (!payload.playerName) throw error('Nimimerkki puuttuu.', 'invalid-name');
    if (!INSTRUMENTS.includes(payload.instrumentName)) throw error('Tuntematon soitin.', 'invalid-instrument');
    if (![3, 4, 5].includes(payload.noteCount)) throw error('Virheellinen sävelten määrä.', 'invalid-notes');
    if (!Number.isFinite(payload.timeMs) || payload.timeMs < 0) throw error('Virheellinen aika.', 'invalid-time');
    return payload;
  }
  function notify(record) {
    const copy = { ...record };
    listeners.forEach(listener => { try { listener(copy); } catch (e) { console.warn('Tulostaulun kuuntelija:', e); } });
  }
  function store(record) {
    memory.set(record.id, record);
    try { localStorage.setItem(OUTBOX_PREFIX + record.id, JSON.stringify(record)); record.durable = true; }
    catch (_) { record.durable = false; }
    return record;
  }
  function getRecord(id) {
    if (memory.has(id)) return memory.get(id);
    try {
      const item = JSON.parse(localStorage.getItem(OUTBOX_PREFIX + id));
      if (item && item.id === id && /^[A-Za-z0-9-]{20,64}$/.test(id)) {
        validate(item);
        item.durable = true;
        memory.set(id, item); return item;
      }
    } catch (_) {}
    return null;
  }
  function records() {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(OUTBOX_PREFIX)) getRecord(key.slice(OUTBOX_PREFIX.length));
      }
    } catch (_) {}
    return Array.from(memory.values()).sort((a, b) => a.finishedAt - b.finishedAt);
  }
  function pruneHistory() {
    // Never discard an unconfirmed score. Keep the latest 100 confirmed or
    // practice results locally, rather than every child's name indefinitely.
    const done = records().filter(r => r.status === 'saved' || r.status === 'practice');
    for (const r of done.slice(0, Math.max(0, done.length - 100))) {
      try { localStorage.removeItem(OUTBOX_PREFIX + r.id); } catch (_) {}
      memory.delete(r.id);
    }
  }
  function queueScore(score) {
    const payload = validate(score);
    const id = /^[A-Za-z0-9-]{20,64}$/.test(score.roundId || '') ? score.roundId : newId();
    const old = getRecord(id);
    if (old) return old;
    const practice = payload.timeMs < 1000 || payload.timeMs > 600000 || score.ranked === false;
    const r = store({ ...payload, id, finishedAt: Number(score.finishedAt) || Date.now(),
      status: practice ? 'practice' : 'pending', lastError: '', serverId: null });
    notify(r);
    pruneHistory();
    if (!practice) void flushPending();
    return r;
  }
  function loadScript(name, ready) {
    if (ready()) return Promise.resolve();
    if (scriptLoads.has(name)) return scriptLoads.get(name);
    const promise = new Promise((resolve, reject) => {
      const node = document.createElement('script');
      node.src = SDK_BASE + name; node.async = true; node.crossOrigin = 'anonymous';
      const timer = setTimeout(() => { node.remove(); reject(error('Firebase-kirjasto ei latautunut.', 'sdk-unavailable')); }, 8000);
      node.onload = () => { clearTimeout(timer); ready() ? resolve() : reject(error('Firebase-kirjasto puuttuu.', 'sdk-unavailable')); };
      node.onerror = () => { clearTimeout(timer); node.remove(); reject(error('Firebase-kirjasto ei latautunut.', 'sdk-unavailable')); };
      document.head.appendChild(node);
    }).finally(() => scriptLoads.delete(name));
    scriptLoads.set(name, promise);
    return promise;
  }
  async function loadSDK() {
    if (window.firebase?.firestore && window.firebase?.auth) return;
    if (!online()) throw error('Ei verkkoyhteyttä.', 'offline');
    if (!sdkPromise) sdkPromise = (async () => {
      await loadScript('firebase-app-compat.js', () => !!window.firebase?.initializeApp);
      await Promise.all([
        loadScript('firebase-firestore-compat.js', () => !!window.firebase?.firestore),
        loadScript('firebase-auth-compat.js', () => !!window.firebase?.auth)
      ]);
    })().finally(() => { sdkPromise = null; });
    return sdkPromise;
  }
  async function init() {
    if (db && auth) return db;
    await loadSDK();
    const f = window.firebase;
    const app = f.apps.find(a => a.name === APP_NAME) || f.initializeApp(FIREBASE_CONFIG, APP_NAME);
    db = app.firestore(); auth = app.auth();
    return db;
  }
  async function ensureAuth() {
    if (!online()) throw error('Ei verkkoyhteyttä.', 'offline');
    await init();
    if (auth.currentUser) return auth.currentUser;
    if (!authPromise) authPromise = (async () => {
      // Let persisted authentication restore before creating a new account.
      let unsubscribe = () => {};
      try {
        await timeout(new Promise((resolve, reject) => {
          unsubscribe = auth.onAuthStateChanged(resolve, reject);
        }), 8000);
      } finally { unsubscribe(); }
      if (auth.currentUser) return auth.currentUser;
      const credential = await auth.signInAnonymously();
      return credential.user;
    })().finally(() => { authPromise = null; });
    return authPromise;
  }
  function samePayload(a, b) {
    return ['playerName', 'instrumentName', 'noteCount', 'timeMs'].every(key => a[key] === b[key]);
  }
  function explainError(e) {
    const code = String(e?.code || '');
    if (code.includes('operation-not-allowed') || code.includes('admin-restricted-operation'))
      return 'Firebase: Anonymous-kirjautuminen on otettava käyttöön.';
    if (code.includes('permission-denied')) return 'Pilvitallennus estyi. Tarkista Firebase-säännöt.';
    if (code.includes('unauthorized-domain')) return 'Firebase ei hyväksy tämän sivuston osoitetta.';
    if (code === 'id-conflict') return 'Tulostunnisteen tiedot eivät täsmää. Tulosta ei korvattu.';
    return 'Tulos odottaa verkkoyhteyttä tai pilvipalvelua.';
  }
  function sendRecord(record) {
    if (inflight.has(record.id)) return inflight.get(record.id);
    if (record.status === 'saved' || record.status === 'practice') return Promise.resolve(record);
    const operation = (async () => {
      const user = await ensureAuth();
      if (!record.serverId) { record.serverId = user.uid + '_' + record.id; store(record); }
      const ref = db.collection(COLLECTION).doc(record.serverId);
      await db.runTransaction(async transaction => {
        const snap = await transaction.get(ref);
        if (snap.exists) {
          if (!samePayload(snap.data(), record)) throw error('Tunniste on jo käytössä.', 'id-conflict');
          return; // Previous commit was acknowledged late: do not create a duplicate.
        }
        if (!record.serverId.startsWith(user.uid + '_'))
          throw error('Tuloksen omistaja ei täsmää.', 'permission-denied');
        transaction.set(ref, {
          playerName: record.playerName, instrumentName: record.instrumentName,
          noteCount: record.noteCount, timeMs: record.timeMs,
          createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
        });
      });
      record.status = 'saved'; record.lastError = ''; record.savedAt = Date.now();
      store(record); notify(record); return record;
    })().catch(e => {
      record.status = 'pending'; record.lastError = explainError(e);
      store(record); notify(record); throw e;
    }).finally(() => { inflight.delete(record.id); });
    inflight.set(record.id, operation);
    return operation;
  }
  function flushPending() {
    if (flushPromise) return flushPromise;
    if (!online()) return Promise.resolve();
    flushPromise = (async () => {
      const attempted = new Set();
      while (online()) {
        const r = records().find(item => item.status !== 'saved' && item.status !== 'practice' && !attempted.has(item.id));
        if (!r) break;
        attempted.add(r.id);
        try {
          await timeout(sendRecord(r), 9000);
        } catch (e) {
          if (e.code === 'timeout') {
            r.status = 'pending'; r.lastError = explainError(e); store(r); notify(r);
          }
          break; // Avoid repeatedly hitting a misconfigured or offline service.
        }
      }
    })().finally(() => { flushPromise = null; });
    return flushPromise;
  }
  async function saveScore(score) {
    const r = queueScore(score);
    if (r.status !== 'practice') await timeout(sendRecord(r), 9000);
    return { id: r.serverId || r.id, playerName: r.playerName, status: r.status };
  }
  function readCache() {
    try { cacheMemory = JSON.parse(localStorage.getItem(CACHE_KEY)) || cacheMemory; } catch (_) {}
    if (!cacheMemory || cacheMemory.semester !== currentSemester().key) return [];
    return cacheMemory.rows || [];
  }
  function writeCache(rows) {
    // Keep the best ten of EACH group. This union also contains the top ten
    // for the 'all instruments' filter; a global 250 cutoff does not.
    const groupCounts = new Map();
    const compact = rows.filter(row => {
      const key = row.instrumentName + ':' + row.noteCount;
      const n = groupCounts.get(key) || 0;
      groupCounts.set(key, n + 1); return n < 10;
    }).map(({ id, playerName, instrumentName, noteCount, timeMs }) => ({ id, playerName, instrumentName, noteCount, timeMs }));
    cacheMemory = { semester: currentSemester().key, savedAt: Date.now(), rows: compact };
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(cacheMemory)); } catch (_) {}
  }
  async function loadScores() {
    // Filter-specific ranking is done by the UI BEFORE it takes the top ten.
    try {
      const operation = (async () => {
        await ensureAuth();
        const term = currentSemester(), T = window.firebase.firestore.Timestamp;
        const snap = await db.collection(COLLECTION)
          .where('createdAt', '>=', T.fromDate(term.start))
          .where('createdAt', '<', T.fromDate(term.end)).get({ source: 'server' });
        return snap.docs.map(doc => ({ ...doc.data(), id: doc.id }))
          .filter(row => typeof row.playerName === 'string' && INSTRUMENTS.includes(row.instrumentName)
            && [3, 4, 5].includes(row.noteCount) && Number.isFinite(row.timeMs) && row.timeMs >= 1000 && row.timeMs <= 600000)
          .sort((a, b) => a.timeMs - b.timeMs);
      })();
      const rows = await timeout(operation, 8000);
      writeCache(rows); return { rows, cached: false, error: '' };
    } catch (e) {
      return { rows: readCache(), cached: true, error: 'Verkon tulostaulua ei saatu päivitettyä.' };
    }
  }
  function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
  window.addEventListener('online', () => { void flushPending(); });
  window.addEventListener('pageshow', () => { void flushPending(); });
  window.addEventListener('storage', event => {
    if (!event.key?.startsWith(OUTBOX_PREFIX) || !event.newValue) return;
    try {
      const r = JSON.parse(event.newValue);
      if (r?.id && event.key === OUTBOX_PREFIX + r.id) { memory.delete(r.id); const current = getRecord(r.id); if (current) notify(current); }
    } catch (_) {}
  });
  const retryTimer = setInterval(() => {
    if (!document.hidden) void flushPending();
  }, 30000);
  // Exposed small API permits isolated tests without touching the real database.
  window.SavelkojuScoreboard = {
    init, saveScore, loadScores, queueScore, flushPending, getRecord, subscribe,
    cleanName, currentSemester, newId, records, explainError
  };
})();
