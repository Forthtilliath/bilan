import { httpResource } from '@angular/common/http';
import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { Router } from '@angular/router';

import { BilanApi, toProblem } from '../../core/api';
import { formatEur, formatPct } from '../../core/format';
import type { Account, Portfolio, Trade } from '../../core/models';
import { holdsAssets } from '../../core/models';
import { Icon } from '../../shared/icon';
import { Delta } from '../../shared/ui/delta';
import { Drawer } from '../../shared/ui/drawer';
import type { SegmentOption } from '../../shared/ui/segmented';
import { Segmented } from '../../shared/ui/segmented';
import { StatTile } from '../../shared/ui/stat-tile';

import { HoldingsTable } from './holdings-table';
import { AllocationCard, PerformanceCard } from './portfolio-charts';
import { TradeForm } from './trade-form';
import { TradesTable } from './trades-table';

/** Synthese des investissements, tous comptes ou un seul (`?accountId=`). */
@Component({
  selector: 'app-portfolio-page',
  imports: [
    Icon,
    Delta,
    Drawer,
    Segmented,
    StatTile,
    HoldingsTable,
    TradesTable,
    TradeForm,
    PerformanceCard,
    AllocationCard,
  ],
  templateUrl: './portfolio.page.html',
})
export class PortfolioPage {
  /** Parametre de requete. */
  readonly accountId = input<string>();

  private readonly router = inject(Router);
  private readonly api = inject(BilanApi);

  private readonly accounts = httpResource<Account[]>(() => '/api/accounts', { defaultValue: [] });
  protected readonly scopes = computed<SegmentOption<string>[]>(() => [
    { value: '', label: 'Tous les comptes' },
    ...this.accounts
      .value()
      .filter((a) => holdsAssets(a.type))
      .map((a) => ({ value: a.id, label: a.name })),
  ]);
  protected readonly scope = computed(() => this.accountId() ?? '');

  private readonly suffix = computed(() => (this.scope() ? `?accountId=${this.scope()}` : ''));
  private readonly resource = httpResource<Portfolio>(() => `/api/portfolio${this.suffix()}`);
  protected readonly trades = httpResource<Trade[]>(() => `/api/trades${this.suffix()}`, {
    defaultValue: [],
  });
  protected readonly data = linkedSignal<Portfolio | undefined, Portfolio | undefined>({
    source: () => (this.resource.hasValue() ? this.resource.value() : undefined),
    computation: (next, previous) => next ?? previous?.value,
  });
  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => !!this.resource.error());

  protected readonly tiles = computed(() => {
    const t = this.data()?.totals;
    if (!t) {
      return null;
    }
    const performance = t.value - t.contributed;
    return {
      value: formatEur(t.value),
      dayChange: t.dayChange,
      unrealized: formatEur(t.unrealizedGain, { signed: true }),
      unrealizedPct: t.unrealizedPct ?? 0,
      realized: formatEur(t.realizedGain, { signed: true }),
      performance: formatEur(performance, { signed: true }),
      performancePct: t.contributed > 0 ? (performance / t.contributed) * 100 : null,
      contributed: formatEur(t.contributed, { round: true }),
      cash: formatEur(t.cash),
    };
  });

  protected readonly trading = signal(false);
  protected readonly tradeError = signal<string | null>(null);
  protected readonly formatPct = formatPct;

  protected setScope(accountId: string): void {
    void this.router.navigate([], {
      queryParams: { accountId: accountId || null },
      replaceUrl: true,
    });
  }

  protected refresh(): void {
    this.trading.set(false);
    this.resource.reload();
    this.trades.reload();
  }

  protected deleteTrade(trade: Trade): void {
    this.tradeError.set(null);
    this.api.deleteTrade(trade.id).subscribe({
      next: () => {
        this.refresh();
      },
      error: (err: unknown) => {
        const problem = toProblem(err);
        this.tradeError.set(Object.values(problem.errors ?? {})[0] ?? problem.detail ?? null);
      },
    });
  }
}
