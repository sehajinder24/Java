import { describe, expect, it } from 'vitest';
import { computeAreaOfControl } from '../geometry/aoc.js';

const unit = (id, team, x, y, r) => ({ unitId: id, teamId: team, x, y, influenceRadius: r });
const byTeam = (regions, t) => regions.find((r) => r.teamId === t);

describe('area of control', () => {
  it('gives a lone unit a circular region', () => {
    const [r] = computeAreaOfControl([unit('a', 'A', 500, 500, 100)]);
    expect(r.area).toBeGreaterThan(Math.PI * 100 * 100 * 0.99);
    expect(r.area).toBeLessThan(Math.PI * 100 * 100 * 1.001);
  });

  it('merges overlapping same-team units without double counting', () => {
    const solo = computeAreaOfControl([unit('a', 'A', 500, 500, 100)])[0].area;
    const merged = computeAreaOfControl([unit('a', 'A', 500, 500, 100), unit('b', 'A', 560, 500, 100)]);
    expect(merged).toHaveLength(1);
    expect(merged[0].paths).toHaveLength(1);
    expect(merged[0].area).toBeGreaterThan(solo);
    expect(merged[0].area).toBeLessThan(solo * 2);
  });

  it('splits an overlap between two teams at the midpoint', () => {
    const regions = computeAreaOfControl([unit('a', 'A', 400, 500, 150), unit('b', 'B', 600, 500, 150)]);
    const a = byTeam(regions, 'A').area;
    const b = byTeam(regions, 'B').area;
    expect(Math.abs(a - b)).toBeLessThan(1);
    const full = Math.PI * 150 * 150;
    expect(a).toBeLessThan(full);
  });

  it('does not chop a big unit behind a small enemy that cannot reach there', () => {
    const regions = computeAreaOfControl([unit('big', 'A', 500, 500, 300), unit('small', 'B', 700, 500, 40)]);
    const a = byTeam(regions, 'A').area;
    expect(a).toBeGreaterThan(Math.PI * 300 * 300 * 0.9);
  });

  it('leaves disjoint teams untouched', () => {
    const regions = computeAreaOfControl([unit('a', 'A', 200, 200, 80), unit('b', 'B', 900, 900, 80)]);
    expect(regions).toHaveLength(2);
    expect(byTeam(regions, 'A').area).toBeCloseTo(byTeam(regions, 'B').area, 0);
  });

  it('keeps same-team units in one region even next to an enemy', () => {
    const regions = computeAreaOfControl([
      unit('a1', 'A', 400, 500, 120), unit('a2', 'A', 480, 500, 120), unit('b', 'B', 640, 500, 120),
    ]);
    expect(regions).toHaveLength(2);
  });

  it('ignores units without a usable radius or team', () => {
    expect(computeAreaOfControl([unit('a', 'A', 1, 1, 0), unit('b', null, 1, 1, 50)])).toEqual([]);
  });
});
