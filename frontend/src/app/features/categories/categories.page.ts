import { httpResource } from '@angular/common/http';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { formatEur } from '../../core/format';
import type { Category, CategoryKind } from '../../core/models';
import { seriesColor } from '../../core/palette';
import { Icon } from '../../shared/icon';
import { BudgetMeter } from '../../shared/ui/budget-meter';
import { CategoryChip } from '../../shared/ui/category-chip';
import { Drawer } from '../../shared/ui/drawer';

import { CategoryForm } from './category-form';

/** Categories de depenses (avec budgets) et de revenus, chiffres du mois courant et moyenne sur 6 mois. */
@Component({
  selector: 'app-categories-page',
  imports: [RouterLink, Icon, BudgetMeter, CategoryChip, Drawer, CategoryForm],
  templateUrl: './categories.page.html',
  styles: `
    .category-list {
      display: flex;
      flex-direction: column;
    }
    .category-row {
      display: grid;
      grid-template-columns:
        minmax(150px, 1.1fr) minmax(200px, 2fr) repeat(2, minmax(90px, 0.6fr))
        auto;
      align-items: center;
      gap: 16px;
      padding: 12px 0;
      border-bottom: 1px solid var(--border);
    }
    .category-row:last-child {
      border-bottom: 0;
    }
    .category-row__figure {
      display: flex;
      flex-direction: column;
      text-align: right;
    }
    .category-row__figure strong {
      font-variant-numeric: tabular-nums;
      font-weight: 600;
    }
    .category-row__figure span {
      color: var(--ink-3);
      font-size: 0.75rem;
    }
    .category-row__actions {
      display: flex;
      gap: 2px;
    }
    @media (max-width: 760px) {
      .category-row {
        grid-template-columns: minmax(0, 1fr) auto;
      }
      .category-row__budget {
        grid-column: 1 / -1;
        order: 5;
      }
      .category-row__figure--avg {
        display: none;
      }
    }
  `,
})
export class CategoriesPage {
  protected readonly categories = httpResource<Category[]>(() => '/api/categories', {
    defaultValue: [],
  });

  protected readonly expenses = computed(() =>
    this.categories
      .value()
      .filter((c) => c.kind === 'EXPENSE')
      .sort((a, b) => b.currentMonth - a.currentMonth),
  );
  protected readonly incomes = computed(() =>
    this.categories
      .value()
      .filter((c) => c.kind === 'INCOME')
      .sort((a, b) => b.monthlyAverage - a.monthlyAverage),
  );
  protected readonly budgetTotal = computed(() => {
    const budgeted = this.expenses().filter((c) => c.monthlyBudget);
    const budget = budgeted.reduce((sum, c) => sum + (c.monthlyBudget ?? 0), 0);
    const spent = budgeted.reduce((sum, c) => sum + c.currentMonth, 0);
    return { budget: formatEur(budget, { round: true }), spent: formatEur(spent, { round: true }) };
  });

  protected readonly editing = signal<Category | null>(null);
  protected readonly creating = signal<CategoryKind | null>(null);

  protected readonly formatEur = formatEur;
  protected readonly seriesColor = seriesColor;

  protected onDone(): void {
    this.editing.set(null);
    this.creating.set(null);
    this.categories.reload();
  }

  protected close(): void {
    this.editing.set(null);
    this.creating.set(null);
  }
}
