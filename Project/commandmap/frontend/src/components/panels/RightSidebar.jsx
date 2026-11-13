import { FORMATION_TYPES, TOOLS, UNIT_TYPES, LINE_STYLES } from '../../data/constants.js';
import { TERRAIN_TEMPLATES } from '../../data/terrain.js';
import { clamp, round2 } from '../../geometry/geom.js';
import { findObject, removeObject, subordinates, updateObject, validParents } from '../../state/ops.js';
import Icon from '../ui/Icon.jsx';
import { ColorField, Field, NumberField, RangeField, SelectField, TextField } from '../ui/Fields.jsx';
import { MAP_HEIGHT, MAP_WIDTH } from '../../data/constants.js';

export default function RightSidebar({ scenario, selection, setSelection, edit, setPlacingFormationId }) {
  const obj = selection ? findObject(scenario, selection.kind, selection.id) : null;
  const teamOptions = scenario.teams.map((t) => ({ value: t.teamId, label: t.name }));
  const formationOptions = scenario.formations.map((f) => ({ value: f.formationId, label: f.name }));
  const key = (field) => `${selection?.kind}:${selection?.id}:${field}`;
  const set = (patch, field = Object.keys(patch)[0]) =>
    edit((s) => updateObject(s, selection.kind, selection.id, patch), { coalesce: key(field) });
  const del = () => { edit((s) => removeObject(s, selection.kind, selection.id)); setSelection(null); };

  if (!obj) {
    const setScenario = (patch, field) => edit((s) => ({ ...s, ...patch }), { coalesce: `scenario:${field}` });
    return (
      <aside className="sidebar right">
        <section className="side-section">
          <h3>Scenario</h3>
          <TextField label="Name" value={scenario.scenarioName} onChange={(v) => setScenario({ scenarioName: v }, 'name')} />
          <TextField label="Description" multiline value={scenario.description} onChange={(v) => setScenario({ description: v }, 'desc')} />
          <SelectField label="Terrain map" value={scenario.mapTemplate} onChange={(v) => setScenario({ mapTemplate: v }, 'map')} options={TERRAIN_TEMPLATES.map((t) => ({ value: t.id, label: t.name }))} />
          <p className="muted small">Select a unit, headquarters, territory or drawing on the map to edit it here.</p>
          <dl className="kv">
            <dt>Created</dt><dd>{new Date(scenario.metadata.createdAt).toLocaleString()}</dd>
            <dt>Modified</dt><dd>{new Date(scenario.metadata.lastModified).toLocaleString()}</dd>
            <dt>Format</dt><dd>v{scenario.metadata.version}</dd>
          </dl>
        </section>
      </aside>
    );
  }

  const header = (title) => (
    <div className="panel-head">
      <h3>{title}</h3>
      <button className="icon-btn danger" onClick={del} title="Delete (Del)"><Icon name="trash" /></button>
    </div>
  );
  const teamColorOf = (id) => scenario.teams.find((t) => t.teamId === id)?.color;

  const coords = (xKey = 'x', yKey = 'y') => (
    <div className="two">
      <NumberField label="X" value={obj[xKey]} min={0} max={MAP_WIDTH} onChange={(v) => set({ [xKey]: round2(clamp(v, 0, MAP_WIDTH)) })} />
      <NumberField label="Y" value={obj[yKey]} min={0} max={MAP_HEIGHT} onChange={(v) => set({ [yKey]: round2(clamp(v, 0, MAP_HEIGHT)) })} />
    </div>
  );

  let body = null;
  if (selection.kind === 'unit') {
    body = (
      <>
        {header('Unit')}
        <TextField label="Name" value={obj.name} onChange={(v) => set({ name: v })} />
        <TextField label="Designation" value={obj.designation} onChange={(v) => set({ designation: v })} />
        <SelectField label="Type" value={obj.unitType} onChange={(v) => set({ unitType: v })} options={UNIT_TYPES.map((u) => ({ value: u.id, label: u.label }))} />
        <SelectField label="Team" value={obj.teamId} onChange={(v) => set({ teamId: v })} options={teamOptions} />
        <ColorField label="Colour" value={obj.color || teamColorOf(obj.teamId)} onChange={(v) => set({ color: v })}>
          {obj.color && <button className="link-btn" onClick={() => set({ color: null })}>Use team colour</button>}
        </ColorField>
        <SelectField label="Parent formation" value={obj.parentFormationId} allowEmpty emptyLabel="Unassigned" onChange={(v) => set({ parentFormationId: v })} options={formationOptions} />
        {coords()}
        <RangeField label="Influence radius" value={obj.influenceRadius} min={20} max={600} onChange={(v) => set({ influenceRadius: v })} />
        <p className="muted small">A visual territory size, not a military capability. You can also drag the gold grip on the map.</p>
        <TextField label="Description" multiline value={obj.description} onChange={(v) => set({ description: v })} />
      </>
    );
  } else if (selection.kind === 'formation') {
    const subs = subordinates(scenario, obj.formationId);
    const parents = validParents(scenario, obj).map((f) => ({ value: f.formationId, label: f.name }));
    body = (
      <>
        {header('Headquarters')}
        <TextField label="Name" value={obj.name} onChange={(v) => set({ name: v })} />
        <SelectField label="Type" value={obj.formationType} onChange={(v) => set({ formationType: v, parentFormationId: null })} options={FORMATION_TYPES.map((t) => ({ value: t.id, label: t.label }))} />
        <SelectField label="Team" value={obj.teamId} onChange={(v) => set({ teamId: v })} options={teamOptions} />
        <SelectField label="Reports to" value={obj.parentFormationId} allowEmpty emptyLabel="No parent" onChange={(v) => set({ parentFormationId: v })} options={parents} />
        <Field label="Map position">
          {obj.x == null ? (
            <button className="btn" onClick={() => setPlacingFormationId(obj.formationId)}>Place on map</button>
          ) : (
            <span className="row-gap">
              <code>{Math.round(obj.x)}, {Math.round(obj.y)}</code>
              <button className="btn" onClick={() => setPlacingFormationId(obj.formationId)}>Move</button>
              <button className="btn" onClick={() => set({ x: null, y: null })}>Remove</button>
            </span>
          )}
        </Field>
        <TextField label="Description" multiline value={obj.description} onChange={(v) => set({ description: v })} />
        <h4>Subordinates ({subs.formationIds.size + scenario.units.filter((u) => u.parentFormationId === obj.formationId).length})</h4>
        <ul className="plain-list">
          {scenario.formations.filter((f) => f.parentFormationId === obj.formationId).map((f) => (
            <li key={f.formationId}><button className="row-btn" onClick={() => setSelection({ kind: 'formation', id: f.formationId })}>{f.name}</button></li>
          ))}
          {scenario.units.filter((u) => u.parentFormationId === obj.formationId).map((u) => (
            <li key={u.unitId}><button className="row-btn" onClick={() => setSelection({ kind: 'unit', id: u.unitId })}>{u.name}</button></li>
          ))}
        </ul>
      </>
    );
  } else if (selection.kind === 'territory') {
    body = (
      <>
        {header(obj.shapeType === 'CIRCLE' ? 'Circle territory' : 'Polygon territory')}
        <TextField label="Name" value={obj.name} onChange={(v) => set({ name: v })} />
        <SelectField label="Team" value={obj.teamId} allowEmpty emptyLabel="No team" onChange={(v) => set({ teamId: v, ...(v ? { fillColor: teamColorOf(v) } : {}) }, 'teamId')} options={teamOptions} />
        <ColorField label="Fill colour" value={obj.fillColor} onChange={(v) => set({ fillColor: v })} />
        <RangeField label="Opacity" value={obj.opacity ?? 0.45} min={0.05} max={1} step={0.05} onChange={(v) => set({ opacity: v })} />
        <NumberField label="Layer priority" value={obj.layerPriority ?? 0} step={1} onChange={(v) => set({ layerPriority: Math.round(v) })} hint="Higher numbers draw on top." />
        {obj.shapeType === 'CIRCLE' ? (
          <>
            <div className="two">
              <NumberField label="Centre X" value={obj.center.x} onChange={(v) => set({ center: { ...obj.center, x: v } }, 'cx')} />
              <NumberField label="Centre Y" value={obj.center.y} onChange={(v) => set({ center: { ...obj.center, y: v } }, 'cy')} />
            </div>
            <NumberField label="Radius" value={obj.radius} min={5} onChange={(v) => set({ radius: Math.max(5, v) })} />
          </>
        ) : (
          <p className="muted small">{obj.points.length} points. Drag a grip to reshape, double-click an edge to add a point, Alt-click a grip to remove one.</p>
        )}
        <p className="muted small">Manual territory always overrides automatic territory underneath it.</p>
      </>
    );
  } else if (selection.kind === 'drawing') {
    const isText = obj.drawingType === 'TEXT';
    body = (
      <>
        {header(isText ? 'Text note' : 'Drawing')}
        {isText && <TextField label="Text" value={obj.text} onChange={(v) => set({ text: v })} />}
        {!isText && obj.drawingType !== 'ARROW' && (
          <SelectField label="Style" value={obj.drawingType} onChange={(v) => set({ drawingType: v })} options={LINE_STYLES.map((l) => ({ value: l.id, label: l.label }))} />
        )}
        <ColorField label="Colour" value={obj.color} onChange={(v) => set({ color: v })} />
        <RangeField label={isText ? 'Text size' : 'Stroke width'} value={obj.strokeWidth ?? 4} min={2} max={16} onChange={(v) => set({ strokeWidth: v })} />
        <TextField label="Description" multiline value={obj.description} onChange={(v) => set({ description: v })} />
        {isText && <div className="two"><NumberField label="X" value={obj.points[0].x} onChange={(v) => set({ points: [{ ...obj.points[0], x: v }] }, 'x')} /><NumberField label="Y" value={obj.points[0].y} onChange={(v) => set({ points: [{ ...obj.points[0], y: v }] }, 'y')} /></div>}
      </>
    );
  }
  return <aside className="sidebar right"><section className="side-section">{body}</section></aside>;
}
export { TOOLS };
