import { useState } from 'react';
import { FORMATION_TYPES, LINE_STYLES, TOOLS, UNIT_TYPES } from '../../data/constants.js';
import { uid } from '../../data/ids.js';
import { UnitGlyph } from '../map/UnitGlyph.jsx';
import { addObject, createFormation, effectiveColor, teamUsage, updateObject } from '../../state/ops.js';
import Icon from '../ui/Icon.jsx';

function ToolPalette({ tool, setTool, drawStyle, setDrawStyle }) {
  return (
    <section className="side-section">
      <h3>Tools</h3>
      <div className="tool-grid">
        {TOOLS.map((t) => (
          <button key={t.id} className={`tool-btn ${tool === t.id ? 'active' : ''}`} onClick={() => setTool(t.id)} title={`${t.label} (${t.key})`} aria-pressed={tool === t.id}>
            <Icon name={t.icon} size={20} />
            <span>{t.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>
      {['line', 'arrow', 'text'].includes(tool) && (
        <div className="tool-options">
          {tool === 'line' && (
            <select value={drawStyle.lineType} onChange={(e) => setDrawStyle({ ...drawStyle, lineType: e.target.value })} aria-label="Line style">
              {LINE_STYLES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
          )}
          <input type="color" value={drawStyle.color} onChange={(e) => setDrawStyle({ ...drawStyle, color: e.target.value })} aria-label="Drawing colour" />
          {tool !== 'text' && (
            <input type="range" min="2" max="14" value={drawStyle.strokeWidth} onChange={(e) => setDrawStyle({ ...drawStyle, strokeWidth: Number(e.target.value) })} aria-label="Stroke width" />
          )}
        </div>
      )}
    </section>
  );
}

function TeamPicker({ scenario, activeTeamId, setActiveTeamId }) {
  const team = scenario.teams.find((t) => t.teamId === activeTeamId);
  return (
    <label className="team-picker">
      <span className="swatch" style={{ background: team?.color ?? '#555' }} />
      <select value={activeTeamId ?? ''} onChange={(e) => setActiveTeamId(e.target.value)} aria-label="Active team">
        {scenario.teams.map((t) => <option key={t.teamId} value={t.teamId}>{t.name}</option>)}
      </select>
    </label>
  );
}

function UnitsTab({ scenario, activeTeamId, setActiveTeamId, unitType, setUnitType, setTool, selection, setSelection }) {
  const color = scenario.teams.find((t) => t.teamId === activeTeamId)?.color ?? '#888';
  return (
    <>
      <p className="muted small">Drag a unit onto the map, or choose one and click where it belongs. New units join the team below.</p>
      <TeamPicker scenario={scenario} activeTeamId={activeTeamId} setActiveTeamId={setActiveTeamId} />
      <div className="unit-cards">
        {UNIT_TYPES.map((u) => (
          <button
            key={u.id}
            className={`unit-card ${unitType === u.id ? 'active' : ''}`}
            draggable
            onDragStart={(e) => { e.dataTransfer.setData('application/x-commandmap-unit', u.id); e.dataTransfer.effectAllowed = 'copy'; setUnitType(u.id); }}
            onClick={() => { setUnitType(u.id); setTool('unit'); }}
          >
            <svg width="56" height="44" viewBox="-34 -30 68 56"><UnitGlyph type={u.id} color={color} /></svg>
            <span>{u.label}</span>
          </button>
        ))}
      </div>
      <h4>On the map ({scenario.units.length})</h4>
      <ul className="plain-list">
        {scenario.units.length === 0 && <li className="muted small">No units yet.</li>}
        {scenario.units.map((u) => (
          <li key={u.unitId}>
            <button className={`row-btn ${selection?.id === u.unitId ? 'active' : ''}`} onClick={() => setSelection({ kind: 'unit', id: u.unitId })}>
              <span className="swatch" style={{ background: effectiveColor(u, scenario.teams) }} />
              <span className="grow">{u.name}</span>
              <span className="muted small">{u.designation}</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

function FormationsTab({ scenario, activeTeamId, selection, setSelection, edit }) {
  const selectedFormation = selection?.kind === 'formation' ? selection.id : null;
  const add = () => {
    const f = createFormation(scenario, { teamId: activeTeamId, parentId: selectedFormation });
    edit((s) => addObject(s, 'formation', f));
    setSelection({ kind: 'formation', id: f.formationId });
  };
  const roots = scenario.formations.filter((f) => !f.parentFormationId || !scenario.formations.some((p) => p.formationId === f.parentFormationId));
  const loose = scenario.units.filter((u) => !u.parentFormationId || !scenario.formations.some((f) => f.formationId === u.parentFormationId));

  const unitRow = (u, depth) => (
    <li key={u.unitId} style={{ paddingLeft: depth * 14 }}>
      <button className={`row-btn ${selection?.id === u.unitId ? 'active' : ''}`} onClick={() => setSelection({ kind: 'unit', id: u.unitId })}>
        <span className="swatch sq" style={{ background: effectiveColor(u, scenario.teams) }} />
        <span className="grow">{u.name}</span>
      </button>
    </li>
  );
  const node = (f, depth, seen) => {
    if (seen.has(f.formationId)) return null;
    const nextSeen = new Set(seen).add(f.formationId);
    const team = scenario.teams.find((t) => t.teamId === f.teamId);
    const badge = FORMATION_TYPES.find((t) => t.id === f.formationType)?.badge;
    return (
      <li key={f.formationId}>
        <div style={{ paddingLeft: depth * 14 }}>
          <button className={`row-btn ${selection?.id === f.formationId ? 'active' : ''}`} onClick={() => setSelection({ kind: 'formation', id: f.formationId })}>
            <span className="badge" style={{ background: team?.color ?? '#555' }}>{badge}</span>
            <span className="grow">{f.name}</span>
            {f.x != null && <Icon name="locate" size={14} />}
          </button>
        </div>
        <ul className="plain-list">
          {scenario.formations.filter((c) => c.parentFormationId === f.formationId).map((c) => node(c, depth + 1, nextSeen))}
          {scenario.units.filter((u) => u.parentFormationId === f.formationId).map((u) => unitRow(u, depth + 1))}
        </ul>
      </li>
    );
  };

  return (
    <>
      <p className="muted small">Select a headquarters to highlight everything under its command on the map.</p>
      <button className="btn full" onClick={add}>
        <Icon name="plus" size={16} /> {selectedFormation ? 'Add subordinate HQ' : 'Add headquarters'}
      </button>
      <ul className="plain-list tree">
        {roots.length === 0 && <li className="muted small">No headquarters yet.</li>}
        {roots.map((f) => node(f, 0, new Set()))}
      </ul>
      {loose.length > 0 && (
        <>
          <h4>Unassigned units</h4>
          <ul className="plain-list">{loose.map((u) => unitRow(u, 0))}</ul>
        </>
      )}
    </>
  );
}

function TeamsTab({ scenario, activeTeamId, setActiveTeamId, edit, setToast }) {
  const patch = (id, p) => edit((s) => ({ ...s, teams: s.teams.map((t) => (t.teamId === id ? { ...t, ...p } : t)) }), { coalesce: `team:${id}` });
  const add = () => {
    const team = { teamId: uid('team'), name: `Team ${scenario.teams.length + 1}`, color: '#a855f7', description: '' };
    edit((s) => ({ ...s, teams: [...s.teams, team] }));
    setActiveTeamId(team.teamId);
  };
  const remove = (t) => {
    const use = teamUsage(scenario, t.teamId);
    if (use.units + use.formations + use.territories > 0) {
      setToast(`${t.name} still has ${use.units} units, ${use.formations} formations and ${use.territories} territories. Reassign or delete them first.`);
      return;
    }
    if (scenario.teams.length === 1) { setToast('A scenario needs at least one team.'); return; }
    edit((s) => ({ ...s, teams: s.teams.filter((x) => x.teamId !== t.teamId) }));
    if (activeTeamId === t.teamId) setActiveTeamId(scenario.teams.find((x) => x.teamId !== t.teamId).teamId);
  };
  return (
    <>
      <p className="muted small">Team colours decide how automatic territory is drawn.</p>
      <ul className="plain-list team-list">
        {scenario.teams.map((t) => (
          <li key={t.teamId} className={`team-row ${activeTeamId === t.teamId ? 'active' : ''}`}>
            <input type="color" value={t.color} onChange={(e) => patch(t.teamId, { color: e.target.value })} aria-label={`${t.name} colour`} />
            <input type="text" className="grow" value={t.name} onChange={(e) => patch(t.teamId, { name: e.target.value })} aria-label="Team name" />
            <button className="icon-btn" title="Use for new objects" onClick={() => setActiveTeamId(t.teamId)}><Icon name="check" size={16} /></button>
            <button className="icon-btn" title="Delete team" onClick={() => remove(t)}><Icon name="trash" size={16} /></button>
            <input type="text" className="team-desc" value={t.description ?? ''} placeholder="Description" onChange={(e) => patch(t.teamId, { description: e.target.value })} aria-label="Team description" />
          </li>
        ))}
      </ul>
      <button className="btn full" onClick={add}><Icon name="plus" size={16} /> Add team</button>
    </>
  );
}

export default function LeftSidebar(props) {
  const [tab, setTab] = useState('units');
  const tabs = [['units', 'Units'], ['formations', 'Formations'], ['teams', 'Teams']];
  return (
    <aside className="sidebar left">
      <ToolPalette tool={props.tool} setTool={props.setTool} drawStyle={props.drawStyle} setDrawStyle={props.setDrawStyle} />
      <div className="tabs" role="tablist">
        {tabs.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      <div className="tab-body">
        {tab === 'units' && <UnitsTab {...props} />}
        {tab === 'formations' && <FormationsTab {...props} />}
        {tab === 'teams' && <TeamsTab {...props} />}
      </div>
    </aside>
  );
}
export { updateObject };
