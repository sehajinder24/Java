import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import * as api from './api/client.js';
import { downloadBlob, readFileAsText, safeFileName } from './api/files.js';
import BottomPanel from './components/panels/BottomPanel.jsx';
import { MessageDialog, NewScenarioDialog, ScenarioManager } from './components/panels/Dialogs.jsx';
import LeftSidebar from './components/panels/LeftSidebar.jsx';
import RightSidebar from './components/panels/RightSidebar.jsx';
import TopToolbar from './components/panels/TopToolbar.jsx';
import MapCanvas from './components/map/MapCanvas.jsx';
import { exportMapPng } from './components/map/exportPng.jsx';
import { DEFAULT_LAYERS, TOOLS } from './data/constants.js';
import sampleJson from './data/sample-scenario.json';
import { aocSignature, computeAreaOfControl } from './geometry/aoc.js';
import { createScenario, duplicateScenario, localValidate, sanitizeScenario } from './state/factory.js';
import { clearScenario, findObject, removeObject, subordinates } from './state/ops.js';
import { activeScenario, initWorkspace, isDirty, workspaceReducer } from './state/workspace.js';

export default function App() {
  const [ws, dispatch] = useReducer(workspaceReducer, undefined, () => initWorkspace(sanitizeScenario(sampleJson)));
  const scenario = activeScenario(ws);
  const dirty = isDirty(ws);

  const [tool, setTool] = useState('select');
  const [selectionRaw, setSelection] = useState(null);
  const [activeTeamRaw, setActiveTeamId] = useState(null);
  const [unitType, setUnitType] = useState('INFANTRY');
  const [drawStyle, setDrawStyle] = useState({ color: '#ffffff', strokeWidth: 4, lineType: 'LINE' });
  const [layers, setLayers] = useState(DEFAULT_LAYERS);
  const [view, setView] = useState({ x: 0, y: 0, k: 0.5 });
  const [placingFormationId, setPlacingFormationId] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [toast, setToast] = useState(null);
  const [backend, setBackend] = useState({ online: null, validation: null });
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const activeTeamId = scenario.teams.some((t) => t.teamId === activeTeamRaw) ? activeTeamRaw : scenario.teams[0]?.teamId ?? null;
  const selection = selectionRaw && findObject(scenario, selectionRaw.kind, selectionRaw.id) ? selectionRaw : null;

  const edit = useCallback((fn, opts = {}) => {
    dispatch({ type: 'edit', fn, transient: Boolean(opts.transient), coalesce: opts.coalesce, now: Date.now(), iso: new Date().toISOString() });
  }, []);
  const beginGesture = useCallback(() => dispatch({ type: 'gesture' }), []);
  const showToast = useCallback((message) => setToast({ message, id: Date.now() }), []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => { setSelection(null); setPlacingFormationId(null); }, [ws.activeId]);

  // Automatic area of control: recomputed only when something that affects it changes.
  const signature = aocSignature(scenario.units);
  const regions = useMemo(() => computeAreaOfControl(scenario.units), [signature]); // eslint-disable-line react-hooks/exhaustive-deps

  const highlight = useMemo(() => {
    if (selection?.kind !== 'formation') return null;
    return { fromId: selection.id, ...subordinates(scenario, selection.id) };
  }, [selection, scenario]);

  // ----- backend status and background validation (debounced, never per mouse move) -----
  useEffect(() => {
    let alive = true;
    const ping = () => api.checkHealth().then((ok) => alive && setBackend((b) => ({ ...b, online: ok })));
    ping();
    const t = setInterval(ping, 20000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      api.validateScenario(scenario)
        .then((validation) => alive && setBackend({ online: true, validation }))
        .catch((e) => alive && setBackend({ online: e.offline ? false : true, validation: null }));
    }, 700);
    return () => { alive = false; clearTimeout(t); };
  }, [scenario]);

  useEffect(() => {
    const warn = (e) => {
      if (ws.order.some((id) => isDirty(ws, id))) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [ws]);

  // ----- scenario actions -----
  const saveLocalFile = (s, notice) => {
    downloadBlob(new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' }), safeFileName(s.scenarioName));
    dispatch({ type: 'markSaved', id: s.scenarioId, stamp: s.metadata.lastModified });
    showToast(notice);
  };

  const save = useCallback(async () => {
    const s = scenario;
    try {
      const { blob, filename } = await api.exportScenario(s);
      downloadBlob(blob, filename);
      dispatch({ type: 'markSaved', id: s.scenarioId, stamp: s.metadata.lastModified });
      showToast(`Saved ${filename}`);
    } catch (e) {
      if (e.offline) saveLocalFile(s, 'Backend offline: saved without server validation.');
      else setDialog({ type: 'errors', title: 'The scenario could not be saved', message: e.message, errors: e.errors });
    }
  }, [scenario]); // eslint-disable-line react-hooks/exhaustive-deps

  const importText = async (text) => {
    let imported;
    try {
      ({ scenario: imported } = await api.importScenario(text));
    } catch (e) {
      if (!e.offline) {
        setDialog({ type: 'errors', title: 'This file could not be loaded', message: e.message, errors: e.errors.length > 1 ? e.errors : [] });
        return;
      }
      try {
        const raw = JSON.parse(text);
        const problems = localValidate(raw);
        if (problems.length) throw new Error(problems.join('; '));
        imported = raw;
        showToast('Backend offline: loaded with basic checks only.');
      } catch (err) {
        setDialog({ type: 'errors', title: 'This file could not be loaded', message: err.message });
        return;
      }
    }
    let scenarioIn = sanitizeScenario(imported);
    if (ws.scenarios[scenarioIn.scenarioId]) {
      const replace = window.confirm(`"${ws.scenarios[scenarioIn.scenarioId].scenarioName}" is already open. Replace it with the file's version?\n\nChoose Cancel to open the file as a separate copy.`);
      if (!replace) scenarioIn = { ...scenarioIn, scenarioId: createScenario().scenarioId, scenarioName: `${scenarioIn.scenarioName} (loaded)` };
    }
    dispatch({ type: 'import', scenario: scenarioIn });
    setDialog(null);
    showToast(`Loaded "${scenarioIn.scenarioName}": ${scenarioIn.units.length} units, ${scenarioIn.territories.length} territories, ${scenarioIn.drawings.length} drawings.`);
  };

  const onFilePicked = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try { await importText(await readFileAsText(file)); } catch (err) { setDialog({ type: 'errors', title: 'This file could not be loaded', message: err.message }); }
  };

  const exportPng = async () => {
    try { downloadBlob(await exportMapPng(scenario, layers), `${scenario.scenarioName.replace(/[^A-Za-z0-9._-]+/g, '-') || 'map'}.png`); }
    catch (e) { showToast(e.message); }
  };

  const createNew = (opts) => { dispatch({ type: 'new', scenario: createScenario(opts) }); setDialog(null); };
  const openSample = () => {
    const s = sanitizeScenario(sampleJson);
    if (ws.scenarios[s.scenarioId]) dispatch({ type: 'open', id: s.scenarioId });
    else dispatch({ type: 'import', scenario: s });
    setDialog(null);
  };

  // ----- keyboard -----
  useEffect(() => {
    const onKey = (e) => {
      if (e.defaultPrevented || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); dispatch({ type: e.shiftKey ? 'redo' : 'undo' }); return; }
      if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); dispatch({ type: 'redo' }); return; }
      if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); save(); return; }
      if (mod || e.altKey) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selection) { e.preventDefault(); edit((s) => removeObject(s, selection.kind, selection.id)); setSelection(null); }
        return;
      }
      if (e.key === 'Escape') { setSelection(null); setPlacingFormationId(null); setTool('select'); return; }
      const t = TOOLS.find((x) => x.key.toLowerCase() === e.key.toLowerCase());
      if (t) setTool(t.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selection, edit, save]);

  return (
    <div className="app">
      <TopToolbar
        scenario={scenario}
        dirty={dirty}
        canUndo={ws.past.length > 0}
        canRedo={ws.future.length > 0}
        onUndo={() => dispatch({ type: 'undo' })}
        onRedo={() => dispatch({ type: 'redo' })}
        zoom={view.k}
        onZoomIn={() => canvasRef.current?.zoomBy(1.25)}
        onZoomOut={() => canvasRef.current?.zoomBy(0.8)}
        onFit={() => canvasRef.current?.fit()}
        layers={layers}
        setLayers={setLayers}
        onNew={() => setDialog({ type: 'new' })}
        onScenarios={() => setDialog({ type: 'manage' })}
        onSave={save}
        onLoad={() => fileInputRef.current?.click()}
        onExportPng={exportPng}
        onExportLocal={() => saveLocalFile(scenario, 'Saved without server validation.')}
        online={backend.online}
      />
      <input ref={fileInputRef} type="file" accept=".json,application/json" hidden onChange={onFilePicked} />

      <div className="workspace">
        <LeftSidebar
          scenario={scenario}
          tool={tool}
          setTool={setTool}
          drawStyle={drawStyle}
          setDrawStyle={setDrawStyle}
          activeTeamId={activeTeamId}
          setActiveTeamId={setActiveTeamId}
          unitType={unitType}
          setUnitType={setUnitType}
          selection={selection}
          setSelection={setSelection}
          edit={edit}
          setToast={showToast}
        />
        <main className="canvas-area">
          <MapCanvas
            ref={canvasRef}
            scenario={scenario}
            regions={regions}
            view={view}
            setView={setView}
            tool={tool}
            selection={selection}
            setSelection={setSelection}
            layers={layers}
            edit={edit}
            beginGesture={beginGesture}
            activeTeamId={activeTeamId}
            unitType={unitType}
            drawStyle={drawStyle}
            placingFormationId={placingFormationId}
            onPlaced={() => setPlacingFormationId(null)}
            highlight={highlight}
          />
        </main>
        <RightSidebar scenario={scenario} selection={selection} setSelection={setSelection} edit={edit} setPlacingFormationId={(id) => { setPlacingFormationId(id); setTool('select'); }} />
      </div>
      <BottomPanel scenario={scenario} regions={regions} selection={selection} backend={backend} dirty={dirty} />

      {dialog?.type === 'new' && <NewScenarioDialog onCreate={createNew} onClose={() => setDialog(null)} onSample={openSample} />}
      {dialog?.type === 'manage' && (
        <ScenarioManager
          workspace={ws}
          dirtyOf={(id) => isDirty(ws, id)}
          onOpen={(id) => { dispatch({ type: 'open', id }); setDialog(null); }}
          onRename={(id, name) => dispatch({ type: 'rename', id, name, iso: new Date().toISOString() })}
          onDuplicate={(id) => dispatch({ type: 'duplicate', id, copy: duplicateScenario(ws.scenarios[id]) })}
          onClear={(id) => {
            if (!window.confirm('Remove every unit, headquarters, territory and drawing from this scenario?')) return;
            dispatch({ type: 'open', id });
            edit(clearScenario);
          }}
          onDelete={(id) => {
            if (isDirty(ws, id) && !window.confirm('This scenario has unsaved changes. Close it anyway?')) return;
            dispatch({ type: 'remove', id, fallback: createScenario() });
          }}
          onNew={() => setDialog({ type: 'new' })}
          onImport={() => fileInputRef.current?.click()}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.type === 'errors' && <MessageDialog title={dialog.title} message={dialog.message} errors={dialog.errors} onClose={() => setDialog(null)} />}
      {toast && <div className="toast" role="status" key={toast.id}>{toast.message}</div>}
    </div>
  );
}
