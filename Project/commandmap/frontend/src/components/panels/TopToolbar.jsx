import { LAYER_LABELS } from '../../data/constants.js';
import Dropdown from '../ui/Dropdown.jsx';
import Icon from '../ui/Icon.jsx';

function Btn({ icon, label, onClick, disabled, title, primary }) {
  return (
    <button className={`tb-btn ${primary ? 'primary' : ''}`} onClick={onClick} disabled={disabled} title={title ?? label}>
      <Icon name={icon} size={17} />
      {label && <span>{label}</span>}
    </button>
  );
}

export default function TopToolbar({
  scenario, dirty, canUndo, canRedo, onUndo, onRedo, zoom, onZoomIn, onZoomOut, onFit,
  layers, setLayers, onNew, onScenarios, onSave, onLoad, onExportPng, onExportLocal, online,
}) {
  return (
    <header className="topbar">
      <div className="brand"><svg width="22" height="22" viewBox="0 0 32 32"><path d="M4 25 L12 7 L19 19 L23 12 L29 25 Z" fill="#d1a24a" /></svg>CommandMap</div>
      <button className="scenario-name" onClick={onScenarios} title="Manage scenarios">
        <Icon name="map" size={16} />
        <span>{scenario.scenarioName}</span>
        {dirty && <i className="dot" title="Unsaved changes" />}
        <Icon name="chevron" size={14} />
      </button>
      <span className="sep" />
      <Btn icon="newfile" label="New" onClick={onNew} title="New scenario" />
      <Btn icon="save" label="Save" onClick={onSave} primary title="Save scenario to a JSON file (Ctrl+S)" />
      <Btn icon="load" label="Load" onClick={onLoad} title="Load a scenario JSON file" />
      <Dropdown trigger={() => <Btn icon="export" label="Export" />}>
        {({ close }) => (
          <>
            <button className="menu-item" onClick={() => { close(); onExportPng(); }}><Icon name="image" size={16} /> Map as PNG image</button>
            <button className="menu-item" onClick={() => { close(); onExportLocal(); }}><Icon name="save" size={16} /> JSON without server check</button>
          </>
        )}
      </Dropdown>
      <span className="sep" />
      <Btn icon="undo" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)" />
      <Btn icon="redo" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" />
      <span className="sep" />
      <Btn icon="minus" onClick={onZoomOut} title="Zoom out" />
      <span className="zoom-label">{Math.round(zoom * 100)}%</span>
      <Btn icon="plus" onClick={onZoomIn} title="Zoom in" />
      <Btn icon="fit" onClick={onFit} title="Fit map to window" />
      <Dropdown trigger={() => <Btn icon="layers" label="Layers" />}>
        {() => (
          <div className="layer-menu">
            {Object.entries(LAYER_LABELS).map(([key, label]) => (
              <label key={key} className="check">
                <input type="checkbox" checked={layers[key]} onChange={(e) => setLayers({ ...layers, [key]: e.target.checked })} />
                {label}
              </label>
            ))}
          </div>
        )}
      </Dropdown>
      <span className="grow" />
      <span className={`conn ${online === false ? 'off' : online ? 'on' : ''}`} title={online === false ? 'Backend not reachable' : 'Backend connected'}>
        {online === false ? 'Backend offline' : online ? 'Backend online' : 'Connecting'}
      </span>
    </header>
  );
}
