// Small 2D geometry helpers. Points are {x, y} objects in map space unless noted.

export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const round2 = (v) => Math.round(v * 100) / 100;

/** Ring of [x, y] pairs approximating a circle. */
export function circleRing(cx, cy, r, segments = 72) {
  const ring = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    ring.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return ring;
}

/** Keeps the part of a convex ring where a*x + b*y <= c (Sutherland-Hodgman against one half-plane). */
export function clipHalfPlane(ring, a, b, c) {
  const out = [];
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i];
    const q = ring[(i + 1) % ring.length];
    const dp = a * p[0] + b * p[1] - c;
    const dq = a * q[0] + b * q[1] - c;
    const pIn = dp <= 0;
    const qIn = dq <= 0;
    if (pIn) out.push(p);
    if (pIn !== qIn) {
      const t = dp / (dp - dq);
      out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]);
    }
  }
  return out;
}

export const closeRing = (ring) => [...ring, ring[0]];

/** Signed shoelace area of a ring of [x, y] pairs. */
export function ringArea(ring) {
  let sum = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    sum += x1 * y2 - x2 * y1;
  }
  return sum / 2;
}

export function distToSegment(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / len2, 0, 1);
  const proj = { x: a.x + t * dx, y: a.y + t * dy };
  return { distance: dist(p, proj), point: proj };
}

/**
 * Closest point on a polyline/polygon edge to p.
 * `index` is the position at which a new vertex should be inserted.
 */
export function nearestOnPath(points, p, closed) {
  let best = null;
  const count = closed ? points.length : points.length - 1;
  for (let i = 0; i < count; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const { distance, point } = distToSegment(p, a, b);
    if (!best || distance < best.distance) best = { distance, point, index: i + 1 };
  }
  return best;
}

export function polygonCentroid(points) {
  const n = points.length || 1;
  return {
    x: points.reduce((s, p) => s + p.x, 0) / n,
    y: points.reduce((s, p) => s + p.y, 0) / n,
  };
}

export const pointsAttr = (points) => points.map((p) => `${p.x},${p.y}`).join(' ');

/** Path data for a list of rings of [x, y] pairs. */
export function ringsToPath(rings) {
  return rings
    .map((ring) => `M${ring.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}Z`)
    .join('');
}

/** Black or white, whichever reads better on the given hex colour. */
export function contrastColor(hex) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return '#ffffff';
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#12161b' : '#ffffff';
}
