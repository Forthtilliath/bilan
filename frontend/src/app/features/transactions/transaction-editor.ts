import { httpResource } from '@angular/common/http';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { Observable } from 'rxjs';

import { BilanApi, toProblem } from '../../core/api';
import { clientErrors } from '../../core/form-errors';
import { todayIso } from '../../core/format';
import type { Account, AccountId, Category, CategoryId, Transaction } from '../../core/models';
import { Icon } from '../../shared/icon';
import { ConfirmButton } from '../../shared/ui/confirm-button';
import type { SegmentOption } from '../../shared/ui/segmented';
import { Segmented } from '../../shared/ui/segmented';

export type EditorMode = 'expense' | 'income' | 'transfer';

/** Mode d'edition deduit d'une operation existante. */
export function modeOf(tx: Transaction): EditorMode {
  if (tx.transferId) {
    return 'transfer';
  }
  return tx.amount < 0 ? 'expense' : 'income';
}

/**
 * Saisie d'une depense, d'un revenu ou d'un virement. Le montant se saisit en positif : le mode donne le signe.
 * Un virement existant s'edite comme un tout (ses deux jambes).
 */
@Component({
  selector: 'app-transaction-editor',
  imports: [ReactiveFormsModule, Segmented, ConfirmButton, Icon],
  templateUrl: './transaction-editor.html',
})
export class TransactionEditor {
  readonly transaction = input<Transaction | null>(null);
  readonly defaultAccountId = input<string | null>(null);
  readonly done = output();
  readonly cancelled = output();

  private readonly api = inject(BilanApi);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly accounts = httpResource<Account[]>(() => '/api/accounts', {
    defaultValue: [],
  });
  protected readonly categories = httpResource<Category[]>(() => '/api/categories', {
    defaultValue: [],
  });

  protected readonly mode = signal<EditorMode>('expense');
  protected readonly modes = computed<SegmentOption<EditorMode>[]>(() => {
    const tx = this.transaction();
    const all: SegmentOption<EditorMode>[] = [
      { value: 'expense', label: 'Dépense' },
      { value: 'income', label: 'Revenu' },
      { value: 'transfer', label: 'Virement' },
    ];
    // Une operation ne devient pas un virement (et inversement) : on supprime puis on recree.
    if (!tx) {
      return all;
    }
    return tx.transferId
      ? all.filter((m) => m.value === 'transfer')
      : all.filter((m) => m.value !== 'transfer');
  });

  protected readonly form = this.fb.group({
    accountId: ['', Validators.required],
    toAccountId: [''],
    categoryId: [''],
    bookedOn: [todayIso(), Validators.required],
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    label: ['', [Validators.maxLength(140)]],
    note: ['', Validators.maxLength(500)],
  });

  protected readonly activeAccounts = computed(() =>
    this.accounts.value().filter((a) => !a.archived),
  );
  protected readonly modeCategories = computed(() => {
    const kind = this.mode() === 'income' ? 'INCOME' : 'EXPENSE';
    return this.categories.value().filter((c) => c.kind === kind);
  });

  protected readonly errors = signal<Record<string, string>>({});
  protected readonly problem = signal<string | null>(null);
  protected readonly saving = signal(false);

  constructor() {
    effect(() => {
      const tx = this.transaction();
      const fallback = this.defaultAccountId();
      untracked(() => {
        if (tx) {
          this.load(tx);
        } else {
          this.form.patchValue({ accountId: fallback ?? '' });
        }
      });
    });
  }

  private load(tx: Transaction): void {
    const mode = modeOf(tx);
    this.mode.set(mode);
    const outgoing = tx.amount < 0;
    this.form.reset({
      accountId: mode === 'transfer' && !outgoing ? (tx.counterpartAccountId ?? '') : tx.accountId,
      toAccountId:
        mode === 'transfer' ? (outgoing ? (tx.counterpartAccountId ?? '') : tx.accountId) : '',
      categoryId: tx.categoryId ?? '',
      bookedOn: tx.bookedOn,
      amount: Math.abs(tx.amount),
      label: tx.label,
      note: tx.note ?? '',
    });
  }

  protected submit(): void {
    const errors = clientErrors(this.form);
    const value = this.form.getRawValue();
    if (this.mode() === 'transfer' && !value.toAccountId) {
      errors['toAccountId'] = 'Choisissez le compte à créditer.';
    }
    if (this.mode() !== 'transfer' && !value.label.trim()) {
      errors['label'] = 'Le libellé est obligatoire.';
    }
    this.errors.set(errors);
    this.problem.set(null);
    if (Object.keys(errors).length > 0) {
      return;
    }
    this.saving.set(true);
    this.request(value).subscribe({
      next: () => {
        this.saving.set(false);
        this.done.emit();
      },
      error: (err: unknown) => {
        this.fail(err);
      },
    });
  }

  private request(value: ReturnType<typeof this.form.getRawValue>): Observable<unknown> {
    const tx = this.transaction();
    const amount = Math.round((value.amount ?? 0) * 100) / 100;
    const note = value.note.trim() || null;
    if (this.mode() === 'transfer') {
      const request = {
        fromAccountId: value.accountId as AccountId,
        toAccountId: value.toAccountId as AccountId,
        bookedOn: value.bookedOn,
        amount,
        label: value.label.trim() || null,
        note,
      };
      return tx?.transferId
        ? this.api.updateTransfer(tx.transferId, request)
        : this.api.createTransfer(request);
    }
    const request = {
      accountId: value.accountId as AccountId,
      categoryId: (value.categoryId || null) as CategoryId | null,
      bookedOn: value.bookedOn,
      amount: this.mode() === 'expense' ? -amount : amount,
      label: value.label.trim(),
      note,
    };
    return tx ? this.api.updateTransaction(tx.id, request) : this.api.createTransaction(request);
  }

  /** Changer de sens vide la categorie : elle n'appartient qu'a un sens. */
  protected switchMode(mode: EditorMode): void {
    this.mode.set(mode);
    this.form.controls.categoryId.setValue('');
    this.errors.set({});
  }

  protected remove(): void {
    const tx = this.transaction();
    if (!tx) {
      return;
    }
    this.saving.set(true);
    this.api.deleteTransaction(tx.id).subscribe({
      next: () => {
        this.done.emit();
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
