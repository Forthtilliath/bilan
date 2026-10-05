package dev.forthtilliath.bilan.demo;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;

import dev.forthtilliath.bilan.account.Account;
import dev.forthtilliath.bilan.category.Category;
import dev.forthtilliath.bilan.demo.DemoCatalog.AccountKey;
import dev.forthtilliath.bilan.demo.DemoCatalog.CategoryKey;
import dev.forthtilliath.bilan.investment.Asset;
import dev.forthtilliath.bilan.investment.PriceBook;
import dev.forthtilliath.bilan.investment.Trade;
import dev.forthtilliath.bilan.investment.TradeSide;
import dev.forthtilliath.bilan.transaction.Transaction;

/**
 * Carnet d'ecritures de la demo : les generateurs y deposent operations, virements et ordres.
 * Toute ecriture datee apres aujourd'hui ou avant l'ouverture du compte est ignoree (et signalee par {@code false}).
 */
final class DemoBook {

	final LocalDate today;
	final Random random;
	private final Map<AccountKey, Account> accounts;
	private final Map<CategoryKey, Category> categories;
	private final Map<String, Asset> assets;
	private final PriceBook prices;
	final List<Transaction> transactions = new ArrayList<>();
	final List<Trade> trades = new ArrayList<>();
	private long sequence;

	DemoBook(LocalDate today, Random random, Map<AccountKey, Account> accounts, Map<CategoryKey, Category> categories,
			Map<String, Asset> assets, PriceBook prices) {
		this.today = today;
		this.random = random;
		this.accounts = accounts;
		this.categories = categories;
		this.assets = assets;
		this.prices = prices;
	}

	boolean isOpen(AccountKey key, LocalDate date) {
		return !date.isAfter(today) && !date.isBefore(accounts.get(key).getOpenedOn());
	}

	boolean spend(AccountKey account, LocalDate date, BigDecimal amount, String label, CategoryKey category) {
		return record(account, date, amount.negate(), label, category);
	}

	boolean earn(AccountKey account, LocalDate date, BigDecimal amount, String label, CategoryKey category) {
		return record(account, date, amount, label, category);
	}

	boolean transfer(AccountKey from, AccountKey to, LocalDate date, BigDecimal amount, String label) {
		if (!isOpen(from, date) || !isOpen(to, date)) {
			return false;
		}
		UUID transferId = UUID.randomUUID();
		Transaction debit = add(from, date, amount.negate(),
				label != null ? label : "Virement vers " + accounts.get(to).getName());
		Transaction credit = add(to, date, amount,
				label != null ? label : "Virement depuis " + accounts.get(from).getName());
		debit.setTransferId(transferId);
		credit.setTransferId(transferId);
		return true;
	}

	/** Passe un ordre au cours de cloture du jour ; renvoie son effet sur les liquidites (0 si ignore). */
	BigDecimal trade(AccountKey account, String symbol, TradeSide side, LocalDate date, BigDecimal quantity,
			BigDecimal fees) {
		if (!isOpen(account, date) || quantity.signum() <= 0) {
			return BigDecimal.ZERO;
		}
		Trade trade = new Trade(accounts.get(account).getId(), assets.get(symbol).getId(), side, date, quantity,
				price(symbol, date), fees);
		trades.add(trade);
		return trade.toEvent().cashFlow();
	}

	BigDecimal price(String symbol, LocalDate date) {
		return prices.priceAt(assets.get(symbol).getId(), date);
	}

	/** Montant aleatoire au centime dans [min, max]. */
	BigDecimal amount(double min, double max) {
		return BigDecimal.valueOf(min + random.nextDouble() * (max - min)).setScale(2, RoundingMode.HALF_UP);
	}

	boolean chance(double probability) {
		return random.nextDouble() < probability;
	}

	int between(int min, int max) {
		return min + random.nextInt(max - min + 1);
	}

	/** Le jour {@code day} du mois, ramene au dernier jour pour les mois courts. */
	static LocalDate day(YearMonth month, int day) {
		return month.atDay(Math.min(day, month.lengthOfMonth()));
	}

	LocalDate randomDay(YearMonth month) {
		return day(month, between(1, month.lengthOfMonth()));
	}

	private boolean record(AccountKey account, LocalDate date, BigDecimal amount, String label, CategoryKey category) {
		if (!isOpen(account, date)) {
			return false;
		}
		add(account, date, amount, label).setCategoryId(category == null ? null : categories.get(category).getId());
		return true;
	}

	private Transaction add(AccountKey account, LocalDate date, BigDecimal amount, String label) {
		Transaction tx = new Transaction(accounts.get(account).getId(), date, amount, label);
		// Heure de saisie croissante : tri stable des operations d'un meme jour.
		tx.setCreatedAt(date.atTime(8, 0).toInstant(ZoneOffset.UTC).plusSeconds(sequence++));
		transactions.add(tx);
		return tx;
	}
}
