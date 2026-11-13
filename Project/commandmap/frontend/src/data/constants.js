// Keep the map size and format version in sync with backend MapConstants.java.
export const MAP_WIDTH = 2000;
export const MAP_HEIGHT = 1400;
export const FORMAT_VERSION = '1.0';

export const MIN_ZOOM = 0.15;
export const MAX_ZOOM = 6;
export const MAX_HISTORY = 100;

export const UNIT_TYPES = [
  { id: 'INFANTRY', label: 'Infantry Division', short: 'Inf', radius: 150 },
  { id: 'CAVALRY', label: 'Cavalry Division', short: 'Cav', radius: 170 },
  { id: 'ARMOURED', label: 'Armoured Division', short: 'Arm', radius: 200 },
  { id: 'ARTILLERY', label: 'Artillery Division', short: 'Art', radius: 130 },
];

export const FORMATION_TYPES = [
  { id: 'THEATRE_HQ', label: 'Theatre HQ', level: 0, badge: 'TH' },
  { id: 'ARMY_GROUP_HQ', label: 'Army Group HQ', level: 1, badge: 'AG' },
  { id: 'ARMY_HQ', label: 'Army HQ', level: 2, badge: 'A' },
  { id: 'CORPS_HQ', label: 'Corps HQ', level: 3, badge: 'C' },
  { id: 'DIVISION', label: 'Division HQ', level: 4, badge: 'D' },
];

export const LINE_STYLES = [
  { id: 'LINE', label: 'Line' },
  { id: 'BOUNDARY', label: 'Boundary' },
  { id: 'DEFENCE_LINE', label: 'Defence line' },
];

export const TOOLS = [
  { id: 'select', label: 'Select', key: 'V', icon: 'cursor' },
  { id: 'unit', label: 'Place unit', key: 'U', icon: 'unit' },
  { id: 'polygon', label: 'Polygon territory', key: 'P', icon: 'polygon' },
  { id: 'circle', label: 'Circle territory', key: 'C', icon: 'circle' },
  { id: 'line', label: 'Line', key: 'L', icon: 'line' },
  { id: 'arrow', label: 'Direction arrow', key: 'A', icon: 'arrow' },
  { id: 'text', label: 'Text note', key: 'T', icon: 'text' },
  { id: 'eraser', label: 'Eraser', key: 'E', icon: 'eraser' },
];

export const TERRAIN_COLORS = {
  neutral: '#e6dcc0',
  plains: '#b5d38a',
  forest: '#2e6a3b',
  water: '#4a8fd4',
  mountain: '#8c6a46',
  city: '#8e9297',
  road: '#d6d6d6',
};

export const TERRAIN_LEGEND = [
  ['Plains', TERRAIN_COLORS.plains],
  ['Forest', TERRAIN_COLORS.forest],
  ['Water', TERRAIN_COLORS.water],
  ['Mountains', TERRAIN_COLORS.mountain],
  ['Cities', TERRAIN_COLORS.city],
  ['Roads', TERRAIN_COLORS.road],
  ['Neutral ground', TERRAIN_COLORS.neutral],
];

export const DEFAULT_LAYERS = {
  terrain: true,
  auto: true,
  manual: true,
  drawings: true,
  units: true,
  hq: true,
  labels: true,
  radii: false,
};

export const LAYER_LABELS = {
  terrain: 'Terrain',
  auto: 'Automatic territory',
  manual: 'Manual territory',
  drawings: 'Drawings',
  units: 'Units',
  hq: 'Headquarters',
  labels: 'Labels',
  radii: 'Influence radii',
};
