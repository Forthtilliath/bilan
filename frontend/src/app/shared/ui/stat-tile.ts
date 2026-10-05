import { Component, input } from '@angular/core';

/** Tuile de chiffre cle : libelle, valeur, puis une ligne de contexte projetee (variation, precision...). */
@Component({
  selector: 'app-stat-tile',
  host: { class: 'stat-tile' },
  template: `
    <p class="stat-tile__label">{{ label() }}</p>
    <p class="stat-tile__value">{{ value() }}</p>
    <div class="stat-tile__meta"><ng-content /></div>
  `,
})
export class StatTile {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
}
