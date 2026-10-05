package dev.forthtilliath.bilan.demo;

import static dev.forthtilliath.bilan.demo.DemoBook.day;
import static dev.forthtilliath.bilan.demo.DemoCatalog.AccountKey.CHECKING;
import static dev.forthtilliath.bilan.demo.DemoCatalog.AccountKey.CRYPTO;
import static dev.forthtilliath.bilan.demo.DemoCatalog.AccountKey.PEA;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.Month;
import java.time.YearMonth;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import dev.forthtilliath.bilan.demo.DemoCatalog.AccountKey;
import dev.forthtilliath.bilan.demo.DemoCatalog.CategoryKey;
import dev.forthtilliath.bilan.investment.TradeSide;

/**
 * Investissement programme : versement apres la paie, investi debut du mois suivant sur le PEA (ETF monde en coeur, satellites en rotation,
 * deux ventes pour illustrer plus- et moins-value), dividendes annuels, et achat mensuel de crypto.
 * Les liquidites de chaque compte sont suivies pour ne jamais acheter a decouvert.
 */
final class InvestingPlan {

	private static final BigDecimal PEA_DEPOSIT = new BigDecimal("450.00");
	private static final BigDecimal CRYPTO_DEPOSIT = new BigDecimal("100.00");
	private static final List<String> SATELLITES = List.of("AURA", "VRDS", "NRDL", "OBLG", "AURA", "EMRG");
	private static final Map<String, BigDecimal> DIVIDENDS = Map.of("NRDL", new BigDecimal("1.35"), "VRDS",
			new BigDecimal("1.10"));

	private final DemoBook book;
	private final Map<AccountKey, BigDecimal> cash = new EnumMap<>(AccountKey.class);
	private final Map<String, BigDecimal> peaQuantities = new HashMap<>();

	InvestingPlan(DemoBook book, BigDecimal peaOpening, BigDecimal cryptoOpening) {
		this.book = book;
		cash.put(PEA, peaOpening);
		cash.put(CRYPTO, cryptoOpening);
	}

	void month(YearMonth month, int index) {
		pea(month, index);
		crypto(month);
	}

	private void pea(YearMonth month, int index) {
		LocalDate tradeDay = weekday(day(month, 4));
		if (index == 22) {
			sellShare("AURA", tradeDay, BigDecimal.ONE);
		}
		if (index == 20) {
			sellShare("NRDL", tradeDay, BigDecimal.ONE);
		}
		buyPea(target(index), tradeDay);
		if (month.getMonth() == Month.JUNE) {
			DIVIDENDS.forEach((symbol, perShare) -> {
				BigDecimal held = peaQuantities.getOrDefault(symbol, BigDecimal.ZERO);
				BigDecimal amount = held.multiply(perShare).setScale(2, RoundingMode.HALF_UP);
				if (amount.signum() > 0 && book.earn(PEA, day(month, 18), amount, "Dividende — " + symbol,
						CategoryKey.INTEREST)) {
					cash.merge(PEA, amount, BigDecimal::add);
				}
			});
		}
		if (book.transfer(CHECKING, PEA, EverydayLife.payday(month).plusDays(1), PEA_DEPOSIT, "Versement PEA")) {
			cash.merge(PEA, PEA_DEPOSIT, BigDecimal::add);
		}
	}

	/** ETF monde 2 mois sur 4, ETF regional 1 mois sur 4, une ligne « satellite » le 4e. */
	private static String target(int index) {
		return switch (index % 4) {
			case 0, 1 -> "MNDE";
			case 2 -> index % 8 == 2 ? "EURO" : "EMRG";
			default -> SATELLITES.get(index / 4 % SATELLITES.size());
		};
	}

	private void buyPea(String symbol, LocalDate date) {
		BigDecimal price = book.price(symbol, date);
		BigDecimal available = cash.get(PEA);
		BigDecimal quantity = available.divide(price, 0, RoundingMode.FLOOR);
		while (quantity.signum() > 0 && quantity.multiply(price).add(peaFees(quantity, price)).compareTo(available) > 0) {
			quantity = quantity.subtract(BigDecimal.ONE);
		}
		BigDecimal flow = book.trade(PEA, symbol, TradeSide.BUY, date, quantity, peaFees(quantity, price));
		if (flow.signum() != 0) {
			cash.merge(PEA, flow, BigDecimal::add);
			peaQuantities.merge(symbol, quantity, BigDecimal::add);
		}
	}

	private void sellShare(String symbol, LocalDate date, BigDecimal share) {
		BigDecimal held = peaQuantities.getOrDefault(symbol, BigDecimal.ZERO);
		BigDecimal quantity = held.multiply(share).setScale(0, RoundingMode.FLOOR);
		BigDecimal price = book.price(symbol, date);
		BigDecimal flow = book.trade(PEA, symbol, TradeSide.SELL, date, quantity, peaFees(quantity, price));
		if (flow.signum() != 0) {
			cash.merge(PEA, flow, BigDecimal::add);
			peaQuantities.merge(symbol, quantity.negate(), BigDecimal::add);
		}
	}

	/** Courtage : 0,25 % du montant, 1 EUR minimum. */
	private static BigDecimal peaFees(BigDecimal quantity, BigDecimal price) {
		BigDecimal fees = quantity.multiply(price).multiply(new BigDecimal("0.0025")).setScale(2, RoundingMode.HALF_UP);
		return fees.max(BigDecimal.ONE.setScale(2));
	}

	/** Achat en debut de mois (60 % bitcoin, 40 % ether, 0,5 % de frais), versement apres la paie. */
	private void crypto(YearMonth month) {
		LocalDate date = day(month, 6);
		BigDecimal budget = cash.get(CRYPTO);
		buyCrypto("BTC", date, budget.multiply(new BigDecimal("0.6")).setScale(2, RoundingMode.FLOOR));
		buyCrypto("ETH", date, cash.get(CRYPTO));
		if (book.transfer(CHECKING, CRYPTO, EverydayLife.payday(month).plusDays(2), CRYPTO_DEPOSIT,
				"Versement crypto")) {
			cash.merge(CRYPTO, CRYPTO_DEPOSIT, BigDecimal::add);
		}
	}

	private void buyCrypto(String symbol, LocalDate date, BigDecimal amount) {
		if (amount.compareTo(BigDecimal.TEN) < 0) {
			return;
		}
		BigDecimal fees = amount.multiply(new BigDecimal("0.005")).setScale(2, RoundingMode.CEILING);
		BigDecimal quantity = amount.subtract(fees).divide(book.price(symbol, date), 6, RoundingMode.FLOOR);
		cash.merge(CRYPTO, book.trade(CRYPTO, symbol, TradeSide.BUY, date, quantity, fees), BigDecimal::add);
	}

	private static LocalDate weekday(LocalDate date) {
		LocalDate day = date;
		while (day.getDayOfWeek() == DayOfWeek.SATURDAY || day.getDayOfWeek() == DayOfWeek.SUNDAY) {
			day = day.plusDays(1);
		}
		return day;
	}
}
