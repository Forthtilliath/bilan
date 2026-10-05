import { addMonths, monthOf, monthRange, todayIso } from '../../core/format';

export type PeriodPreset = 'month' | 'last-month' | '3m' | '12m' | 'all';

export interface Period {
  from: string | null;
  to: string | null;
}

export const PERIOD_LABELS: Record<PeriodPreset, string> = {
  month: 'Ce mois',
  'last-month': 'Mois dernier',
  '3m': '3 mois',
  '12m': '12 mois',
  all: 'Tout',
};

/** Bornes d'une periode predefinie, relatives a `today`. */
export function presetPeriod(preset: PeriodPreset, today = todayIso()): Period {
  const month = monthOf(today);
  switch (preset) {
    case 'month':
      return { from: monthRange(month).from, to: today };
    case 'last-month':
      return monthRange(addMonths(month, -1));
    case '3m':
      return { from: monthRange(addMonths(month, -2)).from, to: today };
    case '12m':
      return { from: monthRange(addMonths(month, -11)).from, to: today };
    case 'all':
      return { from: null, to: null };
  }
}

/** Retrouve le preset correspondant a des bornes, ou null pour une periode personnalisee. */
export function matchPreset(period: Period, today = todayIso()): PeriodPreset | null {
  const presets = Object.keys(PERIOD_LABELS) as PeriodPreset[];
  return (
    presets.find((preset) => {
      const candidate = presetPeriod(preset, today);
      return candidate.from === period.from && candidate.to === period.to;
    }) ?? null
  );
}
