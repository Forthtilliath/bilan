/** Formats francais : euros, pourcentages, dates et mois. Les dates ISO sont lues en heure locale. */

const EUR = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const EUR_ROUND = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});
const EUR_COMPACT = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  notation: 'compact',
  maximumFractionDigits: 1,
});
const PERCENT = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const QUANTITY = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 8 });
const PRICE = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

const DATE = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const DAY_MONTH = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const MONTH_LONG = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
const MONTH_SHORT = new Intl.DateTimeFormat('fr-FR', { month: 'short' });
const MONTH_YEAR_SHORT = new Intl.DateTimeFormat('fr-FR', { month: 'short', year: '2-digit' });

export interface EurOptions {
  /** Toujours afficher le signe (+ / −). */
  signed?: boolean;
  /** Arrondi a l'euro. */
  round?: boolean;
}

export function formatEur(value: number, options: EurOptions = {}): string {
  const formatted = (options.round ? EUR_ROUND : EUR).format(Math.abs(value));
  return sign(value, options.signed) + formatted;
}

/** 12,9 k€ — pour les axes et les etiquettes serrees. */
export function formatEurCompact(value: number): string {
  return EUR_COMPACT.format(value);
}

export function formatPct(value: number | null | undefined, signed = false): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  return `${sign(value, signed)}${PERCENT.format(Math.abs(value))} %`;
}

export function formatQuantity(value: number): string {
  return QUANTITY.format(value);
}

/** Cours unitaire : 2 a 4 decimales. */
export function formatPrice(value: number): string {
  return `${PRICE.format(value)} €`;
}

function sign(value: number, signed?: boolean): string {
  if (value < 0) {
    return '−';
  }
  return signed && value > 0 ? '+' : '';
}

// ------------------------------------------------------------------ Dates

/** Date ISO (AAAA-MM-JJ) → Date locale a minuit (sans decalage de fuseau). */
export function parseIsoDate(iso: string): Date {
  const [year = 1970, month = 1, day = 1] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function formatDate(iso: string): string {
  return DATE.format(parseIsoDate(iso));
}

export function formatDayMonth(iso: string): string {
  return DAY_MONTH.format(parseIsoDate(iso));
}

// ------------------------------------------------------------------ Mois (AAAA-MM)

export function monthOf(iso: string): string {
  return iso.slice(0, 7);
}

export function addMonths(month: string, delta: number): string {
  const [year = 1970, m = 1] = month.split('-').map(Number);
  const date = new Date(year, m - 1 + delta, 1);
  return toIsoDate(date).slice(0, 7);
}

/** Premier et dernier jour du mois. */
export function monthRange(month: string): { from: string; to: string } {
  const [year = 1970, m = 1] = month.split('-').map(Number);
  return { from: `${month}-01`, to: toIsoDate(new Date(year, m, 0)) };
}

/** « septembre 2026 » */
export function formatMonth(month: string): string {
  return MONTH_LONG.format(parseIsoDate(`${month}-01`));
}

/** « sept. » ; avec l'annee : « sept. 26 » */
export function formatMonthShort(month: string, withYear = false): string {
  return (withYear ? MONTH_YEAR_SHORT : MONTH_SHORT).format(parseIsoDate(`${month}-01`));
}
