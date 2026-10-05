import type { Brand } from '@forthtilliath/ts-types';

/** Miroir des records Java (dev.forthtilliath.bilan.*). Montants en euros, dates ISO AAAA-MM-JJ. */

export type AccountId = Brand<string, 'AccountId'>;
export type CategoryId = Brand<string, 'CategoryId'>;
export type TransactionId = Brand<string, 'TransactionId'>;
export type TransferId = Brand<string, 'TransferId'>;
export type AssetId = Brand<string, 'AssetId'>;
export type TradeId = Brand<string, 'TradeId'>;

/** Emplacement de la palette categorielle (1 a 8), couleur d'un compte ou d'une categorie. */
export type ColorSlot = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export const COLOR_SLOTS: readonly ColorSlot[] = [1, 2, 3, 4, 5, 6, 7, 8];

// ------------------------------------------------------------------ Comptes

export const ACCOUNT_TYPES = ['CHECKING', 'SAVINGS', 'BROKERAGE', 'CRYPTO', 'CASH'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CHECKING: 'Compte courant',
  SAVINGS: 'Épargne',
  BROKERAGE: 'Compte-titres / PEA',
  CRYPTO: 'Crypto',
  CASH: 'Espèces',
};

/** Comptes pouvant porter des titres. */
export function holdsAssets(type: AccountType): boolean {
  return type === 'BROKERAGE' || type === 'CRYPTO';
}

export interface Account {
  id: AccountId;
  name: string;
  type: AccountType;
  institution: string | null;
  openingBalance: number;
  openedOn: string;
  color: ColorSlot;
  archived: boolean;
  balance: number;
  cash: number;
  holdingsValue: number;
  change30d: number;
  transactionCount: number;
  /** Soldes des 12 dernieres fins de mois, le dernier = aujourd'hui. */
  trend: number[];
}

export interface AccountRequest {
  name: string;
  type: AccountType;
  institution: string | null;
  openingBalance: number;
  openedOn: string;
  color: ColorSlot;
  archived: boolean;
}

export interface SeriesPoint {
  date: string;
  value: number;
}

// ------------------------------------------------------------------ Categories

export type CategoryKind = 'INCOME' | 'EXPENSE';

export interface Category {
  id: CategoryId;
  name: string;
  kind: CategoryKind;
  color: ColorSlot;
  icon: string | null;
  monthlyBudget: number | null;
  currentMonth: number;
  monthlyAverage: number;
  transactionCount: number;
}

export interface CategoryRequest {
  name: string;
  kind: CategoryKind;
  color: ColorSlot;
  icon: string | null;
  monthlyBudget: number | null;
}

// ------------------------------------------------------------------ Operations

export type TransactionKind = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface Transaction {
  id: TransactionId;
  accountId: AccountId;
  accountName: string;
  accountColor: ColorSlot;
  categoryId: CategoryId | null;
  categoryName: string | null;
  categoryColor: ColorSlot | null;
  categoryIcon: string | null;
  bookedOn: string;
  /** Signe : negatif = sortie. */
  amount: number;
  label: string;
  note: string | null;
  transferId: TransferId | null;
  counterpartAccountId: AccountId | null;
  counterpartAccountName: string | null;
}

export interface TransactionPage {
  items: Transaction[];
  total: number;
  page: number;
  size: number;
  inflow: number;
  outflow: number;
}

export interface TransactionQuery {
  accountId?: AccountId | null;
  categoryId?: CategoryId | null;
  uncategorized?: boolean;
  kind?: TransactionKind | null;
  from?: string | null;
  to?: string | null;
  q?: string | null;
  page?: number;
  size?: number;
}

export interface TransactionRequest {
  accountId: AccountId;
  categoryId: CategoryId | null;
  bookedOn: string;
  amount: number;
  label: string;
  note: string | null;
}

export interface TransferRequest {
  fromAccountId: AccountId;
  toAccountId: AccountId;
  bookedOn: string;
  amount: number;
  label: string | null;
  note: string | null;
}

// ------------------------------------------------------------------ Investissements

export const ASSET_CLASSES = ['ETF', 'STOCK', 'BOND', 'CRYPTO'] as const;
export type AssetClass = (typeof ASSET_CLASSES)[number];

/** Libelles des classes d'actifs, plus la poche de liquidites des comptes d'investissement. */
export const ALLOCATION_LABELS: Record<AssetClass | 'CASH', string> = {
  ETF: 'ETF',
  STOCK: 'Actions',
  BOND: 'Obligations',
  CRYPTO: 'Crypto',
  CASH: 'Liquidités',
};

/** Couleur fixe par classe : elle suit l'entite, jamais son rang. */
export const ALLOCATION_COLORS: Record<AssetClass | 'CASH', ColorSlot> = {
  ETF: 1,
  STOCK: 2,
  BOND: 3,
  CRYPTO: 4,
  CASH: 5,
};

export interface Asset {
  id: AssetId;
  symbol: string;
  name: string;
  assetClass: AssetClass;
  price: number;
  priceDate: string;
  change1d: number | null;
  change1y: number | null;
  trend: number[];
}

export type TradeSide = 'BUY' | 'SELL';

export interface Trade {
  id: TradeId;
  accountId: AccountId;
  accountName: string;
  assetId: AssetId;
  symbol: string;
  assetName: string;
  assetClass: AssetClass;
  side: TradeSide;
  tradedOn: string;
  quantity: number;
  price: number;
  fees: number;
  cashFlow: number;
  realizedGain: number | null;
}

export interface TradeRequest {
  accountId: AccountId;
  assetId: AssetId;
  side: TradeSide;
  tradedOn: string;
  quantity: number;
  price: number;
  fees: number;
}

export interface Holding {
  assetId: AssetId;
  symbol: string;
  name: string;
  assetClass: AssetClass;
  quantity: number;
  averageCost: number;
  price: number;
  marketValue: number;
  costBasis: number;
  unrealizedGain: number;
  unrealizedPct: number | null;
  weight: number;
  change1d: number | null;
}

export interface Portfolio {
  totals: {
    value: number;
    marketValue: number;
    cash: number;
    costBasis: number;
    unrealizedGain: number;
    unrealizedPct: number | null;
    realizedGain: number;
    contributed: number;
    dayChange: number;
  };
  holdings: Holding[];
  allocation: { key: AssetClass | 'CASH'; value: number; weight: number }[];
  performance: { date: string; value: number; contributed: number }[];
}

// ------------------------------------------------------------------ Tableau de bord

export interface MonthFlow {
  /** AAAA-MM */
  month: string;
  income: number;
  expense: number;
  net: number;
}

export interface CategorySpending {
  categoryId: CategoryId | null;
  name: string;
  color: ColorSlot | null;
  icon: string | null;
  amount: number;
  budget: number | null;
}

export interface Dashboard {
  month: string;
  netWorth: { total: number; investments: number; change30d: number; change30dPct: number | null };
  current: MonthFlow;
  previous: MonthFlow;
  savingsRate: number | null;
  history: { date: string; total: number; investments: number }[];
  cashflow: MonthFlow[];
  spending: CategorySpending[];
  recent: Transaction[];
}

/** Erreur d'API au format ProblemDetail (RFC 9457), avec erreurs par champ. */
export interface ApiProblem {
  status: number;
  detail?: string;
  errors?: Record<string, string>;
}
