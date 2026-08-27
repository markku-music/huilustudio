(function () {
  "use strict";

  const DB_NAME = "pikakirjoitin3";
  const DB_VERSION = 1;
  const STORE_NAME = "recentProjects";
  const FALLBACK_KEY = "pikakirjoitin3.recentProjects.v1";
  const MAX_RECENTS = 50;

  function clonePlain(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function makeId() {
    try {
      if (crypto && typeof crypto.randomUUID === "function") return crypto.randomUUID();
    } catch (error) {}
    return "pk3-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  function normalizePayload(payload) {
    if (!payload || typeof payload !== "object" || !payload.score || typeof payload.score !== "object") {
      throw new Error("Virheellinen Pikakirjoitin-projekti.");
    }
    const copy = clonePlain(payload);
    copy.format = copy.format || "Pikakirjoitin3";
    copy.version = copy.version || "0.17.4";
    copy.projectId = String(copy.projectId || makeId());
    copy.savedAt = copy.savedAt || new Date().toISOString();
    copy.settings = copy.settings && typeof copy.settings === "object" ? copy.settings : {};
    return copy;
  }

  function recordFromPayload(payload) {
    const copy = normalizePayload(payload);
    const score = copy.score || {};
    const meta = score.metadata || {};
    const now = new Date().toISOString();
    copy.savedAt = now;
    return {
      id: copy.projectId,
      title: String(meta.title || copy.settings.title || "").trim(),
      composer: String(meta.composer || copy.settings.composer || "").trim(),
      updatedAt: now,
      payload: copy
    };
  }

  function openDb() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) {
        reject(new Error("IndexedDB ei ole käytettävissä."));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = function () {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("updatedAt", "updatedAt", { unique: false });
        }
      };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error || new Error("IndexedDB:n avaaminen epäonnistui.")); };
    });
  }

  function idbRequest(request) {
    return new Promise(function (resolve, reject) {
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error || new Error("IndexedDB-operaatio epäonnistui.")); };
    });
  }

  async function withStore(mode, callback) {
    const db = await openDb();
    try {
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      const done = new Promise(function (resolve, reject) {
        tx.oncomplete = resolve;
        tx.onerror = function () { reject(tx.error || new Error("IndexedDB-transaktio epäonnistui.")); };
        tx.onabort = function () { reject(tx.error || new Error("IndexedDB-transaktio keskeytyi.")); };
      });
      const result = await callback(store, tx);
      await done;
      return result;
    } finally {
      db.close();
    }
  }

  function fallbackRead() {
    try {
      const raw = localStorage.getItem(FALLBACK_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (error) {
      return [];
    }
  }

  function fallbackWrite(list) {
    try {
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(list.slice(0, MAX_RECENTS)));
      return true;
    } catch (error) {
      return false;
    }
  }

  async function list() {
    try {
      const records = await withStore("readonly", function (store) {
        return idbRequest(store.getAll());
      });
      return (records || [])
        .sort(function (a, b) { return String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")); })
        .slice(0, MAX_RECENTS);
    } catch (error) {
      return fallbackRead()
        .sort(function (a, b) { return String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")); })
        .slice(0, MAX_RECENTS);
    }
  }

  async function trimIdb() {
    const records = await list();
    if (records.length <= MAX_RECENTS) return;
    const keep = new Set(records.slice(0, MAX_RECENTS).map(function (r) { return r.id; }));
    await withStore("readwrite", async function (store) {
      const all = await idbRequest(store.getAll());
      for (const record of all || []) {
        if (!keep.has(record.id)) store.delete(record.id);
      }
    });
  }

  async function save(payload) {
    const record = recordFromPayload(payload);
    try {
      await withStore("readwrite", function (store) {
        store.put(record);
        return Promise.resolve();
      });
      // Tehdään trimmaus suoraan kaikista riveistä, jotta enimmäismäärä on oikeasti 50.
      const db = await openDb();
      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const all = await idbRequest(store.getAll());
        all.sort(function (a, b) { return String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")); });
        all.slice(MAX_RECENTS).forEach(function (old) { store.delete(old.id); });
        await new Promise(function (resolve, reject) {
          tx.oncomplete = resolve;
          tx.onerror = function () { reject(tx.error); };
          tx.onabort = function () { reject(tx.error); };
        });
      } finally {
        db.close();
      }
      return record;
    } catch (error) {
      let items = fallbackRead().filter(function (item) { return item.id !== record.id; });
      items.unshift(record);
      if (!fallbackWrite(items.slice(0, MAX_RECENTS))) throw error;
      return record;
    }
  }

  async function remove(id) {
    const key = String(id || "");
    if (!key) return;
    try {
      await withStore("readwrite", function (store) {
        store.delete(key);
        return Promise.resolve();
      });
    } catch (error) {
      fallbackWrite(fallbackRead().filter(function (item) { return item.id !== key; }));
    }
  }

  async function get(id) {
    const key = String(id || "");
    if (!key) return null;
    try {
      return await withStore("readonly", function (store) {
        return idbRequest(store.get(key));
      }) || null;
    } catch (error) {
      return fallbackRead().find(function (item) { return item.id === key; }) || null;
    }
  }

  window.PikakirjoitinRecentProjects = {
    MAX_RECENTS: MAX_RECENTS,
    list: list,
    save: save,
    remove: remove,
    get: get,
    normalizePayload: normalizePayload,
    makeId: makeId
  };
})();
