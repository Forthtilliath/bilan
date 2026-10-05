import { Component, computed, input } from '@angular/core';

import { formatDate, formatEur, formatPct } from '../../core/format';
import type { Portfolio } from '../../core/models';
import { ALLOCATION_COLORS, ALLOCATION_LABELS } from '../../core/models';
import { FLOW_COLORS, seriesColor } from '../../core/palette';
import type { LegendItem } from '../../shared/charts/chart-card';
import { ChartCard } from '../../shared/charts/chart-card';
import type { DonutSlice } from '../../shared/charts/donut-chart';
import { DonutChart } from '../../shared/charts/donut-chart';
import type { LineSeries } from '../../shared/charts/line-chart';
import { LineChart } from '../../shared/charts/line-chart';

/** Valeur du portefeuille face aux versements nets : l'ecart entre les deux courbes est la performance. */
@Component({
  selector: 'app-performance-card',
  imports: [ChartCard, LineChart],
  template: `
    <app-chart-card
      heading="Performance"
      subtitle="Valeur (titres + liquidités) et versements nets cumulés"
      [legend]="legend"
    >
      @if (dates().length > 1) {
        <app-line-chart
          [dates]="dates()"
          [series]="series()"
          [height]="260"
          label="Valeur du portefeuille et versements"
        />
      } @else {
        <p class="empty">Pas encore d'historique.</p>
      }
      <table table class="table">
        <thead>
          <tr>
            <th scope="col">Semaine du</th>
            <th scope="col" class="num">Valeur</th>
            <th scope="col" class="num">Versements nets</th>
          </tr>
        </thead>
        <tbody>
          @for (point of portfolio().performance.slice().reverse(); track point.date) {
            <tr>
              <td>{{ formatDate(point.date) }}</td>
              <td class="num">{{ formatEur(point.value) }}</td>
              <td class="num">{{ formatEur(point.contributed) }}</td>
            </tr>
          }
        </tbody>
      </table>
    </app-chart-card>
  `,
})
export class PerformanceCard {
  readonly portfolio = input.required<Portfolio>();

  protected readonly formatDate = formatDate;
  protected readonly formatEur = formatEur;
  protected readonly legend: readonly LegendItem[] = [
    { label: 'Valeur', color: FLOW_COLORS.investments },
    { label: 'Versements nets', color: FLOW_COLORS.contributed },
  ];
  protected readonly dates = computed(() => this.portfolio().performance.map((p) => p.date));
  protected readonly series = computed<LineSeries[]>(() => [
    {
      key: 'value',
      label: 'Valeur',
      color: FLOW_COLORS.investments,
      values: this.portfolio().performance.map((p) => p.value),
      area: true,
    },
    {
      key: 'contributed',
      label: 'Versements nets',
      color: FLOW_COLORS.contributed,
      values: this.portfolio().performance.map((p) => p.contributed),
    },
  ]);
}

/** Repartition par classe d'actifs (couleur fixe par classe), liquidites comprises. */
@Component({
  selector: 'app-allocation-card',
  imports: [DonutChart],
  host: { class: 'card' },
  template: `
    <header class="card__header">
      <h2 class="card__title">Répartition</h2>
    </header>
    <div class="allocation">
      <app-donut-chart
        [slices]="slices()"
        centerTitle="Valeur"
        [centerValue]="total()"
        label="Répartition par classe d'actifs"
      />
      <ul class="allocation__list">
        @for (slice of portfolio().allocation; track slice.key) {
          <li class="allocation__row">
            <span class="legend__key" [style.background]="color(slice.key)"></span>
            <span>{{ labels[slice.key] }}</span>
            <span class="num">{{ formatEur(slice.value, { round: true }) }}</span>
            <span class="num faint">{{ formatPct(slice.weight) }}</span>
          </li>
        }
      </ul>
    </div>
  `,
  styles: `
    .allocation {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 20px;
    }
    .allocation__list {
      display: flex;
      flex: 1 1 200px;
      flex-direction: column;
      gap: 8px;
    }
    .allocation__row {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto 4.2em;
      align-items: center;
      gap: 10px;
      font-size: 0.875rem;
    }
    .allocation__row .faint {
      font-size: 0.75rem;
      text-align: right;
    }
  `,
})
export class AllocationCard {
  readonly portfolio = input.required<Portfolio>();

  protected readonly labels = ALLOCATION_LABELS;
  protected readonly formatEur = formatEur;
  protected readonly formatPct = formatPct;
  protected readonly total = computed(() =>
    formatEur(this.portfolio().totals.value, { round: true }),
  );
  protected readonly slices = computed<DonutSlice[]>(() =>
    this.portfolio().allocation.map((slice) => ({
      key: slice.key,
      label: ALLOCATION_LABELS[slice.key],
      value: slice.value,
      color: seriesColor(ALLOCATION_COLORS[slice.key]),
    })),
  );

  protected color(key: keyof typeof ALLOCATION_COLORS): string {
    return seriesColor(ALLOCATION_COLORS[key]);
  }
}
