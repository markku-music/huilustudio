/* Puhallinstartti v23.10.0: smooth calibration ring + stable portrait rotate message. */
const CACHE_PREFIX = 'puhallinstartti|' + encodeURIComponent(self.registration.scope) + '|';
const CACHE_NAME = CACHE_PREFIX + '23.10.0-calibration-rotate-stable';
const ASSETS = [
  "./",
  "./index.html",
  "./Lamppu.wav",
  "./assets/icons/apple-touch-icon.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable-192.png",
  "./assets/icons/icon-maskable-512.png",
  "./assets/themes/classic/background.webp",
  "./assets/themes/classic/cover_disabled.webp",
  "./assets/themes/classic/empty.webp",
  "./assets/themes/classic/notes/A.webp",
  "./assets/themes/classic/notes/B.webp",
  "./assets/themes/classic/notes/C.webp",
  "./assets/themes/classic/notes/D.webp",
  "./assets/themes/classic/notes/E.webp",
  "./assets/themes/classic/notes/Es.webp",
  "./assets/themes/classic/notes/F.webp",
  "./assets/themes/classic/notes/G.webp",
  "./assets/themes/classic/notes/H.webp",
  "./assets/themes/concert/background.webp",
  "./assets/themes/concert/cover_disabled.webp",
  "./assets/themes/concert/empty.webp",
  "./assets/themes/concert/notes/A.webp",
  "./assets/themes/concert/notes/B.webp",
  "./assets/themes/concert/notes/C.webp",
  "./assets/themes/concert/notes/D.webp",
  "./assets/themes/concert/notes/E.webp",
  "./assets/themes/concert/notes/Es.webp",
  "./assets/themes/concert/notes/F.webp",
  "./assets/themes/concert/notes/G.webp",
  "./assets/themes/concert/notes/H.webp",
  "./assets/themes/kids/background.webp",
  "./assets/themes/kids/cover_disabled.webp",
  "./assets/themes/kids/empty.webp",
  "./assets/themes/kids/notes/A.webp",
  "./assets/themes/kids/notes/B.webp",
  "./assets/themes/kids/notes/C.webp",
  "./assets/themes/kids/notes/D.webp",
  "./assets/themes/kids/notes/E.webp",
  "./assets/themes/kids/notes/Es.webp",
  "./assets/themes/kids/notes/F.webp",
  "./assets/themes/kids/notes/G.webp",
  "./assets/themes/kids/notes/H.webp",
  "./audio-manager.js",
  "./manifest.webmanifest",
  "./resonator-engine.js",
  "./scoreboard.js"
];

const SDK_URLS = [
  'https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore-compat.js'
];
const ROOT_URL = new URL('./', self.registration.scope).href;
const INDEX_URL = new URL('./index.html', self.registration.scope).href;
const CORE_URLS = new Set(ASSETS.map(path => new URL(path, self.registration.scope).href));
const SDK_SET = new Set(SDK_URLS);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const requests = [...CORE_URLS].map(url => new Request(url, { cache: 'reload' }));
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(requests);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    // Legacy unscoped caches are deliberately left alone: ownership cannot
    // safely be inferred from their name when several games share a domain.
    await self.clients.claim();
  })());
});

function canStore(url, response) {
  if (!response || response.status !== 200 || !response.ok) return false;
  if (!CORE_URLS.has(url) && !SDK_SET.has(url)) return false;
  // A hosting service's HTML 200 fallback must not become a cached JS file.
  if (url.endsWith('.js') && !/javascript|ecmascript/i.test(response.headers.get('content-type') || '')) return false;
  return true;
}

async function respond(request) {
  const cache = await caches.open(CACHE_NAME);
  const url = new URL(request.url);
  const canonical = url.origin + url.pathname;
  const isAppPage = request.mode === 'navigate' && (canonical === ROOT_URL || canonical === INDEX_URL);
  const cacheKey = isAppPage ? INDEX_URL : request;
  const cached = await cache.match(cacheKey);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (canStore(request.url, response)) await cache.put(request, response.clone());
    return response;
  } catch (_) {
    if (isAppPage) {
      const page = await cache.match(INDEX_URL);
      if (page) return page;
    }
    // Never return index.html to a script, image, audio or API request.
    return Response.error();
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const inScope = url.origin === self.location.origin && url.href.startsWith(self.registration.scope);
  if (!inScope && !SDK_SET.has(request.url)) return;
  const response = respond(request);
  event.respondWith(response);
  event.waitUntil(response.then(() => {}, () => {}));
});
