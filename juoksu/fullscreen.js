/* Presentation only: race timing, audio, score layout and records stay in
 * their existing modules. Fullscreen is requested directly from a click. */
(() => {
  'use strict';
  const el = id => document.getElementById(id);
  const root = document.documentElement;
  const panel = el('settingsDialog');
  const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement;

  function openSettings() {
    if (!panel.open) panel.showModal();
  }
  function closeSettings() {
    if (panel.open) panel.close();
  }
  function syncFullscreen() {
    el('fullscreenToggle').textContent = fullscreenElement() ? 'Poistu koko näytöstä' : 'Siirry koko näyttöön';
  }
  async function enterFullscreen() {
    if (fullscreenElement()) return true;
    const request = root.requestFullscreen || root.webkitRequestFullscreen;
    if (!request) {
      el('fullscreenStatus').textContent = 'Tämä selain ei tue koko näytön tilaa. Voit pelata selainikkunassa.';
      return false;
    }
    try {
      await request.call(root);
      el('fullscreenStatus').textContent = '';
      syncFullscreen();
      return true;
    } catch (error) {
      el('fullscreenStatus').textContent = 'Koko näytön tila ei auennut. Voit yrittää uudelleen tästä tai pelata selainikkunassa.';
      syncFullscreen();
      return false;
    }
  }

  el('settingsOpen').addEventListener('click', openSettings);
  el('settingsClose').addEventListener('click', closeSettings);
  panel.addEventListener('click', event => {
    if (event.target !== panel) return;
    const box = panel.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeSettings();
  });
  panel.addEventListener('close', () => el('settingsOpen').focus());

  el('startGame').addEventListener('click', async () => {
    // Start both requests in this click, before awaiting either of them.
    // Reuse the existing microphone handler, including its calibration.
    const entering = enterFullscreen();
    const microphone = mode === 'mic' && !ready && !opening ? el('mic').onclick() : null;
    el('startScreen').hidden = true;
    const success = await entering;
    await microphone;
    // Successful startup goes straight to the field. Open settings only
    // when fullscreen or microphone startup needs the user's attention.
    if (!success || (mode === 'mic' && !ready && !opening)) openSettings();
    else if (!panel.open) el('settingsOpen').focus();
  });
  el('fullscreenToggle').addEventListener('click', async () => {
    if (fullscreenElement()) {
      const leave = document.exitFullscreen || document.webkitExitFullscreen;
      try { await leave.call(document); }
      catch { el('fullscreenStatus').textContent = 'Poistu koko näytöstä selaimen Esc-toiminnolla.'; }
      syncFullscreen();
    } else {
      const success = await enterFullscreen();
      if (success) {
        el('startScreen').hidden = true;
        closeSettings();
      }
    }
  });
  document.addEventListener('fullscreenchange', syncFullscreen);
  document.addEventListener('webkitfullscreenchange', syncFullscreen);
  syncFullscreen();

  // Mirror opening/calibration feedback while the settings panel is closed.
  const startupNotice = el('startupNotice');
  function syncStartupNotice() {
    startupNotice.hidden = mode !== 'mic' || !opening;
    startupNotice.textContent = startupNotice.hidden ? '' : el('status').textContent;
  }
  new MutationObserver(syncStartupNotice).observe(el('status'), {childList:true,subtree:true,characterData:true});
  syncStartupNotice();

})();
