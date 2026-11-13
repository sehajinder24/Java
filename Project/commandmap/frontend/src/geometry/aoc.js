import polygonClipping from 'polygon-clipping';
import { circleRing, clipHalfPlane, closeRing, ringArea, ringsToPath } from './geom.js';

const SEGMENTS = 72;

/**
 * Area of control: a Voronoi-style partition constrained by each unit's influence radius.
 *
 * A point belongs to the team of the NEAREST unit among the units whose radius covers it.
 *  - Units of the same team never cut each other, so their circles merge into one region.
 *  - For two units of different teams, the lens where the enemy circle overlaps is divided by
 *    the perpendicular bisector: the part closer to the enemy is removed from this unit's region.
 *  - Areas that only one team reaches are never cut, so radii of different size behave sensibly.
 *
 * Returns [{ teamId, unitIds, paths: [svgPathData], area }] with one entry per team.
 */
export function computeAreaOfControl(units) {
  const usable = units.filter(
    (u) => Number.isFinite(u.x) && Number.isFinite(u.y) && u.influenceRadius > 0 && u.teamId,
  );
  if (usable.length === 0) return [];
  try {
    return exactRegions(usable);
  } catch (err) {
    // polygon-clipping can fail on pathological input; fall back to the simple convex partition.
    return convexRegions(usable);
  }
}

function exactRegions(units) {
  const byTeam = new Map();

  for (const u of units) {
    let region = [[closeRing(circleRing(u.x, u.y, u.influenceRadius, SEGMENTS))]];

    for (const v of units) {
      if (v === u || v.teamId === u.teamId) continue;
      const d = Math.hypot(u.x - v.x, u.y - v.y);
      if (d < 1e-6 || d >= u.influenceRadius + v.influenceRadius) continue;

      // Points closer to v than to u:  2(u - v) . p <= |u|^2 - |v|^2
      const a = 2 * (u.x - v.x);
      const b = 2 * (u.y - v.y);
      const c = u.x * u.x + u.y * u.y - v.x * v.x - v.y * v.y;
      const lens = clipHalfPlane(circleRing(v.x, v.y, v.influenceRadius, SEGMENTS), a, b, c);
      if (lens.length < 3) continue;

      region = polygonClipping.difference(region, [[closeRing(lens)]]);
      if (region.length === 0) break;
    }

    if (region.length === 0) continue;
    if (!byTeam.has(u.teamId)) byTeam.set(u.teamId, { regions: [], unitIds: [] });
    const entry = byTeam.get(u.teamId);
    entry.regions.push(region);
    entry.unitIds.push(u.unitId);
  }

  const result = [];
  for (const [teamId, { regions, unitIds }] of byTeam) {
    const merged = regions.length === 1 ? regions[0] : polygonClipping.union(...regions);
    result.push({
      teamId,
      unitIds,
      paths: merged.map((polygon) => ringsToPath(polygon)),
      area: multiPolygonArea(merged),
    });
  }
  return result;
}

/** Plain Voronoi cells clipped to each circle. Same-team cells overlap instead of merging. */
function convexRegions(units) {
  const byTeam = new Map();
  for (const u of units) {
    let ring = circleRing(u.x, u.y, u.influenceRadius, SEGMENTS);
    for (const v of units) {
      if (v === u || v.teamId === u.teamId) continue;
      if (Math.hypot(u.x - v.x, u.y - v.y) < 1e-6) continue;
      const a = 2 * (v.x - u.x);
      const b = 2 * (v.y - u.y);
      const c = v.x * v.x + v.y * v.y - u.x * u.x - u.y * u.y;
      ring = clipHalfPlane(ring, a, b, c);
      if (ring.length < 3) break;
    }
    if (ring.length < 3) continue;
    if (!byTeam.has(u.teamId)) byTeam.set(u.teamId, { paths: [], unitIds: [], area: 0 });
    const entry = byTeam.get(u.teamId);
    entry.paths.push(ringsToPath([ring]));
    entry.unitIds.push(u.unitId);
    entry.area += Math.abs(ringArea(ring));
  }
  return [...byTeam].map(([teamId, v]) => ({ teamId, ...v }));
}

/** Area of a polygon-clipping MultiPolygon: first ring is the outline, the rest are holes. */
export function multiPolygonArea(multiPolygon) {
  return multiPolygon.reduce((sum, polygon) => {
    const [outer, ...holes] = polygon;
    const holeArea = holes.reduce((s, h) => s + Math.abs(ringArea(h.slice(0, -1))), 0);
    return sum + Math.abs(ringArea(outer.slice(0, -1))) - holeArea;
  }, 0);
}

/** Cache key covering only the fields that influence the result. */
export function aocSignature(units) {
  return units
    .map((u) => `${u.unitId}:${u.teamId}:${u.x}:${u.y}:${u.influenceRadius}`)
    .join('|');
}
