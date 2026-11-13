import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { MAP_HEIGHT, MAP_WIDTH, MAX_ZOOM, MIN_ZOOM } from '../../data/constants.js';
import { clamp, dist, nearestOnPath, round2 } from '../../geometry/geom.js';
import {
  addObject, createDrawing, createTerritory, createUnit, findObject, insertVertex,
  removeObject, removeVertex, setVertex, translateObject, updateObject,
} from '../../state/ops.js';
import MapLayers from './MapLayers.jsx';
import { DraftShape, SelectionHandles } from './Overlays.jsx';

const CURSORS = { select: 'default', unit: 'copy', polygon: 'crosshair', circle: 'crosshair', line: 'crosshair', arrow: 'crosshair', text: 'text', eraser: 'not-allowed' };

const MapCanvas = forwardRef(function MapCanvas(props, ref) {
  const {
    scenario, regions, view, setView, tool, selection, setSelection, layers, edit, beginGesture,
    activeTeamId, unitType, drawStyle, placingFormationId, onPlaced, highlight,
  } = props;

  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  const readoutRef = useRef(null);
  const gesture = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [draft, setDraft] = useState(null);
  const draftRef = useRef(null);
  draftRef.current = draft;
  const [panning, setPanning] = useState(false);
  const spaceDown = useRef(false);

  const teamColor = scenario.teams.find((t) => t.teamId === activeTeamId)?.color ?? '#a8a29e';
  const markerScale = clamp(1 / Math.sqrt(view.k), 0.5, 1.9);

  const fit = useCallback(() => {
    if (!size.w) return;
    const k = clamp(Math.min(size.w / MAP_WIDTH, size.h / MAP_HEIGHT) * 0.96, MIN_ZOOM, MAX_ZOOM);
    setView({ k, x: (size.w - MAP_WIDTH * k) / 2, y: (size.h - MAP_HEIGHT * k) / 2 });
  }, [size, setView]);

  const zoomBy = useCallback((factor, cx = size.w / 2, cy = size.h / 2) => {
    setView((v) => {
      const k = clamp(v.k * factor, MIN_ZOOM, MAX_ZOOM);
      const r = k / v.k;
      return { k, x: cx - (cx - v.x) * r, y: cy - (cy - v.y) * r };
    });
  }, [size, setView]);

  useImperativeHandle(ref, () => ({ fit, zoomBy }), [fit, zoomBy]);

  // size tracking
  useEffect(() => {
    const el = wrapRef.current;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const ready = size.w > 0;
  useEffect(() => { if (ready) fit(); /* eslint-disable-next-line */ }, [scenario.scenarioId, ready]);
  useEffect(() => setDraft(null), [tool]);

  // wheel zoom needs a non-passive listener
  useEffect(() => {
    const el = svgRef.current;
    const onWheel = (e) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomBy(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomBy]);

  const toMap = useCallback((e) => {
    const r = svgRef.current.getBoundingClientRect();
    return { x: (e.clientX - r.left - view.x) / view.k, y: (e.clientY - r.top - view.y) / view.k };
  }, [view]);

  const finishDraft = useCallback(() => {
    const d = draftRef.current;
    if (!d) return;
    if (d.kind === 'polygon' && d.points.length >= 3) {
      const t = createTerritory(scenario, { shape: 'POLYGON', teamId: activeTeamId, points: d.points });
      edit((s) => addObject(s, 'territory', t));
      setSelection({ kind: 'territory', id: t.territoryId });
    } else if (d.kind === 'line' && d.points.length >= 2) {
      const dr = createDrawing({ type: drawStyle.lineType, points: d.points, color: drawStyle.color, strokeWidth: drawStyle.strokeWidth });
      edit((s) => addObject(s, 'drawing', dr));
      setSelection({ kind: 'drawing', id: dr.drawingId });
    }
    setDraft(null);
  }, [scenario, activeTeamId, drawStyle, edit, setSelection]);

  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.code === 'Space') { spaceDown.current = e.type === 'keydown'; if (e.type === 'keydown') e.preventDefault(); return; }
      if (e.type !== 'keydown' || !draftRef.current) return;
      if (e.key === 'Enter') { e.preventDefault(); finishDraft(); }
      else if (e.key === 'Escape') { e.preventDefault(); setDraft(null); }
      else if (e.key === 'Backspace' && draftRef.current.points) {
        e.preventDefault();
        setDraft((d) => (d.points.length > 1 ? { ...d, points: d.points.slice(0, -1) } : null));
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); };
  }, [finishDraft]);

  const hitOf = (e) => {
    const el = e.target.closest?.('[data-handle],[data-kind]');
    return el ? { handle: el.dataset.handle, kind: el.dataset.kind, id: el.dataset.id } : {};
  };

  const startPan = (e) => {
    gesture.current = { type: 'pan', sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y };
    setPanning(true);
  };

  const addDraftPoint = (kind, p) => {
    setDraft((d) => {
      const pts = d?.kind === kind ? d.points : [];
      const last = pts[pts.length - 1];
      if (last && dist(last, p) < 6 / view.k) return d;
      return { kind, points: [...pts, p], cursor: p };
    });
  };

  const onPointerDown = (e) => {
    if (e.button === 1 || e.button === 2 || spaceDown.current) { e.preventDefault(); svgRef.current.setPointerCapture(e.pointerId); startPan(e); return; }
    if (e.button !== 0) return;
    const p = toMap(e);
    const hit = hitOf(e);
    svgRef.current.setPointerCapture(e.pointerId);

    if (placingFormationId) {
      edit((s) => updateObject(s, 'formation', placingFormationId, { x: round2(clamp(p.x, 0, MAP_WIDTH)), y: round2(clamp(p.y, 0, MAP_HEIGHT)) }));
      setSelection({ kind: 'formation', id: placingFormationId });
      onPlaced();
      return;
    }

    switch (tool) {
      case 'select':
        if (hit.handle) {
          if (e.altKey && hit.handle.startsWith('v:')) {
            edit((s) => removeVertex(s, hit.kind, hit.id, Number(hit.handle.slice(2))));
            return;
          }
          gesture.current = { type: 'handle', ...hit, sx: e.clientX, sy: e.clientY, started: false };
        } else if (hit.kind) {
          const already = selection?.kind === hit.kind && selection.id === hit.id;
          setSelection({ kind: hit.kind, id: hit.id });
          if (hit.kind === 'territory' && !already) startPan(e);
          else gesture.current = { type: 'move', ...hit, last: p, sx: e.clientX, sy: e.clientY, started: false };
        } else {
          setSelection(null);
          startPan(e);
        }
        break;
      case 'unit': {
        const unit = createUnit(scenario, { type: unitType, teamId: activeTeamId, x: p.x, y: p.y });
        edit((s) => addObject(s, 'unit', unit));
        setSelection({ kind: 'unit', id: unit.unitId });
        break;
      }
      case 'polygon': {
        const d = draftRef.current;
        if (d?.kind === 'polygon' && d.points.length >= 3 && dist(p, d.points[0]) < 12 / view.k) finishDraft();
        else addDraftPoint('polygon', p);
        break;
      }
      case 'line': addDraftPoint('line', p); break;
      case 'circle':
        setDraft({ kind: 'circle', center: p, radius: 0 });
        gesture.current = { type: 'circle' };
        break;
      case 'arrow':
        setDraft({ kind: 'arrow', start: p, end: p });
        gesture.current = { type: 'arrow' };
        break;
      case 'text': {
        const dr = createDrawing({ type: 'TEXT', points: [p], color: drawStyle.color, strokeWidth: 5, text: 'Label' });
        edit((s) => addObject(s, 'drawing', dr));
        setSelection({ kind: 'drawing', id: dr.drawingId });
        break;
      }
      case 'eraser':
        if (hit.kind && !hit.handle) {
          edit((s) => removeObject(s, hit.kind, hit.id));
          if (selection?.id === hit.id) setSelection(null);
        }
        break;
      default:
    }
  };

  const onPointerMove = (e) => {
    const p = toMap(e);
    if (readoutRef.current) readoutRef.current.textContent = `x ${Math.round(p.x)}   y ${Math.round(p.y)}`;
    const g = gesture.current;
    if (!g) {
      const d = draftRef.current;
      if (d && (d.kind === 'polygon' || d.kind === 'line')) setDraft({ ...d, cursor: p });
      return;
    }
    if (g.type === 'pan') {
      setView((v) => ({ ...v, x: g.vx + e.clientX - g.sx, y: g.vy + e.clientY - g.sy }));
    } else if (g.type === 'circle') {
      setDraft((d) => d && { ...d, radius: dist(d.center, p) });
    } else if (g.type === 'arrow') {
      setDraft((d) => d && { ...d, end: p });
    } else if (g.type === 'move' || g.type === 'handle') {
      if (!g.started) {
        if (Math.hypot(e.clientX - g.sx, e.clientY - g.sy) < 3) return;
        g.started = true;
        beginGesture();
      }
      if (g.type === 'move') {
        const dx = p.x - g.last.x;
        const dy = p.y - g.last.y;
        g.last = p;
        edit((s) => translateObject(s, g.kind, g.id, dx, dy), { transient: true });
      } else if (g.handle === 'radius') {
        edit((s) => {
          const o = findObject(s, g.kind, g.id);
          if (!o) return s;
          const c = g.kind === 'unit' ? o : o.center;
          const r = round2(Math.max(10, dist(c, p)));
          return g.kind === 'unit' ? updateObject(s, 'unit', g.id, { influenceRadius: r }) : updateObject(s, 'territory', g.id, { radius: r });
        }, { transient: true });
      } else if (g.handle.startsWith('v:')) {
        const i = Number(g.handle.slice(2));
        edit((s) => setVertex(s, g.kind, g.id, i, p), { transient: true });
      }
    }
  };

  const onPointerUp = (e) => {
    const g = gesture.current;
    gesture.current = null;
    setPanning(false);
    try { svgRef.current.releasePointerCapture(e.pointerId); } catch { /* not captured */ }
    const d = draftRef.current;
    if (g?.type === 'circle' && d?.kind === 'circle') {
      if (d.radius > 8) {
        const t = createTerritory(scenario, { shape: 'CIRCLE', teamId: activeTeamId, center: d.center, radius: d.radius });
        edit((s) => addObject(s, 'territory', t));
        setSelection({ kind: 'territory', id: t.territoryId });
      }
      setDraft(null);
    } else if (g?.type === 'arrow' && d?.kind === 'arrow') {
      if (dist(d.start, d.end) > 12) {
        const dr = createDrawing({ type: 'ARROW', points: [d.start, d.end], color: drawStyle.color, strokeWidth: drawStyle.strokeWidth });
        edit((s) => addObject(s, 'drawing', dr));
        setSelection({ kind: 'drawing', id: dr.drawingId });
      }
      setDraft(null);
    }
  };

  const onDoubleClick = (e) => {
    if ((tool === 'polygon' || tool === 'line') && draftRef.current) { finishDraft(); return; }
    if (tool !== 'select' || !selection) return;
    const hit = hitOf(e);
    if (hit.handle || hit.kind !== selection.kind || hit.id !== selection.id) return;
    const o = findObject(scenario, hit.kind, hit.id);
    if (!o?.points?.length || o.drawingType === 'TEXT') return;
    const near = nearestOnPath(o.points, toMap(e), hit.kind === 'territory');
    if (near) edit((s) => insertVertex(s, hit.kind, hit.id, near.index, near.point));
  };

  const onDrop = (e) => {
    const type = e.dataTransfer.getData('application/x-commandmap-unit');
    if (!type) return;
    e.preventDefault();
    const p = toMap(e);
    const unit = createUnit(scenario, { type, teamId: activeTeamId, x: p.x, y: p.y });
    edit((s) => addObject(s, 'unit', unit));
    setSelection({ kind: 'unit', id: unit.unitId });
  };

  const cursor = panning ? 'grabbing' : placingFormationId ? 'crosshair' : CURSORS[tool];

  return (
    <div className="canvas-wrap" ref={wrapRef} onDragOver={(e) => e.dataTransfer.types.includes('application/x-commandmap-unit') && e.preventDefault()} onDrop={onDrop}>
      <svg
        ref={svgRef}
        className="map-svg"
        width={size.w}
        height={size.h}
        style={{ cursor }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onDoubleClick={onDoubleClick}
        onContextMenu={(e) => e.preventDefault()}
      >
        <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
          <rect x="-6" y="-6" width={MAP_WIDTH + 12} height={MAP_HEIGHT + 12} fill="#0a0d10" />
          <MapLayers scenario={scenario} regions={regions} layers={layers} markerScale={markerScale} selection={selection} highlight={highlight} idPrefix="live" />
          <SelectionHandles scenario={scenario} selection={selection} k={view.k} />
          <DraftShape draft={draft} k={view.k} color={drawStyle.color} strokeWidth={drawStyle.strokeWidth} teamColor={teamColor} />
        </g>
      </svg>
      <div className="canvas-readout" ref={readoutRef}>x 0   y 0</div>
      {draft && (draft.kind === 'polygon' || draft.kind === 'line') && (
        <div className="canvas-hint">Click to add points. Double-click or press Enter to finish, Backspace to undo a point, Esc to cancel.</div>
      )}
      {placingFormationId && <div className="canvas-hint">Click the map to place the headquarters.</div>}
    </div>
  );
});

export default MapCanvas;
