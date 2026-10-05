import { Component, computed, input } from '@angular/core';

import { formatDayMonth } from '../../core/format';
import type { Transaction } from '../../core/models';

import { Amount } from './amount';
import { CategoryChip } from './category-chip';

/** Ligne d'operation compacte (listes) : pastille, libelle, compte ou contrepartie, date, montant. */
@Component({
  selector: 'app-transaction-row',
  imports: [Amount, CategoryChip],
  host: { class: 'tx-row' },
  template: `
    @let tx = transaction();
    <app-category-chip
      [icon]="tx.transferId ? 'transfer' : tx.categoryIcon"
      [slot]="tx.transferId ? null : tx.categoryColor"
      [showName]="false"
    />
    <span class="tx-row__text">
      <span class="tx-row__label">{{ tx.label }}</span>
      <span class="tx-row__meta">{{ meta() }}</span>
    </span>
    <app-amount
      class="tx-row__amount"
      [value]="tx.amount"
      [signed]="true"
      [tone]="!tx.transferId"
    />
  `,
  styles: `
    :host {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      gap: 12px;
    }
    .tx-row__text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .tx-row__label {
      overflow: hidden;
      font-size: 0.875rem;
      font-weight: 500;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .tx-row__meta {
      overflow: hidden;
      color: var(--ink-3);
      font-size: 0.75rem;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .tx-row__amount {
      font-size: 0.875rem;
      font-weight: 500;
    }
  `,
})
export class TransactionRow {
  readonly transaction = input.required<Transaction>();

  protected readonly meta = computed(() => {
    const tx = this.transaction();
    const where = tx.transferId
      ? `${tx.accountName} → ${tx.counterpartAccountName ?? '?'}`
      : `${tx.categoryName ?? 'Non catégorisé'} · ${tx.accountName}`;
    return `${formatDayMonth(tx.bookedOn)} · ${where}`;
  });
}
