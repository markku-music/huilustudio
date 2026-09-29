if ('serviceWorker' in navigator && window.isSecureContext) {
 window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Offline-tallennus ei onnistunut:', error)));
}
