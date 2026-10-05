import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { BilanApi, toProblem } from '../core/api';
import { ThemeService } from '../core/theme';
import type { IconName } from '../shared/icon';
import { Icon } from '../shared/icon';

import { Logo } from './logo';

interface NavItem {
  path: string;
  label: string;
  icon: IconName;
  exact?: boolean;
}

/** Coquille : barre laterale (navigation, theme, remise a zero de la demo) et zone de contenu. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, Logo],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <a class="brand" routerLink="/" aria-label="Bilan — tableau de bord">
          <app-logo />
          <span class="brand__name">Bilan</span>
        </a>
        <nav class="nav" aria-label="Navigation principale">
          @for (item of nav; track item.path) {
            <a
              class="nav__link"
              [routerLink]="item.path"
              routerLinkActive="is-active"
              [routerLinkActiveOptions]="{ exact: !!item.exact }"
              ariaCurrentWhenActive="page"
            >
              <app-icon [name]="item.icon" />
              {{ item.label }}
            </a>
          }
        </nav>
        <div class="sidebar__footer">
          <button type="button" class="btn btn--ghost btn--block" (click)="theme.toggle()">
            <app-icon [name]="theme.isDark() ? 'sun' : 'moon'" />
            <span class="sidebar__label">{{
              theme.isDark() ? 'Thème clair' : 'Thème sombre'
            }}</span>
          </button>
          <button
            type="button"
            class="btn btn--ghost btn--block"
            [disabled]="resetting()"
            (click)="resetDemo()"
            [title]="armed() ? 'Cliquer pour confirmer' : 'Régénérer les données de démonstration'"
          >
            <app-icon name="refresh" />
            <span class="sidebar__label">{{
              armed() ? 'Confirmer la remise à zéro' : 'Réinitialiser la démo'
            }}</span>
          </button>
          <p class="sidebar__note">
            Démo portfolio — comptes, enseignes et cours sont fictifs, régénérés à la date du jour.
          </p>
        </div>
      </aside>
      <main class="main" id="contenu">
        @if (error(); as message) {
          <p class="alert" role="alert"><app-icon name="alert" /> {{ message }}</p>
        }
        <router-outlet />
      </main>
    </div>
  `,
})
export class Shell {
  private readonly api = inject(BilanApi);
  protected readonly theme = inject(ThemeService);

  protected readonly nav: readonly NavItem[] = [
    { path: '/', label: 'Tableau de bord', icon: 'dashboard', exact: true },
    { path: '/comptes', label: 'Comptes', icon: 'wallet' },
    { path: '/transactions', label: 'Opérations', icon: 'list' },
    { path: '/categories', label: 'Budgets', icon: 'tag' },
    { path: '/investissements', label: 'Investissements', icon: 'trending' },
  ];

  protected readonly armed = signal(false);
  protected readonly resetting = signal(false);
  protected readonly error = signal<string | null>(null);

  /** Deux clics : armer, puis confirmer. Les donnees changent partout : on recharge la page. */
  protected resetDemo(): void {
    if (!this.armed()) {
      this.armed.set(true);
      setTimeout(() => {
        this.armed.set(false);
      }, 4000);
      return;
    }
    this.resetting.set(true);
    this.api.resetDemo().subscribe({
      next: () => {
        location.reload();
      },
      error: (err: unknown) => {
        this.resetting.set(false);
        this.armed.set(false);
        this.error.set(toProblem(err).detail ?? null);
      },
    });
  }
}
