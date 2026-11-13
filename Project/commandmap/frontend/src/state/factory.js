import { FORMAT_VERSION } from '../data/constants.js';
import { uid } from '../data/ids.js';

export function defaultTeams() {
  return [
    { teamId: uid('team'), name: 'Team A', color: '#3b82f6', description: 'Blue team' },
    { teamId: uid('team'), name: 'Team B', color: '#ef4444', description: 'Red team' },
    { teamId: uid('team'), name: 'Team C', color: '#a8a29e', description: 'Neutral team' },
  ];
}

export function createScenario({ name = 'Untitled scenario', description = '', mapTemplate = 'terrain-map-01' } = {}) {
  const now = new Date().toISOString();
  return {
    scenarioId: uid('scenario'),
    scenarioName: name,
    description,
    mapTemplate,
    teams: defaultTeams(),
    units: [],
    formations: [],
    territories: [],
    drawings: [],
    metadata: { version: FORMAT_VERSION, createdAt: now, lastModified: now },
  };
}

export function duplicateScenario(source) {
  const now = new Date().toISOString();
  return {
    ...structuredClone(source),
    scenarioId: uid('scenario'),
    scenarioName: `${source.scenarioName} (copy)`,
    metadata: { version: FORMAT_VERSION, createdAt: now, lastModified: now },
  };
}

/** Fills in anything missing so older or hand-edited files never crash the editor. */
export function sanitizeScenario(raw) {
  const now = new Date().toISOString();
  const arr = (v) => (Array.isArray(v) ? v : []);
  return {
    scenarioId: raw.scenarioId || uid('scenario'),
    scenarioName: raw.scenarioName || 'Imported scenario',
    description: raw.description || '',
    mapTemplate: raw.mapTemplate || 'terrain-map-01',
    teams: arr(raw.teams),
    units: arr(raw.units),
    formations: arr(raw.formations),
    territories: arr(raw.territories).map((t) => ({ points: [], ...t })),
    drawings: arr(raw.drawings).map((d) => ({ points: [], ...d })),
    metadata: {
      version: raw.metadata?.version || FORMAT_VERSION,
      createdAt: raw.metadata?.createdAt || now,
      lastModified: raw.metadata?.lastModified || now,
    },
  };
}

/** Minimal check used only when the backend cannot be reached. */
export function localValidate(raw) {
  const errors = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return ['The file does not contain a scenario object'];
  }
  if (!raw.metadata?.version) errors.push('metadata.version is missing');
  for (const key of ['teams', 'units', 'formations', 'territories', 'drawings']) {
    if (raw[key] !== undefined && !Array.isArray(raw[key])) errors.push(`${key} must be a list`);
  }
  return errors;
}
