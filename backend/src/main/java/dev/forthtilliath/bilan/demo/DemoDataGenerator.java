package dev.forthtilliath.bilan.demo;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;

import dev.forthtilliath.bilan.account.Account;
import dev.forthtilliath.bilan.category.Category;
import dev.forthtilliath.bilan.demo.DemoCatalog.AccountDef;
import dev.forthtilliath.bilan.demo.DemoCatalog.AccountKey;
import dev.forthtilliath.bilan.demo.DemoCatalog.AssetDef;
import dev.forthtilliath.bilan.demo.DemoCatalog.CategoryDef;
import dev.forthtilliath.bilan.demo.DemoCatalog.CategoryKey;
import dev.forthtilliath.bilan.demo.PriceSimulator.Close;
import dev.forthtilliath.bilan.investment.Asset;
import dev.forthtilliath.bilan.investment.PriceBook;
import dev.forthtilliath.bilan.investment.Trade;
import dev.forthtilliath.bilan.transaction.Transaction;

/**
 * Genere {@value #MONTHS} mois d'historique se terminant aujourd'hui. Pur et deterministe (graine fixe) :
 * meme date du jour = memes donnees, seuls les identifiants changent.
 */
public final class DemoDataGenerator {

	static final int MONTHS = 24;
	private static final long SEED = 2026L;

	private DemoDataGenerator() {
	}

	public record PriceRow(UUID assetId, LocalDate date, BigDecimal close) {
	}

	public record DemoData(
			List<Account> accounts,
			List<Category> categories,
			List<Asset> assets,
			List<PriceRow> prices,
			List<Transaction> transactions,
			List<Trade> trades) {
	}

	public static DemoData generate(LocalDate today) {
		YearMonth firstMonth = YearMonth.from(today).minusMonths(MONTHS - 1L);
		LocalDate start = firstMonth.atDay(1);

		Map<AccountKey, Account> accounts = new EnumMap<>(AccountKey.class);
		for (AccountDef def : DemoCatalog.ACCOUNTS) {
			Account account = new Account(def.name(), def.type(), start.plusMonths(def.openedAfterMonths()));
			account.setInstitution(def.institution());
			account.setOpeningBalance(DemoCatalog.money(def.opening()));
			account.setColor(def.color());
			accounts.put(def.key(), account);
		}
		Map<CategoryKey, Category> categories = new EnumMap<>(CategoryKey.class);
		for (CategoryDef def : DemoCatalog.CATEGORIES) {
			Category category = new Category(def.name(), def.kind(), def.color());
			category.setIcon(def.icon());
			category.setMonthlyBudget(DemoCatalog.money(def.budget()));
			categories.put(def.key(), category);
		}

		Map<String, Asset> assets = new LinkedHashMap<>();
		List<PriceRow> prices = new ArrayList<>();
		PriceBook book = new PriceBook();
		for (AssetDef def : DemoCatalog.ASSETS) {
			Asset asset = new Asset(UUID.randomUUID(), def.symbol(), def.name(), def.assetClass());
			assets.put(def.symbol(), asset);
			for (Close close : PriceSimulator.simulate(def, start.minusDays(45), today)) {
				prices.add(new PriceRow(asset.getId(), close.date(), close.price()));
				book.put(asset.getId(), close.date(), close.price());
			}
		}

		DemoBook ledger = new DemoBook(today, new Random(SEED), accounts, categories, assets, book);
		EverydayLife life = new EverydayLife(ledger, accounts.get(AccountKey.CASH).getOpeningBalance());
		InvestingPlan plan = new InvestingPlan(ledger, accounts.get(AccountKey.PEA).getOpeningBalance(),
				accounts.get(AccountKey.CRYPTO).getOpeningBalance());
		for (int index = 0; index < MONTHS; index++) {
			YearMonth month = firstMonth.plusMonths(index);
			life.month(month, index);
			plan.month(month, index);
		}

		return new DemoData(List.copyOf(accounts.values()), List.copyOf(categories.values()),
				List.copyOf(assets.values()), prices, ledger.transactions, ledger.trades);
	}
}
