import { Component, computed, input } from '@angular/core';

import { formatEur } from '../../core/format';

/**
 * Montant en euros, chiffres tabulaires. `tone` colore selon le signe (vert = entree, rouge = sortie) ;
 * le signe ecrit (+ / −) porte toujours le sens, la couleur ne fait que le souligner.
 */
@Component({
  selector: 'app-amount',
  host: {
    class: 'amount',
    '[class.amount--up]': 'tone() && value() > 0',
    '[class.amount--down]': 'tone() && value() < 0',
  },
  template: '{{ text() }}',
})
export class Amount {
  readonly value = input.required<number>();
  readonly signed = input(false);
  readonly tone = input(false);
  readonly round = input(false);

  protected readonly text = computed(() =>
    formatEur(this.value(), { signed: this.signed(), round: this.round() }),
  );
}
