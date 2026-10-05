package dev.forthtilliath.bilan.demo;

import java.math.BigDecimal;
import java.util.List;

import dev.forthtilliath.bilan.account.AccountType;
import dev.forthtilliath.bilan.category.CategoryKind;
import dev.forthtilliath.bilan.investment.AssetClass;

/**
 * Decor de la demo : comptes, categories et titres fictifs (noms, enseignes et cours inventes).
 * {@code totalReturn} fixe la performance d'un titre sur toute la periode simulee : le hasard dessine
 * le chemin, pas l'arrivee, pour une histoire lisible et identique a chaque generation.
 */
final class DemoCatalog {

	private DemoCatalog() {
	}

	enum AccountKey {
		CHECKING, SAVINGS, PEA, CRYPTO, CASH
	}

	enum CategoryKey {
		HOUSING, GROCERIES, RESTAURANTS, TRANSPORT, LEISURE, HEALTH, SUBSCRIPTIONS, SHOPPING,
		SALARY, FREELANCE, INTEREST, REFUNDS
	}

	record AccountDef(AccountKey key, String name, AccountType type, String institution, String opening, int color,
			int openedAfterMonths) {
	}

	record CategoryDef(CategoryKey key, String name, CategoryKind kind, int color, String icon, String budget) {
	}

	record AssetDef(String symbol, String name, AssetClass assetClass, double start, double totalReturn,
			double volatility, long seed) {
	}

	static final List<AccountDef> ACCOUNTS = List.of(
			new AccountDef(AccountKey.CHECKING, "Compte courant", AccountType.CHECKING, "Banque Lumière", "2900.00", 1, 0),
			new AccountDef(AccountKey.SAVINGS, "Livret d'épargne", AccountType.SAVINGS, "Banque Lumière", "6500.00", 3, 0),
			new AccountDef(AccountKey.PEA, "PEA", AccountType.BROKERAGE, "Courtier Horizon", "500.00", 7, 0),
			new AccountDef(AccountKey.CRYPTO, "Portefeuille crypto", AccountType.CRYPTO, "Plateforme Orbit", "0.00", 2,
					6),
			new AccountDef(AccountKey.CASH, "Espèces", AccountType.CASH, null, "80.00", 4, 0));

	static final List<CategoryDef> CATEGORIES = List.of(
			new CategoryDef(CategoryKey.HOUSING, "Logement", CategoryKind.EXPENSE, 1, "home", "1050"),
			new CategoryDef(CategoryKey.GROCERIES, "Courses", CategoryKind.EXPENSE, 2, "cart", "450"),
			new CategoryDef(CategoryKey.RESTAURANTS, "Restaurants", CategoryKind.EXPENSE, 3, "utensils", "180"),
			new CategoryDef(CategoryKey.TRANSPORT, "Transports", CategoryKind.EXPENSE, 4, "train", "160"),
			new CategoryDef(CategoryKey.LEISURE, "Loisirs", CategoryKind.EXPENSE, 5, "ticket", "150"),
			new CategoryDef(CategoryKey.HEALTH, "Santé", CategoryKind.EXPENSE, 6, "heart", "90"),
			new CategoryDef(CategoryKey.SUBSCRIPTIONS, "Abonnements", CategoryKind.EXPENSE, 7, "repeat", "110"),
			new CategoryDef(CategoryKey.SHOPPING, "Shopping", CategoryKind.EXPENSE, 8, "bag", "180"),
			new CategoryDef(CategoryKey.SALARY, "Salaire", CategoryKind.INCOME, 1, "briefcase", null),
			new CategoryDef(CategoryKey.FREELANCE, "Freelance", CategoryKind.INCOME, 2, "laptop", null),
			new CategoryDef(CategoryKey.INTEREST, "Intérêts & dividendes", CategoryKind.INCOME, 3, "percent", null),
			new CategoryDef(CategoryKey.REFUNDS, "Remboursements", CategoryKind.INCOME, 4, "undo", null));

	static final List<AssetDef> ASSETS = List.of(
			new AssetDef("MNDE", "Monde Indiciel ETF", AssetClass.ETF, 96.40, 0.21, 0.14, 11),
			new AssetDef("EURO", "Europe 600 ETF", AssetClass.ETF, 48.15, 0.12, 0.15, 12),
			new AssetDef("EMRG", "Marchés Émergents ETF", AssetClass.ETF, 27.80, 0.05, 0.18, 13),
			new AssetDef("OBLG", "Obligations Euro Agrégées", AssetClass.BOND, 104.20, 0.03, 0.04, 14),
			new AssetDef("AURA", "Aurore Semi-conducteurs", AssetClass.STOCK, 145.00, 0.62, 0.36, 18),
			new AssetDef("NRDL", "Nordlys Énergie", AssetClass.STOCK, 38.20, -0.14, 0.26, 16),
			new AssetDef("VRDS", "Verdis Santé", AssetClass.STOCK, 72.60, 0.04, 0.22, 17),
			new AssetDef("BTC", "Bitcoin", AssetClass.CRYPTO, 41200.00, 0.78, 0.52, 18),
			new AssetDef("ETH", "Ether", AssetClass.CRYPTO, 2240.00, 0.18, 0.64, 19));

	static BigDecimal money(String value) {
		return value == null ? null : new BigDecimal(value);
	}
}
