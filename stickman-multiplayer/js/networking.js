// Realtime Database helpers: rooms, players, onDisconnect cleanup, rate-limited updates

import { getDB, getAuthUser } from './firebase-init.js';

const ROOMS = '/rooms';
const USERS = '/users';

export function humanReadableId() {
  const animals = ['tiger','lion','eagle','panda','cobra','otter','shark','rhino','crane','wolf'];
  const colors = ['red','blue','green','gold','pink','cyan','violet','black','white','navy'];
  return `${colors[Math.floor(Math.random()*colors.length)]}-${animals[Math.floor(Math.random()*animals.length)]}-${Math.floor(Math.random()*900+100)}`;
}

export async function hostRoom(settings = { maxPlayers: 4, mode: 'deathmatch' }) {
  const db = getDB();
  const user = getAuthUser();
  const roomId = humanReadableId();
  const roomRef = db.ref(`${ROOMS}/${roomId}`);
  const playerId = user.uid;

  await roomRef.set({
    hostId: playerId,
    createdAt: firebase.database.ServerValue.TIMESTAMP,
    settings,
    players: { [playerId]: createPlayerEntry(playerId) },
    events: {}
  });

  setupOnDisconnect(roomId, playerId);
  return { roomId };
}

export async function quickMatch(settings = { maxPlayers: 4, mode: 'deathmatch' }) {
  const db = getDB();
  const roomsSnap = await db.ref(ROOMS).once('value');
  const rooms = roomsSnap.val() || {};
  const user = getAuthUser();

  for (const [rid, room] of Object.entries(rooms)) {
    const numPlayers = room.players ? Object.keys(room.players).length : 0;
    if (numPlayers < (room.settings?.maxPlayers || 4)) {
      await joinRoom(rid);
      return { roomId: rid };
    }
  }
  return hostRoom(settings);
}

export async function joinRoom(roomId) {
  const db = getDB();
  const user = getAuthUser();
  const playerId = user.uid;
  const playerRef = db.ref(`${ROOMS}/${roomId}/players/${playerId}`);
  await playerRef.set(createPlayerEntry(playerId));
  setupOnDisconnect(roomId, playerId);
}

export function createPlayerEntry(playerId) {
  return {
    id: playerId,
    name: `Player-${playerId.substring(0, 4)}`,
    x: 100,
    y: 350,
    vx: 0,
    vy: 0,
    health: 100,
    lastTs: Date.now(),
    ready: false
  };
}

export function setupOnDisconnect(roomId, playerId) {
  const db = getDB();
  const ref = db.ref(`${ROOMS}/${roomId}/players/${playerId}`);
  ref.onDisconnect().remove();
}

export function setReady(roomId, ready) {
  const db = getDB();
  const user = getAuthUser();
  return db.ref(`${ROOMS}/${roomId}/players/${user.uid}/ready`).set(ready);
}

export function listenPlayers(roomId, callback) {
  const db = getDB();
  const ref = db.ref(`${ROOMS}/${roomId}/players`);
  ref.on('value', snap => callback(snap.val() || {}));
  return () => ref.off();
}

export function broadcastEvent(roomId, event) {
  const db = getDB();
  const key = getDB().ref().push().key;
  return db.ref(`${ROOMS}/${roomId}/events/${key}`).set({ ...event, ts: Date.now() });
}

export function listenEvents(roomId, onEvent) {
  const db = getDB();
  const ref = db.ref(`${ROOMS}/${roomId}/events`);
  ref.on('child_added', snap => onEvent({ id: snap.key, ...snap.val() }));
  return () => ref.off();
}

// Rate-limited self state updates (default 10 Hz)
export function createStatePublisher(roomId, hz = 10) {
  const db = getDB();
  const user = getAuthUser();
  const playerRef = db.ref(`${ROOMS}/${roomId}/players/${user.uid}`);
  let lastSent = 0;

  return function publish(state) {
    const now = performance.now();
    const minInterval = 1000 / hz;
    if (now - lastSent < minInterval) return;
    lastSent = now;

    // Delta compression: only send essential fields
    const { x, y, dx, dy, health } = state;
    const payload = {
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      vx: Math.round(dx * 100) / 100,
      vy: Math.round(dy * 100) / 100,
      health: Math.round(health),
      lastTs: Date.now()
    };
    playerRef.update(payload);
  };
}

export function creditSessionCoins(userId, amount) {
  const db = getDB();
  const ref = db.ref(`${USERS}/${userId}/profile/coins`);
  return ref.transaction(curr => (curr || 0) + amount);
}

