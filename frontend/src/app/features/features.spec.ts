import type { CategorySpending, Transaction } from '../core/models';

import { defaultAnalysisMonth } from './dashboard/dashboard.page';
import { spendingSlices } from './dashboard/spending-card';
import { priceAt } from './portfolio/trade-form';
import { modeOf } from './transactions/transaction-editor';

const spending = (name: string, amount: number): CategorySpending => ({
  categoryId: null,
  name,
  color: 1,
  icon: null,
  amount,
  budget: null,
});

describe('defaultAnalysisMonth', () => {
  it('analyses the previous month during the first week', () => {
    expect(defaultAnalysisMonth('2026-10-05')).toBe('2026-09');
    expect(defaultAnalysisMonth('2026-01-03')).toBe('2025-12');
    expect(defaultAnalysisMonth('2026-10-08')).toBe('2026-10');
  });
});

describe('spendingSlices', () => {
  it('keeps five categories and folds the rest into « Autres »', () => {
    const slices = spendingSlices(
      ['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((name, i) => spending(name, 100 - i * 10)),
    );
    expect(slices.map((s) => s.label)).toEqual(['A', 'B', 'C', 'D', 'E', 'Autres']);
    expect(slices.at(-1)?.value).toBe(90);
  });

  it('ignores categories without spending', () => {
    expect(spendingSlices([spending('A', 0), spending('B', 12)]).map((s) => s.label)).toEqual([
      'B',
    ]);
  });
});

describe('priceAt', () => {
  const prices = [
    { date: '2026-10-01', value: 10 },
    { date: '2026-10-02', value: 11 },
    { date: '2026-10-05', value: 12 },
  ];

  it('takes the last close known on that day (week-ends included)', () => {
    expect(priceAt(prices, '2026-10-04')).toBe(11);
    expect(priceAt(prices, '2026-10-05')).toBe(12);
    expect(priceAt(prices, '2026-09-01')).toBe(10);
    expect(priceAt([], '2026-10-01')).toBeNull();
  });
});

describe('modeOf', () => {
  const tx = (patch: Partial<Transaction>): Transaction =>
    ({ amount: -10, transferId: null, ...patch }) as Transaction;

  it('derives the editor mode from the sign and the transfer link', () => {
    expect(modeOf(tx({}))).toBe('expense');
    expect(modeOf(tx({ amount: 2985 }))).toBe('income');
    expect(modeOf(tx({ transferId: 't' as Transaction['transferId'] }))).toBe('transfer');
  });
});
