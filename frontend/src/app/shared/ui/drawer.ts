import type { ElementRef } from '@angular/core';
import {
  afterNextRender,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

import { Icon } from '../icon';

/**
 * Panneau lateral modal sur <dialog> natif : piege du focus, Echap et fond assombri fournis par le navigateur.
 * Le contenu (formulaire) est projete ; il n'est rendu que lorsque le panneau est ouvert.
 */
@Component({
  selector: 'app-drawer',
  imports: [Icon],
  template: `
    <dialog #dialog class="drawer" [attr.aria-labelledby]="titleId" (close)="closed.emit()">
      @if (open()) {
        <div class="drawer__panel">
          <header class="drawer__header">
            <h2 class="drawer__title" [id]="titleId">{{ heading() }}</h2>
            <button type="button" class="icon-button" aria-label="Fermer" (click)="dialog.close()">
              <app-icon name="close" />
            </button>
          </header>
          <div class="drawer__body"><ng-content /></div>
        </div>
      }
    </dialog>
  `,
})
export class Drawer {
  readonly open = input.required<boolean>();
  readonly heading = input.required<string>();
  readonly closed = output();

  private static nextId = 0;
  protected readonly titleId = `drawer-title-${Drawer.nextId++}`;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const dialog = this.dialog().nativeElement;
      if (this.open() && !dialog.open) {
        dialog.showModal();
      } else if (!this.open() && dialog.open) {
        dialog.close();
      }
    });

    // Un clic sur le fond (le <dialog> lui-meme, hors panneau) ferme le tiroir ; Echap est gere nativement.
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const dialog = this.dialog().nativeElement;
      const onClick = (event: MouseEvent): void => {
        if (event.target === dialog) {
          dialog.close();
        }
      };
      dialog.addEventListener('click', onClick);
      destroyRef.onDestroy(() => {
        dialog.removeEventListener('click', onClick);
      });
    });
  }
}
