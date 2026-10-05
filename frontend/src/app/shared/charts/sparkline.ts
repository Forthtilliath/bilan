import { Component, computed, input } from '@angular/core';

import { linearScale, linePath } from './scale';

/** Mini-courbe de tendance sans axes ; le dernier point est marque. Decorative : la valeur est ecrite a cote. */
@Component({
  selector: 'app-sparkline',
  host: { class: 'sparkline', 'aria-hidden': 'true' },
  template: `
    @if (path(); as p) {
      <svg
        [attr.width]="width()"
        [attr.height]="height()"
        [attr.viewBox]="'0 0 ' + width() + ' ' + height()"
      >
        <path class="sparkline__line" [attr.d]="p.d" [style.stroke]="color()" />
        <circle
          class="sparkline__dot"
          [attr.cx]="p.endX"
          [attr.cy]="p.endY"
          r="2.5"
          [style.fill]="color()"
        />
      </svg>
    }
  `,
})
export class Sparkline {
  readonly values = input.required<readonly number[]>();
  readonly color = input('var(--ink-3)');
  readonly width = input(96);
  readonly height = input(28);

  protected readonly path = computed(() => {
    const values = this.values();
    if (values.length < 2) {
      return null;
    }
    const pad = 3;
    const x = linearScale([0, values.length - 1], [pad, this.width() - pad]);
    const y = linearScale([Math.min(...values), Math.max(...values)], [this.height() - pad, pad]);
    const points = values.map((value, i) => [x(i), y(value)] as const);
    const last = points.at(-1) ?? [0, 0];
    return { d: linePath(points), endX: last[0], endY: last[1] };
  });
}
