import { MAP_HEIGHT, MAP_WIDTH, TERRAIN_LEGEND, UNIT_TYPES, FORMATION_TYPES } from '../../data/constants.js';
import { getTemplate } from '../../data/terrain.js';
import { findObject } from '../../state/ops.js';

export default function BottomPanel({ scenario, regions, selection, backend, dirty }) {
  const share = (teamId) => {
    const r = regions.find((x) => x.teamId === teamId);
    return r ? Math.min(100, (r.area / (MAP_WIDTH * MAP_HEIGHT)) * 100) : 0;
  };
  const obj = selection ? findObject(scenario, selection.kind, selection.id) : null;
  const selLabel = !obj ? 'Nothing selected'
    : selection.kind === 'unit' ? `Unit: ${obj.name} at ${Math.round(obj.x)}, ${Math.round(obj.y)}`
    : selection.kind === 'formation' ? `HQ: ${obj.name}`
    : selection.kind === 'territory' ? `Territory: ${obj.name}`
    : `Drawing: ${obj.drawingType.toLowerCase().replace('_', ' ')}`;

  const status = backend.online === false ? 'Backend offline: saving works without server checks'
    : backend.validation == null ? 'Backend online'
    : backend.validation.valid ? 'Backend online, scenario valid'
    : `${backend.validation.errors.length} issue${backend.validation.errors.length === 1 ? '' : 's'}: ${backend.validation.errors[0]}`;
  const statusClass = backend.online === false ? 'warn' : backend.validation && !backend.validation.valid ? 'bad' : 'ok';

  return (
    <footer className="bottom-panel">
      <div className="bp-col">
        <h4>Scenario</h4>
        <div>{scenario.scenarioName}{dirty ? ' (unsaved changes)' : ''}</div>
        <div className="muted small">{getTemplate(scenario.mapTemplate).name}, format v{scenario.metadata.version}</div>
        <div className={`status ${statusClass}`} title={status}>{status}</div>
      </div>
      <div className="bp-col">
        <h4>Forces</h4>
        <div className="muted small">
          {UNIT_TYPES.map((u) => `${scenario.units.filter((x) => x.unitType === u.id).length} ${u.short}`).join('  ')}
        </div>
        <div className="muted small">{scenario.formations.length} HQs, {scenario.territories.length} territories, {scenario.drawings.length} drawings</div>
        <div className="muted small">{FORMATION_TYPES.length} command levels</div>
      </div>
      <div className="bp-col grow">
        <h4>Teams and territory share</h4>
        <ul className="team-stats">
          {scenario.teams.map((t) => (
            <li key={t.teamId}>
              <span className="swatch" style={{ background: t.color }} />
              {t.name}: {scenario.units.filter((u) => u.teamId === t.teamId).length} units, {share(t.teamId).toFixed(1)}% of map
            </li>
          ))}
        </ul>
      </div>
      <div className="bp-col">
        <h4>Legend</h4>
        <ul className="legend">
          {TERRAIN_LEGEND.map(([name, color]) => (
            <li key={name}><span className="swatch sq" style={{ background: color }} />{name}</li>
          ))}
        </ul>
      </div>
      <div className="bp-col">
        <h4>Selection</h4>
        <div>{selLabel}</div>
      </div>
    </footer>
  );
}
