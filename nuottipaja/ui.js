const labels = { pitch: 'Sävel', duration: 'Aika-arvo' };
const opposite = role => role === 'pitch' ? 'duration' : 'pitch';
const noteSVG = (small = false) => `<svg class="note-icon${small ? ' small' : ''}" viewBox="0 0 44 70" aria-hidden="true"><ellipse cx="15" cy="57" rx="12" ry="8.5" transform="rotate(-18 15 57)" fill="currentColor"/><path d="M25 57V4" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"/></svg>`;
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

/** All callbacks are optional; promises and synchronous errors are supported. */
export function createUI(callbacks = {}) {
  const app = document.getElementById('app');
  const feedback = document.getElementById('feedback');
  const feedbackText = document.getElementById('feedback-text');
  let currentRole = null;
  let busy = false;
  let lastRoomRender = null;

  document.getElementById('feedback-close').addEventListener('click', () => { feedback.hidden = true; });

  function showMessage(message, isError) {
    feedbackText.textContent = message;
    feedback.classList.toggle('error', isError);
    feedback.hidden = !message;
  }
  function showError(message) { showMessage(message, true); }
  function showNotice(message) { showMessage(message, false); }
  function clearFeedback() { feedback.hidden = true; }

  function setBusy(value) {
    busy = !!value;
    app.setAttribute('aria-busy', String(busy));
    for (const element of app.querySelectorAll('button, input')) {
      element.disabled = busy || element.dataset.disabled === 'true';
    }
  }
  function paint(markup) {
    app.innerHTML = markup;
    setBusy(busy);
  }
  function call(name, ...args) {
    try {
      const result = callbacks[name]?.(...args);
      if (result && typeof result.catch === 'function') {
        result.catch(error => { setBusy(false); showError(error?.message || 'Jotain meni pieleen. Kokeile uudelleen.'); });
      }
    } catch (error) {
      setBusy(false);
      showError(error?.message || 'Jotain meni pieleen. Kokeile uudelleen.');
    }
  }
  function listen(id, name, ...args) {
    const element = app.querySelector(`#${id}`);
    if (element) element.addEventListener('click', () => call(name, ...args));
  }
  function pageHeader(action = 'Vaihda tehtävää', id = 'back') {
    return `<header class="page-header"><h1 class="brand">Nuottipaja</h1><button type="button" id="${id}" class="text-button">${action}</button></header>`;
  }

  function showHome() {
    lastRoomRender = null;
    currentRole = null;
    clearFeedback();
    paint(`<section class="home" aria-label="Nuottipaja – valitse tehtävä">
      <div class="start-picture">
        <img src="./assets/start.png" alt="Nuottipaja. Valitse tehtävä. Huilua soittava lapsi ja tabletilla aika-arvoja valitseva lapsi." width="1672" height="941" draggable="false" />
        <button type="button" id="choose-pitch" class="image-button pitch"><span class="sr-only">Sävel – soitan sävelet</span></button>
        <button type="button" id="choose-duration" class="image-button duration"><span class="sr-only">Aika-arvo – valitsen nuottien aika-arvot</span></button>
      </div>
      <p class="home-caption">Kahden pelaajan yhteyskokeilu</p>
      <p class="working" role="status">Valmistellaan yhteyttä…</p>
    </section>`);
    listen('choose-pitch', 'onRole', 'pitch');
    listen('choose-duration', 'onRole', 'duration');
  }

  function showMenu(role) {
    if (!labels[role]) return showHome();
    currentRole = role;
    lastRoomRender = null;
    clearFeedback();
    const duration = role === 'duration';
    paint(`<section class="page">
      ${pageHeader()}
      <div class="panel menu-panel">
        <p class="eyebrow">Sinun tehtäväsi</p>
        <h2 class="role-title"><span class="role-symbol${duration ? ' duration' : ''}" aria-hidden="true">${duration ? '♩' : 'G'}</span>${labels[role]}</h2>
        <p class="intro">${duration ? 'Sinä valitset nuotin aika-arvon. Pari antaa sille sävelen.' : 'Sinä annat nuotille sävelen. Pari valitsee sen aika-arvon.'}</p>
        <button id="create" type="button" class="button wide${duration ? ' orange' : ''}">Luo uusi peli</button>
        <div class="divider">tai liity parin peliin</div>
        <form id="join-form">
          <label for="room-code" class="input-label">Parilta saatu liittymiskoodi</label>
          <div class="code-entry"><input id="room-code" name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="off" placeholder="6 numeroa" aria-describedby="code-help" required /><button id="join" type="submit" class="button${duration ? ' orange' : ''}">Liity</button></div>
          <p id="code-help" class="small-note" style="margin-top:10px">Sama koodi yhdistää teidät. Huoneeseen mahtuu kaksi pelaajaa.</p>
        </form>
        <p class="working" role="status">Yhdistetään…</p>
      </div>
      <p class="small-note menu-footnote">Molemmat avaavat Nuottipajan omalla laitteellaan.</p>
    </section>`);
    listen('back', 'onBack');
    listen('create', 'onCreate', role);
    const input = app.querySelector('#room-code');
    input.addEventListener('input', () => {
      input.value = input.value.replace(/\D/g, '').slice(0, 6);
      input.setCustomValidity('');
    });
    app.querySelector('#join-form').addEventListener('submit', event => {
      event.preventDefault();
      if (busy) return;
      const code = input.value.trim();
      if (!/^\d{6}$/.test(code)) {
        input.setCustomValidity('Kirjoita kuusinumeroinen liittymiskoodi.');
        input.reportValidity();
        return;
      }
      clearFeedback();
      call('onJoin', code, role);
    });
  }

  function showRoom(state, uid) {
    const players = state?.players || {};
    const ownPlayer = players[uid];
    const role = ownPlayer?.role || currentRole;
    currentRole = role;
    const entries = Object.entries(players);
    const hasPitch = entries.some(([, player]) => player.role === 'pitch');
    const hasDuration = entries.some(([, player]) => player.role === 'duration');
    const ready = entries.length === 2 && hasPitch && hasDuration;
    const pair = state?.pair || {};
    const pitch = pair.pitch || null;
    const duration = pair.duration ?? null;
    const complete = !!pitch && duration != null;
    const ownAnswered = role === 'pitch' ? !!pitch : duration != null;
    const hasAnswer = !!pitch || duration != null;
    const signature = JSON.stringify({ code: state?.code, players, pitch, duration, round: state?.round, uid, role });
    if (lastRoomRender === signature) return;
    lastRoomRender = signature;
    const roomCode = String(state?.code || '');
    const disabled = condition => condition ? 'data-disabled="true" disabled' : '';
    const roleCard = cardRole => {
      const present = cardRole === 'pitch' ? hasPitch : hasDuration;
      const own = role === cardRole;
      return `<div class="role-card ${cardRole}${own ? ' own' : ''}"><span class="mini-symbol" aria-hidden="true">${cardRole === 'pitch' ? 'G' : '♩'}</span><div><strong>${labels[cardRole]}</strong><small>${own ? 'Sinun tehtäväsi' : present ? 'Pari mukana' : 'Odotetaan paria'}</small></div></div>`;
    };
    let pairMessage = 'Kumpikin antaa nuotille oman osuutensa.';
    if (!ready) pairMessage = 'Kokeilu alkaa, kun pari liittyy.';
    else if (complete) pairMessage = 'Yhteys toimii! Teitte yhdessä G-neljäsosan.';
    else if (ownAnswered) pairMessage = 'Oma osuutesi on valmis. Odotetaan paria.';
    else if (hasAnswer) pairMessage = 'Parin osuus on valmis. Nyt on sinun vuorosi.';

    paint(`<section class="page">
      ${pageHeader('Poistu huoneesta', 'leave')}
      <div class="room-head">
        <div class="code-block"><p class="eyebrow">${entries.length < 2 ? 'Kerro tämä koodi parillesi' : 'Yhteinen pelihuone'}</p><h2 class="room-code">${escapeHTML(roomCode)}</h2></div>
        <div class="room-status${ready ? ' ready' : ''}" role="status"><span class="status-dot" aria-hidden="true"></span>${ready ? 'Pari mukana · 2/2' : `Odotetaan paria · ${entries.length}/2`}</div>
      </div>
      <p class="room-instruction">${ready ? 'Teillä on yhteinen nuotti. Kokeilkaa lähettää sävel ja aika-arvo omilta laitteilta.' : `Pari valitsee omalla laitteellaan tehtävän ${escapeHTML(labels[opposite(role)] || '')} ja liittyy yllä olevalla koodilla.`}</p>
      <div class="roles">${roleCard('pitch')}${roleCard('duration')}</div>
      <div class="panel test-panel">
        <p class="eyebrow">Ensimmäinen yhteinen nuotti</p>
        <h2 class="test-title">Yhteyskokeilu</h2>
        <p class="test-subtitle">${role === 'pitch' ? 'Anna nuotille sävel G. Pari valitsee sen keston.' : 'Valitse neljäsosa. Pari antaa nuotille sävelen G.'}</p>
        <div class="pair-display" aria-label="Yhteinen nuotti">
          <div class="answer-tile${pitch ? ' filled' : ''}"><small>Sävel</small><span class="answer-value${pitch ? '' : ' empty'}" aria-label="${pitch ? `Sävel ${escapeHTML(pitch)}` : 'Sävel puuttuu'}">${pitch ? escapeHTML(pitch) : '–'}</span></div>
          <span class="plus" aria-hidden="true">+</span>
          <div class="answer-tile duration${duration != null ? ' filled' : ''}"><small>Aika-arvo</small><span class="answer-value${duration != null ? '' : ' empty'}" aria-label="${duration != null ? 'Neljäsosanuotti, yksi isku' : 'Aika-arvo puuttuu'}">${duration != null ? noteSVG() : '–'}</span></div>
        </div>
        <p class="pair-feedback${complete ? ' success' : ''}" role="status" aria-live="polite">${pairMessage}</p>
        ${role === 'pitch'
          ? `<button id="send-pitch" class="button send-button" type="button" ${disabled(!ready || ownAnswered)}> ${ownAnswered ? 'G lähetetty ✓' : 'Lähetä sävel G'}</button>`
          : `<button id="send-duration" class="button orange send-button" type="button" ${disabled(!ready || ownAnswered)}>${noteSVG(true)}${ownAnswered ? 'Neljäsosa lähetetty ✓' : 'Valitse neljäsosa'}</button>`}
        <p class="test-hint">${role === 'pitch' ? 'Tässä kokeessa sävel annetaan painikkeella. Mikrofoni lisätään myöhemmin.' : 'Neljäsosanuotti kestää yhden iskun. Tässä kokeessa valittavana on yksi aika-arvo.'}</p>
        <p class="working" role="status">Päivitetään yhteistä nuottia…</p>
      </div>
      <div class="room-actions"><button id="reset" class="text-button" type="button" ${disabled(!ready || !hasAnswer)}>Kokeile uudelleen</button>${callbacks.onChangeRole && entries.length < 2 ? '<button id="change-role" class="text-button" type="button">Vaihda omaa tehtävää</button>' : ''}</div>
      <p class="small-note room-footnote">Valinnat näkyvät molemmilla laitteilla. Nimiä ei kysytä.</p>
    </section>`);
    listen('leave', 'onLeave');
    listen('send-pitch', 'onSendPitch', 'G');
    listen('send-duration', 'onSendDuration', 1);
    listen('reset', 'onReset');
    listen('change-role', 'onChangeRole', opposite(role));
  }

  function showRoleConflict(code, requestedRole) {
    const available = opposite(requestedRole);
    clearFeedback();
    paint(`<section class="page">${pageHeader()}<div class="panel menu-panel">
      <p class="eyebrow">Pelihuone ${escapeHTML(code)}</p><h2 class="role-title">Tehtävä on varattu</h2>
      <p class="intro">Parisi valitsi jo tehtävän ${escapeHTML(labels[requestedRole])}. Voit ottaa tehtävän ${escapeHTML(labels[available])} ja liittyä samaan peliin.</p>
      <button id="join-opposite" class="button wide${available === 'duration' ? ' orange' : ''}" type="button">Valitse ${escapeHTML(labels[available])} ja liity</button>
      <p class="working" role="status">Liitytään…</p></div></section>`);
    listen('back', 'onBack');
    listen('join-opposite', 'onJoin', code, available);
  }

  return { showHome, showMenu, showRoom, showRoleConflict, setBusy, showError, showNotice };
}
