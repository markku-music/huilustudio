import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRoomState, joinRoomState, changeRoleState,
  sendAnswerState, resetRoomState, leaveRoomState,
  RoomError, ROOM_TTL
} from '../dist/room-state.js';

const NOW = 1_800_000_000_000;
const OWNER = 'owner-auth-uid';
const GUEST = 'guest-auth-uid';
const THIRD = 'third-auth-uid';
const code = '001234';
const solo = (role = 'pitch') => createRoomState(code, OWNER, role, NOW);
const paired = (role = 'pitch') => joinRoomState(solo(role), GUEST, role === 'pitch' ? 'duration' : 'pitch', NOW + 1);
const rejects = (fn, errorCode) => assert.throws(fn, error => error instanceof RoomError && error.code === errorCode);
function freeze(value) {
  if (value && typeof value === 'object') {
    Object.freeze(value);
    for (const child of Object.values(value)) freeze(child);
  }
  return value;
}

test('new room preserves leading-zero invitation and reserves only the creator role', () => {
  const room = solo('duration');
  assert.equal(room.code, '001234');
  assert.equal(room.owner, OWNER);
  assert.equal(room.players[OWNER].role, 'duration');
  assert.equal(Object.keys(room.players).length, 1);
  assert.deepEqual(room.pair, { pitch: null, duration: null });
  assert.equal(room.expiresAt - room.createdAt, ROOM_TTL);
});

test('creation rejects invalid invitation and unsupported role', () => {
  for (const invalid of ['1234', '1234567', 'abcdef', ' 001234', '-12345']) {
    rejects(() => createRoomState(invalid, OWNER, 'pitch', NOW), 'code');
  }
  rejects(() => solo('both'), 'role');
});

for (const ownerRole of ['pitch', 'duration']) {
  const guestRole = ownerRole === 'pitch' ? 'duration' : 'pitch';
  test(`${ownerRole} creator accepts only a guest with the opposite role`, () => {
    const room = freeze(solo(ownerRole));
    rejects(() => joinRoomState(room, GUEST, ownerRole, NOW + 1), 'role-taken');
    assert.equal(Object.keys(room.players).length, 1);
    const joined = joinRoomState(room, GUEST, guestRole, NOW + 2);
    assert.equal(joined.players[OWNER].role, ownerRole);
    assert.equal(joined.players[GUEST].role, guestRole);
    assert.equal(Object.keys(joined.players).length, 2);
  });
}

test('simultaneous join retried against the winner never admits a third player', () => {
  for (const [winner, loser] of [[GUEST, THIRD], [THIRD, GUEST]]) {
    const room = freeze(solo());
    const committed = joinRoomState(room, winner, 'duration', NOW + 1);
    rejects(() => joinRoomState(committed, loser, 'duration', NOW + 2), 'full');
    rejects(() => joinRoomState(committed, loser, 'pitch', NOW + 2), 'full');
    assert.equal(Object.keys(committed.players).length, 2);
    assert.equal(committed.players[loser], undefined);
  }
});

test('refresh/repeated join with the same authenticated player resumes without clearing answers', () => {
  let room = paired();
  room = sendAnswerState(room, OWNER, 'pitch', 'G', room.round, NOW + 2);
  const originalRound = room.round;
  const originalJoinedAt = room.players[GUEST].joinedAt;
  const resumed = joinRoomState(room, GUEST, 'duration', NOW + 20);
  assert.equal(resumed, room);
  assert.equal(resumed.pair.pitch, 'G');
  assert.equal(resumed.round, originalRound);
  assert.equal(resumed.players[GUEST].joinedAt, originalJoinedAt);
  rejects(() => joinRoomState(room, GUEST, 'pitch', NOW + 20), 'own-role');
});

test('missing and expired invitations do not create a room on join', () => {
  rejects(() => joinRoomState(null, GUEST, 'duration', NOW), 'not-found');
  const room = solo();
  rejects(() => joinRoomState(room, GUEST, 'duration', room.expiresAt), 'expired');
  rejects(() => joinRoomState(room, OWNER, 'pitch', room.expiresAt + 1), 'expired');
});

test('either contribution order produces the same shared G quarter note', () => {
  const answers = [[OWNER, 'pitch', 'G'], [GUEST, 'duration', 1]];
  for (const order of [answers, [...answers].reverse()]) {
    let room = freeze(paired());
    const round = room.round;
    for (const [uid, kind, value] of order) {
      room = freeze(sendAnswerState(room, uid, kind, value, round, NOW + 3));
    }
    assert.deepEqual(room.pair, { pitch: 'G', duration: 1 });
    assert.equal(room.round, round);
    assert.equal(Object.keys(room.players).length, 2);
  }
});

test('a transaction retried after the other player answers preserves that contribution', () => {
  const initial = paired();
  const firstCommitted = sendAnswerState(initial, GUEST, 'duration', 1, initial.round, NOW + 2);
  const secondCommitted = sendAnswerState(firstCommitted, OWNER, 'pitch', 'G', initial.round, NOW + 3);
  assert.deepEqual(secondCommitted.pair, { pitch: 'G', duration: 1 });
  assert.deepEqual(initial.pair, { pitch: null, duration: null });
});

test('a single player cannot send either portion before pairing', () => {
  for (const role of ['pitch', 'duration']) {
    const room = solo(role);
    rejects(() => sendAnswerState(room, OWNER, role, role === 'pitch' ? 'G' : 1, room.round, NOW + 1), 'waiting');
    assert.deepEqual(room.pair, { pitch: null, duration: null });
  }
});

test('role ownership, membership, and supported values are enforced', () => {
  const room = freeze(paired());
  rejects(() => sendAnswerState(room, THIRD, 'pitch', 'G', room.round, NOW + 2), 'not-member');
  rejects(() => sendAnswerState(room, OWNER, 'duration', 1, room.round, NOW + 2), 'wrong-role');
  rejects(() => sendAnswerState(room, GUEST, 'pitch', 'G', room.round, NOW + 2), 'wrong-role');
  rejects(() => sendAnswerState(room, OWNER, 'pitch', 'C', room.round, NOW + 2), 'value');
  rejects(() => sendAnswerState(room, GUEST, 'duration', 0.5, room.round, NOW + 2), 'value');
  rejects(() => sendAnswerState(room, GUEST, 'duration', '1', room.round, NOW + 2), 'value');
  rejects(() => sendAnswerState(room, OWNER, 'other', 'G', room.round, NOW + 2), 'wrong-role');
  assert.deepEqual(room.pair, { pitch: null, duration: null });
});

test('reset clears both answers and rejects an in-flight response for the previous round', () => {
  let room = paired();
  room = sendAnswerState(room, OWNER, 'pitch', 'G', room.round, NOW + 2);
  room = sendAnswerState(room, GUEST, 'duration', 1, room.round, NOW + 3);
  const previousRound = room.round;
  const reset = resetRoomState(freeze(room), OWNER, previousRound, NOW + 4);
  assert.deepEqual(reset.pair, { pitch: null, duration: null });
  assert.equal(reset.round, previousRound + 1);
  rejects(() => sendAnswerState(reset, GUEST, 'duration', 1, previousRound, NOW + 5), 'stale-round');
  assert.deepEqual(reset.pair, { pitch: null, duration: null });
});

test('a second concurrent reset for the same round cannot wipe a new contribution', () => {
  const initial = paired();
  const reset = resetRoomState(initial, OWNER, initial.round, NOW + 2);
  const answered = sendAnswerState(reset, OWNER, 'pitch', 'G', reset.round, NOW + 3);
  const retriedReset = resetRoomState(answered, GUEST, initial.round, NOW + 4);
  assert.equal(retriedReset, answered);
  assert.equal(retriedReset.pair.pitch, 'G');
});

test('outsiders cannot reset or change a room role', () => {
  const room = solo();
  rejects(() => resetRoomState(room, THIRD, room.round, NOW + 1), 'not-member');
  rejects(() => changeRoleState(room, THIRD, 'duration', NOW + 1), 'not-member');
});

test('role change is allowed only while alone and clears the earlier round', () => {
  const room = freeze(solo());
  const changed = changeRoleState(room, OWNER, 'duration', NOW + 1);
  assert.equal(changed.players[OWNER].role, 'duration');
  assert.equal(changed.players[OWNER].joinedAt, room.players[OWNER].joinedAt);
  assert.equal(changed.round, room.round + 1);
  assert.deepEqual(changed.pair, { pitch: null, duration: null });
  assert.equal(changeRoleState(changed, OWNER, 'duration', NOW + 2), changed);
  rejects(() => changeRoleState(paired(), OWNER, 'duration', NOW + 2), 'paired');
});

test('guest leave resets the joint note but keeps the creator and invitation', () => {
  let room = paired();
  room = sendAnswerState(room, OWNER, 'pitch', 'G', room.round, NOW + 2);
  const oldRound = room.round;
  const remaining = leaveRoomState(freeze(room), GUEST, NOW + 3);
  assert.equal(remaining.code, room.code);
  assert.equal(remaining.owner, OWNER);
  assert.deepEqual(Object.keys(remaining.players), [OWNER]);
  assert.deepEqual(remaining.pair, { pitch: null, duration: null });
  assert.equal(remaining.round, oldRound + 1);
  rejects(() => sendAnswerState(remaining, OWNER, 'pitch', 'G', oldRound, NOW + 4), 'stale-round');
  rejects(() => sendAnswerState(remaining, OWNER, 'pitch', 'G', remaining.round, NOW + 4), 'waiting');
});

test('a replacement partner can reuse the room and old guest cannot contribute', () => {
  const room = paired();
  const waiting = leaveRoomState(room, GUEST, NOW + 2);
  const replaced = joinRoomState(waiting, THIRD, 'duration', NOW + 3);
  assert.equal(replaced.players[GUEST], undefined);
  assert.equal(replaced.players[THIRD].role, 'duration');
  assert.equal(replaced.round, waiting.round + 1);
  rejects(() => sendAnswerState(replaced, GUEST, 'duration', 1, replaced.round, NOW + 4), 'not-member');
});

test('creator leave closes the room; missing room and outsider leave are harmless', () => {
  const room = freeze(paired());
  assert.equal(leaveRoomState(room, OWNER, NOW + 2), null);
  assert.equal(leaveRoomState(room, THIRD, NOW + 2), room);
  assert.equal(leaveRoomState(null, GUEST, NOW + 2), null);
});

test('expired paired room rejects gameplay and role changes', () => {
  const room = paired();
  rejects(() => sendAnswerState(room, OWNER, 'pitch', 'G', room.round, room.expiresAt), 'expired');
  rejects(() => resetRoomState(room, GUEST, room.round, room.expiresAt), 'expired');
  rejects(() => changeRoleState(room, OWNER, 'duration', room.expiresAt), 'expired');
});
