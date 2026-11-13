import { describe, expect, it } from 'vitest';
import { createScenario } from '../state/factory.js';
import { addObject, createFormation, createUnit, removeObject, subordinates, translateObject, updateObject, validParents } from '../state/ops.js';
import { initWorkspace, workspaceReducer } from '../state/workspace.js';

describe('scenario operations', () => {
  it('moves and removes units', () => {
    let s = createScenario();
    const u = createUnit(s, { type: 'ARMOURED', teamId: s.teams[0].teamId, x: 100, y: 100 });
    s = addObject(s, 'unit', u);
    s = translateObject(s, 'unit', u.unitId, 25, -10);
    expect(s.units[0]).toMatchObject({ x: 125, y: 90, influenceRadius: 200 });
    expect(removeObject(s, 'unit', u.unitId).units).toHaveLength(0);
  });

  it('re-parents subordinates when a formation is removed', () => {
    let s = createScenario();
    const team = s.teams[0].teamId;
    const hq = createFormation(s, { teamId: team, parentId: null });
    s = addObject(s, 'formation', hq);
    const army = createFormation(s, { teamId: team, parentId: hq.formationId });
    s = addObject(s, 'formation', army);
    const u = { ...createUnit(s, { type: 'INFANTRY', teamId: team, x: 1, y: 1 }), parentFormationId: army.formationId };
    s = addObject(s, 'unit', u);
    expect(subordinates(s, hq.formationId).unitIds.has(u.unitId)).toBe(true);
    s = removeObject(s, 'formation', army.formationId);
    expect(s.units[0].parentFormationId).toBe(hq.formationId);
  });

  it('only offers higher-ranked parents', () => {
    let s = createScenario();
    const team = s.teams[0].teamId;
    const theatre = createFormation(s, { teamId: team, parentId: null });
    s = addObject(s, 'formation', theatre);
    const child = createFormation(s, { teamId: team, parentId: theatre.formationId });
    s = addObject(s, 'formation', child);
    expect(validParents(s, theatre)).toHaveLength(0);
    expect(validParents(s, child).map((f) => f.formationId)).toEqual([theatre.formationId]);
  });
});

describe('workspace history', () => {
  const stamp = { now: 1000, iso: '2026-11-11T10:00:00Z' };
  it('undoes and redoes edits, and coalesces rapid property edits', () => {
    let ws = initWorkspace(createScenario());
    const rename = (name, now) => ({ type: 'edit', fn: (s) => ({ ...s, scenarioName: name }), coalesce: 'name', now, iso: stamp.iso });
    ws = workspaceReducer(ws, rename('A', 1000));
    ws = workspaceReducer(ws, rename('AB', 1200));
    expect(ws.past).toHaveLength(1);
    ws = workspaceReducer(ws, { type: 'undo' });
    expect(ws.scenarios[ws.activeId].scenarioName).toBe('Untitled scenario');
    ws = workspaceReducer(ws, { type: 'redo' });
    expect(ws.scenarios[ws.activeId].scenarioName).toBe('AB');
  });

  it('treats a whole drag as one undo step', () => {
    let ws = initWorkspace(createScenario());
    ws = workspaceReducer(ws, { type: 'gesture' });
    for (let i = 0; i < 5; i += 1) {
      ws = workspaceReducer(ws, { type: 'edit', transient: true, fn: (s) => ({ ...s, description: `${i}` }), ...stamp });
    }
    expect(ws.past).toHaveLength(1);
  });

  it('keeps edits from leaking into updateObject targets that do not exist', () => {
    const s = createScenario();
    expect(updateObject(s, 'unit', 'nope', { x: 1 }).units).toEqual([]);
  });
});
