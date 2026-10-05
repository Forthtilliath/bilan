import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import type { Account, Category, Transaction } from '../../core/models';

import { TransactionEditor } from './transaction-editor';
import { TransactionTable } from './transaction-table';

const ACCOUNTS = [
  { id: 'cc', name: 'Compte courant', archived: false },
  { id: 'liv', name: 'Livret', archived: false },
  { id: 'old', name: 'Ancien compte', archived: true },
] as Account[];
const CATEGORIES = [
  { id: 'food', name: 'Courses', kind: 'EXPENSE' },
  { id: 'pay', name: 'Salaire', kind: 'INCOME' },
] as Category[];

/** Operation de test : les identifiants restent de simples chaines. */
const transaction = (patch: Record<string, unknown>): Transaction =>
  ({
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
    ...patch,
  }) as unknown as Transaction;

describe('TransactionEditor', () => {
  let http: HttpTestingController;

  async function open(tx: Transaction | null) {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(TransactionEditor);
    fixture.componentRef.setInput('transaction', tx);
    fixture.componentRef.setInput('defaultAccountId', 'cc');
    TestBed.tick();
    http.expectOne('/api/accounts').flush(ACCOUNTS);
    http.expectOne('/api/categories').flush(CATEGORIES);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const field = (name: string): HTMLInputElement | HTMLSelectElement => {
      const element = host.querySelector<HTMLInputElement | HTMLSelectElement>(
        `[formcontrolname="${name}"]`,
      );
      if (!element) {
        throw new Error(`Champ ${name} absent`);
      }
      return element;
    };
    const select = (name: string): HTMLSelectElement => field(name) as HTMLSelectElement;
    const type = async (name: string, value: string) => {
      const input = field(name);
      input.value = value;
      input.dispatchEvent(new Event(input instanceof HTMLSelectElement ? 'change' : 'input'));
      await fixture.whenStable();
    };
    return { fixture, host, select, type };
  }

  afterEach(() => {
    http.verify();
  });

  it('records an expense with a negative amount, among active accounts only', async () => {
    const { fixture, host, select, type } = await open(null);
    const done = vi.fn();
    fixture.componentInstance.done.subscribe(done);

    expect([...select('accountId').options].map((o) => o.text)).not.toContain('Ancien compte');
    expect([...select('categoryId').options].map((o) => o.text)).toEqual([
      'Non catégorisé',
      'Courses',
    ]);
    await type('amount', '42.5');
    await type('categoryId', 'food');
    await type('label', '  Marché  ');
    host.querySelector('form')?.dispatchEvent(new Event('submit'));

    const request = http.expectOne('/api/transactions');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toMatchObject({
      accountId: 'cc',
      categoryId: 'food',
      amount: -42.5,
      label: 'Marché',
    });
    request.flush(transaction({}));
    expect(done).toHaveBeenCalled();
  });

  it('validates locally before calling the API and shows server field errors', async () => {
    const { fixture, host, type } = await open(null);
    host.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(host.querySelectorAll('.field__error').length).toBeGreaterThanOrEqual(2);

    await type('amount', '10');
    await type('label', 'Test');
    host.querySelector('form')?.dispatchEvent(new Event('submit'));
    http
      .expectOne('/api/transactions')
      .flush(
        { detail: 'Opération invalide.', errors: { bookedOn: 'Date antérieure à l’ouverture.' } },
        { status: 422, statusText: 'Unprocessable Content' },
      );
    await fixture.whenStable();
    expect(host.textContent).toContain('Date antérieure à l’ouverture.');
  });

  it('edits a transfer as a whole, from its credit leg', async () => {
    const leg = transaction({
      id: 'credit',
      accountId: 'liv',
      amount: 120,
      categoryId: null,
      transferId: 'tr1',
      counterpartAccountId: 'cc',
    });
    const { host, select } = await open(leg);

    expect(select('accountId').value).toBe('cc');
    expect(select('toAccountId').value).toBe('liv');
    expect(host.querySelector('app-segmented')).toBeNull();
    host.querySelector('form')?.dispatchEvent(new Event('submit'));

    const request = http.expectOne('/api/transfers/tr1');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toMatchObject({
      fromAccountId: 'cc',
      toAccountId: 'liv',
      amount: 120,
    });
    request.flush([]);
  });
});

describe('TransactionTable', () => {
  it('groups operations by day and opens one with the keyboard', async () => {
    const fixture = TestBed.createComponent(TransactionTable);
    fixture.componentRef.setInput('items', [
      transaction({ id: 'a', bookedOn: '2026-10-03' }),
      transaction({ id: 'b', bookedOn: '2026-10-03', label: 'Loyer' }),
      transaction({ id: 'c', bookedOn: '2026-10-01', amount: 2985, label: 'Salaire' }),
    ]);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const selected = vi.fn();
    fixture.componentInstance.selected.subscribe(selected);

    expect([...host.querySelectorAll('.table__group')].map((g) => g.textContent.trim())).toEqual([
      '3 oct. 2026',
      '1 oct. 2026',
    ]);
    host
      .querySelectorAll('tr.is-clickable')[1]
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(selected).toHaveBeenCalledWith(expect.objectContaining({ id: 'b' }));
    expect(host.querySelector('.amount--up')?.textContent).toContain('+2');
  });

  it('says when nothing matches', async () => {
    const fixture = TestBed.createComponent(TransactionTable);
    fixture.componentRef.setInput('items', []);
    fixture.componentRef.setInput('emptyLabel', 'Rien ici.');
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Rien ici.');
  });
});
