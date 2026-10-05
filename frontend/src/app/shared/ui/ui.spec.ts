import type { Type } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { BudgetMeter, budgetStatus } from './budget-meter';
import { ConfirmButton } from './confirm-button';
import { Delta } from './delta';
import { MonthPicker } from './month-picker';

/** Monte un composant avec ses entrees et attend le rendu. */
async function render<T>(
  component: Type<T>,
  inputs: Record<string, unknown>,
): Promise<ComponentFixture<T>> {
  const fixture = TestBed.createComponent(component);
  for (const [name, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(name, value);
  }
  await fixture.whenStable();
  return fixture;
}

const text = (fixture: ComponentFixture<unknown>): string =>
  (fixture.nativeElement as HTMLElement).textContent.replace(/\s+/g, ' ').trim();

describe('budgetStatus', () => {
  it('warns from 85 % and flags overspending', () => {
    expect(budgetStatus(40, 100)).toBe('ok');
    expect(budgetStatus(85, 100)).toBe('warning');
    expect(budgetStatus(100, 100)).toBe('warning');
    expect(budgetStatus(100.01, 100)).toBe('over');
    expect(budgetStatus(10, 0)).toBe('ok');
  });
});

describe('BudgetMeter', () => {
  it('pairs the over-budget state with an explicit label', async () => {
    const fixture = await render(BudgetMeter, { spent: 213, budget: 180, name: 'Shopping' });
    const host = fixture.nativeElement as HTMLElement;

    expect(host.dataset['status']).toBe('over');
    expect(text(fixture)).toContain('Dépassé de 33');
    expect(host.querySelector<HTMLElement>('.meter__fill')?.style.width).toBe('100%');
    expect(host.querySelector('[role="meter"]')?.getAttribute('aria-label')).toContain('Shopping');
  });

  it('shows what is left when under budget', async () => {
    const fixture = await render(BudgetMeter, { spent: 30, budget: 90 });
    expect(text(fixture)).toContain('60 € restants');
  });
});

describe('Delta', () => {
  it('colours a rise as good by default and as bad for expenses', async () => {
    const good = await render(Delta, { value: 120 });
    expect((good.nativeElement as HTMLElement).classList).toContain('delta--good');

    const bad = await render(Delta, { value: 120, upIsGood: false });
    expect((bad.nativeElement as HTMLElement).classList).toContain('delta--bad');
  });

  it('writes the sign and the relative change', async () => {
    const fixture = await render(Delta, { value: -50, pct: -2.5, suffix: 'sur 30 jours' });
    expect(text(fixture)).toMatch(/^−50,00\s€ \(−2,5\s%\) sur 30 jours$/);
  });
});

describe('ConfirmButton', () => {
  afterEach(() => vi.useRealTimers());

  it('needs two clicks, and disarms after four seconds', async () => {
    const fixture = await render(ConfirmButton, {});
    vi.useFakeTimers();
    const confirmed = vi.fn();
    fixture.componentInstance.confirmed.subscribe(confirmed);
    const button = (fixture.nativeElement as HTMLElement).querySelector('button');

    // Minuteurs simules : on declenche la detection de changements a la main (whenStable les attendrait).
    button?.click();
    fixture.detectChanges();
    expect(confirmed).not.toHaveBeenCalled();
    expect(text(fixture)).toBe('Confirmer la suppression');

    vi.advanceTimersByTime(4000);
    fixture.detectChanges();
    expect(text(fixture)).toBe('Supprimer');

    button?.click();
    button?.click();
    expect(confirmed).toHaveBeenCalledTimes(1);
  });
});

describe('MonthPicker', () => {
  it('cannot go past its bounds', async () => {
    const fixture = await render(MonthPicker, { month: '2026-10', min: '2026-09', max: '2026-10' });
    const [previous, next] = (fixture.nativeElement as HTMLElement).querySelectorAll('button');

    expect(text(fixture)).toBe('octobre 2026');
    expect(next?.disabled).toBe(true);
    previous?.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.month()).toBe('2026-09');
    expect(previous?.disabled).toBe(true);
  });
});
