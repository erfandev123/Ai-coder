// Minimal lobby UI wiring: Host, Join, Quick Match, Play vs Computer

import { hostRoom, joinRoom, quickMatch, listenPlayers, setReady } from './networking.js';

export function initLobbyUI({ onEnterRoom, onPlayVsComputer }) {
  const els = getEls();
  let currentRoomId = null;
  let stopPlayers = null;

  els.hostBtn.onclick = async () => {
    disableAll(true);
    try {
      const { roomId } = await hostRoom();
      enterRoom(roomId);
    } finally {
      disableAll(false);
    }
  };
  els.quickBtn.onclick = async () => {
    disableAll(true);
    try {
      const { roomId } = await quickMatch();
      enterRoom(roomId);
    } finally {
      disableAll(false);
    }
  };
  els.joinBtn.onclick = async () => {
    const roomId = prompt('Enter Room ID');
    if (!roomId) return;
    disableAll(true);
    try {
      await joinRoom(roomId);
      enterRoom(roomId);
    } catch (e) {
      alert('Join failed: ' + e.message);
    } finally {
      disableAll(false);
    }
  };
  els.vsCpuBtn.onclick = () => onPlayVsComputer?.();

  els.readyToggle.onchange = () => {
    if (currentRoomId) setReady(currentRoomId, els.readyToggle.checked);
  };

  function enterRoom(roomId) {
    currentRoomId = roomId;
    els.roomInfo.textContent = `Room: ${roomId}`;
    els.roomPanel.style.display = 'block';
    els.buttonsPanel.style.display = 'none';
    if (stopPlayers) stopPlayers();
    stopPlayers = listenPlayers(roomId, players => {
      els.playerList.innerHTML = '';
      Object.values(players).forEach(p => {
        const li = document.createElement('li');
        li.textContent = `${p.name || p.id} ${p.ready ? '✅' : '⏳'}`;
        els.playerList.appendChild(li);
      });
      const count = Object.keys(players).length;
      els.startBtn.disabled = count < 2; // simple guard
    });
  }

  els.startBtn.onclick = () => {
    if (!currentRoomId) return;
    onEnterRoom?.(currentRoomId);
  };

  function disableAll(disabled) {
    [els.hostBtn, els.joinBtn, els.quickBtn, els.vsCpuBtn, els.startBtn].forEach(b => (b.disabled = disabled));
  }

  function getEls() {
    return {
      hostBtn: document.getElementById('btn-host'),
      joinBtn: document.getElementById('btn-join'),
      quickBtn: document.getElementById('btn-quick'),
      vsCpuBtn: document.getElementById('btn-vs-cpu'),
      startBtn: document.getElementById('btn-start'),
      readyToggle: document.getElementById('toggle-ready'),
      playerList: document.getElementById('player-list'),
      roomInfo: document.getElementById('room-info'),
      roomPanel: document.getElementById('room-panel'),
      buttonsPanel: document.getElementById('buttons-panel')
    };
  }
}

