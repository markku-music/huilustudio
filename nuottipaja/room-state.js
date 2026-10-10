import {freshGame} from './game-state.js';
export const ROLES = ['pitch', 'duration'];
export const ROOM_TTL = 24 * 60 * 60 * 1000;
export class RoomError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
const fail = (code, message) => { throw new RoomError(code, message); };
const roleValid = role => { if (!ROLES.includes(role)) fail('role', 'Valitse ensin Sävel tai Aika-arvo.'); };
const blank = () => ({ pitch: null, duration: null });
export function createRoomState(code, uid, role, now) {
  roleValid(role);
  if (!/^\d{3}$/.test(code)) fail('code', 'Koodissa pitää olla kolme numeroa.');
  return { game: freshGame(), code, owner: uid, players: { [uid]: { role, joinedAt: now } }, pair: blank(), round: 1, createdAt: now, updatedAt: now, expiresAt: now + ROOM_TTL };
}
export function assertRoom(room, now) {
  if (!room) fail('not-found', 'Tällä koodilla ei löytynyt peliä. Tarkista koodi pariltasi.');
  if (room.expiresAt <= now) fail('expired', 'Tämä pelihuone on vanhentunut. Luo uusi peli.');
}
export function joinRoomState(room, uid, role, now) {
  roleValid(role); assertRoom(room, now);
  if (room.players[uid]) {
    if (room.players[uid].role !== role) fail('own-role', 'Olet jo tässä huoneessa toisessa tehtävässä. Palaa valitsemaan se tehtävä.');
    return room;
  }
  const entries = Object.values(room.players);
  if (entries.length >= 2) fail('full', 'Pelihuone on täynnä. Siihen mahtuu kaksi pelaajaa.');
  if (entries.some(p => p.role === role)) fail('role-taken', `${role === 'pitch' ? 'Sävel' : 'Aika-arvo'} on jo varattu. Valitse toinen tehtävä ja liity samalla koodilla.`);
  return { ...room, players: { ...room.players, [uid]: { role, joinedAt: now } }, game: freshGame(room.game?.song, (room.game?.revision || 0) + 1), pair: blank(), round: room.round + 1, updatedAt: now };
}
export function changeRoleState(room, uid, role, now) {
  roleValid(role); assertRoom(room, now);
  if (!room.players[uid]) fail('not-member', 'Et ole enää tässä pelihuoneessa.');
  if (Object.keys(room.players).length !== 1) fail('paired', 'Tehtävää voi vaihtaa, kun olet huoneessa yksin.');
  if (room.players[uid].role === role) return room;
  return { ...room, players: { [uid]: { ...room.players[uid], role } }, game: freshGame(room.game?.song, (room.game?.revision || 0) + 1), pair: blank(), round: room.round + 1, updatedAt: now };
}
export function sendAnswerState(room, uid, kind, value, expectedRound, now) {
  assertRoom(room, now);
  if (room.round !== expectedRound) fail('stale-round', 'Yhteinen nuotti vaihtui. Anna valinta uudelleen.');
  const own = room.players[uid];
  if (!own) fail('not-member', 'Et ole enää tässä pelihuoneessa.');
  if (Object.keys(room.players).length !== 2) fail('waiting', 'Odota, että pari liittyy huoneeseen.');
  if (own.role !== kind) fail('wrong-role', 'Tämä valinta kuuluu parisi tehtävään.');
  if ((kind === 'pitch' && value !== 'G') || (kind === 'duration' && value !== 1)) fail('value', 'Tämä yhteyskokeilu käyttää G:tä ja neljäsosaa.');
  return { ...room, pair: { ...room.pair, [kind]: value }, updatedAt: now };
}
export function resetRoomState(room, uid, expectedRound, now) {
  assertRoom(room, now);
  if (!room.players[uid]) fail('not-member', 'Et ole enää tässä pelihuoneessa.');
  if (room.round !== expectedRound) return room;
  return { ...room, game: freshGame(room.game?.song, (room.game?.revision || 0) + 1), pair: blank(), round: room.round + 1, updatedAt: now };
}
export function leaveRoomState(room, uid, now) {
  if (!room || !room.players[uid]) return room;
  if (room.owner === uid) return null;
  const players = { ...room.players }; delete players[uid];
  return { ...room, players, game: freshGame(room.game?.song, (room.game?.revision || 0) + 1), pair: blank(), round: room.round + 1, updatedAt: now };
}
