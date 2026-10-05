import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { formatEur } from '../../core/format';
import { type Account, ACCOUNT_TYPE_LABELS, holdsAssets } from '../../core/models';
import { seriesColor } from '../../core/palette';
import { Sparkline } from '../../shared/charts/sparkline';
import { Delta } from '../../shared/ui/delta';

/** Carte de compte : solde, variation 30 jours, tendance 12 mois et, pour un compte-titres, la repartition. */
@Component({
  selector: 'app-account-card',
  imports: [RouterLink, Sparkline, Delta],
  template: `
    @let a = account();
    <a
      class="account-card card"
      [routerLink]="['/comptes', a.id]"
      [class.account-card--archived]="a.archived"
    >
      <header class="account-card__header">
        <span class="swatch" [style.--swatch]="color()"></span>
        <span class="account-card__name">{{ a.name }}</span>
        <span class="badge">{{ typeLabel() }}</span>
      </header>
      <p class="account-card__balance">{{ balance() }}</p>
      <div class="account-card__footer">
        <div class="account-card__meta">
          <app-delta [value]="a.change30d" suffix="30 j" />
          <span class="faint">{{ detail() }}</span>
        </div>
        <app-sparkline [values]="a.trend" [color]="color()" [width]="110" [height]="34" />
      </div>
    </a>
  `,
  styles: `
    .account-card {
      gap: 10px;
      height: 100%;
      transition:
        border-color 150ms,
        transform 150ms;
    }
    .account-card:hover {
      border-color: var(--border-strong);
      transform: translateY(-1px);
    }
    .account-card--archived {
      opacity: 0.6;
    }
    .account-card__header {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .account-card__name {
      flex: 1;
      overflow: hidden;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .account-card__balance {
      font-size: 1.625rem;
      font-weight: 600;
      letter-spacing: -0.025em;
    }
    .account-card__footer {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 12px;
    }
    .account-card__meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 0.75rem;
    }
  `,
})
export class AccountCard {
  readonly account = input.required<Account>();

  protected readonly color = computed(() => seriesColor(this.account().color));
  protected readonly balance = computed(() => formatEur(this.account().balance));
  protected readonly typeLabel = computed(() => ACCOUNT_TYPE_LABELS[this.account().type]);
  protected readonly detail = computed(() => {
    const a = this.account();
    if (holdsAssets(a.type)) {
      return `Titres ${formatEur(a.holdingsValue, { round: true })} · liquidités ${formatEur(a.cash, { round: true })}`;
    }
    return a.institution ?? `${a.transactionCount} opérations`;
  });
}
