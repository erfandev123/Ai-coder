// Client-side prediction for local player, interpolation for remotes

export class RemoteBuffer {
  constructor(bufferMs = 150) {
    this.bufferMs = bufferMs;
    this.snapshots = [];
  }
  push(snapshot) {
    this.snapshots.push(snapshot);
    const cutoff = Date.now() - 1000; // keep last second
    this.snapshots = this.snapshots.filter(s => s.lastTs >= cutoff);
  }
  // Returns interpolated state at renderTime = now - bufferMs
  sample() {
    const targetTs = Date.now() - this.bufferMs;
    if (this.snapshots.length === 0) return null;
    let a = null, b = null;
    for (let i = 0; i < this.snapshots.length; i++) {
      const s = this.snapshots[i];
      if (s.lastTs <= targetTs) a = s;
      if (s.lastTs >= targetTs) { b = s; break; }
    }
    if (!a) a = this.snapshots[0];
    if (!b) b = this.snapshots[this.snapshots.length - 1];
    const t = b.lastTs === a.lastTs ? 0 : (targetTs - a.lastTs) / (b.lastTs - a.lastTs);
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const lerp = (p, q, f) => p + (q - p) * clamp(f, 0, 1);
    return {
      x: lerp(a.x, b.x, t),
      y: lerp(a.y, b.y, t),
      vx: lerp(a.vx, b.vx, t),
      vy: lerp(a.vy, b.vy, t),
      health: b.health,
      lastTs: targetTs
    };
  }
}

export function predictNext(state, dt) {
  // Simple Euler integration for local prediction
  return {
    x: state.x + state.dx * dt,
    y: state.y + state.dy * dt,
    dx: state.dx,
    dy: state.dy,
    health: state.health
  };
}

