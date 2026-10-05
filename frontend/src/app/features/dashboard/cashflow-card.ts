import { Component, computed, input, output } from '@angular/core';

import { formatEur, formatMonth, formatMonthShort } from '../../core/format';
import type { MonthFlow } from '../../core/models';
import { FLOW_COLORS } from '../../core/palette';
import type { LegendItem } from '../../shared/charts/chart-card';
import { ChartCard } from '../../shared/charts/chart-card';
import type { ColumnSeries } from '../../shared/charts/column-chart';
import { ColumnChart } from '../../shared/charts/column-chart';

/** Revenus et depenses des 12 mois se terminant au mois analyse ; un clic sur un mois le selectionne. */
@Component({
  selector: 'app-cashflow-card',
  imports: [ChartCard, ColumnChart],
  template: `
    <app-chart-card
      heading="Revenus et dépenses"
      subtitle="12 mois, hors virements internes — cliquez un mois pour l'analyser"
      [legend]="legend"
    >
      <app-column-chart
        [categories]="months()"
        [labels]="labels()"
        [titles]="titles()"
        [series]="series()"
        [selected]="selected()"
        [height]="250"
        label="Revenus et dépenses par mois"
        (picked)="pick.emit($event)"
      />
      <table table class="table">
        <thead>
          <tr>
            <th scope="col">Mois</th>
            <th scope="col" class="num">Revenus</th>
            <th scope="col" class="num">Dépenses</th>
            <th scope="col" class="num">Solde</th>
          </tr>
        </thead>
        <tbody>
          @for (flow of flows(); track flow.month) {
            <tr>
              <td>{{ formatMonth(flow.month) }}</td>
              <td class="num">{{ formatEur(flow.income) }}</td>
              <td class="num">{{ formatEur(flow.expense) }}</td>
              <td class="num">{{ formatEur(flow.net, { signed: true }) }}</td>
            </tr>
          }
        </tbody>
      </table>
    </app-chart-card>
  `,
})
export class CashflowCard {
  readonly flows = input.required<readonly MonthFlow[]>();
  readonly selected = input.required<string>();
  readonly pick = output<string>();

  protected readonly formatEur = formatEur;
  protected readonly formatMonth = formatMonth;
  protected readonly legend: readonly LegendItem[] = [
    { label: 'Revenus', color: FLOW_COLORS.income, shape: 'rect' },
    { label: 'Dépenses', color: FLOW_COLORS.expense, shape: 'rect' },
  ];

  protected readonly months = computed(() => this.flows().map((f) => f.month));
  protected readonly labels = computed(() => this.flows().map((f) => formatMonthShort(f.month)));
  protected readonly titles = computed(() => this.flows().map((f) => formatMonth(f.month)));
  protected readonly series = computed<ColumnSeries[]>(() => [
    {
      key: 'income',
      label: 'Revenus',
      color: FLOW_COLORS.income,
      values: this.flows().map((f) => f.income),
    },
    {
      key: 'expense',
      label: 'Dépenses',
      color: FLOW_COLORS.expense,
      values: this.flows().map((f) => f.expense),
    },
  ]);
}
