CommandMap

A 2D military scenario map editor. Place fictional units on a terrain map and the editor draws each team's **area of control** automatically: same-team areas merge, competing areas split by proximity. Scenarios are saved as JSON files on your own device. There is **no database** and the server never stores anything.

- Frontend: React 18, plain JavaScript, SVG rendering, Vite
- Backend: Java 17, Spring Boot 3.3, Jackson, REST (no database, no persistence)

The bundled sample scenario "Operation Iron Ford" on the River Valley map. The red polygon at the ford is a manual territory overriding the automatic blue territory underneath. (This image is a static render of the map layers. Replace it with your own screenshot of the full editor.)*

Addiontally is the Operation Barbarrosa scenario or it's reimagining, just to show the scale of combat.

Run it

You need Java 17+, Maven 3.9+ and Node 18+.

terminal 1: backend on http://localhost:8080
cd backend
mvn spring-boot:run

terminal 2: frontend on http://localhost:5173
cd frontend
npm install
npm run dev

Open http://localhost:5173. The dev server forwards `/api` to the backend. If the backend is not running, the editor still works: Save and Load fall back to plain local JSON, and the toolbar shows "Backend offline".

Tests: `cd backend && mvn test` and `cd frontend && npm test`.

To point the frontend at a backend on another address, set `VITE_API_BASE` (for example `VITE_API_BASE=http://myhost:8080/api`) and add the frontend origin to `commandmap.cors.allowed-origins` in `backend/src/main/resources/application.properties`.





## Using the editor

| Task | How |
| --- | --- |
| Place a unit | Drag a card from the Units tab onto the map, or pick one and click the map (U) |
| Move or edit a unit | Select tool (V), drag it; edit details on the right |
| Change influence radius | Drag the gold grip on a selected unit, or use the slider |
| Territory by hand | Polygon (P): click points, double-click or Enter to finish. Circle (C): drag from the centre |
| Reshape a territory | Select it, drag the grips; double-click an edge to add a point; Alt-click a grip to remove one |
| Lines, boundaries, defence lines | Line tool (L); pick the style in the tool options or the right panel |
| Arrows | Arrow tool (A): drag from tail to head |
| Text notes | Text tool (T): click, then edit the text on the right |
| Delete | Select and press Delete, or use the Eraser (E) |
| Pan and zoom | Mouse wheel zooms at the cursor. Drag empty ground, hold Space, or use the middle mouse button to pan |
| Headquarters | Formations tab: Add headquarters, set parents on the right, then Place on map. Selecting an HQ highlights everything under it |
| Undo and redo | Ctrl+Z, Ctrl+Shift+Z |
| Save | Save (Ctrl+S) downloads a `.commandmap.json` file |
| Load | Load picks a saved file and rebuilds the whole scenario |

Manual territory always wins over automatic territory where they overlap. Higher layer priority draws on top of lower.

## How the area of control works

Implemented in `frontend/src/geometry/aoc.js`. A point belongs to the team of the **nearest unit whose influence radius covers it**.

1. Each unit starts as a circle of its influence radius.
2. For every enemy unit whose circle overlaps, the lens where the enemy circle lies is divided along the perpendicular bisector between the two units. The half nearer the enemy is removed from this unit's region.
3. Units of the same team never cut each other, so each team's regions are unioned into one outline with no internal borders.
4. Manual territories are cut out of the automatic layer with an SVG mask, so they always take priority.

It runs entirely in the browser and is recalculated only when a unit's position, radius or team changes. Dragging never calls the backend; the backend validates the scenario shortly after you stop.

## Save and load flow

**Save:** the frontend sends the scenario to `POST /api/scenarios/export`; the backend validates it, normalises it and returns a JSON file; the browser downloads it.
**Load:** the frontend sends the file's raw text to `POST /api/scenarios/import`; the backend parses, validates and migrates it and returns the processed scenario; the frontend rebuilds the map.

Scenarios are versioned (`metadata.version`, currently `1.0`). A file from a newer major or minor version is rejected with a clear message; the `migrate` hook in `ScenarioService` is where upgrades for old files go.

## REST API

| Method and path | Purpose |
| --- | --- |
| `GET /api/health` | Health check |
| `POST /api/scenarios/validate` | Validate a scenario; always 200 with `{valid, errors, warnings}` |
| `POST /api/scenarios/process` | Validate, normalise and return the scenario; 422 with an error list if invalid |
| `POST /api/scenarios/export` | Validate and return a downloadable JSON file |
| `POST /api/scenarios/import` | Body is raw file text; returns `{valid, errors, warnings, data}` |
| `POST /api/units/validate`, `/process` | Body `{units, teamIds?, formationIds?}` |
| `POST /api/formations/validate`, `/process` | Body `{formations, teamIds?}` |
| `POST /api/teams/validate` | Body `{teams}` |
| `POST /api/territories/validate`, `/process` | Body `{territories, teamIds?}` |
| `POST /api/drawings/validate`, `/process` | Body `{drawings}` |

`teamIds` and `formationIds` are optional; when given, references are checked against them. Errors use one shape: `{timestamp, status, error, message, errors[], warnings[]}`. A ready-to-use Postman collection is in `postman/`.

What the backend checks: required fields and unique IDs; valid team and parent-formation references; formation rank order (a corps cannot command an army) and no loops in the chain of command; positive influence radii; polygons with at least 3 points and circles with a positive radius; opacity from 0 to 1; hex colours; drawing point counts; a supported file version.

## Scenario file format

See `sample-scenarios/sample-scenario.json`.

```json
{
  "scenarioId": "scenario-001",
  "scenarioName": "Sample Scenario",
  "description": "",
  "mapTemplate": "terrain-map-01",
  "teams":       [{ "teamId": "", "name": "", "color": "#3b82f6", "description": "" }],
  "units":       [{ "unitId": "", "name": "", "unitType": "INFANTRY", "designation": "", "teamId": "", "color": null,
                    "parentFormationId": null, "x": 0, "y": 0, "influenceRadius": 150, "description": "" }],
  "formations":  [{ "formationId": "", "name": "", "formationType": "ARMY_HQ", "teamId": "", "parentFormationId": null,
                    "description": "", "x": null, "y": null }],
  "territories": [{ "territoryId": "", "name": "", "teamId": "", "shapeType": "POLYGON|CIRCLE", "points": [], "center": null,
                    "radius": null, "fillColor": "#ef4444", "opacity": 0.45, "layerPriority": 1 }],
  "drawings":    [{ "drawingId": "", "drawingType": "LINE|BOUNDARY|DEFENCE_LINE|ARROW|TEXT", "points": [], "color": "#ffffff",
                    "strokeWidth": 4, "text": null, "description": "" }],
  "metadata": { "version": "1.0", "createdAt": "", "lastModified": "" }
}
```

Unit types: `INFANTRY`, `CAVALRY`, `ARMOURED`, `ARTILLERY`. Formation types: `THEATRE_HQ`, `ARMY_GROUP_HQ`, `ARMY_HQ`, `CORPS_HQ`, `DIVISION`. A unit with `"color": null` uses its team's colour. The map is 2000 x 1400 units.

## Project layout

```
backend/    Spring Boot (config, controller, service, dto, model, enums, exception)
frontend/   React app (src/geometry = area of control, src/state = scenario and undo logic,
            src/components = map layers, panels, dialogs)
sample-scenarios/  Example scenario file
postman/    API collection
docs/       Screenshots
```

## Scope notes

- Terrain maps are three predefined SVG templates (River Valley, Coastal Plains, Highland Pass).
- Not included: loading user-made terrain, multi-select, copy and paste.
