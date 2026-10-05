import { httpResource } from '@angular/common/http';
import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { transactionsUrl } from '../../core/api';
import { formatDate, formatEur } from '../../core/format';
import type { Account, SeriesPoint, Transaction, TransactionPage } from '../../core/models';
import { ACCOUNT_TYPE_LABELS, holdsAssets } from '../../core/models';
import { seriesColor } from '../../core/palette';
import { ChartCard } from '../../shared/charts/chart-card';
import { LineChart } from '../../shared/charts/line-chart';
import { Icon } from '../../shared/icon';
import { Delta } from '../../shared/ui/delta';
import { Drawer } from '../../shared/ui/drawer';
import { StatTile } from '../../shared/ui/stat-tile';
import { TransactionEditor } from '../transactions/transaction-editor';
import { TransactionTable } from '../transactions/transaction-table';

import { AccountForm } from './account-form';

/** Fiche d'un compte : chiffres cles, historique du solde, 50 dernieres operations. */
@Component({
  selector: 'app-account-detail-page',
  imports: [
    RouterLink,
    ChartCard,
    LineChart,
    Icon,
    Delta,
    Drawer,
    StatTile,
    AccountForm,
    TransactionTable,
    TransactionEditor,
  ],
  templateUrl: './account-detail.page.html',
})
export class AccountDetailPage {
  /** Parametre de route `:id`. */
  readonly id = input.required<string>();

  private readonly router = inject(Router);

  protected readonly account = httpResource<Account>(() => `/api/accounts/${this.id()}`);
  protected readonly history = httpResource<SeriesPoint[]>(
    () => `/api/accounts/${this.id()}/history`,
    {
      defaultValue: [],
    },
  );
  protected readonly transactions = httpResource<TransactionPage>(() =>
    transactionsUrl({ accountId: this.id() as Account['id'], size: 50 }),
  );

  protected readonly editing = signal(false);
  protected readonly editedTransaction = signal<Transaction | null>(null);
  protected readonly creatingTransaction = signal(false);

  protected readonly formatDate = formatDate;
  protected readonly formatEur = formatEur;
  protected readonly typeLabels = ACCOUNT_TYPE_LABELS;
  protected readonly holdsAssets = holdsAssets;

  protected readonly color = computed(() =>
    this.account.hasValue() ? seriesColor(this.account.value().color) : 'var(--series-1)',
  );
  protected readonly dates = computed(() => this.history.value().map((p) => p.date));
  protected readonly series = computed(() => [
    {
      key: 'balance',
      label: 'Solde',
      color: this.color(),
      values: this.history.value().map((p) => p.value),
      area: true,
    },
  ]);

  protected refresh(): void {
    this.account.reload();
    this.history.reload();
    this.transactions.reload();
  }

  protected onSaved(): void {
    this.editing.set(false);
    this.refresh();
  }

  protected onDeleted(): void {
    this.editing.set(false);
    void this.router.navigate(['/comptes']);
  }

  protected onTransactionDone(): void {
    this.editedTransaction.set(null);
    this.creatingTransaction.set(false);
    this.refresh();
  }
}
