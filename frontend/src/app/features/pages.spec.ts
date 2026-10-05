import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import type { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AccountsPage } from './accounts/accounts.page';
import { CategoriesPage } from './categories/categories.page';
import { DashboardPage } from './dashboard/dashboard.page';
import { PortfolioPage } from './portfolio/portfolio.page';

/** Reponses d'API minimales mais coherentes, servies par HttpTestingController. */
const ACCOUNT = {
  id: 'cc',
  name: 'Compte courant',
  type: 'CHECKING',
  institution: 'Banque',
  openingBalance: 100,
  openedOn: '2025-01-01',
  color: 1,
  archived: false,
  balance: 1500,
  cash: 1500,
  holdingsValue: 0,
  change30d: 120,
  transactionCount: 4,
  trend: [1000, 1200, 1500],
};
const PEA = {
  ...ACCOUNT,
  id: 'pea',
  name: 'PEA',
  type: 'BROKERAGE',
  color: 7,
  balance: 900,
  cash: 100,
  holdingsValue: 800,
};
const FLOW = (month: string, income: number, expense: number) => ({
  month,
  income,
  expense,
  net: income - expense,
});
const DASHBOARD = {
  month: '2026-09',
  netWorth: { total: 2400, investments: 900, change30d: 150, change30dPct: 6.7 },
  current: FLOW('2026-09', 3000, 2000),
  previous: FLOW('2026-08', 2900, 2400),
  savingsRate: 33.3,
  history: [
    { date: '2026-09-01', total: 2200, investments: 850 },
    { date: '2026-09-08', total: 2300, investments: 880 },
    { date: '2026-09-15', total: 2400, investments: 900 },
  ],
  cashflow: [FLOW('2026-08', 2900, 2400), FLOW('2026-09', 3000, 2000)],
  spending: [
    { categoryId: 'food', name: 'Courses', color: 2, icon: 'cart', amount: 500, budget: 450 },
    { categoryId: 'fun', name: 'Loisirs', color: 5, icon: 'ticket', amount: 0, budget: 150 },
  ],
  recent: [],
};
const PORTFOLIO = {
  totals: {
    value: 900,
    marketValue: 800,
    cash: 100,
    costBasis: 700,
    unrealizedGain: 100,
    unrealizedPct: 14.3,
    realizedGain: 25,
    contributed: 750,
    dayChange: -4,
  },
  holdings: [
    {
      assetId: 'mnde',
      symbol: 'MNDE',
      name: 'Monde Indiciel ETF',
      assetClass: 'ETF',
      quantity: 8,
      averageCost: 87.5,
      price: 100,
      marketValue: 800,
      costBasis: 700,
      unrealizedGain: 100,
      unrealizedPct: 14.3,
      weight: 88.9,
      change1d: -0.5,
    },
  ],
  allocation: [
    { key: 'ETF', value: 800, weight: 88.9 },
    { key: 'CASH', value: 100, weight: 11.1 },
  ],
  performance: [
    { date: '2026-09-01', value: 850, contributed: 750 },
    { date: '2026-09-08', value: 900, contributed: 750 },
  ],
};
const CATEGORY = (id: string, name: string, kind: string, budget: number | null) => ({
  id,
  name,
  kind,
  color: 2,
  icon: 'cart',
  monthlyBudget: budget,
  currentMonth: 500,
  monthlyAverage: 430,
  transactionCount: 12,
});

async function renderPage(page: Type<unknown>, responses: Record<string, unknown>) {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
  });
  const http = TestBed.inject(HttpTestingController);
  const fixture = TestBed.createComponent(page);
  // Plusieurs tours : certaines lectures ne partent qu'une fois les premieres recues.
  for (let round = 0; round < 3; round++) {
    TestBed.tick();
    for (const request of http.match(() => true)) {
      const url = request.request.urlWithParams;
      const key = Object.keys(responses).find((prefix) => url.startsWith(prefix));
      request.flush(key ? (responses[key] as object) : []);
    }
    await fixture.whenStable();
  }
  return fixture.nativeElement as HTMLElement;
}

describe('pages', () => {
  it('dashboard: hero figure, monthly tiles, budgets and accounts', async () => {
    const host = await renderPage(DashboardPage, {
      '/api/dashboard': DASHBOARD,
      '/api/accounts': [ACCOUNT, PEA],
    });
    const text = host.textContent.replace(/\s+/g, ' ');

    expect(host.querySelector('.hero-figure')?.textContent).toMatch(/2\s400\s€/);
    expect(text).toContain("Taux d'épargne");
    expect(text).toContain('33,3 %');
    expect(text).toContain('Dépassé de 50');
    expect(host.querySelectorAll('app-line-chart, app-column-chart, app-donut-chart')).toHaveLength(
      3,
    );
    expect(text).toContain('Compte courant');
  });

  it('accounts: total, split and one card per active account', async () => {
    const host = await renderPage(AccountsPage, {
      '/api/accounts': [ACCOUNT, PEA, { ...ACCOUNT, id: 'x', archived: true }],
    });

    expect(host.querySelector('.hero-figure')?.textContent).toMatch(/2\s400,00\s€/);
    expect(host.querySelectorAll('.split__part')).toHaveLength(2);
    expect(host.querySelectorAll('app-account-card')).toHaveLength(3);
    expect(host.textContent).toContain('Comptes archivés');
  });

  it('portfolio: totals, positions and allocation', async () => {
    const host = await renderPage(PortfolioPage, {
      '/api/accounts': [ACCOUNT, PEA],
      '/api/portfolio': PORTFOLIO,
      '/api/trades': [],
    });
    const text = host.textContent.replace(/\s+/g, ' ');

    expect(text).toContain('+100,00 €');
    expect(text).toContain('MNDE');
    expect(text).toContain('Liquidités');
    expect(
      [...host.querySelectorAll('.segmented__option')].map((o) => o.textContent.trim()),
    ).toEqual(['Tous les comptes', 'PEA']);
  });

  it('categories: expenses with budgets, incomes apart', async () => {
    const host = await renderPage(CategoriesPage, {
      '/api/categories': [
        CATEGORY('food', 'Courses', 'EXPENSE', 450),
        CATEGORY('pay', 'Salaire', 'INCOME', null),
      ],
    });

    expect(host.querySelectorAll('.category-row')).toHaveLength(2);
    expect(host.querySelectorAll('app-budget-meter')).toHaveLength(1);
    expect(host.textContent).toContain('Salaire');
  });
});
