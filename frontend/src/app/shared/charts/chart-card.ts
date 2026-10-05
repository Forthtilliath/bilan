import { Component, input, signal } from '@angular/core';

import { Icon } from '../icon';

export interface LegendItem {
  label: string;
  color: string;
  shape?: 'line' | 'rect';
}

/**
 * Carte de graphique : titre, legende (des 2 series), actions, et bascule vers la vue tableau
 * (equivalent accessible du graphique, projete via `[table]`).
 */
@Component({
  selector: 'app-chart-card',
  imports: [Icon],
  host: { class: 'card chart-card' },
  template: `
    <header class="card__header">
      <div class="card__heading">
        <h2 class="card__title">{{ heading() }}</h2>
        @if (subtitle()) {
          <p class="card__subtitle">{{ subtitle() }}</p>
        }
      </div>
      <div class="card__actions">
        <ng-content select="[actions]" />
        @if (hasTable()) {
          <button
            type="button"
            class="icon-button"
            [attr.aria-pressed]="showTable()"
            [attr.aria-label]="
              showTable() ? 'Afficher le graphique' : 'Afficher les données en tableau'
            "
            [title]="showTable() ? 'Graphique' : 'Tableau'"
            (click)="showTable.set(!showTable())"
          >
            <app-icon [name]="showTable() ? 'chart' : 'table'" [size]="16" />
          </button>
        }
      </div>
    </header>
    @if (legend().length > 1) {
      <ul class="legend" aria-label="Légende">
        @for (item of legend(); track item.label) {
          <li class="legend__item">
            <span
              class="legend__key"
              [class.legend__key--line]="item.shape !== 'rect'"
              [style.background]="item.color"
            ></span>
            {{ item.label }}
          </li>
        }
      </ul>
    }
    <div [hidden]="showTable()"><ng-content /></div>
    @if (showTable()) {
      <div class="chart-card__table"><ng-content select="[table]" /></div>
    }
  `,
})
export class ChartCard {
  readonly heading = input.required<string>();
  readonly subtitle = input('');
  readonly legend = input<readonly LegendItem[]>([]);
  readonly hasTable = input(true);

  protected readonly showTable = signal(false);
}
