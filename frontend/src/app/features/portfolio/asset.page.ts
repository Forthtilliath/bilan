import { httpResource } from '@angular/common/http';
import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BilanApi } from '../../core/api';
import { formatDate, formatEur, formatPct, formatPrice, formatQuantity } from '../../core/format';
import type { Asset, Portfolio, SeriesPoint, Trade } from '../../core/models';
import { ALLOCATION_COLORS, ALLOCATION_LABELS } from '../../core/models';
import { seriesColor } from '../../core/palette';
import { ChartCard } from '../../shared/charts/chart-card';
import type { LineSeries } from '../../shared/charts/line-chart';
import { LineChart } from '../../shared/charts/line-chart';
import { Icon } from '../../shared/icon';
import { Delta } from '../../shared/ui/delta';
import { Drawer } from '../../shared/ui/drawer';
import type { SegmentOption } from '../../shared/ui/segmented';
import { Segmented } from '../../shared/ui/segmented';
import { StatTile } from '../../shared/ui/stat-tile';

import { TradeForm } from './trade-form';
import { TradesTable } from './trades-table';

type Range = '3M' | '6M' | '1A' | 'MAX';
const RANGE_DAYS: Record<Range, number> = { '3M': 92, '6M': 183, '1A': 366, MAX: Infinity };

/** Fiche d'un titre : cours, variations, position detenue et ordres passes. */
@Component({
  selector: 'app-asset-page',
  imports: [
    RouterLink,
    ChartCard,
    LineChart,
    Icon,
    Delta,
    Drawer,
    Segmented,
    StatTile,
    TradeForm,
    TradesTable,
  ],
  templateUrl: './asset.page.html',
})
export class AssetPage {
  /** Parametre de route `:id`. */
  readonly id = input.required<string>();

  private readonly api = inject(BilanApi);

  protected readonly asset = httpResource<Asset>(() => `/api/assets/${this.id()}`);
  protected readonly prices = httpResource<SeriesPoint[]>(() => `/api/assets/${this.id()}/prices`, {
    defaultValue: [],
  });
  protected readonly portfolio = httpResource<Portfolio>(() => '/api/portfolio');
  protected readonly trades = httpResource<Trade[]>(() => `/api/trades?assetId=${this.id()}`, {
    defaultValue: [],
  });

  protected readonly range = signal<Range>('1A');
  protected readonly ranges: readonly SegmentOption<Range>[] = [
    { value: '3M', label: '3 mois' },
    { value: '6M', label: '6 mois' },
    { value: '1A', label: '1 an' },
    { value: 'MAX', label: 'Tout' },
  ];
  protected readonly trading = signal(false);

  protected readonly labels = ALLOCATION_LABELS;
  protected readonly formatDate = formatDate;
  protected readonly formatEur = formatEur;
  protected readonly formatPct = formatPct;
  protected readonly formatPrice = formatPrice;
  protected readonly formatQuantity = formatQuantity;

  protected readonly holding = computed(() =>
    this.portfolio.hasValue()
      ? (this.portfolio.value().holdings.find((h) => h.assetId === this.id()) ?? null)
      : null,
  );

  protected readonly visible = computed(() => {
    const prices = this.prices.value();
    const days = RANGE_DAYS[this.range()];
    if (!Number.isFinite(days) || prices.length === 0) {
      return prices;
    }
    const last = new Date(prices.at(-1)?.date ?? '');
    last.setDate(last.getDate() - days);
    const from = last.toISOString().slice(0, 10);
    return prices.filter((p) => p.date >= from);
  });
  protected readonly periodChange = computed(() => {
    const points = this.visible();
    const first = points[0]?.value;
    const last = points.at(-1)?.value;
    return first && last ? ((last - first) / first) * 100 : null;
  });
  protected readonly dates = computed(() => this.visible().map((p) => p.date));
  protected readonly series = computed<LineSeries[]>(() => {
    const asset = this.asset.hasValue() ? this.asset.value() : null;
    return [
      {
        key: 'close',
        label: 'Cours de clôture',
        color: seriesColor(asset ? ALLOCATION_COLORS[asset.assetClass] : 1),
        values: this.visible().map((p) => p.value),
        area: true,
      },
    ];
  });

  protected refresh(): void {
    this.trading.set(false);
    this.portfolio.reload();
    this.trades.reload();
  }

  protected deleteTrade(trade: Trade): void {
    this.api.deleteTrade(trade.id).subscribe({
      next: () => {
        this.refresh();
      },
      error: () => this.trades.reload(),
    });
  }
}
