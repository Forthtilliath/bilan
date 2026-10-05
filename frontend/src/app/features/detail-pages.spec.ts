import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { Shell } from '../layout/shell';
import { TransactionRow } from '../shared/ui/transaction-row';

import { AccountDetailPage } from './accounts/account-detail.page';
import { AssetPage } from './portfolio/asset.page';
import { TradesTable } from './portfolio/trades-table';
import { TransactionsPage } from './transactions/transactions.page';

let http: HttpTestingController;

const TX = {
  id: 't1',
  accountId: 'cc',
  accountName: 'Compte courant',
  accountColor: 1,
  categoryId: 'food',
  categoryName: 'Courses',
  categoryColor: 2,
  categoryIcon: 'cart',
  bookedOn: '2026-10-03',
  amount: -42.5,
  label: 'Marché',
  note: null,
  transferId: null,
  counterpartAccountId: null,
  counterpartAccountName: null,
};
const PAGE = { items: [TX], total: 120, page: 0, size: 50, inflow: 3000, outflow: 1200 };
const TRADE = {
  id: 'tr1',
  accountId: 'pea',
  accountName: 'PEA',
  assetId: 'mnde',
  symbol: 'MNDE',
  assetName: 'Monde',
  assetClass: 'ETF',
  side: 'SELL',
  tradedOn: '2026-09-04',
  quantity: 2,
  price: 110,
  fees: 1,
  cashFlow: 219,
  realizedGain: 18.5,
};

function setup(): void {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
  });
  http = TestBed.inject(HttpTestingController);
}

/** Repond a toutes les lectures en attente (plusieurs tours : certaines en declenchent d'autres). */
async function serve(
  fixture: ComponentFixture<unknown>,
  responses: Record<string, unknown>,
): Promise<HTMLElement> {
  for (let round = 0; round < 3; round++) {
    TestBed.tick();
    for (const request of http.match(() => true)) {
      const key = Object.keys(responses).find((prefix) =>
        request.request.urlWithParams.startsWith(prefix),
      );
      request.flush(key ? (responses[key] as object) : []);
    }
    await fixture.whenStable();
  }
  return fixture.nativeElement as HTMLElement;
}

describe('TransactionsPage', () => {
  beforeEach(setup);

  it('shows the selection totals and pages, and writes filters to the URL', async () => {
    const fixture = TestBed.createComponent(TransactionsPage);
    fixture.componentRef.setInput('kind', 'EXPENSE');
    const host = await serve(fixture, { '/api/transactions': PAGE });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    expect(host.querySelector('.totals')?.textContent.replace(/\s+/g, ' ')).toMatch(
      /120.*\+3\s000,00\s€.*−1\s200,00\s€/,
    );
    expect(host.querySelector('.pager')?.textContent).toContain('Page 1 sur 3');
    expect(http.match(() => true)).toHaveLength(0);

    const accountSelect = host.querySelector<HTMLSelectElement>('select[aria-label="Compte"]');
    accountSelect?.dispatchEvent(new Event('change'));
    expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({ replaceUrl: true }));

    [...host.querySelectorAll<HTMLButtonElement>('.pager button')].at(-1)?.click();
    expect(navigate).toHaveBeenLastCalledWith(
      [],
      expect.objectContaining({ queryParams: { page: 1 } }),
    );
  });
});

describe('AccountDetailPage', () => {
  beforeEach(setup);

  it('shows the balance history and the latest operations of one account', async () => {
    const fixture = TestBed.createComponent(AccountDetailPage);
    fixture.componentRef.setInput('id', 'pea');
    const host = await serve(fixture, {
      '/api/accounts/pea/history': [
        { date: '2026-09-01', value: 800 },
        { date: '2026-09-08', value: 900 },
      ],
      '/api/accounts/pea': {
        id: 'pea',
        name: 'PEA',
        type: 'BROKERAGE',
        institution: 'Courtier',
        openingBalance: 500,
        openedOn: '2024-11-01',
        color: 7,
        archived: false,
        balance: 900,
        cash: 100,
        holdingsValue: 800,
        change30d: 40,
        transactionCount: 26,
        trend: [800, 900],
      },
      '/api/transactions': PAGE,
    });

    expect(host.querySelector('h1')?.textContent).toBe('PEA');
    expect(host.textContent).toContain('Positions');
    expect(host.textContent).toContain('Titres');
    expect(host.querySelector('app-line-chart')).not.toBeNull();
    expect(host.querySelectorAll('app-transaction-table tr.is-clickable')).toHaveLength(1);
  });
});

describe('AssetPage', () => {
  beforeEach(setup);

  it('shows the price, the position held and the trades on that asset', async () => {
    const fixture = TestBed.createComponent(AssetPage);
    fixture.componentRef.setInput('id', 'mnde');
    const host = await serve(fixture, {
      '/api/assets/mnde/prices': [
        { date: '2026-09-01', value: 100 },
        { date: '2026-10-05', value: 116.64 },
      ],
      '/api/assets/mnde': {
        id: 'mnde',
        symbol: 'MNDE',
        name: 'Monde Indiciel ETF',
        assetClass: 'ETF',
        price: 116.64,
        priceDate: '2026-10-05',
        change1d: -0.81,
        change1y: 13.96,
        trend: [100, 116.64],
      },
      '/api/portfolio': {
        holdings: [
          {
            assetId: 'mnde',
            quantity: 57,
            averageCost: 103.42,
            marketValue: 6648.48,
            unrealizedGain: 753.72,
            unrealizedPct: 12.8,
          },
        ],
      },
      '/api/trades': [TRADE],
    });

    expect(host.querySelector('h1')?.textContent).toBe('Monde Indiciel ETF');
    expect(host.textContent.replace(/\s+/g, ' ')).toContain('+16,6 %');
    expect(host.textContent).toContain('Ma position');
    expect(host.querySelectorAll('app-trades-table tbody tr')).toHaveLength(1);
  });
});

describe('TradesTable', () => {
  it('shows the realized result of a sale and deletes in two clicks', async () => {
    const fixture = TestBed.createComponent(TradesTable);
    fixture.componentRef.setInput('trades', [
      TRADE,
      { ...TRADE, id: 'tr2', side: 'BUY', realizedGain: null },
    ]);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const removed = vi.fn();
    fixture.componentInstance.remove.subscribe(removed);

    expect(host.querySelectorAll('.badge--sell')).toHaveLength(1);
    expect(host.textContent).toContain('+18,50');
    const trash = host.querySelector<HTMLButtonElement>('tbody tr button');
    trash?.click();
    await fixture.whenStable();
    expect(removed).not.toHaveBeenCalled();
    expect(trash?.getAttribute('aria-label')).toBe('Confirmer la suppression');
    trash?.click();
    expect(removed).toHaveBeenCalledWith(expect.objectContaining({ id: 'tr1' }));
  });
});

describe('TransactionRow', () => {
  it('describes a transfer by its two accounts', async () => {
    const fixture = TestBed.createComponent(TransactionRow);
    fixture.componentRef.setInput('transaction', {
      ...TX,
      transferId: 'x',
      counterpartAccountName: 'Livret',
      amount: -300,
    });
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Compte courant → Livret');
  });
});

describe('Shell', () => {
  beforeEach(setup);

  it('asks for a confirmation before resetting the demo and reports failures', async () => {
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const reset = [...host.querySelectorAll<HTMLButtonElement>('.sidebar__footer button')][1];

    expect(host.querySelectorAll('.nav__link')).toHaveLength(5);
    reset?.click();
    await fixture.whenStable();
    expect(reset?.textContent).toContain('Confirmer la remise à zéro');
    http.expectNone('/api/demo/reset');

    reset?.click();
    http
      .expectOne('/api/demo/reset')
      .flush(
        { detail: 'Réinitialisation trop rapprochée : réessayez dans 8 s.' },
        { status: 429, statusText: 'Too Many Requests' },
      );
    await fixture.whenStable();
    expect(host.querySelector('[role="alert"]')?.textContent).toContain('réessayez dans 8 s');
  });

  it('switches the theme', async () => {
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    const toggle = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.sidebar__footer button',
    );
    const before = toggle?.textContent;
    toggle?.click();
    await fixture.whenStable();
    expect(toggle?.textContent).not.toBe(before);
  });
});
