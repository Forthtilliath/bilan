import { HttpClient, httpResource } from '@angular/common/http';
import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { Router } from '@angular/router';

import { debounce, downloadCsv, formatCsvNumber, toCsv } from '@forthtilliath/ts-kit';

import { toProblem, transactionsUrl } from '../../core/api';
import { formatEur } from '../../core/format';
import type {
  Account,
  AccountId,
  Category,
  CategoryId,
  Transaction,
  TransactionKind,
  TransactionPage,
  TransactionQuery,
} from '../../core/models';
import { Icon } from '../../shared/icon';
import { Drawer } from '../../shared/ui/drawer';

import { TransactionEditor } from './transaction-editor';
import type { TransactionFiltersValue } from './transaction-filters';
import { TransactionFilters } from './transaction-filters';
import { TransactionTable } from './transaction-table';

const PAGE_SIZE = 50;

/** Recherche d'operations. Les filtres vivent dans l'URL (partageable, bouton Precedent fonctionnel). */
@Component({
  selector: 'app-transactions-page',
  imports: [TransactionFilters, TransactionTable, TransactionEditor, Drawer, Icon],
  templateUrl: './transactions.page.html',
})
export class TransactionsPage {
  // Parametres de requete (withComponentInputBinding).
  readonly q = input<string>();
  readonly accountId = input<string>();
  readonly categoryId = input<string>();
  readonly uncategorized = input<string>();
  readonly kind = input<TransactionKind>();
  readonly from = input<string>();
  readonly to = input<string>();
  readonly page = input<string>();

  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  protected readonly accounts = httpResource<Account[]>(() => '/api/accounts', {
    defaultValue: [],
  });
  protected readonly categories = httpResource<Category[]>(() => '/api/categories', {
    defaultValue: [],
  });

  protected readonly filters = computed<TransactionFiltersValue>(() => ({
    q: this.q() ?? '',
    accountId: this.accountId() ?? '',
    categoryId: this.uncategorized() === 'true' ? 'none' : (this.categoryId() ?? ''),
    kind: this.kind() ?? '',
    from: this.from() ?? null,
    to: this.to() ?? null,
  }));
  protected readonly pageIndex = computed(() => Math.max(0, Number(this.page() ?? 0) || 0));

  private readonly query = computed<TransactionQuery>(() => {
    const f = this.filters();
    return {
      q: f.q || null,
      accountId: (f.accountId || null) as AccountId | null,
      categoryId: (f.categoryId && f.categoryId !== 'none'
        ? f.categoryId
        : null) as CategoryId | null,
      uncategorized: f.categoryId === 'none',
      kind: f.kind || null,
      from: f.from,
      to: f.to,
    };
  });

  protected readonly result = httpResource<TransactionPage>(() =>
    transactionsUrl({ ...this.query(), page: this.pageIndex(), size: PAGE_SIZE }),
  );
  /** Derniere page recue, gardee affichee (attenuee) pendant le chargement suivant. */
  protected readonly data = linkedSignal<TransactionPage | undefined, TransactionPage | undefined>({
    source: () => (this.result.hasValue() ? this.result.value() : undefined),
    computation: (next, previous) => next ?? previous?.value,
  });

  protected readonly summary = computed(() => {
    const d = this.data();
    if (!d) {
      return null;
    }
    const pages = Math.max(1, Math.ceil(d.total / d.size));
    return {
      count: d.total,
      inflow: formatEur(d.inflow),
      outflow: formatEur(d.outflow),
      net: formatEur(d.inflow - d.outflow, { signed: true }),
      page: d.page + 1,
      pages,
    };
  });

  protected readonly editing = signal<Transaction | null>(null);
  protected readonly creating = signal(false);
  protected readonly exporting = signal(false);
  protected readonly exportError = signal<string | null>(null);

  /** Ecrit les filtres dans l'URL ; toute modification ramene a la premiere page. */
  protected applyFilters(change: Partial<TransactionFiltersValue>): void {
    const next = { ...this.filters(), ...change };
    const queryParams = {
      q: next.q || null,
      accountId: next.accountId || null,
      categoryId: next.categoryId && next.categoryId !== 'none' ? next.categoryId : null,
      uncategorized: next.categoryId === 'none' ? 'true' : null,
      kind: next.kind || null,
      from: next.from,
      to: next.to,
      page: null,
    };
    if ('q' in change) {
      this.navigateDebounced(queryParams);
    } else {
      this.navigateDebounced.cancel();
      this.navigate(queryParams);
    }
  }

  protected goToPage(page: number): void {
    this.navigate({ page: page > 0 ? page : null }, true);
  }

  protected resetFilters(): void {
    void this.router.navigate([], { queryParams: {} });
  }

  private navigate(queryParams: Record<string, string | number | null>, merge = false): void {
    void this.router.navigate([], {
      queryParams,
      queryParamsHandling: merge ? 'merge' : '',
      replaceUrl: true,
    });
  }

  private readonly navigateDebounced = debounce(
    (queryParams: Record<string, string | number | null>) => {
      this.navigate(queryParams);
    },
    300,
  );

  protected onEdited(): void {
    this.editing.set(null);
    this.creating.set(false);
    this.result.reload();
  }

  /** Export CSV de tout l'ensemble filtre (pas seulement la page affichee), separateur « ; » pour Excel FR. */
  protected exportCsv(): void {
    this.exporting.set(true);
    this.exportError.set(null);
    this.http.get<TransactionPage>(transactionsUrl({ ...this.query(), size: 5000 })).subscribe({
      next: (page) => {
        const rows = page.items.map((tx) => [
          tx.bookedOn,
          tx.label,
          tx.transferId ? 'Virement' : (tx.categoryName ?? 'Non catégorisé'),
          tx.accountName,
          formatCsvNumber(tx.amount, 2),
          tx.note ?? '',
        ]);
        const header = ['Date', 'Libellé', 'Catégorie', 'Compte', 'Montant', 'Note'];
        downloadCsv('operations-bilan.csv', toCsv([header, ...rows], ';'));
        this.exporting.set(false);
      },
      error: (err: unknown) => {
        this.exporting.set(false);
        this.exportError.set(toProblem(err).detail ?? null);
      },
    });
  }
}
