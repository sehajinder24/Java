import { contrastColor } from '../../geometry/geom.js';

const FONT = "'Barlow Semi Condensed', system-ui, sans-serif";
const HALO = { paintOrder: 'stroke' };

/** NATO-style frame with a type symbol, drawn around (0, 0). Frame size: 48 x 32. */
export function UnitGlyph({ type, color, selected = false, highlighted = false, showSize = true }) {
  const ink = contrastColor(color);
  const outline = '#0b0f14';
  return (
    <g>
      {highlighted && (
        <rect x="-32" y="-26" width="64" height="52" rx="5" fill="rgba(253,224,71,0.18)" stroke="#fde047" strokeWidth="3" />
      )}
      <rect x="-24" y="-16" width="48" height="32" rx="2" fill={color} stroke={outline} strokeWidth="2.6" />
      <g fill="none" stroke={ink} strokeWidth="2.4" strokeLinecap="round">
        {type === 'INFANTRY' && <path d="M-23 -15L23 15M-23 15L23 -15" />}
        {type === 'CAVALRY' && <path d="M-23 15L23 -15" />}
        {type === 'ARMOURED' && <ellipse cx="0" cy="0" rx="14" ry="7.5" />}
        {type === 'ARTILLERY' && <circle cx="0" cy="0" r="5" fill={ink} />}
      </g>
      {showSize && (
        <text
          y="-21"
          textAnchor="middle"
          fontSize="12"
          fontWeight="700"
          fontFamily={FONT}
          fill="#ffffff"
          stroke={outline}
          strokeWidth="3"
          style={HALO}
        >
          XX
        </text>
      )}
      {selected && (
        <rect x="-30" y="-24" width="60" height="48" rx="4" fill="none" stroke="#f5c451" strokeWidth="2.6" strokeDasharray="7 4" />
      )}
    </g>
  );
}

/** Headquarters flag, drawn around (0, 0). */
export function HqGlyph({ badge, color, selected = false, highlighted = false }) {
  const ink = contrastColor(color);
  const outline = '#0b0f14';
  return (
    <g>
      {highlighted && (
        <rect x="-26" y="-48" width="52" height="64" rx="5" fill="rgba(253,224,71,0.18)" stroke="#fde047" strokeWidth="3" />
      )}
      <path d="M0 -10V-46" stroke={outline} strokeWidth="3.4" strokeLinecap="round" />
      <path d="M0 -46L24 -38L0 -30Z" fill={color} stroke={outline} strokeWidth="2.4" strokeLinejoin="round" />
      <rect x="-18" y="-12" width="36" height="24" rx="3" fill={color} stroke={outline} strokeWidth="2.6" />
      <text
        y="5"
        textAnchor="middle"
        fontSize="15"
        fontWeight="700"
        fontFamily={FONT}
        fill={ink}
      >
        {badge}
      </text>
      {selected && (
        <rect x="-26" y="-50" width="52" height="68" rx="4" fill="none" stroke="#f5c451" strokeWidth="2.6" strokeDasharray="7 4" />
      )}
    </g>
  );
}
