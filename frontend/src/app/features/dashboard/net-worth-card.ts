import { Component, computed, input, signal } from '@angular/core';

import { formatDate, formatEur, todayIso } from '../../core/format';
import type { Dashboard } from '../../core/models';
import { FLOW_COLORS } from '../../core/palette';
import type { LegendItem } from '../../shared/charts/chart-card';
import { ChartCard } from '../../shared/charts/chart-card';
import type { LineSeries } from '../../shared/charts/line-chart';
import { LineChart } from '../../shared/charts/line-chart';
import { Delta } from '../../shared/ui/delta';
import type { SegmentOption } from '../../shared/ui/segmented';
import { Segmented } from '../../shared/ui/segmented';

type Range = '6M' | '1A' | 'MAX';

const RANGE_WEEKS: Record<Range, number> = { '6M': 26, '1A': 52, MAX: Infinity };

/** Chiffre vedette (patrimoine net a date du jour) et son evolution hebdomadaire. */
@Component({
  selector: 'app-net-worth-card',
  imports: [ChartCard, LineChart, Delta, Segmented],
  template: `
    @let d = dashboard();
    <app-chart-card heading="Patrimoine net" [subtitle]="'Au ' + today" [legend]="legend">
      <app-segmented actions label="Période" [options]="ranges" [(value)]="range" />
      <div class="net-worth">
        <p class="hero-figure">{{ total() }}</p>
        <p class="net-worth__meta">
          <app-delta
            [value]="d.netWorth.change30d"
            [pct]="d.netWorth.change30dPct"
            suffix="sur 30 jours"
          />
          <span class="faint">·</span>
          <span class="muted">dont {{ investments() }} investis</span>
        </p>
      </div>
      <app-line-chart
        [dates]="dates()"
        [series]="series()"
        [height]="260"
        label="Évolution du patrimoine net"
      />
      <table table class="table">
        <thead>
          <tr>
            <th scope="col">Semaine du</th>
            <th scope="col" class="num">Patrimoine net</th>
            <th scope="col" class="num">Investissements</th>
          </tr>
        </thead>
        <tbody>
          @for (point of points().slice().reverse(); track point.date) {
            <tr>
              <td>{{ formatDate(point.date) }}</td>
              <td class="num">{{ formatEur(point.total) }}</td>
              <td class="num">{{ formatEur(point.investments) }}</td>
            </tr>
          }
        </tbody>
      </table>
    </app-chart-card>
  `,
  styles: `
    .net-worth {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .net-worth__meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      font-size: 0.8125rem;
    }
  `,
})
export class NetWorthCard {
  readonly dashboard = input.required<Dashboard>();

  protected readonly today = formatDate(todayIso());
  protected readonly formatDate = formatDate;
  protected readonly formatEur = formatEur;
  protected readonly range = signal<Range>('1A');
  protected readonly ranges: readonly SegmentOption<Range>[] = [
    { value: '6M', label: '6 mois' },
    { value: '1A', label: '1 an' },
    { value: 'MAX', label: 'Tout' },
  ];
  protected readonly legend: readonly LegendItem[] = [
    { label: 'Patrimoine net', color: FLOW_COLORS.netWorth },
    { label: 'Investissements', color: FLOW_COLORS.investments },
  ];

  protected readonly total = computed(() =>
    formatEur(this.dashboard().netWorth.total, { round: true }),
  );
  protected readonly investments = computed(() =>
    formatEur(this.dashboard().netWorth.investments, { round: true }),
  );

  protected readonly points = computed(() => {
    const history = this.dashboard().history;
    const weeks = RANGE_WEEKS[this.range()];
    return Number.isFinite(weeks) ? history.slice(-weeks - 1) : history;
  });
  protected readonly dates = computed(() => this.points().map((p) => p.date));
  protected readonly series = computed<LineSeries[]>(() => [
    {
      key: 'total',
      label: 'Patrimoine net',
      color: FLOW_COLORS.netWorth,
      values: this.points().map((p) => p.total),
      area: true,
    },
    {
      key: 'investments',
      label: 'Investissements',
      color: FLOW_COLORS.investments,
      values: this.points().map((p) => p.investments),
    },
  ]);
}
