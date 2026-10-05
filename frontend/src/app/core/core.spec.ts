import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { toProblem, transactionsUrl } from './api';
import type { AccountId } from './models';
import { holdsAssets } from './models';
import { seriesColor } from './palette';
import { ThemeService } from './theme';

describe('transactionsUrl', () => {
  it('only keeps the criteria that are set', () => {
    expect(transactionsUrl({})).toBe('/api/transactions');
    expect(
      transactionsUrl({
        q: 'loyer',
        accountId: 'a1' as AccountId,
        categoryId: null,
        uncategorized: false,
        from: '',
        page: 0,
        size: 50,
      }),
    ).toBe('/api/transactions?q=loyer&accountId=a1&page=0&size=50');
  });

  it('encodes free text', () => {
    expect(transactionsUrl({ q: 'Café & co' })).toBe('/api/transactions?q=Caf%C3%A9+%26+co');
  });
});

describe('toProblem', () => {
  it('reads the ProblemDetail and its field errors', () => {
    const error = new HttpErrorResponse({
      status: 422,
      error: { detail: 'Opération invalide.', errors: { amount: 'Montant nul.' } },
    });
    expect(toProblem(error)).toEqual({
      status: 422,
      detail: 'Opération invalide.',
      errors: { amount: 'Montant nul.' },
    });
  });

  it('explains an unreachable server and unknown errors', () => {
    expect(toProblem(new HttpErrorResponse({ status: 0 })).detail).toContain('injoignable');
    expect(toProblem(new Error('boom'))).toEqual({ status: -1, detail: 'Erreur inattendue.' });
  });
});

describe('models and palette', () => {
  it('knows which accounts hold assets and maps colour slots', () => {
    expect(holdsAssets('BROKERAGE')).toBe(true);
    expect(holdsAssets('CRYPTO')).toBe(true);
    expect(holdsAssets('SAVINGS')).toBe(false);
    expect(seriesColor(3)).toBe('var(--series-3)');
    expect(seriesColor(null)).toBe('var(--ink-3)');
  });
});

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('applies and remembers an explicit theme', async () => {
    const theme = TestBed.inject(ThemeService);
    theme.preference.set('dark');
    TestBed.tick();
    await Promise.resolve();

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('bilan.theme')).toBe('dark');
    expect(theme.isDark()).toBe(true);

    theme.toggle();
    TestBed.tick();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
