import { Component, computed, input, model } from '@angular/core';

import { addMonths, formatMonth } from '../../core/format';
import { Icon } from '../icon';

/** Navigation mois par mois (AAAA-MM), bornee par `min` / `max`. */
@Component({
  selector: 'app-month-picker',
  imports: [Icon],
  host: { class: 'month-picker' },
  template: `
    <button
      type="button"
      class="icon-button"
      aria-label="Mois précédent"
      [disabled]="!canGoBack()"
      (click)="month.set(previous())"
    >
      <app-icon name="chevron-left" />
    </button>
    <span class="month-picker__label" aria-live="polite">{{ label() }}</span>
    <button
      type="button"
      class="icon-button"
      aria-label="Mois suivant"
      [disabled]="!canGoForward()"
      (click)="month.set(next())"
    >
      <app-icon name="chevron-right" />
    </button>
  `,
})
export class MonthPicker {
  readonly month = model.required<string>();
  readonly min = input<string | null>(null);
  readonly max = input<string | null>(null);

  protected readonly previous = computed(() => addMonths(this.month(), -1));
  protected readonly next = computed(() => addMonths(this.month(), 1));
  protected readonly label = computed(() => formatMonth(this.month()));
  protected readonly canGoBack = computed(() => {
    const min = this.min();
    return min === null || this.previous() >= min;
  });
  protected readonly canGoForward = computed(() => {
    const max = this.max();
    return max === null || this.next() <= max;
  });
}
