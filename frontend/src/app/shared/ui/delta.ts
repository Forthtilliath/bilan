import { Component, computed, input } from '@angular/core';

import { formatEur, formatPct } from '../../core/format';
import { Icon } from '../icon';

/**
 * Variation signee avec fleche : la couleur dit si c'est une bonne nouvelle (`upIsGood` : une hausse des
 * depenses est mauvaise), la fleche et le signe disent le sens — jamais la couleur seule.
 */
@Component({
  selector: 'app-delta',
  imports: [Icon],
  host: {
    class: 'delta',
    '[class.delta--good]': 'mood() === "good"',
    '[class.delta--bad]': 'mood() === "bad"',
  },
  template: `
    @if (value() !== 0) {
      <app-icon [name]="value() > 0 ? 'arrow-up' : 'arrow-down'" [size]="14" />
    }
    <span>{{ text() }}</span>
    @if (suffix()) {
      <span class="delta__suffix">{{ suffix() }}</span>
    }
  `,
})
export class Delta {
  readonly value = input.required<number>();
  /** Variation relative (%) affichee entre parentheses. */
  readonly pct = input<number | null>(null);
  readonly unit = input<'eur' | 'pct'>('eur');
  readonly upIsGood = input(true);
  readonly suffix = input('');

  protected readonly mood = computed(() => {
    const value = this.value();
    if (value === 0) {
      return 'neutral';
    }
    return value > 0 === this.upIsGood() ? 'good' : 'bad';
  });

  protected readonly text = computed(() => {
    const main =
      this.unit() === 'pct'
        ? formatPct(this.value(), true)
        : formatEur(this.value(), { signed: true, round: Math.abs(this.value()) >= 1000 });
    const pct = this.pct();
    return pct === null || this.unit() === 'pct' ? main : `${main} (${formatPct(pct, true)})`;
  });
}
