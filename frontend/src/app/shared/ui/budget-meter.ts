import { Component, computed, input } from '@angular/core';

import { formatEur, formatPct } from '../../core/format';
import { Icon } from '../icon';

export type BudgetStatus = 'ok' | 'warning' | 'over';

/** Etat d'un budget : depasse a 100 %, alerte a partir de 85 %. */
export function budgetStatus(spent: number, budget: number): BudgetStatus {
  if (budget <= 0) {
    return 'ok';
  }
  const ratio = spent / budget;
  return ratio > 1 ? 'over' : ratio >= 0.85 ? 'warning' : 'ok';
}

/**
 * Jauge de budget : le remplissage porte l'etat (couleur de la categorie, puis alerte, puis depassement),
 * toujours double d'une icone et d'un libelle — jamais la couleur seule.
 */
@Component({
  selector: 'app-budget-meter',
  imports: [Icon],
  host: { class: 'meter', '[attr.data-status]': 'status()' },
  template: `
    <div
      class="meter__track"
      role="meter"
      [attr.aria-valuenow]="spent()"
      aria-valuemin="0"
      [attr.aria-valuemax]="budget()"
      [attr.aria-label]="ariaLabel()"
    >
      <div class="meter__fill" [style.width.%]="fill()" [style.--meter-color]="color()"></div>
    </div>
    <p class="meter__caption">
      @switch (status()) {
        @case ('over') {
          <span class="meter__status"
            ><app-icon name="alert" [size]="14" /> Dépassé de {{ overBy() }}</span
          >
        }
        @case ('warning') {
          <span class="meter__status"
            ><app-icon name="alert" [size]="14" /> {{ pct() }} utilisé</span
          >
        }
        @default {
          <span>{{ remaining() }} restants</span>
        }
      }
      <span class="meter__numbers">{{ spentLabel() }} / {{ budgetLabel() }}</span>
    </p>
  `,
})
export class BudgetMeter {
  readonly spent = input.required<number>();
  readonly budget = input.required<number>();
  readonly color = input('var(--series-1)');
  readonly name = input('');

  protected readonly status = computed(() => budgetStatus(this.spent(), this.budget()));
  protected readonly fill = computed(() => Math.min(100, (this.spent() / this.budget()) * 100));
  protected readonly pct = computed(() => formatPct((this.spent() / this.budget()) * 100));
  protected readonly overBy = computed(() =>
    formatEur(this.spent() - this.budget(), { round: true }),
  );
  protected readonly remaining = computed(() =>
    formatEur(this.budget() - this.spent(), { round: true }),
  );
  protected readonly spentLabel = computed(() => formatEur(this.spent(), { round: true }));
  protected readonly budgetLabel = computed(() => formatEur(this.budget(), { round: true }));
  protected readonly ariaLabel = computed(
    () => `${this.name()} : ${this.spentLabel()} sur ${this.budgetLabel()}`,
  );
}
