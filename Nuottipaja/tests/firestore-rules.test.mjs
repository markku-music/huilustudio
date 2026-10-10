import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, collection, setDoc, getDoc, getDocs, deleteDoc, runTransaction, serverTimestamp } from 'firebase/firestore';

const projectId = 'demo-nuottipaja';
const rules = await readFile(new URL('../firebase/firestore.rules', import.meta.url), 'utf8');
const testEnv = await initializeTestEnvironment({projectId, firestore: {host: '127.0.0.1', port: 8088, rules}});
const owner = testEnv.authenticatedContext('owner').firestore();
const guest = testEnv.authenticatedContext('guest').firestore();
const stranger = testEnv.authenticatedContext('stranger').firestore();
const anon = testEnv.unauthenticatedContext().firestore();
const room = (db, code = '123456') => doc(db, 'nuottipajaRoomsV1', code);
const next = (before, modifications = {}) => ({...structuredClone(before), updatedAt: Date.now(), ...modifications});
const fresh = (code = '123456', now = Date.now()) => ({code, owner: 'owner', players: {owner: {role: 'pitch', joinedAt: now}}, pair: {pitch: null, duration: null}, round: 1, createdAt: now, updatedAt: now, expiresAt: now + 86400000});
let checks = 0;
async function good(label, operation) { await assertSucceeds(operation); console.log('PASS allowed:', label); checks++; }
async function bad(label, operation) { await assertFails(operation); console.log('PASS denied:', label); checks++; }

try {
  await testEnv.clearFirestore();
  await bad('unauthenticated missing lookup', getDoc(room(anon)));
  await good('signed-in missing exact-code lookup', getDoc(room(guest)));
  await bad('room enumeration', getDocs(collection(owner, 'nuottipajaRoomsV1')));
  await bad('invalid code lookup', getDoc(room(owner, 'abc')));
  let state = fresh();
  await bad('create a room owned by another identity', setDoc(room(guest), state));
  await bad('create an initially occupied room', setDoc(room(owner), {...state, players:{...state.players, guest: {role:'duration',joinedAt:Date.now()}}}));
  await good('owner creates one-player room', setDoc(room(owner), state));

  const sameRole = next(state, {players: {...state.players, guest: {role:'pitch',joinedAt:Date.now()}}, round:2});
  await bad('second player takes already-occupied role', setDoc(room(guest), sameRole));
  const steal = next(state, {players: {owner:{role:'duration',joinedAt:state.createdAt}, guest:{role:'pitch',joinedAt:Date.now()}}, round:2});
  await bad('joining player changes owner role', setDoc(room(guest), steal));
  const joined = next(state, {players: {...state.players, guest:{role:'duration',joinedAt:Date.now()}}, round:2});
  await good('opposite role joins and advances round', setDoc(room(guest), joined));
  state = joined;
  await bad('third player joins full room', setDoc(room(stranger), next(state, {players:{...state.players,stranger:{role:'pitch',joinedAt:Date.now()}},round:3})));
  await bad('nonmember writes a pitch', setDoc(room(stranger), next(state, {pair:{pitch:'G',duration:null}})));
  await bad('pitch role writes duration', setDoc(room(owner), next(state, {pair:{pitch:null,duration:1}})));
  await bad('duration role writes pitch', setDoc(room(guest), next(state, {pair:{pitch:'G',duration:null}})));
  await bad('member changes immutable owner', setDoc(room(owner), next(state, {owner:'guest'})));
  await bad('member changes expiry', setDoc(room(owner), next(state, {expiresAt:state.expiresAt+60000})));
  await bad('member writes unexpected pitch', setDoc(room(owner), next(state, {pair:{pitch:'A',duration:null}})));
  state = next(state, {pair:{pitch:'G',duration:null}});
  await good('pitch role sends G', setDoc(room(owner), state));
  await bad('duration role erases partner pitch', setDoc(room(guest), next(state, {pair:{pitch:null,duration:1}})));
  state = next(state, {pair:{pitch:'G',duration:1}});
  await good('duration role sends quarter preserving pitch', setDoc(room(guest), state));
  await bad('nonmember resets pair', setDoc(room(stranger), next(state, {pair:{pitch:null,duration:null},round:3})));
  const stale = structuredClone(state);
  state = next(state, {pair:{pitch:null,duration:null},round:3});
  await good('guest resets shared pair with next round', setDoc(room(guest), state));
  await bad('stale previous-round event', setDoc(room(owner), next(stale, {pair:{pitch:'G',duration:null}})));
  await bad('role switch while paired', setDoc(room(owner), next(state, {players:{owner:{role:'duration',joinedAt:state.createdAt},guest:{role:'pitch',joinedAt:state.players.guest.joinedAt}},round:4})));
  await bad('guest deletes whole room', deleteDoc(room(guest)));
  await bad('nonmember removes guest', setDoc(room(stranger), next(state, {players:{owner:state.players.owner},pair:{pitch:null,duration:null},round:4})));
  state = next(state, {players:{owner:state.players.owner},pair:{pitch:null,duration:null},round:4});
  await good('guest removes only self and resets', setDoc(room(guest), state));
  state = next(state, {players:{owner:{...state.players.owner,role:'duration'}},pair:{pitch:null,duration:null},round:5});
  await good('solo owner changes role', setDoc(room(owner), state));
  await good('owner closes room', deleteDoc(room(owner)));

  const expired = fresh('234567', Date.now()-90000000);
  expired.players.guest={role:'duration',joinedAt:expired.createdAt};
  await testEnv.withSecurityRulesDisabled(ctx=>setDoc(room(ctx.firestore(),'234567'),expired));
  await bad('expired room cannot be revived by reset', setDoc(room(owner,'234567'),next(expired,{pair:{pitch:null,duration:null},round:2})));
  await good('expired owner can clean up',deleteDoc(room(owner,'234567')));

  // Two actual Firestore transactions contend for the same remaining seat.
  const contested = fresh('345678');
  await good('create race-test room',setDoc(room(owner,'345678'),contested));
  const joinRace = (db,uid)=>runTransaction(db,async tx=>{
    const reference=room(db,'345678');
    const before=(await tx.get(reference)).data();
    if(Object.keys(before.players).length>=2)throw new Error('room full');
    tx.set(reference,next(before,{players:{...before.players,[uid]:{role:'duration',joinedAt:Date.now()}},pair:{pitch:null,duration:null},round:before.round+1}));
  });
  const results=await Promise.allSettled([joinRace(guest,'guest'),joinRace(stranger,'stranger')]);
  assert.equal(results.filter(result=>result.status==='fulfilled').length,1);
  assert.equal(Object.keys((await getDoc(room(owner,'345678'))).data().players).length,2);
  console.log('PASS race: exactly one remaining-seat winner');checks++;

  await good('prior score creation remains allowed',setDoc(doc(owner,'puhallinstarttiScores','owner_abcdefghijklmnopqrstuvwx'),{
    playerName:'Testi',instrumentName:'Huilu',noteCount:3,timeMs:1200,createdAt:serverTimestamp()
  }));
  await bad('prior score update remains forbidden',setDoc(doc(owner,'puhallinstarttiScores','owner_abcdefghijklmnopqrstuvwx'),{
    playerName:'Testi',instrumentName:'Huilu',noteCount:3,timeMs:1500,createdAt:serverTimestamp()
  }));
  console.log(`All ${checks} Firebase rule checks passed.`);
} finally {
  await testEnv.cleanup();
}
