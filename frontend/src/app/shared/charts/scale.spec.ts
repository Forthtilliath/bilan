import { columnPath, linearScale, nearestIndex, niceStep, niceTicks, spreadIndices } from './scale';

describe('chart scales', () => {
  it('maps a domain linearly, including inverted ranges', () => {
    const y = linearScale([0, 100], [200, 0]);
    expect(y(0)).toBe(200);
    expect(y(25)).toBe(150);
    expect(linearScale([5, 5], [0, 10])(5)).toBe(5);
  });

  it('picks 1-2-5 steps', () => {
    expect(niceStep(100, 4)).toBe(20);
    expect(niceStep(37_000, 4)).toBe(10_000);
    expect(niceStep(0.9, 4)).toBe(0.2);
  });

  it('builds round ticks around the data, with zero for bars', () => {
    expect(niceTicks(9_901, 41_794, 4)).toEqual([0, 10_000, 20_000, 30_000, 40_000, 50_000]);
    expect(niceTicks(1_200, 1_900, 4)).toEqual([1_200, 1_400, 1_600, 1_800, 2_000]);
    expect(niceTicks(300, 4_900, 4, true)[0]).toBe(0);
    expect(niceTicks(0.1, 0.3, 2)).toEqual([0.1, 0.2, 0.3]);
  });

  it('widens a flat domain instead of dividing by zero', () => {
    const ticks = niceTicks(500, 500, 4);
    expect(ticks[0]).toBeLessThan(500);
    expect(ticks.at(-1)).toBeGreaterThan(500);
  });

  it('finds the nearest x by binary search', () => {
    const xs = [0, 10, 20, 30];
    expect(nearestIndex(xs, -4)).toBe(0);
    expect(nearestIndex(xs, 14)).toBe(1);
    expect(nearestIndex(xs, 16)).toBe(2);
    expect(nearestIndex(xs, 99)).toBe(3);
    expect(nearestIndex([], 1)).toBe(-1);
  });

  it('spreads label indices and keeps both ends', () => {
    expect(spreadIndices(3, 6)).toEqual([0, 1, 2]);
    expect(spreadIndices(101, 5)).toEqual([0, 25, 50, 75, 100]);
  });

  it('draws columns with a rounded data end and a square base', () => {
    expect(columnPath(0, 10, 20, 100)).toMatch(/^M0,100V24Q0,20 4,20H6Q10,20 10,24V100Z$/);
    expect(columnPath(0, 10, 100, 100)).toBe('');
  });
});
