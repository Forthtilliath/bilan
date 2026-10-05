import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { formatEur } from '../../core/format';
import type { CategorySpending } from '../../core/models';
import { seriesColor } from '../../core/palette';
import { BudgetMeter, budgetStatus } from '../../shared/ui/budget-meter';
import { CategoryChip } from '../../shared/ui/category-chip';

/** Budgets mensuels : depassements d'abord, puis par taux de consommation decroissant. */
@Component({
  selector: 'app-budgets-card',
  imports: [BudgetMeter, CategoryChip, RouterLink],
  host: { class: 'card' },
  template: `
    <header class="card__header">
      <div class="card__heading">
        <h2 class="card__title">Budgets du mois</h2>
        <p class="card__subtitle">{{ summary() }}</p>
      </div>
      <a class="card__link" routerLink="/categories">Gérer</a>
    </header>
    <ul class="budgets">
      @for (row of rows(); track row.name) {
        <li class="budgets__item">
          <app-category-chip [name]="row.name" [icon]="row.icon" [slot]="row.color" />
          <app-budget-meter
            [spent]="row.amount"
            [budget]="row.budget ?? 0"
            [color]="color(row)"
            [name]="row.name"
          />
        </li>
      } @empty {
        <li class="empty">Aucun budget défini.</li>
      }
    </ul>
  `,
  styles: `
    .budgets {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 18px 24px;
    }
    .budgets__item {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 0.875rem;
      font-weight: 500;
    }
  `,
})
export class BudgetsCard {
  readonly spending = input.required<readonly CategorySpending[]>();

  protected readonly rows = computed(() =>
    this.spending()
      .filter((s) => s.budget !== null && s.budget > 0)
      .sort((a, b) => b.amount / (b.budget ?? 1) - a.amount / (a.budget ?? 1)),
  );

  protected readonly summary = computed(() => {
    const rows = this.rows();
    const spent = rows.reduce((sum, r) => sum + r.amount, 0);
    const budget = rows.reduce((sum, r) => sum + (r.budget ?? 0), 0);
    const over = rows.filter((r) => budgetStatus(r.amount, r.budget ?? 0) === 'over').length;
    const total = `${formatEur(spent, { round: true })} sur ${formatEur(budget, { round: true })}`;
    return over > 0 ? `${total} · ${over} dépassement${over > 1 ? 's' : ''}` : total;
  });

  protected color(row: CategorySpending): string {
    return seriesColor(row.color);
  }
}
