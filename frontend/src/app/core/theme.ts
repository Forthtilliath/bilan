import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';

export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'bilan.theme';

/** Theme clair / sombre / systeme, applique via `data-theme` sur <html> et memorise localement. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  readonly preference = signal<ThemePreference>(readPreference());

  constructor() {
    effect(() => {
      const preference = this.preference();
      const root = this.document.documentElement;
      if (preference === 'system') {
        root.removeAttribute('data-theme');
      } else {
        root.setAttribute('data-theme', preference);
      }
      try {
        localStorage.setItem(STORAGE_KEY, preference);
      } catch {
        // Stockage indisponible (navigation privee...) : le choix vaut pour la session.
      }
    });
  }

  /** Bascule clair ↔ sombre en partant du theme reellement affiche. */
  toggle(): void {
    this.preference.set(this.isDark() ? 'light' : 'dark');
  }

  isDark(): boolean {
    const preference = this.preference();
    if (preference !== 'system') {
      return preference === 'dark';
    }
    // matchMedia peut manquer (vieux navigateurs, environnements de test) : theme clair par defaut.
    const view = this.document.defaultView;
    return typeof view?.matchMedia === 'function'
      ? view.matchMedia('(prefers-color-scheme: dark)').matches
      : false;
  }
}

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    return 'system';
  }
}
