import { Component, computed, input, signal } from '@angular/core';

import { formatEur, formatPct } from '../../core/format';

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  color: string;
}

/**
 * Anneau partie / tout (6 parts au plus, la page regroupe le reste en « Autres »).
 * Survoler une part l'isole et affiche son montant et sa part au centre.
 */
@Component({
  selector: 'app-donut-chart',
  host: { class: 'donut' },
  template: `
    @let a = active();
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      [attr.viewBox]="'0 0 ' + size() + ' ' + size()"
      role="img"
      [attr.aria-label]="label()"
    >
      @for (arc of arcs(); track arc.key) {
        <path
          class="donut__arc"
          [class.donut__arc--dim]="a && a.key !== arc.key"
          [attr.d]="arc.d"
          [style.fill]="arc.color"
          tabindex="0"
          [attr.aria-label]="arc.label + ' : ' + arc.valueLabel"
          (pointerenter)="hover.set(arc.key)"
          (pointerleave)="hover.set(null)"
          (focus)="hover.set(arc.key)"
          (blur)="hover.set(null)"
        />
      } @empty {
        <circle
          class="donut__empty"
          [attr.cx]="size() / 2"
          [attr.cy]="size() / 2"
          [attr.r]="size() / 2 - thickness() / 2"
          [attr.stroke-width]="thickness()"
        />
      }
    </svg>
    <div class="donut__center" aria-hidden="true">
      @if (a) {
        <span class="donut__title">{{ a.label }}</span>
        <strong class="donut__value">{{ a.valueLabel }}</strong>
        <span class="donut__share">{{ a.share }}</span>
      } @else {
        <span class="donut__title">{{ centerTitle() }}</span>
        <strong class="donut__value">{{ centerValue() }}</strong>
      }
    </div>
  `,
})
export class DonutChart {
  readonly slices = input.required<readonly DonutSlice[]>();
  readonly size = input(184);
  readonly thickness = input(22);
  readonly label = input('');
  readonly centerTitle = input('Total');
  readonly centerValue = input('');
  readonly format = input<(value: number) => string>((value) => formatEur(value, { round: true }));

  protected readonly hover = signal<string | null>(null);

  protected readonly arcs = computed(() => {
    const slices = this.slices().filter((s) => s.value > 0);
    const total = slices.reduce((sum, s) => sum + s.value, 0);
    const radius = this.size() / 2;
    const inner = radius - this.thickness();
    let angle = -Math.PI / 2;
    return slices.map((slice) => {
      const sweep = total > 0 ? (slice.value / total) * Math.PI * 2 : 0;
      const start = angle;
      angle += sweep;
      return {
        key: slice.key,
        label: slice.label,
        color: slice.color,
        valueLabel: this.format()(slice.value),
        share: formatPct(total > 0 ? (slice.value / total) * 100 : 0),
        d: arcPath(radius, radius, inner, radius, start, angle),
      };
    });
  });

  protected readonly active = computed(
    () => this.arcs().find((arc) => arc.key === this.hover()) ?? null,
  );
}

/** Secteur d'anneau entre deux angles (radians, 0 = 3 h). Un tour complet est ferme proprement. */
export function arcPath(
  cx: number,
  cy: number,
  inner: number,
  outer: number,
  start: number,
  end: number,
): string {
  const sweep = Math.min(end - start, Math.PI * 2 - 1e-4);
  const finish = start + sweep;
  const large = sweep > Math.PI ? 1 : 0;
  const point = (r: number, a: number): string =>
    `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  return (
    `M${point(outer, start)}A${outer},${outer} 0 ${large} 1 ${point(outer, finish)}` +
    `L${point(inner, finish)}A${inner},${inner} 0 ${large} 0 ${point(inner, start)}Z`
  );
}
