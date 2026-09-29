/* Start screen and settings. */
(() => {
  'use strict';
  const el = id => document.getElementById(id);
  const panel = el('settingsDialog');

  function openSettings() {
    if (!panel.open) panel.showModal();
  }
  function closeSettings() {
    if (panel.open) panel.close();
  }
  el('settingsOpen').addEventListener('click', openSettings);
  el('settingsClose').addEventListener('click', closeSettings);
  panel.addEventListener('click', event => {
    if (event.target !== panel) return;
    const box = panel.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeSettings();
  });
  panel.addEventListener('close', () => el('settingsOpen').focus());

  el('startGame').addEventListener('click', () => {
    el('startScreen').hidden = true;
    if (mode === 'mic' && !ready && !opening) el('mic').onclick();
    el('settingsOpen').focus();
  });

  // Mirror opening/calibration feedback while the settings panel is closed.
  const startupNotice = el('startupNotice');
  function syncStartupNotice() {
    startupNotice.hidden = mode !== 'mic' || !opening;
    startupNotice.textContent = startupNotice.hidden ? '' : el('status').textContent;
  }
  new MutationObserver(syncStartupNotice).observe(el('status'), {childList:true,subtree:true,characterData:true});
  syncStartupNotice();

})();
