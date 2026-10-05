import {
  addMonths,
  formatDate,
  formatEur,
  formatEurCompact,
  formatMonth,
  formatPct,
  formatQuantity,
  monthRange,
  parseIsoDate,
  toIsoDate,
} from './format';

/** Intl insere des espaces insecables (U+00A0, U+202F) : on les ramene a des espaces simples. */
const plain = (text: string): string => text.replace(/[\u00a0\u202f]/g, ' ');

describe('format', () => {
  it('formats euros the French way, with an optional sign', () => {
    expect(plain(formatEur(1234.5))).toBe('1 234,50 €');
    expect(plain(formatEur(-89.9))).toBe('−89,90 €');
    expect(plain(formatEur(42, { signed: true }))).toBe('+42,00 €');
    expect(plain(formatEur(41794.76, { round: true }))).toBe('41 795 €');
    expect(plain(formatEurCompact(12_900))).toMatch(/^12,9 k\s?€$/);
  });

  it('formats percentages and shows a dash when unknown', () => {
    expect(plain(formatPct(5.678, true))).toBe('+5,7 %');
    expect(plain(formatPct(-0.81))).toBe('−0,8 %');
    expect(formatPct(null)).toBe('—');
  });

  it('keeps crypto quantities precise', () => {
    expect(plain(formatQuantity(0.02285212))).toBe('0,02285212');
    expect(plain(formatQuantity(57))).toBe('57');
  });

  it('reads ISO dates as local dates, without timezone shift', () => {
    const date = parseIsoDate('2026-10-05');
    expect(date.getDate()).toBe(5);
    expect(toIsoDate(date)).toBe('2026-10-05');
    expect(formatDate('2026-10-05')).toMatch(/^5 oct\.? 2026$/);
  });

  it('walks months and their bounds', () => {
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(addMonths('2026-11', 3)).toBe('2027-02');
    expect(monthRange('2028-02')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
    expect(formatMonth('2026-09')).toBe('septembre 2026');
  });
});
