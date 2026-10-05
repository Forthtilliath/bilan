import { Component, computed, input, output } from '@angular/core';

import type { Account, Category, TransactionKind } from '../../core/models';
import { Icon } from '../../shared/icon';
import type { SegmentOption } from '../../shared/ui/segmented';
import { Segmented } from '../../shared/ui/segmented';

import type { Period, PeriodPreset } from './period';
import { matchPreset, PERIOD_LABELS, presetPeriod } from './period';

/** Etat des filtres, tel qu'il vit dans l'URL. `categoryId = 'none'` : operations non categorisees. */
export interface TransactionFiltersValue {
  q: string;
  accountId: string;
  categoryId: string;
  kind: TransactionKind | '';
  from: string | null;
  to: string | null;
}

type KindOption = TransactionKind | 'ALL';

/** Rangee unique de filtres, au-dessus de la liste qu'elle filtre. */
@Component({
  selector: 'app-transaction-filters',
  imports: [Segmented, Icon],
  host: { class: 'filters-panel' },
  template: `
    @let v = value();
    <div class="filters">
      <label class="search">
        <app-icon name="search" [size]="16" />
        <span class="visually-hidden">Rechercher</span>
        <input
          class="input input--search"
          type="search"
          placeholder="Libellé ou note…"
          [value]="v.q"
          (input)="patch({ q: $any($event.target).value })"
        />
      </label>
      <select
        class="select filters__select"
        aria-label="Compte"
        [value]="v.accountId"
        (change)="patch({ accountId: $any($event.target).value })"
      >
        <option value="">Tous les comptes</option>
        @for (account of accounts(); track account.id) {
          <option [value]="account.id">{{ account.name }}</option>
        }
      </select>
      <select
        class="select filters__select"
        aria-label="Catégorie"
        [value]="v.categoryId"
        (change)="patch({ categoryId: $any($event.target).value })"
      >
        <option value="">Toutes les catégories</option>
        <option value="none">Non catégorisé</option>
        @for (category of categories(); track category.id) {
          <option [value]="category.id">{{ category.name }}</option>
        }
      </select>
      <app-segmented
        label="Type"
        [options]="kinds"
        [value]="v.kind || 'ALL'"
        (valueChange)="setKind($event)"
      />
    </div>
    <div class="filters">
      <app-segmented
        label="Période"
        [options]="presets"
        [value]="preset() ?? 'custom'"
        (valueChange)="setPreset($event)"
      />
      <label class="filters__date">
        <span class="faint">Du</span>
        <input
          class="input"
          type="date"
          [value]="v.from ?? ''"
          (change)="patch({ from: $any($event.target).value || null })"
        />
      </label>
      <label class="filters__date">
        <span class="faint">au</span>
        <input
          class="input"
          type="date"
          [value]="v.to ?? ''"
          (change)="patch({ to: $any($event.target).value || null })"
        />
      </label>
      @if (active()) {
        <button type="button" class="btn btn--ghost btn--sm" (click)="cleared.emit()">
          <app-icon name="close" [size]="14" /> Effacer les filtres
        </button>
      }
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .filters__select {
      width: auto;
      max-width: 220px;
    }
    .filters__date {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8125rem;
    }
    .filters__date .input {
      width: auto;
    }
  `,
})
export class TransactionFilters {
  readonly value = input.required<TransactionFiltersValue>();
  readonly accounts = input.required<readonly Account[]>();
  readonly categories = input.required<readonly Category[]>();
  readonly changed = output<Partial<TransactionFiltersValue>>();
  readonly cleared = output();

  protected readonly kinds: readonly SegmentOption<KindOption>[] = [
    { value: 'ALL', label: 'Tout' },
    { value: 'EXPENSE', label: 'Dépenses' },
    { value: 'INCOME', label: 'Revenus' },
    { value: 'TRANSFER', label: 'Virements' },
  ];
  protected readonly presets: readonly SegmentOption<PeriodPreset | 'custom'>[] = [
    ...(Object.entries(PERIOD_LABELS) as [PeriodPreset, string][]).map(([value, label]) => ({
      value,
      label,
    })),
  ];

  protected readonly preset = computed(() => {
    const { from, to } = this.value();
    return matchPreset({ from, to });
  });
  protected readonly active = computed(() => {
    const v = this.value();
    return [v.q, v.accountId, v.categoryId, v.kind, v.from, v.to].some(Boolean);
  });

  protected patch(change: Partial<TransactionFiltersValue>): void {
    this.changed.emit(change);
  }

  protected setKind(kind: KindOption): void {
    this.patch({ kind: kind === 'ALL' ? '' : kind });
  }

  protected setPreset(preset: PeriodPreset | 'custom'): void {
    if (preset !== 'custom') {
      const period: Period = presetPeriod(preset);
      this.patch(period);
    }
  }
}
