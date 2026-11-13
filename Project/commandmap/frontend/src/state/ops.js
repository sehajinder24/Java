// Pure scenario operations: every function takes a scenario and returns a new one.
import { FORMATION_TYPES, MAP_HEIGHT, MAP_WIDTH, UNIT_TYPES } from '../data/constants.js';
import { uid } from '../data/ids.js';
import { clamp, round2 } from '../geometry/geom.js';

export const COLLECTIONS = {
  unit: { key: 'units', id: 'unitId' },
  formation: { key: 'formations', id: 'formationId' },
  territory: { key: 'territories', id: 'territoryId' },
  drawing: { key: 'drawings', id: 'drawingId' },
};

const clampX = (x) => clamp(x, 0, MAP_WIDTH);
const clampY = (y) => clamp(y, 0, MAP_HEIGHT);

export function findObject(s, kind, id) {
  const c = COLLECTIONS[kind];
  return c ? s[c.key].find((o) => o[c.id] === id) : undefined;
}

export function addObject(s, kind, obj) {
  const c = COLLECTIONS[kind];
  return { ...s, [c.key]: [...s[c.key], obj] };
}

export function updateObject(s, kind, id, patch) {
  const c = COLLECTIONS[kind];
  return { ...s, [c.key]: s[c.key].map((o) => (o[c.id] === id ? { ...o, ...patch } : o)) };
}

export function removeObject(s, kind, id) {
  const c = COLLECTIONS[kind];
  const target = findObject(s, kind, id);
  if (!target) return s;
  let next = { ...s, [c.key]: s[c.key].filter((o) => o[c.id] !== id) };
  if (kind === 'formation') {
    // Re-parent subordinates to the removed formation's own parent so nobody is orphaned.
    const parent = target.parentFormationId ?? null;
    next = {
      ...next,
      formations: next.formations.map((f) => (f.parentFormationId === id ? { ...f, parentFormationId: parent } : f)),
      units: next.units.map((u) => (u.parentFormationId === id ? { ...u, parentFormationId: parent } : u)),
    };
  }
  return next;
}

const shift = (p, dx, dy) => ({ x: round2(p.x + dx), y: round2(p.y + dy) });

export function translateObject(s, kind, id, dx, dy) {
  const o = findObject(s, kind, id);
  if (!o) return s;
  if (kind === 'unit' || kind === 'formation') {
    return updateObject(s, kind, id, { x: round2(clampX(o.x + dx)), y: round2(clampY(o.y + dy)) });
  }
  if (kind === 'territory') {
    return o.shapeType === 'CIRCLE'
      ? updateObject(s, kind, id, { center: shift(o.center, dx, dy) })
      : updateObject(s, kind, id, { points: o.points.map((p) => shift(p, dx, dy)) });
  }
  return updateObject(s, kind, id, { points: o.points.map((p) => shift(p, dx, dy)) });
}

export function setVertex(s, kind, id, index, p) {
  const o = findObject(s, kind, id);
  if (!o || !o.points?.[index]) return s;
  const points = o.points.map((q, i) => (i === index ? { x: round2(p.x), y: round2(p.y) } : q));
  return updateObject(s, kind, id, { points });
}

export function insertVertex(s, kind, id, index, p) {
  const o = findObject(s, kind, id);
  if (!o?.points) return s;
  const points = [...o.points.slice(0, index), { x: round2(p.x), y: round2(p.y) }, ...o.points.slice(index)];
  return updateObject(s, kind, id, { points });
}

export function removeVertex(s, kind, id, index) {
  const o = findObject(s, kind, id);
  if (!o?.points) return s;
  const min = kind === 'territory' ? 3 : 2;
  if (o.points.length <= min) return s;
  return updateObject(s, kind, id, { points: o.points.filter((_, i) => i !== index) });
}

export function clearScenario(s) {
  return { ...s, units: [], formations: [], territories: [], drawings: [] };
}

// ---------- construction helpers ----------

const ordinal = (n) => {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
};

export function createUnit(s, { type, teamId, x, y }) {
  const def = UNIT_TYPES.find((t) => t.id === type) ?? UNIT_TYPES[0];
  const sameKind = s.units.filter((u) => u.teamId === teamId && u.unitType === type).length;
  const n = sameKind + 1;
  return {
    unitId: uid('unit'),
    name: `${ordinal(n)} ${def.label}`,
    unitType: def.id,
    designation: `${n} ${def.short}`,
    teamId,
    color: null,
    parentFormationId: null,
    x: round2(clampX(x)),
    y: round2(clampY(y)),
    influenceRadius: def.radius,
    description: '',
  };
}

export function createFormation(s, { teamId, parentId }) {
  const parent = parentId ? findObject(s, 'formation', parentId) : null;
  const parentLevel = parent ? FORMATION_TYPES.find((t) => t.id === parent.formationType)?.level ?? 0 : -1;
  const type = FORMATION_TYPES.find((t) => t.level === Math.min(parentLevel + 1, 3)) ?? FORMATION_TYPES[0];
  const count = s.formations.filter((f) => f.formationType === type.id && f.teamId === teamId).length + 1;
  return {
    formationId: uid('form'),
    name: `${ordinal(count)} ${type.label}`,
    formationType: type.id,
    teamId: parent?.teamId ?? teamId,
    parentFormationId: parent ? parent.formationId : null,
    description: '',
    x: null,
    y: null,
  };
}

export function createTerritory(s, { shape, teamId, points, center, radius }) {
  const team = s.teams.find((t) => t.teamId === teamId);
  const priority = s.territories.reduce((m, t) => Math.max(m, t.layerPriority ?? 0), 0) + 1;
  return {
    territoryId: uid('terr'),
    name: `Territory ${s.territories.length + 1}`,
    teamId: team ? team.teamId : null,
    shapeType: shape,
    points: shape === 'POLYGON' ? points.map((p) => ({ x: round2(p.x), y: round2(p.y) })) : [],
    center: shape === 'CIRCLE' ? { x: round2(center.x), y: round2(center.y) } : null,
    radius: shape === 'CIRCLE' ? round2(radius) : null,
    fillColor: team?.color ?? '#a8a29e',
    opacity: 0.45,
    layerPriority: priority,
  };
}

export function createDrawing({ type, points, color, strokeWidth, text = null }) {
  return {
    drawingId: uid('draw'),
    drawingType: type,
    points: points.map((p) => ({ x: round2(p.x), y: round2(p.y) })),
    color,
    strokeWidth,
    text,
    description: '',
  };
}

// ---------- hierarchy ----------

/** All formations and units below a formation, at any depth. */
export function subordinates(s, formationId) {
  const formationIds = new Set();
  const stack = [formationId];
  while (stack.length) {
    const current = stack.pop();
    for (const f of s.formations) {
      if (f.parentFormationId === current && !formationIds.has(f.formationId)) {
        formationIds.add(f.formationId);
        stack.push(f.formationId);
      }
    }
  }
  const owners = new Set([formationId, ...formationIds]);
  const unitIds = new Set(s.units.filter((u) => owners.has(u.parentFormationId)).map((u) => u.unitId));
  return { formationIds, unitIds };
}

/** Formations that may legally be the parent of a formation of the given type (strictly higher rank, no cycles). */
export function validParents(s, formation) {
  const level = FORMATION_TYPES.find((t) => t.id === formation.formationType)?.level ?? 0;
  const below = subordinates(s, formation.formationId).formationIds;
  return s.formations.filter((f) => {
    if (f.formationId === formation.formationId || below.has(f.formationId)) return false;
    const parentLevel = FORMATION_TYPES.find((t) => t.id === f.formationType)?.level ?? 0;
    return parentLevel < level;
  });
}

export function teamUsage(s, teamId) {
  return {
    units: s.units.filter((u) => u.teamId === teamId).length,
    formations: s.formations.filter((f) => f.teamId === teamId).length,
    territories: s.territories.filter((t) => t.teamId === teamId).length,
  };
}

export function effectiveColor(unit, teams) {
  return unit.color || teams.find((t) => t.teamId === unit.teamId)?.color || '#9ca3af';
}
