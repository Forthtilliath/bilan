import { httpResource } from '@angular/common/http';
import { Component, computed, linkedSignal, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { addMonths, formatEur, formatPct, monthOf, todayIso } from '../../core/format';
import type { Account, Dashboard } from '../../core/models';
import { Delta } from '../../shared/ui/delta';
import { MonthPicker } from '../../shared/ui/month-picker';
import { StatTile } from '../../shared/ui/stat-tile';
import { TransactionRow } from '../../shared/ui/transaction-row';

import { AccountsSummary } from './accounts-summary';
import { BudgetsCard } from './budgets-card';
import { CashflowCard } from './cashflow-card';
import { NetWorthCard } from './net-worth-card';
import { SpendingCard } from './spending-card';

/** En debut de mois, le mois courant est encore presque vide : on analyse le mois precedent. */
export function defaultAnalysisMonth(today = todayIso()): string {
  const month = monthOf(today);
  return Number(today.slice(8, 10)) < 8 ? addMonths(month, -1) : month;
}

@Component({
  selector: 'app-dashboard-page',
  imports: [
    RouterLink,
    NetWorthCard,
    AccountsSummary,
    CashflowCard,
    SpendingCard,
    BudgetsCard,
    StatTile,
    Delta,
    MonthPicker,
    TransactionRow,
  ],
  templateUrl: './dashboard.page.html',
  styles: `
    .month-section {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: 12px;
    }
    .month-section h2 {
      font-family: var(--font-display);
      font-size: 1.75rem;
      font-weight: 400;
    }
    .recent {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
  `,
})
export class DashboardPage {
  protected readonly maxMonth = monthOf(todayIso());
  protected readonly month = signal(defaultAnalysisMonth());

  private readonly resource = httpResource<Dashboard>(() => `/api/dashboard?month=${this.month()}`);
  protected readonly accounts = httpResource<Account[]>(() => '/api/accounts', {
    defaultValue: [],
  });

  /** Derniere reponse recue : pendant un changement de mois, on garde l'affichage (attenue) sans flash. */
  protected readonly data = linkedSignal<Dashboard | undefined, Dashboard | undefined>({
    source: () => (this.resource.hasValue() ? this.resource.value() : undefined),
    computation: (next, previous) => next ?? previous?.value,
  });
  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => !!this.resource.error());

  protected readonly minMonth = computed(() => {
    const first = this.data()?.history[0]?.date;
    return first ? monthOf(first) : null;
  });

  protected readonly tiles = computed(() => {
    const d = this.data();
    if (!d) {
      return null;
    }
    return {
      income: formatEur(d.current.income, { round: true }),
      incomeDelta: d.current.income - d.previous.income,
      expense: formatEur(d.current.expense, { round: true }),
      expenseDelta: d.current.expense - d.previous.expense,
      net: formatEur(d.current.net, { signed: true, round: true }),
      netDelta: d.current.net - d.previous.net,
      rate: formatPct(d.savingsRate),
    };
  });

  protected retry(): void {
    this.resource.reload();
    this.accounts.reload();
  }
}
