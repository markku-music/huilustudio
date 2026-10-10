import {SONGS,songById} from './songs.js';
import {scoreSVG,rhythmIcon,noteName} from './score.js';
import {elapsed} from './game-state.js';
import { inviteURL, qrSVG } from './invite.js';
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
  let gameState=null,gameRole=null,micOn=false;
  const time=ms=>(ms/1000).toFixed(1).replace('.',',')+' s';
  function updateLive(){if(!gameState)return;const g=gameState.game,song=songById(g.song),now=Date.now();const score=app.querySelector('#shared-score');if(score)score.innerHTML=scoreSVG(song,g,now);for(const r of ['pitch','duration']){const el=app.querySelector('#clock-'+r);if(el)el.textContent=time(elapsed(g,r,now));}const cd=app.querySelector('#countdown');if(cd){cd.hidden=g.phase!=='play'||now>=g.startAt;cd.textContent=Math.ceil((g.startAt-now)/1000);}for(const b of app.querySelectorAll('[data-answer]')){const disabled=g.phase!=='play'||now<g.startAt||!!g.finished[gameRole];b.dataset.disabled=String(disabled);b.disabled=busy||disabled;}const mb=app.querySelector('#mic');if(mb)mb.textContent=micOn?'Mikrofoni päällä ✓':'Avaa mikrofoni';}
  setInterval(updateLive,120);

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
    gameState=null;
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
      <button id="join-code-home" class="text-button home-join" type="button">Liity koodilla</button>
      <p class="working" role="status">Valmistellaan yhteyttä…</p>
    </section>`);
    listen('choose-pitch', 'onRole', 'pitch');
    listen('choose-duration', 'onRole', 'duration');
    listen('join-code-home', 'onManualJoin');
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
        <p class="intro" hidden>${duration ? 'Sinä valitset nuotin aika-arvon. Pari antaa sille sävelen.' : 'Sinä annat nuotille sävelen. Pari valitsee sen aika-arvon.'}</p>
        <button id="create" type="button" class="button wide${duration ? ' orange' : ''}">Luo uusi peli</button>
        <div class="divider">tai liity parin peliin</div>
        <form id="join-form">
          <label for="room-code" class="input-label">Parilta saatu liittymiskoodi</label>
          <div class="code-entry"><input id="room-code" name="code" inputmode="numeric" pattern="[0-9]{3}" maxlength="3" autocomplete="off" placeholder="3 numeroa" aria-describedby="code-help" required /><button id="join" type="submit" class="button${duration ? ' orange' : ''}">Liity</button></div>
          <p hidden id="code-help" class="small-note" style="margin-top:10px">Sama koodi yhdistää teidät. Huoneeseen mahtuu kaksi pelaajaa.</p>
        </form>
        <p class="working" role="status">Yhdistetään…</p>
      </div>
      <p hidden class="small-note menu-footnote">Molemmat avaavat Nuottipajan omalla laitteellaan.</p>
    </section>`);
    listen('back', 'onBack');
    listen('create', 'onCreate', role);
    const input = app.querySelector('#room-code');
    input.addEventListener('input', () => {
      input.value = input.value.replace(/\D/g, '').slice(0, 3);
      input.setCustomValidity('');
    });
    app.querySelector('#join-form').addEventListener('submit', event => {
      event.preventDefault();
      if (busy) return;
      const code = input.value.trim();
      if (!/^\d{3}$/.test(code)) {
        input.setCustomValidity('Kirjoita kolminumeroinen liittymiskoodi.');
        input.reportValidity();
        return;
      }
      clearFeedback();
      call('onJoin', code, role);
    });
  }

  function showRoom(state, uid) {
    if(Object.keys(state.players).length===2 && state.game)return showGame(state,uid);
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
    const invitation = state?.owner === uid && !ready ? inviteURL(window.location.href, roomCode, state.createdAt) : null;
    const inviteCard = invitation ? `<div class="panel invitation-panel"><h2>Kutsu pari peliin</h2><p>Skannaa ja liity peliin</p><div class="room-qr">${qrSVG(invitation)}</div><p class="manual-pin">Tai liity käsin: <strong>${escapeHTML(roomCode)}</strong></p><button id="copy-invite" class="text-button" type="button">Kopioi kutsulinkki</button></div>` : ''; 
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
      ${inviteCard}
      <div class="room-head">
        ${invitation ? '' : `<div class="code-block"><p class="eyebrow">${entries.length < 2 ? 'Pelihuone' : 'Yhteinen pelihuone'}</p><h2 class="room-code">${escapeHTML(roomCode)}</h2></div>`}
        <div class="room-status${ready ? ' ready' : ''}" role="status"><span class="status-dot" aria-hidden="true"></span>${ready ? 'Pari mukana · 2/2' : `Odotetaan paria · ${entries.length}/2`}</div>
      </div>
      <p hidden class="room-instruction">${ready ? 'Teillä on yhteinen nuotti. Kokeilkaa lähettää sävel ja aika-arvo omilta laitteilta.' : `Pari skannaa QR-koodin tai avaa pelin ja valitsee Liity koodilla. Vapaa tehtävä on ${escapeHTML(labels[opposite(role)] || '')}.`}</p>
      <div class="roles">${roleCard('pitch')}${roleCard('duration')}</div>
      <div hidden class="panel test-panel">
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
      <div hidden class="room-actions"><button id="reset" class="text-button" type="button" ${disabled(!ready || !hasAnswer)}>Kokeile uudelleen</button>${callbacks.onChangeRole && entries.length < 2 ? '<button id="change-role" class="text-button" type="button">Vaihda omaa tehtävää</button>' : ''}</div>
      <p hidden class="small-note room-footnote">Valinnat näkyvät molemmilla laitteilla. Nimiä ei kysytä.</p>
    </section>`);
    app.querySelector('#copy-invite')?.addEventListener('click', async () => { try { await navigator.clipboard.writeText(invitation); showNotice('Kutsulinkki kopioitu.'); } catch { showNotice('Kopiointi ei onnistunut. Käytä QR-koodia tai PIN-koodia.'); } });
    listen('leave', 'onLeave');
    listen('send-pitch', 'onSendPitch', 'G');
    listen('send-duration', 'onSendDuration', 1);
    listen('reset', 'onReset');
    listen('change-role', 'onChangeRole', opposite(role));
  }

  function showGame(state,uid){
    const g=state.game,role=state.players[uid].role,song=songById(g.song);
    const signature=JSON.stringify({g,uid,players:state.players});
    if(lastRoomRender===signature){gameState=state;updateLive();return;}
    lastRoomRender=signature;currentRole=role;const selecting=g.phase==='select',done=g.phase==='done';
    const options=SONGS.map(s=>`<button class="song-choice${s.id===g.song?' selected':''}" data-song="${s.id}" ${!selecting?'disabled data-disabled="true"':''}><strong>${s.title}</strong><small>${s.measures.length} tahtia</small></button>`).join('');
    const marks=['pitch','duration'].map(r=>`<span class="approval ${r}">${labels[r]} ${g.approved[r]?'✓':'○'}</span>`).join('');
    const times=['pitch','duration'].map(r=>`<div class="clock ${r}"><small>${labels[r]}${r===role?' · sinä':''}</small><strong id="clock-${r}">${time(elapsed(g,r,Date.now()))}</strong><span>${g.progress[r]} / ${song.notes.length}${g.finished[r]?' ✓':''}</span></div>`).join('');
    const inputs=role==='duration'?`<div class="rhythm-buttons">${[1,2].flatMap(d=>[false,true].map(rest=>`<button class="rhythm-button" data-answer="${rest?-d:d}" aria-label="${rest?'Tauko':'Nuotti'}, ${d===1?'neljäsosa':'puolikas'}">${rhythmIcon(d,rest)}<small>${rest?'Tauko · ':''}${d===1?'1 isku':'2 iskua'}</small></button>`)).join('')}</div>`:`<div class="mic-controls"><button id="mic" class="button">${micOn?'Mikrofoni päällä ✓':'Avaa mikrofoni'}</button><span id="heard" aria-live="off">—</span><button data-answer="-1" class="button secondary">Tauko</button></div><details class="test-controls"><summary>Testipainikkeet</summary><div class="pitch-buttons">${[...new Set(song.notes.filter(n=>!n.rest).map(n=>n.pitch))].sort((a,b)=>a-b).map(m=>`<button data-answer="${m}" class="button secondary">${noteName(m)}</button>`).join('')}</div></details>`;
    paint(`<section class="page game-page">${pageHeader('Poistu','leave')}<div class="game-room-line"><span>Huone ${state.code}</span><span class="role-tag ${role}">${labels[role]}</span></div>${selecting?`<div class="song-picker">${options}</div><div class="approval-row">${marks}<button id="approve" class="button${role==='duration'?' orange':''}" ${g.approved[role]?'disabled data-disabled="true"':''}>${g.approved[role]?'Hyväksytty ✓':'Hyväksy kappale'}</button></div>`:`<h2 class="song-title">${song.title}</h2>`}<div class="clocks">${times}</div><div class="panel score-panel"><div id="shared-score">${scoreSVG(song,g)}</div><div id="countdown" ${selecting||done?'hidden':''}></div></div>${done?`<div class="result"><span>Yhteisaika</span><strong>${time(elapsed(g,'pitch',Date.now())+elapsed(g,'duration',Date.now()))}</strong><button id="new-game" class="button">Uusi kierros</button></div>`:inputs}</section>`);
    gameState=state;gameRole=role;
    listen('leave','onLeave');listen('approve','onApprove',g.revision);listen('new-game','onRestart',g.revision);listen('mic','onMicrophone');
    for(const b of app.querySelectorAll('[data-song]'))b.addEventListener('click',()=>call('onChooseSong',b.dataset.song,g.revision));
    for(const b of app.querySelectorAll('[data-answer]'))b.addEventListener('click',()=>call('onAnswer',Number(b.dataset.answer),g.revision,g.progress[role]));
    updateLive();
  }
  function setMicrophone(value){micOn=value;updateLive();}
  function showHeard(midi){const e=app.querySelector('#heard');if(e)e.textContent=noteName(midi);}

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

  function showInvite(code, choice = { status: 'loading' }) {
    lastRoomRender = null;
    const messages = {
      loading: 'Tarkistetaan pelihuonetta…',
      closed: 'Tämä pelihuone on suljettu tai vanhentunut.',
      old: 'Tämä kutsu on vanhentunut. Pyydä parilta uusi QR-koodi.',
      full: 'Pelihuoneessa on jo kaksi pelaajaa.'
    };
    const available = choice.status === 'available';
    const resume = choice.status === 'resume';
    paint(`<section class="page">${pageHeader('Takaisin aloitukseen')}<div class="panel menu-panel">
      <p class="eyebrow">Pelihuone ${escapeHTML(code)}</p>
      <h2>${available ? 'Parisi odottaa!' : resume ? 'Tervetuloa takaisin!' : 'Kutsu peliin'}</h2>
      <p class="intro" role="status">${available ? `Vapaa tehtävä: <strong>${labels[choice.role]}</strong>` : resume ? `Oma tehtäväsi: <strong>${labels[choice.role]}</strong>` : messages[choice.status]}</p>
      ${available || resume ? `<button id="join-invite" class="button wide${choice.role === 'duration' ? ' orange' : ''}" type="button">${resume ? 'Palaa peliin' : 'Liity peliin'}</button>` : ''}
      <p class="working" role="status">Liitytään…</p></div></section>`);
    listen('back', 'onBack');
    listen('join-invite', 'onJoin', code, choice.role);
  }

  function showManualJoin() {
    lastRoomRender = null;
    clearFeedback();
    paint(`<section class="page">${pageHeader('Takaisin aloitukseen')}<div class="panel menu-panel">
      <h2>Liity koodilla</h2><p class="intro">Kirjoita parilta saatu kolminumeroinen PIN. Vapaa tehtävä tarkistetaan puolestasi.</p>
      <form id="manual-form"><label class="input-label" for="manual-code">PIN-koodi</label><div class="code-entry"><input id="manual-code" inputmode="numeric" pattern="[0-9]{3}" maxlength="3" placeholder="3 numeroa" autocomplete="off" required><button class="button" type="submit">Jatka</button></div></form>
      <p class="working" role="status">Tarkistetaan…</p></div></section>`);
    listen('back', 'onBack');
    const input = app.querySelector('#manual-code');
    input.addEventListener('input', () => { input.value = input.value.replace(/\D/g, '').slice(0,3); });
    app.querySelector('#manual-form').addEventListener('submit', event => { event.preventDefault(); if (!busy && /^\d{3}$/.test(input.value)) call('onInspectInvite', input.value); });
  }

  return { setMicrophone, showHeard, showHome, showMenu, showRoom, showRoleConflict, showInvite, showManualJoin, setBusy, showError, showNotice };
}
