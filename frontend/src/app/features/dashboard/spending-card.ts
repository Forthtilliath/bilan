import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { formatEur, formatPct, monthRange } from '../../core/format';
import type { CategorySpending } from '../../core/models';
import { seriesColor } from '../../core/palette';
import type { DonutSlice } from '../../shared/charts/donut-chart';
import { DonutChart } from '../../shared/charts/donut-chart';
import { CategoryChip } from '../../shared/ui/category-chip';

/** Au-dela de 5 categories, le reste est regroupe : un anneau lisible n'a pas plus de 6 parts. */
const MAX_SLICES = 5;

export interface SpendingRow extends CategorySpending {
  share: number;
}

/** Repartit les depenses du mois : les 5 premieres categories, puis « Autres ». */
export function spendingSlices(spending: readonly CategorySpending[]): DonutSlice[] {
  const spent = spending.filter((s) => s.amount > 0);
  const top = spent.slice(0, MAX_SLICES).map((s) => ({
    key: s.categoryId ?? 'none',
    label: s.name,
    value: s.amount,
    color: seriesColor(s.color),
  }));
  const rest = spent.slice(MAX_SLICES).reduce((sum, s) => sum + s.amount, 0);
  return rest > 0
    ? [...top, { key: 'other', label: 'Autres', value: rest, color: 'var(--ink-3)' }]
    : top;
}

/** Depenses du mois par categorie : anneau + liste detaillee (qui sert aussi de vue tableau). */
@Component({
  selector: 'app-spending-card',
  imports: [DonutChart, CategoryChip, RouterLink],
  host: { class: 'card' },
  template: `
    <header class="card__header">
      <div class="card__heading">
        <h2 class="card__title">Dépenses par catégorie</h2>
        <p class="card__subtitle">Cliquez une catégorie pour voir ses opérations</p>
      </div>
    </header>
    <div class="spending">
      <app-donut-chart
        [slices]="slices()"
        centerTitle="Dépensé"
        [centerValue]="total()"
        label="Répartition des dépenses du mois"
      />
      <ul class="spending__list">
        @for (row of rows(); track row.name) {
          <li>
            <a class="spending__row" routerLink="/transactions" [queryParams]="query(row)">
              <app-category-chip [name]="row.name" [icon]="row.icon" [slot]="row.color" />
              <span class="spending__amount num">{{ formatEur(row.amount, { round: true }) }}</span>
              <span class="spending__share num faint">{{ formatPct(row.share) }}</span>
            </a>
          </li>
        } @empty {
          <li class="empty">Aucune dépense ce mois-ci.</li>
        }
      </ul>
    </div>
  `,
  styles: `
    .spending {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 20px;
    }
    .spending__list {
      display: flex;
      flex: 1 1 240px;
      flex-direction: column;
      min-width: 0;
    }
    .spending__row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto 4.2em;
      align-items: center;
      gap: 10px;
      padding: 5px 8px;
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
    }
    .spending__row:hover {
      background: var(--surface-2);
    }
    .spending__amount {
      font-weight: 500;
    }
    .spending__share {
      font-size: 0.75rem;
      text-align: right;
    }
  `,
})
export class SpendingCard {
  readonly spending = input.required<readonly CategorySpending[]>();
  readonly month = input.required<string>();

  protected readonly formatEur = formatEur;
  protected readonly formatPct = formatPct;
  protected readonly slices = computed(() => spendingSlices(this.spending()));
  private readonly sum = computed(() => this.spending().reduce((sum, s) => sum + s.amount, 0));
  protected readonly total = computed(() => formatEur(this.sum(), { round: true }));
  protected readonly rows = computed<SpendingRow[]>(() =>
    this.spending()
      .filter((s) => s.amount > 0)
      .map((s) => ({ ...s, share: this.sum() > 0 ? (s.amount / this.sum()) * 100 : 0 })),
  );

  protected query(row: CategorySpending): Record<string, string> {
    const { from, to } = monthRange(this.month());
    const category: Record<string, string> = row.categoryId
      ? { categoryId: row.categoryId }
      : { uncategorized: 'true' };
    return { ...category, kind: 'EXPENSE', from, to };
  }
}
