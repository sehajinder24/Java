import { TERRAIN_COLORS } from './constants.js';

// Predefined terrain maps. All coordinates live in the 2000 x 1400 map space.
// Each template lists regions (painted in order), rivers, roads and settlements.

export const TERRAIN_TEMPLATES = [
  {
    id: 'terrain-map-01',
    name: 'River Valley',
    description: 'A wide river valley between two mountain ranges, with a ford at the centre.',
    regions: [
      { type: 'plains', d: 'M0 260 C260 220 520 330 820 290 S1500 230 2000 300 L2000 1400 L0 1400 Z' },
      { type: 'mountain', d: 'M0 0 L760 0 C790 90 700 170 560 210 C400 255 200 230 0 300 Z' },
      { type: 'mountain', d: 'M1180 0 L2000 0 L2000 320 C1840 250 1680 285 1520 215 C1380 160 1260 110 1180 0 Z' },
      { type: 'forest', d: 'M140 560 C230 480 430 500 510 600 C590 710 520 850 360 880 C190 905 80 760 140 560 Z' },
      { type: 'forest', d: 'M1480 700 C1580 620 1790 650 1860 760 C1930 880 1830 980 1660 990 C1520 995 1420 860 1480 700 Z' },
      { type: 'forest', d: 'M600 1050 C690 990 820 1010 850 1100 C880 1200 760 1290 650 1270 C560 1250 520 1120 600 1050 Z' },
      { type: 'forest', d: 'M1220 330 C1290 300 1380 330 1370 400 C1360 470 1260 480 1210 430 C1170 390 1180 350 1220 330 Z' },
      { type: 'water', d: 'M1220 1080 C1250 990 1420 970 1520 1030 C1620 1090 1580 1200 1440 1230 C1300 1255 1190 1170 1220 1080 Z' },
    ],
    rivers: [
      { d: 'M950 190 C890 340 1040 440 960 590 C890 720 900 850 980 980 C1060 1110 1090 1250 1030 1400', width: 34 },
      { d: 'M1230 1090 C1150 1080 1080 1040 1010 1010', width: 16 },
    ],
    roads: [
      { d: 'M0 720 C300 690 640 760 900 725 S1400 660 2000 700', width: 9 },
      { d: 'M420 280 C450 480 380 700 430 880 S470 1200 420 1400', width: 8 },
      { d: 'M960 740 C990 900 1010 1050 985 1180', width: 8 },
      { d: 'M1700 560 C1560 600 1400 640 1330 690', width: 7 },
    ],
    cities: [
      { name: 'Ford City', x: 960, y: 725, size: 1.4 },
      { name: 'Westhold', x: 420, y: 720, size: 1.1 },
      { name: 'Eastmark', x: 1700, y: 560, size: 1.1 },
      { name: 'Southport', x: 985, y: 1180, size: 1.2 },
      { name: 'Northgate', x: 430, y: 330, size: 0.9 },
    ],
  },
  {
    id: 'terrain-map-02',
    name: 'Coastal Plains',
    description: 'Open farmland running down to the sea, with a river mouth and a harbour town.',
    regions: [
      { type: 'plains', d: 'M0 0 L2000 0 L2000 1400 L0 1400 Z' },
      { type: 'mountain', d: 'M1500 1400 L2000 1400 L2000 600 C1900 700 1800 760 1720 900 C1640 1040 1580 1200 1500 1400 Z' },
      { type: 'mountain', d: 'M900 0 L1700 0 C1650 120 1500 170 1360 150 C1180 125 1000 120 900 0 Z' },
      { type: 'forest', d: 'M700 450 C800 380 980 400 1020 500 C1060 610 940 700 800 690 C680 680 620 540 700 450 Z' },
      { type: 'forest', d: 'M1250 900 C1350 840 1480 880 1500 980 C1520 1080 1400 1150 1300 1130 C1200 1110 1170 960 1250 900 Z' },
      { type: 'forest', d: 'M650 1100 C750 1050 860 1090 860 1170 C860 1250 760 1290 680 1260 C600 1230 580 1150 650 1100 Z' },
      { type: 'water', d: 'M0 0 L430 0 C380 180 520 320 460 520 C410 700 330 840 450 1000 C540 1130 480 1280 560 1400 L0 1400 Z' },
      { type: 'plains', d: 'M150 300 C210 260 290 290 290 350 C290 420 210 450 160 420 C110 390 100 330 150 300 Z' },
      { type: 'plains', d: 'M200 900 C260 870 340 900 330 960 C320 1020 240 1040 190 1010 C150 980 150 930 200 900 Z' },
      { type: 'water', d: 'M1050 1000 C1100 960 1190 980 1200 1030 C1210 1090 1130 1110 1070 1090 C1020 1070 1010 1030 1050 1000 Z' },
    ],
    rivers: [{ d: 'M1560 700 C1400 650 1300 800 1150 740 S900 640 760 700 S560 650 450 600', width: 28 }],
    roads: [
      { d: 'M520 660 C700 760 1000 820 1300 760 S1800 640 2000 600', width: 9 },
      { d: 'M900 130 C920 300 880 450 930 640 S1000 900 1050 1400', width: 8 },
      { d: 'M520 640 C560 760 570 900 620 1010', width: 7 },
    ],
    cities: [
      { name: 'Harborgate', x: 520, y: 650, size: 1.4 },
      { name: 'Mid Fields', x: 930, y: 765, size: 1.0 },
      { name: 'Highmoor', x: 1700, y: 450, size: 1.1 },
      { name: 'Southvale', x: 1030, y: 1260, size: 1.0 },
    ],
  },
  {
    id: 'terrain-map-03',
    name: 'Highland Pass',
    description: 'A narrow pass winding through mountains, with forests on the slopes.',
    regions: [
      { type: 'mountain', d: 'M0 0 L2000 0 L2000 1400 L0 1400 Z' },
      { type: 'plains', d: 'M0 380 C300 300 560 420 800 520 S1250 760 1500 900 S1800 1150 2000 1200 L2000 1400 L1600 1400 C1450 1250 1200 1060 900 880 S300 640 0 600 Z' },
      { type: 'forest', d: 'M300 330 C400 300 520 340 560 400 C600 470 480 520 380 480 C290 440 250 360 300 330 Z' },
      { type: 'forest', d: 'M1250 1050 C1350 1000 1480 1040 1500 1130 C1520 1220 1400 1280 1300 1250 C1200 1220 1170 1100 1250 1050 Z' },
      { type: 'forest', d: 'M1700 1190 C1780 1150 1900 1180 1920 1260 C1940 1340 1830 1380 1750 1350 C1680 1320 1640 1230 1700 1190 Z' },
      { type: 'water', d: 'M880 640 C940 590 1050 610 1080 680 C1110 760 1020 810 940 790 C870 770 840 690 880 640 Z' },
    ],
    rivers: [{ d: 'M0 500 C300 430 600 520 850 700 S1250 880 1520 1040 S1850 1260 2000 1300', width: 22 }],
    roads: [{ d: 'M0 560 C280 500 600 600 860 770 S1280 950 1540 1110 S1850 1310 2000 1350', width: 8 }],
    cities: [
      { name: 'Greywatch', x: 250, y: 545, size: 1.1 },
      { name: 'Stonepass', x: 1230, y: 880, size: 1.3 },
      { name: 'Eastgate', x: 1850, y: 1290, size: 1.0 },
    ],
  },
];

export function getTemplate(id) {
  return TERRAIN_TEMPLATES.find((t) => t.id === id) ?? TERRAIN_TEMPLATES[0];
}

export const TERRAIN_EDGE = {
  plains: '#98b872',
  forest: '#1f4a29',
  water: '#2f6fb0',
  mountain: '#6d5034',
};

// Relative building blocks [dx, dy, width, height] drawn around a city centre.
export const CITY_BLOCKS = [
  [-30, -22, 26, 18],
  [2, -26, 24, 20],
  [-26, 2, 22, 24],
  [4, 0, 28, 22],
  [-10, -8, 16, 14],
];

export { TERRAIN_COLORS };
