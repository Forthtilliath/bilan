import { Component, input, model } from '@angular/core';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

/** Choix exclusif compact (boutons radio stylises), liable en two-way avec `[(value)]`. */
@Component({
  selector: 'app-segmented',
  host: { class: 'segmented', role: 'radiogroup', '[attr.aria-label]': 'label()' },
  template: `
    @for (option of options(); track option.value) {
      <button
        type="button"
        role="radio"
        class="segmented__option"
        [attr.aria-checked]="option.value === value()"
        (click)="value.set(option.value)"
      >
        {{ option.label }}
      </button>
    }
  `,
})
export class Segmented<T extends string> {
  readonly options = input.required<readonly SegmentOption<T>[]>();
  readonly value = model.required<T>();
  readonly label = input('');
}
