import { Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { BilanApi, toProblem } from '../../core/api';
import { clientErrors } from '../../core/form-errors';
import { todayIso } from '../../core/format';
import type { Account, AccountRequest, AccountType, ColorSlot } from '../../core/models';
import { ACCOUNT_TYPE_LABELS, ACCOUNT_TYPES, COLOR_SLOTS } from '../../core/models';
import { seriesColor } from '../../core/palette';
import { Icon } from '../../shared/icon';
import { ConfirmButton } from '../../shared/ui/confirm-button';

/** Creation / modification / suppression d'un compte (contenu du tiroir). */
@Component({
  selector: 'app-account-form',
  imports: [ReactiveFormsModule, ConfirmButton, Icon],
  templateUrl: './account-form.html',
})
export class AccountForm {
  readonly account = input<Account | null>(null);
  readonly saved = output<Account>();
  readonly deleted = output();
  readonly cancelled = output();

  private readonly api = inject(BilanApi);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly types = ACCOUNT_TYPES;
  protected readonly typeLabels = ACCOUNT_TYPE_LABELS;
  protected readonly slots = COLOR_SLOTS;
  protected readonly seriesColor = seriesColor;
  protected readonly today = todayIso();

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    type: this.fb.control<AccountType>('CHECKING'),
    institution: ['', Validators.maxLength(80)],
    openingBalance: this.fb.control<number>(0, Validators.required),
    openedOn: [todayIso(), Validators.required],
    color: this.fb.control<ColorSlot>(1),
    archived: [false],
  });

  protected readonly errors = signal<Record<string, string>>({});
  protected readonly problem = signal<string | null>(null);
  protected readonly saving = signal(false);

  constructor() {
    effect(() => {
      const account = this.account();
      untracked(() => {
        if (account) {
          this.form.reset({
            name: account.name,
            type: account.type,
            institution: account.institution ?? '',
            openingBalance: account.openingBalance,
            openedOn: account.openedOn,
            color: account.color,
            archived: account.archived,
          });
        }
      });
    });
  }

  protected submit(): void {
    const errors = clientErrors(this.form);
    this.errors.set(errors);
    this.problem.set(null);
    if (Object.keys(errors).length > 0) {
      return;
    }
    const value = this.form.getRawValue();
    const request: AccountRequest = {
      ...value,
      name: value.name.trim(),
      institution: value.institution.trim() || null,
    };
    const existing = this.account();
    this.saving.set(true);
    const call = existing
      ? this.api.updateAccount(existing.id, request)
      : this.api.createAccount(request);
    call.subscribe({
      next: (account) => {
        this.saving.set(false);
        this.saved.emit(account);
      },
      error: (err: unknown) => {
        this.fail(err);
      },
    });
  }

  protected remove(): void {
    const existing = this.account();
    if (!existing) {
      return;
    }
    this.saving.set(true);
    this.api.deleteAccount(existing.id).subscribe({
      next: () => {
        this.deleted.emit();
      },
      error: (err: unknown) => {
        this.fail(err);
      },
    });
  }

  private fail(err: unknown): void {
    const problem = toProblem(err);
    this.saving.set(false);
    this.errors.set(problem.errors ?? {});
    this.problem.set(problem.errors ? null : (problem.detail ?? null));
  }
}
