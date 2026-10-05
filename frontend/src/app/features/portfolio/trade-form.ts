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
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { BilanApi, toProblem } from '../../core/api';
import { clientErrors } from '../../core/form-errors';
import { formatEur, todayIso } from '../../core/format';
import type { Account, AccountId, Asset, AssetId, SeriesPoint, TradeSide } from '../../core/models';
import { holdsAssets } from '../../core/models';
import { Icon } from '../../shared/icon';
import type { SegmentOption } from '../../shared/ui/segmented';
import { Segmented } from '../../shared/ui/segmented';

/** Dernier cours connu a une date (les series sont triees par date croissante). */
export function priceAt(prices: readonly SeriesPoint[], date: string): number | null {
  let found: number | null = null;
  for (const point of prices) {
    if (point.date > date) {
      break;
    }
    found = point.value;
  }
  return found ?? prices[0]?.value ?? null;
}

/** Saisie d'un ordre : le cours de cloture du jour choisi est propose, modifiable. */
@Component({
  selector: 'app-trade-form',
  imports: [ReactiveFormsModule, Segmented, Icon],
  templateUrl: './trade-form.html',
})
export class TradeForm {
  readonly defaultAccountId = input<string | null>(null);
  readonly defaultAssetId = input<string | null>(null);
  readonly defaultSide = input<TradeSide>('BUY');
  readonly done = output();
  readonly cancelled = output();

  private readonly api = inject(BilanApi);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly accounts = httpResource<Account[]>(() => '/api/accounts', {
    defaultValue: [],
  });
  protected readonly assets = httpResource<Asset[]>(() => '/api/assets', { defaultValue: [] });
  protected readonly investmentAccounts = computed(() =>
    this.accounts.value().filter((a) => holdsAssets(a.type) && !a.archived),
  );

  protected readonly side = signal<TradeSide>('BUY');
  protected readonly sides: readonly SegmentOption<TradeSide>[] = [
    { value: 'BUY', label: 'Achat' },
    { value: 'SELL', label: 'Vente' },
  ];
  protected readonly today = todayIso();

  protected readonly form = this.fb.group({
    accountId: ['', Validators.required],
    assetId: ['', Validators.required],
    tradedOn: [todayIso(), Validators.required],
    quantity: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0.00000001),
    ]),
    price: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.0001)]),
    fees: this.fb.control<number>(0, [Validators.required, Validators.min(0)]),
  });
  private readonly value = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  /** Titre choisi : un `computed` ne se propage que s'il change (pas a chaque frappe dans le formulaire). */
  private readonly assetId = computed(() => this.value().assetId ?? '');
  private readonly prices = httpResource<SeriesPoint[]>(
    () => (this.assetId() ? `/api/assets/${this.assetId()}/prices` : undefined),
    { defaultValue: [] },
  );

  private readonly suggestedPrice = computed(() =>
    priceAt(this.prices.value(), this.value().tradedOn ?? todayIso()),
  );

  /** Montant debite (achat) ou credite (vente), frais compris. */
  protected readonly total = computed(() => {
    const { quantity, price, fees } = this.value();
    if (!quantity || !price) {
      return null;
    }
    const gross = quantity * price;
    return formatEur(this.side() === 'BUY' ? gross + (fees ?? 0) : gross - (fees ?? 0));
  });

  protected readonly errors = signal<Record<string, string>>({});
  protected readonly problem = signal<string | null>(null);
  protected readonly saving = signal(false);

  constructor() {
    effect(() => {
      const accountId = this.defaultAccountId() ?? this.investmentAccounts()[0]?.id ?? '';
      const assetId = this.defaultAssetId() ?? '';
      const side = this.defaultSide();
      untracked(() => {
        this.side.set(side);
        this.form.patchValue({
          accountId: this.form.controls.accountId.value || accountId,
          assetId: this.form.controls.assetId.value || assetId,
        });
      });
    });
    // Propose le cours de cloture du jour choisi des que le titre ou la date change
    // (un cours saisi a la main n'est pas ecrase tant que la suggestion reste la meme).
    effect(() => {
      const price = this.suggestedPrice();
      untracked(() => {
        if (price !== null) {
          this.form.controls.price.setValue(price, { emitEvent: false });
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
    this.saving.set(true);
    this.api
      .createTrade({
        accountId: value.accountId as AccountId,
        assetId: value.assetId as AssetId,
        side: this.side(),
        tradedOn: value.tradedOn,
        quantity: value.quantity ?? 0,
        price: value.price ?? 0,
        fees: value.fees,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.done.emit();
        },
        error: (err: unknown) => {
          const problem = toProblem(err);
          this.saving.set(false);
          this.errors.set(problem.errors ?? {});
          this.problem.set(problem.errors ? null : (problem.detail ?? null));
        },
      });
  }
}
