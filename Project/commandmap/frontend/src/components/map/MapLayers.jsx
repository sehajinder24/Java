import { memo } from 'react';
import { FORMATION_TYPES, MAP_HEIGHT, MAP_WIDTH } from '../../data/constants.js';
import { contrastColor, dist, pointsAttr, polygonCentroid } from '../../geometry/geom.js';
import { effectiveColor } from '../../state/ops.js';
import TerrainLayer from './TerrainLayer.jsx';
import { HqGlyph, UnitGlyph } from './UnitGlyph.jsx';

const FONT = "'Barlow Semi Condensed', system-ui, sans-serif";
const HALO = { paintOrder: 'stroke' };
const isSel = (selection, kind, id) => selection?.kind === kind && selection.id === id;

function AutoTerritory({ regions, teamsById, maskId }) {
  return (
    <g mask={maskId ? `url(#${maskId})` : undefined} pointerEvents="none">
      {regions.map((r) => {
        const color = teamsById[r.teamId]?.color ?? '#9ca3af';
        return (
          <g key={r.teamId}>
            {r.paths.map((d, i) => (
              <path
                key={i}
                d={d}
                fill={color}
                fillOpacity="0.34"
                stroke={color}
                strokeOpacity="0.95"
                strokeWidth="3"
                strokeLinejoin="round"
                fillRule="evenodd"
              />
            ))}
          </g>
        );
      })}
    </g>
  );
}

function ManualShapes({ territories, selection, showLabels, shapesOnly = false, mask = false }) {
  const sorted = [...territories].sort((a, b) => (a.layerPriority ?? 0) - (b.layerPriority ?? 0));
  return (
    <g>
      {sorted.map((t) => {
        const selected = isSel(selection, 'territory', t.territoryId);
        const color = t.fillColor || '#a8a29e';
        const common = mask
          ? { fill: '#000' }
          : {
              fill: color,
              fillOpacity: t.opacity ?? 0.45,
              stroke: selected ? '#f5c451' : color,
              strokeWidth: selected ? 4 : 3,
              strokeDasharray: selected ? '10 6' : undefined,
              strokeLinejoin: 'round',
            };
        const attrs = shapesOnly ? {} : { 'data-kind': 'territory', 'data-id': t.territoryId };
        const label =
          !mask && showLabels && t.name
            ? t.shapeType === 'CIRCLE'
              ? { x: t.center.x, y: t.center.y }
              : t.points.length
                ? polygonCentroid(t.points)
                : null
            : null;
        return (
          <g key={t.territoryId} {...attrs}>
            {t.shapeType === 'CIRCLE' ? (
              <circle cx={t.center.x} cy={t.center.y} r={t.radius} {...common} />
            ) : (
              <polygon points={pointsAttr(t.points)} {...common} />
            )}
            {label && (
              <text
                x={label.x}
                y={label.y}
                textAnchor="middle"
                fontSize="19"
                fontWeight="600"
                fontFamily={FONT}
                fill="#ffffff"
                stroke="#0b0f14"
                strokeWidth="4"
                strokeLinejoin="round"
                style={HALO}
                pointerEvents="none"
              >
                {t.name}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

function arrowHead(points, size) {
  const n = points.length;
  const b = points[n - 1];
  let a = points[n - 2];
  if (dist(a, b) < 1) a = { x: b.x - 1, y: b.y };
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  const spread = 0.5;
  const left = { x: b.x - size * Math.cos(ang - spread), y: b.y - size * Math.sin(ang - spread) };
  const right = { x: b.x - size * Math.cos(ang + spread), y: b.y - size * Math.sin(ang + spread) };
  return `${b.x},${b.y} ${left.x},${left.y} ${right.x},${right.y}`;
}

/** Little triangles along a polyline, marking a defence line. */
function defenceTeeth(points, size) {
  const teeth = [];
  const spacing = size * 3.2;
  let carry = spacing / 2;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const len = dist(a, b);
    if (len === 0) continue;
    const ux = (b.x - a.x) / len;
    const uy = (b.y - a.y) / len;
    let d = carry;
    while (d < len) {
      const cx = a.x + ux * d;
      const cy = a.y + uy * d;
      const nx = -uy;
      const ny = ux;
      teeth.push(
        `${cx - ux * size * 0.7},${cy - uy * size * 0.7} ${cx + ux * size * 0.7},${cy + uy * size * 0.7} ${cx + nx * size},${cy + ny * size}`,
      );
      d += spacing;
    }
    carry = d - len;
  }
  return teeth;
}

const DASH = { LINE: undefined, ARROW: undefined, BOUNDARY: '16 7 3 7', DEFENCE_LINE: undefined };

export function DrawingShape({ d, selected }) {
  const color = d.color || '#ffffff';
  const sw = d.strokeWidth ?? 4;
  const attrs = { 'data-kind': 'drawing', 'data-id': d.drawingId };

  if (d.drawingType === 'TEXT') {
    const p = d.points[0];
    const size = sw * 4;
    const width = Math.max(30, (d.text || '').length * size * 0.52);
    return (
      <g {...attrs}>
        <rect
          x={p.x - width / 2 - 4}
          y={p.y - size}
          width={width + 8}
          height={size * 1.3}
          fill="transparent"
          stroke={selected ? '#f5c451' : 'none'}
          strokeWidth="2"
          strokeDasharray="6 4"
        />
        <text
          x={p.x}
          y={p.y}
          textAnchor="middle"
          fontSize={size}
          fontWeight="600"
          fontFamily={FONT}
          fill={color}
          stroke="#0b0f14"
          strokeWidth={Math.max(3, size / 5)}
          strokeLinejoin="round"
          style={HALO}
        >
          {d.text}
        </text>
      </g>
    );
  }

  const pts = pointsAttr(d.points);
  return (
    <g {...attrs}>
      {selected && (
        <polyline points={pts} fill="none" stroke="#f5c451" strokeOpacity="0.55" strokeWidth={sw + 10} strokeLinecap="round" strokeLinejoin="round" />
      )}
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={DASH[d.drawingType]}
      />
      {d.drawingType === 'ARROW' && d.points.length >= 2 && (
        <polygon points={arrowHead(d.points, Math.max(18, sw * 4))} fill={color} stroke={color} strokeWidth="2" strokeLinejoin="round" />
      )}
      {d.drawingType === 'DEFENCE_LINE' &&
        defenceTeeth(d.points, Math.max(8, sw * 2.2)).map((tri, i) => <polygon key={i} points={tri} fill={color} />)}
      <polyline points={pts} fill="none" stroke="rgba(0,0,0,0)" strokeWidth={Math.max(sw + 10, 18)} strokeLinecap="round" pointerEvents="stroke" />
    </g>
  );
}

function HierarchyLines({ scenario, highlight }) {
  if (!highlight) return null;
  const from = scenario.formations.find((f) => f.formationId === highlight.fromId);
  if (!from || from.x == null) return null;
  const targets = [
    ...scenario.units.filter((u) => highlight.unitIds.has(u.unitId)),
    ...scenario.formations.filter((f) => highlight.formationIds.has(f.formationId) && f.x != null),
  ];
  return (
    <g pointerEvents="none" stroke="#fde047" strokeWidth="2" strokeDasharray="8 6" strokeOpacity="0.85">
      {targets.map((t) => (
        <line key={t.unitId ?? t.formationId} x1={from.x} y1={from.y} x2={t.x} y2={t.y} />
      ))}
    </g>
  );
}

/**
 * Everything drawn on the map, in order: terrain, automatic territory, manual territory,
 * drawings, units, headquarters. Used by the live canvas and by the PNG export.
 */
function MapLayers({ scenario, regions, layers, markerScale, selection, highlight, idPrefix = 'm', interactive = true }) {
  const teamsById = Object.fromEntries(scenario.teams.map((t) => [t.teamId, t]));
  const maskId = `${idPrefix}-manual-mask`;
  const useMask = layers.manual && scenario.territories.length > 0;
  const placedFormations = scenario.formations.filter((f) => f.x != null && f.y != null);
  const selectedUnit = selection?.kind === 'unit' ? selection.id : null;
  const dataAttrs = (kind, id) => (interactive ? { 'data-kind': kind, 'data-id': id } : {});

  return (
    <g>
      {layers.terrain && <TerrainLayer templateId={scenario.mapTemplate} idPrefix={`${idPrefix}-t`} showLabels={layers.labels} />}

      {layers.auto && (
        <>
          {useMask && (
            <defs>
              <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={MAP_WIDTH} height={MAP_HEIGHT}>
                <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="#fff" />
                <ManualShapes territories={scenario.territories} selection={null} showLabels={false} shapesOnly mask />
              </mask>
            </defs>
          )}
          {!useMask && (
            <defs>
              <clipPath id={`${idPrefix}-map-clip`}>
                <rect width={MAP_WIDTH} height={MAP_HEIGHT} />
              </clipPath>
            </defs>
          )}
          <g clipPath={useMask ? undefined : `url(#${idPrefix}-map-clip)`}>
            <AutoTerritory regions={regions} teamsById={teamsById} maskId={useMask ? maskId : null} />
          </g>
        </>
      )}

      {layers.manual && (
        <ManualShapes territories={scenario.territories} selection={selection} showLabels={layers.labels} shapesOnly={!interactive} />
      )}

      {layers.drawings &&
        scenario.drawings.map((d) => <DrawingShape key={d.drawingId} d={d} selected={isSel(selection, 'drawing', d.drawingId)} />)}

      {layers.radii && (
        <g pointerEvents="none" fill="none" strokeDasharray="6 6" strokeWidth="2" strokeOpacity="0.8">
          {scenario.units.map((u) => (
            <circle key={u.unitId} cx={u.x} cy={u.y} r={u.influenceRadius} stroke={effectiveColor(u, scenario.teams)} />
          ))}
        </g>
      )}

      <HierarchyLines scenario={scenario} highlight={highlight} />

      {layers.units &&
        [...scenario.units]
          .sort((a, b) => (a.unitId === selectedUnit) - (b.unitId === selectedUnit))
          .map((u) => {
            const color = effectiveColor(u, scenario.teams);
            return (
              <g
                key={u.unitId}
                {...dataAttrs('unit', u.unitId)}
                transform={`translate(${u.x} ${u.y}) scale(${markerScale})`}
                style={{ cursor: 'pointer' }}
              >
                <UnitGlyph
                  type={u.unitType}
                  color={color}
                  selected={isSel(selection, 'unit', u.unitId)}
                  highlighted={highlight?.unitIds.has(u.unitId)}
                />
                {layers.labels && (
                  <text
                    y="35"
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight="600"
                    fontFamily={FONT}
                    fill="#ffffff"
                    stroke="#0b0f14"
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                    style={HALO}
                    pointerEvents="none"
                  >
                    {u.designation || u.name}
                  </text>
                )}
              </g>
            );
          })}

      {layers.hq &&
        placedFormations.map((f) => {
          const color = teamsById[f.teamId]?.color ?? '#9ca3af';
          const badge = FORMATION_TYPES.find((t) => t.id === f.formationType)?.badge ?? 'HQ';
          return (
            <g
              key={f.formationId}
              {...dataAttrs('formation', f.formationId)}
              transform={`translate(${f.x} ${f.y}) scale(${markerScale})`}
              style={{ cursor: 'pointer' }}
            >
              <HqGlyph
                badge={badge}
                color={color}
                selected={isSel(selection, 'formation', f.formationId)}
                highlighted={highlight?.formationIds.has(f.formationId) || highlight?.fromId === f.formationId}
              />
              {layers.labels && (
                <text
                  y="34"
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="600"
                  fontFamily={FONT}
                  fill="#ffffff"
                  stroke="#0b0f14"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                  style={HALO}
                  pointerEvents="none"
                >
                  {f.name}
                </text>
              )}
            </g>
          );
        })}
    </g>
  );
}

export default memo(MapLayers);
export { contrastColor };
