import type { ColorSlot } from './models';

/** Couleur CSS d'un emplacement de la palette categorielle (valeurs claires / sombres dans tokens.css). */
export function seriesColor(slot: ColorSlot | null | undefined): string {
  return slot ? `var(--series-${slot})` : 'var(--ink-3)';
}

/** Couleurs semantiques des graphiques de flux : jamais reutilisees pour une serie ordinaire. */
export const FLOW_COLORS = {
  income: 'var(--series-3)',
  expense: 'var(--series-2)',
  netWorth: 'var(--series-1)',
  investments: 'var(--series-7)',
  contributed: 'var(--ink-3)',
} as const;
