import { qrcodegen } from './vendor/qrcodegen.js';

export function parseInvite(href) {
  const url = new URL(href);
  const code = url.searchParams.get('pin');
  if (!/^\d{3}$/.test(code || '')) return null;
  const value = url.searchParams.get('v');
  const generation = value && /^\d{1,16}$/.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : null;
  return { code, generation };
}

export function inviteURL(href, code, generation) {
  const url = new URL(href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('pin', code);
  url.searchParams.set('v', String(generation));
  return url.href;
}

export function inviteChoice(state, uid, generation, now = Date.now()) {
  if (!state || state.expiresAt <= now) return { status: 'closed' };
  if (generation != null && state.createdAt !== generation) return { status: 'old' };
  if (state.players[uid]) return { status: 'resume', role: state.players[uid].role };
  const roles = Object.values(state.players).map(player => player.role);
  if (roles.length >= 2) return { status: 'full' };
  return { status: 'available', role: roles.includes('pitch') ? 'duration' : 'pitch' };
}

export function qrSVG(text) {
  const qr = qrcodegen.QrCode.encodeText(text, qrcodegen.QrCode.Ecc.MEDIUM);
  const border = 4, size = qr.size + border * 2;
  let path = '';
  for (let y = 0; y < qr.size; y++) for (let x = 0; x < qr.size; x++) {
    if (qr.getModule(x, y)) path += `M${x + border},${y + border}h1v1h-1z`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="Skannaa ja liity tähän pelihuoneeseen" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="white"/><path d="${path}" fill="black"/></svg>`;
}
