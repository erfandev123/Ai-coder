// Hook networking into a simplified version of the existing game loop

import { createStatePublisher, listenPlayers, broadcastEvent, creditSessionCoins } from './networking.js';
import { RemoteBuffer } from './prediction.js';

export function startMultiplayer(roomId, api) {
  // api: hooks into existing single-player code
  // Required: api.getLocalState(), api.applyRemotePlayers(map), api.onEvent(event), api.onSessionEnd(coins)
  const publish = createStatePublisher(roomId, 10);
  const buffers = new Map();
  const stopPlayers = listenPlayers(roomId, players => {
    const selfId = api.getSelfId();
    const remotes = {};
    Object.values(players).forEach(p => {
      if (p.id === selfId) return; // local handled with prediction
      if (!buffers.has(p.id)) buffers.set(p.id, new RemoteBuffer(150));
      buffers.get(p.id).push(p);
    });
    // Sample interpolated states for render
    buffers.forEach((buf, id) => {
      const s = buf.sample();
      if (s) remotes[id] = s;
    });
    api.applyRemotePlayers(remotes);
  });

  let running = true;
  function netTick() {
    if (!running) return;
    const state = api.getLocalState();
    publish(state);
    setTimeout(netTick, 100); // 10 Hz
  }
  netTick();

  return {
    stop: () => {
      running = false;
      stopPlayers?.();
    },
    broadcastEvent: (e) => broadcastEvent(roomId, e),
    creditCoins: (amount) => creditSessionCoins(api.getSelfId(), amount)
  };
}

