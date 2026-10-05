import { httpResource } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { formatEur, formatPct } from '../../core/format';
import type { Account } from '../../core/models';
import { seriesColor } from '../../core/palette';
import { Icon } from '../../shared/icon';
import { Drawer } from '../../shared/ui/drawer';

import { AccountCard } from './account-card';
import { AccountForm } from './account-form';

@Component({
  selector: 'app-accounts-page',
  imports: [AccountCard, AccountForm, Drawer, Icon],
  template: `
    <div class="page">
      <header class="page-header">
        <div class="page-header__text">
          <p class="eyebrow">Patrimoine</p>
          <h1 class="page-title">Comptes</h1>
        </div>
        <div class="page-header__actions">
          <button type="button" class="btn btn--primary" (click)="creating.set(true)">
            <app-icon name="plus" [size]="16" /> Nouveau compte
          </button>
        </div>
      </header>

      @if (accounts.error()) {
        <p class="alert" role="alert">Impossible de charger les comptes.</p>
      }

      <section class="card">
        <header class="card__header">
          <div class="card__heading">
            <p class="card__subtitle">Total des comptes actifs</p>
            <p class="hero-figure">{{ total() }}</p>
          </div>
        </header>
        <div class="split" role="img" [attr.aria-label]="'Répartition : ' + splitLabel()">
          @for (part of split(); track part.id) {
            <span
              class="split__part"
              [style.flex-grow]="part.value"
              [style.background]="part.color"
              [title]="part.label"
            ></span>
          }
        </div>
        <ul class="legend">
          @for (part of split(); track part.id) {
            <li class="legend__item">
              <span class="legend__key" [style.background]="part.color"></span>
              {{ part.name }} <span class="faint num">{{ part.share }}</span>
            </li>
          }
        </ul>
      </section>

      <div class="cards" [class.is-loading]="accounts.isLoading()">
        @for (account of active(); track account.id) {
          <app-account-card [account]="account" />
        }
      </div>

      @if (archived().length > 0) {
        <h2 class="card__title">Comptes archivés</h2>
        <div class="cards">
          @for (account of archived(); track account.id) {
            <app-account-card [account]="account" />
          }
        </div>
      }
    </div>

    <app-drawer heading="Nouveau compte" [open]="creating()" (closed)="creating.set(false)">
      <app-account-form (saved)="onCreated($event)" (cancelled)="creating.set(false)" />
    </app-drawer>
  `,
  styles: `
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
      gap: 16px;
    }
    .split {
      display: flex;
      gap: 2px;
      height: 12px;
      overflow: hidden;
      border-radius: 6px;
    }
    .split__part {
      min-width: 3px;
    }
  `,
})
export class AccountsPage {
  private readonly router = inject(Router);

  protected readonly accounts = httpResource<Account[]>(() => '/api/accounts', {
    defaultValue: [],
  });
  protected readonly creating = signal(false);

  protected readonly active = computed(() => this.accounts.value().filter((a) => !a.archived));
  protected readonly archived = computed(() => this.accounts.value().filter((a) => a.archived));
  private readonly sum = computed(() => this.active().reduce((sum, a) => sum + a.balance, 0));
  protected readonly total = computed(() => formatEur(this.sum()));

  /** Part de chaque compte dans le total (barre empilee, 2 px d'air entre les segments). */
  protected readonly split = computed(() =>
    this.active()
      .filter((a) => a.balance > 0)
      .map((a) => ({
        id: a.id,
        name: a.name,
        value: a.balance,
        color: seriesColor(a.color),
        share: formatPct((a.balance / this.sum()) * 100),
        label: `${a.name} : ${formatEur(a.balance, { round: true })}`,
      })),
  );
  protected readonly splitLabel = computed(() =>
    this.split()
      .map((p) => `${p.name} ${p.share}`)
      .join(', '),
  );

  protected onCreated(account: Account): void {
    this.creating.set(false);
    void this.router.navigate(['/comptes', account.id]);
  }
}
