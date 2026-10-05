import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { formatEur, formatPct, formatPrice, formatQuantity } from '../../core/format';
import type { Holding } from '../../core/models';
import { ALLOCATION_COLORS, ALLOCATION_LABELS } from '../../core/models';
import { seriesColor } from '../../core/palette';
import { Delta } from '../../shared/ui/delta';

/** Positions ouvertes : quantite, PRU, cours, valeur, plus-value latente et poids. */
@Component({
  selector: 'app-holdings-table',
  imports: [RouterLink, Delta],
  template: `
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th scope="col">Titre</th>
            <th scope="col" class="num hide-sm">Quantité</th>
            <th scope="col" class="num hide-sm">PRU</th>
            <th scope="col" class="num">Cours</th>
            <th scope="col" class="num">Valeur</th>
            <th scope="col" class="num">+/− value latente</th>
            <th scope="col" class="num hide-sm">Poids</th>
          </tr>
        </thead>
        <tbody>
          @for (h of holdings(); track h.assetId) {
            <tr>
              <td>
                <a class="holding" [routerLink]="['/investissements', h.assetId]">
                  <span
                    class="swatch"
                    [style.--swatch]="color(h)"
                    [title]="labels[h.assetClass]"
                  ></span>
                  <span>
                    <span class="table__primary">{{ h.symbol }}</span>
                    <span class="table__secondary">{{ h.name }}</span>
                  </span>
                </a>
              </td>
              <td class="num hide-sm">{{ formatQuantity(h.quantity) }}</td>
              <td class="num hide-sm">{{ formatPrice(h.averageCost) }}</td>
              <td class="num">
                {{ formatPrice(h.price) }}
                @if (h.change1d !== null) {
                  <span class="table__secondary"
                    ><app-delta [value]="h.change1d" unit="pct"
                  /></span>
                }
              </td>
              <td class="num table__primary">{{ formatEur(h.marketValue) }}</td>
              <td class="num">
                <app-delta [value]="h.unrealizedGain" />
                <span class="table__secondary">{{ formatPct(h.unrealizedPct, true) }}</span>
              </td>
              <td class="num hide-sm">{{ formatPct(h.weight) }}</td>
            </tr>
          } @empty {
            <tr>
              <td colspan="7" class="empty">Aucune position ouverte.</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: `
    .holding {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .holding:hover .table__primary {
      text-decoration: underline;
    }
  `,
})
export class HoldingsTable {
  readonly holdings = input.required<readonly Holding[]>();

  protected readonly labels = ALLOCATION_LABELS;
  protected readonly formatEur = formatEur;
  protected readonly formatPct = formatPct;
  protected readonly formatPrice = formatPrice;
  protected readonly formatQuantity = formatQuantity;

  protected color(holding: Holding): string {
    return seriesColor(ALLOCATION_COLORS[holding.assetClass]);
  }
}
