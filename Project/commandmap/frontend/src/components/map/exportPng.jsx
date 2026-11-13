import { renderToStaticMarkup } from 'react-dom/server';
import { MAP_HEIGHT, MAP_WIDTH } from '../../data/constants.js';
import { computeAreaOfControl } from '../../geometry/aoc.js';
import MapLayers from './MapLayers.jsx';

/** Renders the whole map (no editing handles) to a PNG blob. */
export function exportMapPng(scenario, layers) {
  const markup = renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" width={MAP_WIDTH} height={MAP_HEIGHT} viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}>
      <MapLayers
        scenario={scenario}
        regions={computeAreaOfControl(scenario.units)}
        layers={layers}
        markerScale={1.1}
        selection={null}
        highlight={null}
        idPrefix="export"
        interactive={false}
      />
    </svg>,
  );
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = MAP_WIDTH;
      canvas.height = MAP_HEIGHT;
      canvas.getContext('2d').drawImage(img, 0, 0);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not create the image'))), 'image/png');
    };
    img.onerror = () => reject(new Error('Could not render the map image'));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  });
}
