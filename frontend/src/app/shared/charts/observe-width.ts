import type { ElementRef, Signal } from '@angular/core';
import { afterNextRender, DestroyRef, inject, signal } from '@angular/core';

/** Largeur de l'element en signal, suivie par ResizeObserver (a appeler dans un contexte d'injection). */
export function observeWidth(element: ElementRef<HTMLElement>, initial = 600): Signal<number> {
  const width = signal(initial);
  const destroyRef = inject(DestroyRef);
  afterNextRender(() => {
    const target = element.nativeElement;
    width.set(Math.round(target.getBoundingClientRect().width) || initial);
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      const next = Math.round(entry?.contentRect.width ?? 0);
      if (next > 0) {
        width.set(next);
      }
    });
    observer.observe(target);
    destroyRef.onDestroy(() => {
      observer.disconnect();
    });
  });
  return width.asReadonly();
}
