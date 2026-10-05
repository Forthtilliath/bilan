import { Component, computed, ElementRef, inject, input, output, signal } from '@angular/core';

import { formatEur, formatEurCompact } from '../../core/format';

import { observeWidth } from './observe-width';
import { columnPath, linearScale, niceTicks, spreadIndices } from './scale';

export interface ColumnSeries {
  key: string;
  label: string;
  color: string;
  /** Une valeur (positive) par categorie. */
  values: readonly number[];
}

const MARGIN = { top: 14, right: 8, bottom: 28, left: 58 };
const MAX_BAR = 24;
const GAP = 2;

/**
 * Colonnes groupees (une par serie et par categorie) partant d'une meme ligne de base.
 * Chaque groupe est une cible de survol / clic ; la categorie selectionnee est surlignee.
 */
@Component({
  selector: 'app-column-chart',
  templateUrl: './column-chart.html',
  host: { class: 'chart' },
})
export class ColumnChart {
  readonly categories = input.required<readonly string[]>();
  /** Etiquettes d'axe, dans l'ordre des categories. */
  readonly labels = input.required<readonly string[]>();
  /** Titres d'infobulle (par defaut : les etiquettes). */
  readonly titles = input<readonly string[] | null>(null);
  readonly series = input.required<readonly ColumnSeries[]>();
  readonly selected = input<string | null>(null);
  readonly height = input(240);
  readonly label = input('');
  readonly format = input<(value: number) => string>((value) => formatEur(value, { round: true }));
  readonly axisFormat = input<(value: number) => string>(formatEurCompact);

  readonly picked = output<string>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly width = observeWidth(this.host);
  protected readonly hover = signal<number | null>(null);

  protected readonly geometry = computed(() => {
    const width = this.width();
    const height = this.height();
    const categories = this.categories();
    const series = this.series();
    const left = MARGIN.left;
    const right = Math.max(width - MARGIN.right, left + 10);
    const top = MARGIN.top;
    const bottom = height - MARGIN.bottom;

    const max = Math.max(0, ...series.flatMap((s) => s.values));
    const ticks = niceTicks(0, max, height < 200 ? 3 : 4, true);
    const y = linearScale([ticks[0] ?? 0, ticks.at(-1) ?? 1], [bottom, top]);

    const band = (right - left) / Math.max(categories.length, 1);
    const count = series.length;
    const barWidth = Math.min(MAX_BAR, (band * 0.72 - GAP * (count - 1)) / count);
    const groupWidth = barWidth * count + GAP * (count - 1);

    const groups = categories.map((key, i) => {
      const bandX = left + i * band;
      const start = bandX + (band - groupWidth) / 2;
      return {
        key,
        index: i,
        bandX,
        center: bandX + band / 2,
        bars: series.map((s, j) => ({
          key: s.key,
          color: s.color,
          d: columnPath(start + j * (barWidth + GAP), barWidth, y(s.values[i] ?? 0), bottom),
        })),
      };
    });
    const visibleLabels = new Set(
      spreadIndices(categories.length, band < 36 ? 6 : categories.length),
    );
    const yTicks = ticks.map((value) => ({ value, y: y(value), label: this.axisFormat()(value) }));
    return { width, left, right, top, bottom, band, groups, visibleLabels, yTicks };
  });

  protected readonly tooltip = computed(() => {
    const index = this.hover();
    if (index === null) {
      return null;
    }
    const g = this.geometry();
    const group = g.groups[index];
    const x = group?.center ?? 0;
    return {
      x,
      flip: x > g.width - 200,
      title: (this.titles() ?? this.labels())[index] ?? '',
      rows: this.series().map((s) => ({
        key: s.key,
        label: s.label,
        color: s.color,
        value: this.format()(s.values[index] ?? 0),
      })),
    };
  });

  protected onKeydown(event: KeyboardEvent, index: number): void {
    const delta = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
    if (delta !== undefined) {
      event.preventDefault();
      const target = (event.currentTarget as SVGElement).parentElement?.children[index + delta];
      (target as SVGElement | undefined)?.focus();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.picked.emit(this.categories()[index] ?? '');
    }
  }
}
