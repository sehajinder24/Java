import { useState } from 'react';
import { TERRAIN_TEMPLATES } from '../../data/terrain.js';
import TerrainLayer from '../map/TerrainLayer.jsx';
import Icon from '../ui/Icon.jsx';
import Modal from '../ui/Modal.jsx';
import { MAP_HEIGHT, MAP_WIDTH } from '../../data/constants.js';

export function TemplateThumb({ id }) {
  return (
    <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="thumb" preserveAspectRatio="xMidYMid slice">
      <TerrainLayer templateId={id} idPrefix={`thumb-${id}`} showLabels={false} />
    </svg>
  );
}

export function NewScenarioDialog({ onCreate, onClose, onSample }) {
  const [name, setName] = useState('New scenario');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState(TERRAIN_TEMPLATES[0].id);
  return (
    <Modal
      title="New scenario"
      onClose={onClose}
      wide
      footer={
        <>
          <button className="btn" onClick={onSample}>Open the sample scenario</button>
          <span className="grow" />
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={() => onCreate({ name: name.trim() || 'Untitled scenario', description, mapTemplate: template })}>Create scenario</button>
        </>
      }
    >
      <label className="field"><span className="field-label">Name</span><input autoFocus type="text" value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label className="field"><span className="field-label">Description</span><input type="text" value={description} onChange={(e) => setDescription(e.target.value)} /></label>
      <span className="field-label">Terrain map</span>
      <div className="template-grid">
        {TERRAIN_TEMPLATES.map((t) => (
          <button key={t.id} className={`template-card ${template === t.id ? 'active' : ''}`} onClick={() => setTemplate(t.id)}>
            <TemplateThumb id={t.id} />
            <strong>{t.name}</strong>
            <span className="muted small">{t.description}</span>
          </button>
        ))}
      </div>
      <p className="muted small">The scenario starts with three teams (blue, red and neutral). You can rename or add teams in the Teams tab.</p>
    </Modal>
  );
}

export function ScenarioManager({ workspace, dirtyOf, onOpen, onRename, onDuplicate, onClear, onDelete, onNew, onImport, onClose }) {
  const [editing, setEditing] = useState(null);
  const [draftName, setDraftName] = useState('');
  return (
    <Modal
      title="Scenarios in memory"
      onClose={onClose}
      wide
      footer={
        <>
          <button className="btn" onClick={onImport}><Icon name="load" size={16} /> Import from file</button>
          <span className="grow" />
          <button className="btn primary" onClick={onNew}><Icon name="plus" size={16} /> New scenario</button>
        </>
      }
    >
      <p className="muted small">Scenarios live only in this browser tab. Use Save to keep one as a file on your device.</p>
      <ul className="scenario-list">
        {workspace.order.map((id) => {
          const s = workspace.scenarios[id];
          const active = id === workspace.activeId;
          return (
            <li key={id} className={active ? 'active' : ''}>
              {editing === id ? (
                <input
                  autoFocus
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onBlur={() => { if (draftName.trim()) onRename(id, draftName.trim()); setEditing(null); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setEditing(null); }}
                />
              ) : (
                <button className="scenario-open" onClick={() => onOpen(id)}>
                  <strong>{s.scenarioName}{dirtyOf(id) ? ' *' : ''}</strong>
                  <span className="muted small">{s.units.length} units, {s.formations.length} HQs, {s.territories.length} territories, {s.drawings.length} drawings</span>
                </button>
              )}
              <button className="icon-btn" title="Rename" onClick={() => { setEditing(id); setDraftName(s.scenarioName); }}><Icon name="edit" size={16} /></button>
              <button className="icon-btn" title="Duplicate" onClick={() => onDuplicate(id)}><Icon name="copy" size={16} /></button>
              <button className="icon-btn" title="Clear all objects" onClick={() => onClear(id)}><Icon name="eraser" size={16} /></button>
              <button className="icon-btn danger" title="Close scenario" onClick={() => onDelete(id)}><Icon name="trash" size={16} /></button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}

export function MessageDialog({ title, message, errors = [], onClose }) {
  return (
    <Modal title={title} onClose={onClose} footer={<><span className="grow" /><button className="btn primary" onClick={onClose}>OK</button></>}>
      {message && <p>{message}</p>}
      {errors.length > 0 && (
        <ul className="error-list">
          {errors.slice(0, 40).map((e, i) => <li key={i}>{e}</li>)}
          {errors.length > 40 && <li>and {errors.length - 40} more</li>}
        </ul>
      )}
    </Modal>
  );
}
