import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { type Account, ACCOUNT_TYPE_LABELS } from '../../core/models';
import { seriesColor } from '../../core/palette';
import { Sparkline } from '../../shared/charts/sparkline';
import { Amount } from '../../shared/ui/amount';
import { Delta } from '../../shared/ui/delta';

/** Liste compacte des comptes actifs : solde, variation 30 jours, tendance 12 mois. */
@Component({
  selector: 'app-accounts-summary',
  imports: [RouterLink, Sparkline, Amount, Delta],
  host: { class: 'card' },
  template: `
    <header class="card__header">
      <h2 class="card__title">Comptes</h2>
      <a class="card__link" routerLink="/comptes">Tout voir</a>
    </header>
    <ul class="accounts">
      @for (account of active(); track account.id) {
        <li>
          <a class="accounts__row" [routerLink]="['/comptes', account.id]">
            <span class="swatch" [style.--swatch]="color(account)"></span>
            <span class="accounts__name">
              <span class="table__primary">{{ account.name }}</span>
              <span class="table__secondary">{{ typeLabels[account.type] }}</span>
            </span>
            <app-sparkline
              [values]="account.trend"
              [color]="color(account)"
              [width]="72"
              [height]="26"
            />
            <span class="accounts__figures">
              <app-amount class="table__primary" [value]="account.balance" />
              <app-delta [value]="account.change30d" />
            </span>
          </a>
        </li>
      }
    </ul>
  `,
  styles: `
    .accounts {
      display: flex;
      flex-direction: column;
      margin: 0 -10px;
    }
    .accounts__row {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto auto;
      align-items: center;
      gap: 12px;
      padding: 9px 10px;
      border-radius: var(--radius-sm);
    }
    .accounts__row:hover {
      background: var(--surface-2);
    }
    .accounts__name {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .accounts__figures {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .accounts__figures app-delta {
      font-size: 0.75rem;
    }
  `,
})
export class AccountsSummary {
  readonly accounts = input.required<readonly Account[]>();

  protected readonly typeLabels = ACCOUNT_TYPE_LABELS;
  protected readonly active = computed(() => this.accounts().filter((a) => !a.archived));
  protected color(account: Account): string {
    return seriesColor(account.color);
  }
}
