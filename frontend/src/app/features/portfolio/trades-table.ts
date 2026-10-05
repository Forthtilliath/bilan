import { Component, input, output, signal } from '@angular/core';

import { formatDate, formatEur, formatPrice, formatQuantity } from '../../core/format';
import type { Trade, TradeId } from '../../core/models';
import { Icon } from '../../shared/icon';
import { Amount } from '../../shared/ui/amount';
import { Delta } from '../../shared/ui/delta';

/** Historique des ordres (plus recent d'abord) ; une vente affiche la plus-value qu'elle a degagee. */
@Component({
  selector: 'app-trades-table',
  imports: [Amount, Delta, Icon],
  template: `
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Ordre</th>
            <th scope="col" class="num hide-sm">Quantité × cours</th>
            <th scope="col" class="num hide-sm">Frais</th>
            <th scope="col" class="num">Montant</th>
            <th scope="col" class="num">Résultat</th>
            <th scope="col"><span class="visually-hidden">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          @for (trade of trades(); track trade.id) {
            <tr>
              <td class="trade-date">{{ formatDate(trade.tradedOn) }}</td>
              <td>
                <span class="badge" [class.badge--sell]="trade.side === 'SELL'">
                  {{ trade.side === 'BUY' ? 'Achat' : 'Vente' }}
                </span>
                <span class="table__primary">{{ trade.symbol }}</span>
                @if (showAccount()) {
                  <span class="table__secondary">{{ trade.accountName }}</span>
                }
              </td>
              <td class="num hide-sm">
                {{ formatQuantity(trade.quantity) }} × {{ formatPrice(trade.price) }}
              </td>
              <td class="num hide-sm">{{ formatEur(trade.fees) }}</td>
              <td class="num"><app-amount [value]="trade.cashFlow" [signed]="true" /></td>
              <td class="num">
                @if (trade.realizedGain !== null) {
                  <app-delta [value]="trade.realizedGain" />
                } @else {
                  <span class="faint">—</span>
                }
              </td>
              <td>
                <button
                  type="button"
                  class="icon-button"
                  [class.icon-button--danger]="armed() === trade.id"
                  [attr.aria-label]="
                    armed() === trade.id
                      ? 'Confirmer la suppression'
                      : 'Supprimer l’ordre ' + trade.symbol + ' du ' + formatDate(trade.tradedOn)
                  "
                  [title]="armed() === trade.id ? 'Cliquer pour confirmer' : 'Supprimer'"
                  (click)="onRemove(trade)"
                >
                  <app-icon [name]="armed() === trade.id ? 'check' : 'trash'" [size]="15" />
                </button>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="7" class="empty">Aucun ordre.</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: `
    .badge {
      margin-right: 8px;
    }
    .trade-date {
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .badge--sell {
      background: color-mix(in oklab, var(--series-2) 16%, transparent);
      color: var(--ink);
    }
  `,
})
export class TradesTable {
  readonly trades = input.required<readonly Trade[]>();
  readonly showAccount = input(true);
  readonly remove = output<Trade>();

  protected readonly formatDate = formatDate;
  protected readonly formatEur = formatEur;
  protected readonly formatPrice = formatPrice;
  protected readonly formatQuantity = formatQuantity;
  protected readonly armed = signal<TradeId | null>(null);

  /** Suppression en deux clics sur la meme ligne. */
  protected onRemove(trade: Trade): void {
    if (this.armed() === trade.id) {
      this.armed.set(null);
      this.remove.emit(trade);
    } else {
      this.armed.set(trade.id);
    }
  }
}
