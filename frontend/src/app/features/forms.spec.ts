import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AccountForm } from './accounts/account-form';
import { CategoryForm } from './categories/category-form';
import { TradeForm } from './portfolio/trade-form';

let http: HttpTestingController;

function setup(): void {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
  });
  http = TestBed.inject(HttpTestingController);
}

/** Saisit une valeur dans un champ reactif, puis attend le rendu. */
async function type(
  fixture: ComponentFixture<unknown>,
  name: string,
  value: string,
): Promise<void> {
  const field = (fixture.nativeElement as HTMLElement).querySelector<
    HTMLInputElement | HTMLSelectElement
  >(`[formcontrolname="${name}"]`);
  if (!field) {
    throw new Error(`Champ ${name} absent`);
  }
  field.value = value;
  field.dispatchEvent(new Event(field instanceof HTMLSelectElement ? 'change' : 'input'));
  await fixture.whenStable();
}

async function submit(fixture: ComponentFixture<unknown>): Promise<void> {
  (fixture.nativeElement as HTMLElement).querySelector('form')?.dispatchEvent(new Event('submit'));
  await fixture.whenStable();
}

describe('AccountForm', () => {
  beforeEach(setup);
  afterEach(() => {
    http.verify();
  });

  it('creates an account with the chosen colour and trims the institution', async () => {
    const fixture = TestBed.createComponent(AccountForm);
    await fixture.whenStable();
    const saved = vi.fn();
    fixture.componentInstance.saved.subscribe(saved);

    await type(fixture, 'name', 'Livret jeune');
    await type(fixture, 'type', 'SAVINGS');
    await type(fixture, 'institution', '   ');
    (fixture.nativeElement as HTMLElement)
      .querySelectorAll<HTMLButtonElement>('.picker__option')[5]
      ?.click();
    await submit(fixture);

    const request = http.expectOne('/api/accounts');
    expect(request.request.body).toMatchObject({
      name: 'Livret jeune',
      type: 'SAVINGS',
      institution: null,
      color: 6,
    });
    request.flush({ id: 'new' });
    expect(saved).toHaveBeenCalledWith({ id: 'new' });
  });

  it('refuses an empty name without calling the API, then shows server errors', async () => {
    const fixture = TestBed.createComponent(AccountForm);
    await fixture.whenStable();
    await submit(fixture);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Champ obligatoire.');

    await type(fixture, 'name', 'Compte');
    await submit(fixture);
    http
      .expectOne('/api/accounts')
      .flush(
        { detail: 'Serveur en maintenance.' },
        { status: 503, statusText: 'Service Unavailable' },
      );
    await fixture.whenStable();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent,
    ).toContain('Serveur en maintenance.');
  });
});

describe('CategoryForm', () => {
  beforeEach(setup);
  afterEach(() => {
    http.verify();
  });

  it('drops the budget of an income category', async () => {
    const fixture = TestBed.createComponent(CategoryForm);
    fixture.componentRef.setInput('defaultKind', 'INCOME');
    await fixture.whenStable();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[formcontrolname="monthlyBudget"]'),
    ).toBeNull();
    await type(fixture, 'name', 'Primes');
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[aria-label="gift"]')
      ?.click();
    await submit(fixture);

    const request = http.expectOne('/api/categories');
    expect(request.request.body).toEqual({
      name: 'Primes',
      kind: 'INCOME',
      color: 1,
      icon: 'gift',
      monthlyBudget: null,
    });
    request.flush({});
  });

  it('locks the kind of a category already in use and updates it in place', async () => {
    const fixture = TestBed.createComponent(CategoryForm);
    fixture.componentRef.setInput('category', {
      id: 'food',
      name: 'Courses',
      kind: 'EXPENSE',
      color: 2,
      icon: 'cart',
      monthlyBudget: 450,
      currentMonth: 0,
      monthlyAverage: 0,
      transactionCount: 12,
    });
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('app-segmented')).toBeNull();
    expect(host.textContent).toContain('déjà utilisée');
    await type(fixture, 'monthlyBudget', '500');
    await submit(fixture);

    const request = http.expectOne('/api/categories/food');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toMatchObject({ kind: 'EXPENSE', monthlyBudget: 500 });
    request.flush({});
  });
});

describe('TradeForm', () => {
  beforeEach(setup);
  afterEach(() => {
    http.verify();
  });

  it('proposes the closing price of the chosen day and shows the debited total', async () => {
    const fixture = TestBed.createComponent(TradeForm);
    fixture.componentRef.setInput('defaultAssetId', 'mnde');
    TestBed.tick();
    http.expectOne('/api/accounts').flush([
      { id: 'cc', name: 'Compte courant', type: 'CHECKING', archived: false },
      { id: 'pea', name: 'PEA', type: 'BROKERAGE', archived: false },
    ]);
    http.expectOne('/api/assets').flush([{ id: 'mnde', symbol: 'MNDE', name: 'Monde' }]);
    // Le titre par defaut declenche la lecture des cours : on y repond avant d'attendre la stabilite.
    TestBed.tick();
    http.expectOne('/api/assets/mnde/prices').flush([
      { date: '2026-01-02', value: 100 },
      { date: '2026-01-05', value: 104 },
    ]);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;

    expect(
      [...host.querySelectorAll<HTMLOptionElement>('[formcontrolname="accountId"] option')].map(
        (o) => o.text,
      ),
    ).toEqual(['Choisir…', 'PEA']);
    await type(fixture, 'tradedOn', '2026-01-04');
    expect(host.querySelector<HTMLInputElement>('[formcontrolname="price"]')?.value).toBe('100');
    await type(fixture, 'quantity', '3');
    await type(fixture, 'fees', '1.5');
    expect(host.querySelector('.trade-total')?.textContent).toMatch(/301,50\s€/);

    await submit(fixture);
    const request = http.expectOne('/api/trades');
    expect(request.request.body).toMatchObject({
      accountId: 'pea',
      assetId: 'mnde',
      side: 'BUY',
      quantity: 3,
      price: 100,
    });
    request.flush({}, { status: 422, statusText: 'Unprocessable Content' });
  });
});
