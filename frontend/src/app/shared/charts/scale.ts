/** Echelles et graduations des graphiques SVG (fonctions pures). */

export type Scale = (value: number) => number;

/** Echelle lineaire : projette [d0, d1] sur [r0, r1]. Un domaine nul se projette au milieu. */
export function linearScale(
  [d0, d1]: readonly [number, number],
  [r0, r1]: readonly [number, number],
): Scale {
  const span = d1 - d0;
  if (span === 0) {
    return () => (r0 + r1) / 2;
  }
  return (value) => r0 + ((value - d0) / span) * (r1 - r0);
}

/** Pas « rond » (1, 2, 5 x 10^n) pour couvrir `span` en environ `count` intervalles. */
export function niceStep(span: number, count: number): number {
  const raw = span / Math.max(count, 1);
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const factor = normalized < 1.5 ? 1 : normalized < 3 ? 2 : normalized < 7 ? 5 : 10;
  return factor * magnitude;
}

/**
 * Graduations rondes englobant [min, max]. `includeZero` force 0 dans le domaine (barres : la longueur
 * doit partir de zero). Un domaine plat est elargi pour rester lisible.
 */
export function niceTicks(min: number, max: number, count = 4, includeZero = false): number[] {
  let low = includeZero ? Math.min(0, min) : min;
  let high = includeZero ? Math.max(0, max) : max;
  if (low === high) {
    const pad = Math.abs(low) * 0.1 || 1;
    low -= pad;
    high += pad;
  }
  const step = niceStep(high - low, count);
  const start = Math.floor(low / step) * step;
  const end = Math.ceil(high / step) * step;
  const ticks: number[] = [];
  for (let tick = start; tick <= end + step / 2; tick += step) {
    // Arrondi pour eviter 0.30000000000000004 dans les etiquettes.
    ticks.push(Number(tick.toPrecision(12)));
  }
  return ticks;
}

/** Indice du point dont l'abscisse est la plus proche de `x` (abscisses croissantes). */
export function nearestIndex(xs: readonly number[], x: number): number {
  if (xs.length === 0) {
    return -1;
  }
  let low = 0;
  let high = xs.length - 1;
  while (high - low > 1) {
    const mid = (low + high) >> 1;
    if ((xs[mid] ?? 0) < x) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return Math.abs((xs[low] ?? 0) - x) <= Math.abs((xs[high] ?? 0) - x) ? low : high;
}

/** Au plus `max` indices regulierement espaces, le premier et le dernier inclus. */
export function spreadIndices(length: number, max: number): number[] {
  if (length <= 0) {
    return [];
  }
  if (length <= max) {
    return Array.from({ length }, (_, i) => i);
  }
  const indices = new Set<number>();
  for (let i = 0; i < max; i++) {
    indices.add(Math.round((i * (length - 1)) / (max - 1)));
  }
  return [...indices];
}

/** Chemin SVG d'une polyligne. */
export function linePath(points: readonly (readonly [number, number])[]): string {
  return points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join('');
}

/** Chemin d'une barre verticale : extremite de donnees arrondie (4px), base carree. */
export function columnPath(
  x: number,
  width: number,
  top: number,
  baseline: number,
  radius = 4,
): string {
  const height = baseline - top;
  if (height <= 0) {
    return '';
  }
  const r = Math.min(radius, width / 2, height);
  return (
    `M${x},${baseline}V${top + r}Q${x},${top} ${x + r},${top}` +
    `H${x + width - r}Q${x + width},${top} ${x + width},${top + r}V${baseline}Z`
  );
}
