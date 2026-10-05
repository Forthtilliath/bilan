import { Component, computed, input } from '@angular/core';

import type { ColorSlot } from '../../core/models';
import { seriesColor } from '../../core/palette';
import { Icon } from '../icon';

/** Pastille d'icone teintee de la couleur de la categorie, suivie de son nom (texte en encre, jamais colore). */
@Component({
  selector: 'app-category-chip',
  imports: [Icon],
  host: { class: 'category-chip' },
  template: `
    <span class="category-chip__icon" [style.--chip-color]="color()">
      <app-icon [name]="icon() ?? 'tag'" [size]="size()" />
    </span>
    @if (showName()) {
      <span class="category-chip__name">{{ name() ?? 'Non catégorisé' }}</span>
    }
  `,
})
export class CategoryChip {
  readonly name = input<string | null>(null);
  readonly icon = input<string | null>(null);
  readonly slot = input<ColorSlot | null>(null);
  readonly showName = input(true);
  readonly size = input(14);

  protected readonly color = computed(() => seriesColor(this.slot()));
}
