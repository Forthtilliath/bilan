import { Component, computed, ElementRef, inject, input, signal } from '@angular/core';

import {
  formatDate,
  formatEur,
  formatEurCompact,
  formatMonthShort,
  parseIsoDate,
} from '../../core/format';

import { observeWidth } from './observe-width';
import { linearScale, linePath, nearestIndex, niceTicks, spreadIndices } from './scale';

export interface LineSeries {
  key: string;
  label: string;
  /** Couleur CSS (ex. `var(--series-1)`). */
  color: string;
  values: readonly number[];
  /** Lavis a 10 % sous la courbe. */
  area?: boolean;
}

const MARGIN = { top: 14, right: 14, bottom: 28, left: 58 };

/**
 * Courbes temporelles sur un seul axe : grille en filets, reticule qui s'aimante a la date la plus proche,
 * infobulle listant toutes les series. Navigable au clavier (fleches) une fois le graphique focalise.
 */
@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.html',
  host: { class: 'chart' },
})
export class LineChart {
  readonly dates = input.required<readonly string[]>();
  readonly series = input.required<readonly LineSeries[]>();
  readonly height = input(240);
  readonly label = input('');
  readonly zeroBased = input(false);
  readonly format = input<(value: number) => string>((value) => formatEur(value, { round: true }));
  readonly axisFormat = input<(value: number) => string>(formatEurCompact);
  readonly dateFormat = input<(iso: string) => string>(formatDate);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly width = observeWidth(this.host);
  protected readonly hover = signal<number | null>(null);

  protected readonly geometry = computed(() => {
    const width = this.width();
    const height = this.height();
    const dates = this.dates();
    const series = this.series();
    const left = MARGIN.left;
    const right = Math.max(width - MARGIN.right, left + 10);
    const top = MARGIN.top;
    const bottom = height - MARGIN.bottom;

    const times = dates.map((date) => parseIsoDate(date).getTime());
    const x = linearScale([times[0] ?? 0, times.at(-1) ?? 1], [left, right]);
    const values = series.flatMap((s) => s.values);
    const [min, max] = values.length ? [Math.min(...values), Math.max(...values)] : [0, 1];
    const ticks = niceTicks(min, max, height < 200 ? 3 : 4, this.zeroBased());
    const y = linearScale([ticks[0] ?? 0, ticks.at(-1) ?? 1], [bottom, top]);
    const xs = times.map(x);

    const paths = series.map((s) => {
      const points = s.values.map((value, i) => [xs[i] ?? 0, y(value)] as const);
      const line = linePath(points);
      const last = points.at(-1) ?? [0, 0];
      const area = s.area
        ? `${line}L${last[0].toFixed(1)},${bottom}L${(points[0]?.[0] ?? 0).toFixed(1)},${bottom}Z`
        : null;
      return { key: s.key, color: s.color, line, area, endX: last[0], endY: last[1] };
    });

    const labelCount = width < 480 ? 3 : width < 760 ? 5 : 7;
    const xTicks = spreadIndices(dates.length, labelCount).map((index, i, all) => ({
      index,
      x: xs[index] ?? 0,
      label: formatMonthShort(dates[index]?.slice(0, 7) ?? '', true),
      anchor: i === 0 ? 'start' : i === all.length - 1 ? 'end' : 'middle',
    }));
    const yTicks = ticks.map((value) => ({ value, y: y(value), label: this.axisFormat()(value) }));
    return { width, left, right, top, bottom, xs, y, paths, xTicks, yTicks };
  });

  protected readonly tooltip = computed(() => {
    const index = this.hover();
    if (index === null) {
      return null;
    }
    const g = this.geometry();
    const x = g.xs[index] ?? 0;
    return {
      x,
      flip: x > g.width - 200,
      title: this.dateFormat()(this.dates()[index] ?? ''),
      rows: this.series().map((s) => {
        const value = s.values[index] ?? 0;
        return {
          key: s.key,
          label: s.label,
          color: s.color,
          value: this.format()(value),
          y: g.y(value),
        };
      }),
    };
  });

  /** Lecture vocale du point courant (slider ARIA) : la date, puis chaque serie. */
  protected readonly valueText = computed(() => {
    const index = this.hover() ?? this.dates().length - 1;
    const date = this.dateFormat()(this.dates()[index] ?? '');
    const values = this.series().map((s) => `${s.label} ${this.format()(s.values[index] ?? 0)}`);
    return [date, ...values].join(', ');
  });

  protected onPointerMove(event: PointerEvent): void {
    const svg = (event.currentTarget as SVGElement).ownerSVGElement;
    const rect = svg?.getBoundingClientRect();
    if (rect) {
      this.hover.set(nearestIndex(this.geometry().xs, event.clientX - rect.left));
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    const last = this.dates().length - 1;
    const current = this.hover() ?? last;
    const step = { ArrowLeft: -1, ArrowRight: 1, Home: -Infinity, End: Infinity }[event.key];
    if (step !== undefined) {
      event.preventDefault();
      this.hover.set(Math.min(Math.max(current + step, 0), last));
    }
  }

  protected onFocus(): void {
    this.hover.set(this.dates().length - 1);
  }
}
