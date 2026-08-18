'use strict';

(() => {
  const CHECK_INTERVAL_MS = 5 * 60 * 1000;
  const VERSION_KEY = 'savelkoju-current-index-hash';
  const banner = document.getElementById('pwaUpdateBanner');
  const updateButton = document.getElementById('pwaUpdateButton');
  let registration = null;
  let currentIndexHash = localStorage.getItem(VERSION_KEY) || '';
  let checkRunning = false;

  async function sha256(text) {
    if (!crypto?.subtle) return String(text.length) + ':' + text.slice(0, 64);
    const data = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  }

  async function fetchIndexHash() {
    const url = new URL('./index.html', location.href);
    url.searchParams.set('_pwa_check', Date.now().toString());
    const response = await fetch(url.href, { cache: 'no-store', credentials: 'same-origin' });
    if (!response.ok) throw new Error('Version tarkistus epäonnistui: ' + response.status);
    return sha256(await response.text());
  }

  async function establishCurrentVersion() {
    try {
      const hash = await fetchIndexHash();
      if (!currentIndexHash) {
        currentIndexHash = hash;
        localStorage.setItem(VERSION_KEY, hash);
      }
    } catch (_) {}
  }

  async function checkForAppUpdate() {
    if (checkRunning || !navigator.onLine || location.protocol === 'file:') return;
    checkRunning = true;
    try {
      if (registration) registration.update().catch(() => {});
      const remoteHash = await fetchIndexHash();
      if (!currentIndexHash) {
        currentIndexHash = remoteHash;
        localStorage.setItem(VERSION_KEY, remoteHash);
      } else if (remoteHash !== currentIndexHash) {
        banner?.classList.remove('hidden');
      }
    } catch (_) {
      // Hetkellinen verkkovirhe: käynnissä oleva versio jatkaa normaalisti.
    } finally {
      checkRunning = false;
    }
  }

  async function activateUpdate() {
    updateButton.disabled = true;
    updateButton.textContent = 'Päivitetään…';
    try {
      if (registration) await registration.update().catch(() => {});
      const remoteHash = await fetchIndexHash().catch(() => '');
      if (remoteHash) {
        currentIndexHash = remoteHash;
        localStorage.setItem(VERSION_KEY, remoteHash);
      }
      const url = new URL(location.href);
      url.searchParams.set('_updated', Date.now().toString());
      location.replace(url.href);
    } catch (_) {
      updateButton.disabled = false;
      updateButton.textContent = 'Päivitä nyt';
    }
  }

  updateButton?.addEventListener('click', activateUpdate);

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', async () => {
      try {
        registration = await navigator.serviceWorker.register('./sw.js', {
          scope: './',
          updateViaCache: 'none'
        });
        await registration.update().catch(() => {});
      } catch (err) {
        console.warn('PWA service worker:', err);
      }
      await establishCurrentVersion();
      setTimeout(checkForAppUpdate, 2500);
      setInterval(checkForAppUpdate, CHECK_INTERVAL_MS);
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForAppUpdate();
  });
  window.addEventListener('online', checkForAppUpdate);
})();
