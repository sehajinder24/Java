import { pointsAttr } from '../../geometry/geom.js';
import { findObject } from '../../state/ops.js';

const HANDLE_FILL = '#f5c451';
const HANDLE_STROKE = '#0b0f14';

function Handle({ kind, id, name, x, y, k, cursor = 'move' }) {
  return (
    <circle
      data-handle={name}
      data-kind={kind}
      data-id={id}
      cx={x}
      cy={y}
      r={7 / k}
      fill={HANDLE_FILL}
      stroke={HANDLE_STROKE}
      strokeWidth={2 / k}
      style={{ cursor }}
    />
  );
}

/** Editing handles for the selected object: vertices and radius grips. */
export function SelectionHandles({ scenario, selection, k }) {
  if (!selection) return null;
  const o = findObject(scenario, selection.kind, selection.id);
  if (!o) return null;

  if (selection.kind === 'unit') {
    return (
      <g>
        <circle cx={o.x} cy={o.y} r={o.influenceRadius} fill="none" stroke="#f5c451" strokeWidth={2 / k} strokeDasharray={`${8 / k} ${6 / k}`} pointerEvents="none" />
        <Handle kind="unit" id={o.unitId} name="radius" x={o.x + o.influenceRadius} y={o.y} k={k} cursor="ew-resize" />
      </g>
    );
  }
  if (selection.kind === 'territory') {
    if (o.shapeType === 'CIRCLE') {
      return <Handle kind="territory" id={o.territoryId} name="radius" x={o.center.x + o.radius} y={o.center.y} k={k} cursor="ew-resize" />;
    }
    return (
      <g>
        {o.points.map((p, i) => (
          <Handle key={i} kind="territory" id={o.territoryId} name={`v:${i}`} x={p.x} y={p.y} k={k} />
        ))}
      </g>
    );
  }
  if (selection.kind === 'drawing' && o.drawingType !== 'TEXT') {
    return (
      <g>
        {o.points.map((p, i) => (
          <Handle key={i} kind="drawing" id={o.drawingId} name={`v:${i}`} x={p.x} y={p.y} k={k} />
        ))}
      </g>
    );
  }
  return null;
}

/** Shape being drawn right now. */
export function DraftShape({ draft, k, color, strokeWidth, teamColor }) {
  if (!draft) return null;
  const dot = 4.5 / k;
  if (draft.kind === 'polygon' || draft.kind === 'line') {
    const pts = draft.cursor ? [...draft.points, draft.cursor] : draft.points;
    const isPoly = draft.kind === 'polygon';
    const stroke = isPoly ? teamColor : color;
    return (
      <g pointerEvents="none">
        {isPoly && pts.length >= 3 && <polygon points={pointsAttr(pts)} fill={teamColor} fillOpacity="0.25" stroke="none" />}
        <polyline points={pointsAttr(pts)} fill="none" stroke={stroke} strokeWidth={isPoly ? 3 : strokeWidth} strokeDasharray={`${8 / k} ${5 / k}`} strokeLinecap="round" strokeLinejoin="round" />
        {draft.points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === 0 && isPoly ? dot * 1.6 : dot} fill={i === 0 && isPoly ? HANDLE_FILL : '#fff'} stroke={HANDLE_STROKE} strokeWidth={1.5 / k} />
        ))}
      </g>
    );
  }
  if (draft.kind === 'circle') {
    return (
      <g pointerEvents="none">
        <circle cx={draft.center.x} cy={draft.center.y} r={draft.radius} fill={teamColor} fillOpacity="0.25" stroke={teamColor} strokeWidth="3" strokeDasharray={`${8 / k} ${5 / k}`} />
        <line x1={draft.center.x} y1={draft.center.y} x2={draft.center.x + draft.radius} y2={draft.center.y} stroke="#fff" strokeWidth={1.5 / k} />
      </g>
    );
  }
  if (draft.kind === 'arrow') {
    return (
      <line pointerEvents="none" x1={draft.start.x} y1={draft.start.y} x2={draft.end.x} y2={draft.end.y} stroke={color} strokeWidth={strokeWidth} strokeDasharray={`${8 / k} ${5 / k}`} strokeLinecap="round" />
    );
  }
  return null;
}
