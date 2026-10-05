import { matchPreset, presetPeriod } from './period';

const TODAY = '2026-10-05';

describe('periods', () => {
  it('resolves presets relative to today', () => {
    expect(presetPeriod('month', TODAY)).toEqual({ from: '2026-10-01', to: TODAY });
    expect(presetPeriod('last-month', TODAY)).toEqual({ from: '2026-09-01', to: '2026-09-30' });
    expect(presetPeriod('3m', TODAY)).toEqual({ from: '2026-08-01', to: TODAY });
    expect(presetPeriod('12m', TODAY)).toEqual({ from: '2025-11-01', to: TODAY });
    expect(presetPeriod('all', TODAY)).toEqual({ from: null, to: null });
  });

  it('recognises a preset from its bounds, or reports a custom range', () => {
    expect(matchPreset({ from: '2026-09-01', to: '2026-09-30' }, TODAY)).toBe('last-month');
    expect(matchPreset({ from: null, to: null }, TODAY)).toBe('all');
    expect(matchPreset({ from: '2026-03-01', to: '2026-03-31' }, TODAY)).toBeNull();
  });
});
