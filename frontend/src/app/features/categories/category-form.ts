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

import { BilanApi, toProblem } from '../../core/api';
import { clientErrors } from '../../core/form-errors';
import type { Category, CategoryKind, CategoryRequest, ColorSlot } from '../../core/models';
import { COLOR_SLOTS } from '../../core/models';
import { seriesColor } from '../../core/palette';
import { CATEGORY_ICONS, Icon } from '../../shared/icon';
import { ConfirmButton } from '../../shared/ui/confirm-button';
import type { SegmentOption } from '../../shared/ui/segmented';
import { Segmented } from '../../shared/ui/segmented';

/** Creation / modification d'une categorie : nom, sens, couleur, icone et budget mensuel (depenses). */
@Component({
  selector: 'app-category-form',
  imports: [ReactiveFormsModule, Segmented, ConfirmButton, Icon],
  templateUrl: './category-form.html',
})
export class CategoryForm {
  readonly category = input<Category | null>(null);
  readonly defaultKind = input<CategoryKind>('EXPENSE');
  readonly done = output();
  readonly cancelled = output();

  private readonly api = inject(BilanApi);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly slots = COLOR_SLOTS;
  protected readonly icons = CATEGORY_ICONS;
  protected readonly seriesColor = seriesColor;
  protected readonly kinds: readonly SegmentOption<CategoryKind>[] = [
    { value: 'EXPENSE', label: 'Dépense' },
    { value: 'INCOME', label: 'Revenu' },
  ];

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(60)]],
    color: this.fb.control<ColorSlot>(1),
    icon: this.fb.control<string>('tag'),
    monthlyBudget: this.fb.control<number | null>(null, Validators.min(1)),
  });
  protected readonly kind = signal<CategoryKind>('EXPENSE');
  /** Le sens d'une categorie deja utilisee ne change plus (ses montants ont un signe). */
  protected readonly kindLocked = computed(() => (this.category()?.transactionCount ?? 0) > 0);

  protected readonly errors = signal<Record<string, string>>({});
  protected readonly problem = signal<string | null>(null);
  protected readonly saving = signal(false);

  constructor() {
    effect(() => {
      const category = this.category();
      const kind = this.defaultKind();
      untracked(() => {
        this.kind.set(category?.kind ?? kind);
        if (category) {
          this.form.reset({
            name: category.name,
            color: category.color,
            icon: category.icon ?? 'tag',
            monthlyBudget: category.monthlyBudget,
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
    const request: CategoryRequest = {
      name: value.name.trim(),
      kind: this.kind(),
      color: value.color,
      icon: value.icon,
      monthlyBudget: this.kind() === 'EXPENSE' && value.monthlyBudget ? value.monthlyBudget : null,
    };
    const existing = this.category();
    this.saving.set(true);
    const call = existing
      ? this.api.updateCategory(existing.id, request)
      : this.api.createCategory(request);
    call.subscribe({
      next: () => {
        this.finish();
      },
      error: (err: unknown) => {
        this.fail(err);
      },
    });
  }

  protected remove(): void {
    const existing = this.category();
    if (existing) {
      this.saving.set(true);
      this.api.deleteCategory(existing.id).subscribe({
        next: () => {
          this.finish();
        },
        error: (err: unknown) => {
          this.fail(err);
        },
      });
    }
  }

  private finish(): void {
    this.saving.set(false);
    this.done.emit();
  }

  private fail(err: unknown): void {
    const problem = toProblem(err);
    this.saving.set(false);
    this.errors.set(problem.errors ?? {});
    this.problem.set(problem.errors ? null : (problem.detail ?? null));
  }
}
