import { memo } from 'react';
import { MAP_HEIGHT, MAP_WIDTH, TERRAIN_COLORS } from '../../data/constants.js';
import { CITY_BLOCKS, TERRAIN_EDGE, getTemplate } from '../../data/terrain.js';

const HALO = { paintOrder: 'stroke' };

function TerrainLayer({ templateId, idPrefix = 'terrain', showLabels = true }) {
  const t = getTemplate(templateId);
  const p = idPrefix;
  return (
    <g>
      <defs>
        <pattern id={`${p}-forest`} width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="4" r="2.4" fill="#1f4a29" opacity="0.6" />
          <circle cx="12" cy="11" r="2" fill="#1f4a29" opacity="0.5" />
        </pattern>
        <pattern id={`${p}-mountain`} width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
          <rect width="3" height="22" fill="#5b4129" opacity="0.38" />
        </pattern>
        <pattern id={`${p}-plains`} width="44" height="44" patternUnits="userSpaceOnUse">
          <circle cx="9" cy="12" r="1.3" fill="#86a95a" opacity="0.55" />
          <circle cx="29" cy="33" r="1.3" fill="#86a95a" opacity="0.55" />
        </pattern>
      </defs>

      <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill={TERRAIN_COLORS.neutral} />

      {t.regions.map((r, i) => (
        <g key={i}>
          <path d={r.d} fill={TERRAIN_COLORS[r.type]} stroke={TERRAIN_EDGE[r.type]} strokeWidth="3" strokeLinejoin="round" />
          {r.type !== 'water' && <path d={r.d} fill={`url(#${p}-${r.type})`} />}
        </g>
      ))}

      {t.rivers.map((r, i) => (
        <g key={`river-${i}`} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={r.d} stroke={TERRAIN_EDGE.water} strokeWidth={r.width + 6} />
          <path d={r.d} stroke={TERRAIN_COLORS.water} strokeWidth={r.width} />
        </g>
      ))}

      {t.roads.map((r, i) => (
        <g key={`road-${i}`} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={r.d} stroke="#8c8c8c" strokeWidth={r.width + 4} />
          <path d={r.d} stroke={TERRAIN_COLORS.road} strokeWidth={r.width} />
        </g>
      ))}

      {t.cities.map((c) => (
        <g key={c.name} transform={`translate(${c.x} ${c.y}) scale(${c.size})`}>
          <circle r="34" fill={TERRAIN_COLORS.city} opacity="0.35" />
          {CITY_BLOCKS.map(([dx, dy, w, h], i) => (
            <rect key={i} x={dx} y={dy} width={w} height={h} fill={TERRAIN_COLORS.city} stroke="#4f5358" strokeWidth="1.6" />
          ))}
        </g>
      ))}

      {showLabels &&
        t.cities.map((c) => (
          <text
            key={`label-${c.name}`}
            x={c.x}
            y={c.y + 52 * c.size}
            textAnchor="middle"
            fontSize="22"
            fontWeight="600"
            fontFamily="'Barlow Semi Condensed', system-ui, sans-serif"
            fill="#1f2328"
            stroke="#f3eee0"
            strokeWidth="5"
            strokeLinejoin="round"
            style={HALO}
          >
            {c.name}
          </text>
        ))}

      <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="none" stroke="#2b333c" strokeWidth="6" />
    </g>
  );
}

export default memo(TerrainLayer);
