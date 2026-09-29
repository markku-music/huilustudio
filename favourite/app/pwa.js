(() => {
  'use strict';
  const button = document.getElementById('pwaButton');
  const dialog = document.getElementById('pwaDialog');
  const help = document.getElementById('pwaHelp');
  const status = document.getElementById('pwaStatus');
  const installButton = document.getElementById('pwaInstall');
  const updateButton = document.getElementById('pwaUpdate');
  const updateHelp = document.getElementById('pwaUpdateHelp');
  const standalone = matchMedia('(display-mode: standalone)');
  const apple = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const supported = 'serviceWorker' in navigator && window.isSecureContext && location.protocol !== 'file:';
  let installPrompt = null;
  let registration = null;
  let waitingWorker = null;
  let updateRequested = false;
  let installed = standalone.matches || navigator.standalone === true;

  function refresh() {
    button.hidden = installed && !waitingWorker;
    button.textContent = waitingWorker ? 'Päivitä' : 'Asenna';
    button.dataset.update = String(Boolean(waitingWorker));
    button.setAttribute('aria-label', waitingWorker ? 'Sovelluksen päivitys' : 'Asenna Nuottiseikkailu');
    installButton.hidden = installed || !installPrompt;
    updateButton.hidden = updateHelp.hidden = !waitingWorker;
    help.textContent = installed ? 'Nuottiseikkailu on avattu sovelluksena.' : apple
      ? 'Avaa tämä osoite Safarissa. Valitse Jaa → Lisää Koti-valikkoon. Jos näet Avaa verkkosovelluksena -valinnan, pidä se päällä. Käynnistä sitten Nuottiseikkailun kuvakkeesta.'
      : installPrompt
        ? 'Paina Asenna sovellus. Nuottiseikkailu avautuu jatkossa omasta kuvakkeestaan.'
        : 'Valitse selaimen valikosta Asenna sovellus tai Lisää aloitusnäyttöön. Macin Safarissa valitse Tiedosto → Lisää Dockiin.';
    if (!supported) help.textContent = 'Avaa sovellus HTTPS-verkko-osoitteesta, esimerkiksi GitHub Pagesista. ZIP-paketista tai suoraan tiedostona avattua sivua ei voi asentaa PWA:na.';
  }
  refresh();
  button.addEventListener('click', () => { refresh(); dialog.showModal(); });
  document.getElementById('pwaClose').addEventListener('click', () => dialog.close());
  standalone.addEventListener('change', () => {
    installed = standalone.matches || navigator.standalone === true;
    refresh();
  });
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    refresh();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    installPrompt = null;
    refresh();
    dialog.close();
  });
  installButton.addEventListener('click', async () => {
    if (!installPrompt) return;
    const prompt = installPrompt;
    installPrompt = null;
    installButton.hidden = true;
    try { await prompt.prompt(); await prompt.userChoice; }
    catch { /* Selaimen oma asennusvalikko jää käytettäväksi. */ }
    refresh();
  });
  updateButton.addEventListener('click', () => {
    const worker = registration?.waiting || waitingWorker;
    if (!worker) return;
    // Toinen avoin ikkuna on voinut jo ottaa saman päivityksen käyttöön.
    if (worker.state === 'activated') { location.reload(); return; }
    updateRequested = true;
    updateButton.disabled = true;
    updateButton.textContent = 'Päivitetään…';
    worker.postMessage({type: 'ACTIVATE_UPDATE'});
  });
  if (!supported) {
    status.textContent = 'Offline-käyttö otetaan käyttöön verkko-osoitteesta.';
    return;
  }
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (updateRequested) location.reload();
  });
  function offerUpdate(worker) {
    waitingWorker = worker;
    refresh();
  }
  function offlineReady() {
    status.textContent = 'Valmis offline-käyttöön. Voit käyttää sovellusta myös ilman verkkoyhteyttä.';
  }
  function watch(worker) {
    if (!worker) return;
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed' && registration.active) offerUpdate(worker);
      if (worker.state === 'activated') offlineReady();
      if (worker.state === 'redundant' && !registration.active)
        status.textContent = 'Offline-tallennus ei valmistunut. Tarkista yhteys ja avaa sovellus uudelleen.';
    });
  }
  navigator.serviceWorker.register('./sw.js', {updateViaCache: 'none'}).then(reg => {
    registration = reg;
    if (reg.waiting) offerUpdate(reg.waiting);
    watch(reg.installing);
    reg.addEventListener('updatefound', () => watch(reg.installing));
    if (reg.active?.state === 'activated') offlineReady();
    else watch(reg.active);
    let lastCheck = Date.now();
    function checkUpdate() {
      if (document.hidden || !navigator.onLine || Date.now() - lastCheck < 60000) return;
      lastCheck = Date.now();
      reg.update().catch(() => {});
    }
    document.addEventListener('visibilitychange', checkUpdate);
    window.addEventListener('online', checkUpdate);
  }).catch(() => {
    status.textContent = 'Offline-käyttö ei ole vielä valmis. Tarkista yhteys ja avaa sovellus uudelleen.';
  });
})();
