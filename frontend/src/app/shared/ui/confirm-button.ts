import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';

import { Icon } from '../icon';

/** Bouton de suppression en deux temps : le premier clic arme (4 s), le second confirme. */
@Component({
  selector: 'app-confirm-button',
  imports: [Icon],
  template: `
    <button
      type="button"
      class="btn btn--danger-ghost"
      [class.btn--danger]="armed()"
      [disabled]="disabled()"
      (click)="onClick()"
    >
      <app-icon name="trash" [size]="16" />
      {{ armed() ? confirmLabel() : label() }}
    </button>
  `,
})
export class ConfirmButton {
  readonly label = input('Supprimer');
  readonly confirmLabel = input('Confirmer la suppression');
  readonly disabled = input(false);
  readonly confirmed = output();

  protected readonly armed = signal(false);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.timer);
    });
  }

  protected onClick(): void {
    clearTimeout(this.timer);
    if (this.armed()) {
      this.armed.set(false);
      this.confirmed.emit();
      return;
    }
    this.armed.set(true);
    this.timer = setTimeout(() => {
      this.armed.set(false);
    }, 4000);
  }
}
