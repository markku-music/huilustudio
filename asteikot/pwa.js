// Registration only: starting the microphone remains an explicit user action.
(() => {
  'use strict';
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' })
      .catch(error => console.warn('Sovelluksen offline-tallennus ei onnistunut:', error));
  });
})();
