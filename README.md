# Ai-coder

## Stickman vs Zombies — Multiplayer (Firebase) Demo

Folder: `stickman-multiplayer/`

Includes a minimal lobby and realtime sync demo using Firebase Realtime Database. Portrait-first, mobile-friendly.

### Run locally

Open `stickman-multiplayer/index.html` in a static server (recommended) or directly in a modern browser.

### Firebase setup

The demo uses the provided config. To use your own project:

1. Create a Firebase project, enable Authentication (Anonymous) and Realtime Database (in test or add rules below).
2. Replace config in `stickman-multiplayer/js/firebase-init.js`.

Minimal database structure used:

```
/rooms/{roomId}
  hostId: string
  settings: { maxPlayers, mode }
  players/{playerId}: { id, name, x, y, vx, vy, health, lastTs, ready }
  events/{eventId}: { type, payload, ts }
/users/{uid}/profile
  coins: number
  upgrades: object
```

### Suggested security rules (draft)

```
{
  "rules": {
    ".read": true,
    "rooms": {
      "$roomId": {
        ".write": "auth != null",
        "players": {
          "$playerId": {
            ".write": "auth != null && auth.uid == $playerId",
            ".validate": "newData.hasChildren(['x','y','vx','vy','health','lastTs']) && newData.child('x').isNumber() && newData.child('y').isNumber()"
          }
        }
      }
    },
    "users": {
      "$uid": {
        ".write": "auth != null && auth.uid == $uid"
      }
    }
  }
}
```

Note: Tighten validation as needed (bounds, rate limiting via Cloud Functions, etc.).
