import { Component, computed, input, output } from '@angular/core';

import { formatDate } from '../../core/format';
import type { Transaction } from '../../core/models';
import { seriesColor } from '../../core/palette';
import { Amount } from '../../shared/ui/amount';
import { CategoryChip } from '../../shared/ui/category-chip';

/** Operations regroupees par jour ; une ligne s'ouvre au clic ou avec Entree. */
@Component({
  selector: 'app-transaction-table',
  imports: [Amount, CategoryChip],
  template: `
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th scope="col">Libellé</th>
            <th scope="col" class="hide-sm">Catégorie</th>
            @if (showAccount()) {
              <th scope="col" class="hide-sm">Compte</th>
            }
            <th scope="col" class="num">Montant</th>
          </tr>
        </thead>
        @for (day of days(); track day.date) {
          <tbody>
            <tr class="table__group">
              <th [attr.colspan]="showAccount() ? 4 : 3" scope="rowgroup">{{ day.label }}</th>
            </tr>
            @for (tx of day.items; track tx.id) {
              <tr
                class="is-clickable"
                tabindex="0"
                (click)="selected.emit(tx)"
                (keydown.enter)="selected.emit(tx)"
              >
                <td>
                  <span class="table__primary">{{ tx.label }}</span>
                  @if (tx.note) {
                    <span class="table__secondary">{{ tx.note }}</span>
                  }
                </td>
                <td class="hide-sm">
                  @if (tx.transferId) {
                    <app-category-chip
                      icon="transfer"
                      [name]="(tx.amount < 0 ? 'Vers ' : 'Depuis ') + tx.counterpartAccountName"
                    />
                  } @else {
                    <app-category-chip
                      [name]="tx.categoryName"
                      [icon]="tx.categoryIcon"
                      [slot]="tx.categoryColor"
                    />
                  }
                </td>
                @if (showAccount()) {
                  <td class="hide-sm">
                    <span class="account-cell">
                      <span class="swatch" [style.--swatch]="color(tx)"></span>{{ tx.accountName }}
                    </span>
                  </td>
                }
                <td class="num">
                  <app-amount
                    class="table__primary"
                    [value]="tx.amount"
                    [signed]="true"
                    [tone]="!tx.transferId"
                  />
                </td>
              </tr>
            }
          </tbody>
        } @empty {
          <tbody>
            <tr>
              <td [attr.colspan]="showAccount() ? 4 : 3" class="empty">{{ emptyLabel() }}</td>
            </tr>
          </tbody>
        }
      </table>
    </div>
  `,
  styles: `
    .account-cell {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
    }
  `,
})
export class TransactionTable {
  readonly items = input.required<readonly Transaction[]>();
  readonly showAccount = input(true);
  readonly emptyLabel = input('Aucune opération.');
  readonly selected = output<Transaction>();

  protected readonly days = computed(() => {
    const groups: { date: string; label: string; items: Transaction[] }[] = [];
    for (const tx of this.items()) {
      const last = groups.at(-1);
      if (last?.date === tx.bookedOn) {
        last.items.push(tx);
      } else {
        groups.push({ date: tx.bookedOn, label: formatDate(tx.bookedOn), items: [tx] });
      }
    }
    return groups;
  });

  protected color(tx: Transaction): string {
    return seriesColor(tx.accountColor);
  }
}
