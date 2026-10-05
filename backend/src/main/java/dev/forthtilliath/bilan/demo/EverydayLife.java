package dev.forthtilliath.bilan.demo;

import static dev.forthtilliath.bilan.demo.DemoBook.day;
import static dev.forthtilliath.bilan.demo.DemoCatalog.AccountKey.CASH;
import static dev.forthtilliath.bilan.demo.DemoCatalog.AccountKey.CHECKING;
import static dev.forthtilliath.bilan.demo.DemoCatalog.AccountKey.SAVINGS;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.Month;
import java.time.YearMonth;
import java.util.List;

import dev.forthtilliath.bilan.demo.DemoCatalog.CategoryKey;

/**
 * Un mois de vie courante : salaire, charges fixes, courses, sorties, imprevus, epargne de precaution
 * et un peu d'especes. Les enseignes sont inventees.
 */
final class EverydayLife {

	private static final List<String> GROCERS = List.of("Marché du Cours", "Supérette Bio Les Halles",
			"Hyper Primeur", "Épicerie Fine Odette", "Fromagerie des Alpes");
	private static final List<String> RESTAURANTS = List.of("Le Bistrot d'Alice", "Sushi Kanpai", "Pizzeria Vesuvio",
			"Café des Arts", "Brasserie du Port", "Ramen Ichigo");
	private static final List<String> LEISURE = List.of("Cinéma Le Rex", "Librairie Page 42",
			"Salle d'escalade Bloc Up", "Concert — Le Hangar", "Musée des Confluences", "Bowling Strike");
	private static final List<String> SHOPS = List.of("Atelier Textile", "Maison & Déco", "Électro Plus",
			"Sport Évasion", "Cordonnerie Martin");

	private final DemoBook book;
	private BigDecimal cash;

	EverydayLife(DemoBook book, BigDecimal openingCash) {
		this.book = book;
		this.cash = openingCash;
	}

	void month(YearMonth month, int index) {
		if (index == 9) {
			book.spend(CHECKING, day(month, 14), new BigDecimal("1249.00"), "Ordinateur portable — Électro Plus",
					CategoryKey.SHOPPING);
		}
		income(month, index);
		fixedCharges(month);
		groceries(month);
		outings(month);
		occasional(month);
		savings(month);
		pocketMoney(month);
	}

	private void income(YearMonth month, int index) {
		BigDecimal salary = new BigDecimal(index < 12 ? "2850.00" : "2985.00");
		book.earn(CHECKING, payday(month), salary, "Salaire — Atelier Nord", CategoryKey.SALARY);
		if (month.getMonth() == Month.DECEMBER) {
			book.earn(CHECKING, day(month, 20), new BigDecimal("1200.00"), "Prime de fin d'année — Atelier Nord",
					CategoryKey.SALARY);
		}
		if (index % 3 == 1) {
			book.earn(CHECKING, day(month, book.between(10, 22)), book.amount(450, 980),
					"Mission freelance — Studio Prisme", CategoryKey.FREELANCE);
		}
		if (month.getMonth() == Month.JANUARY) {
			book.earn(SAVINGS, day(month, 1), book.amount(165, 230), "Intérêts annuels", CategoryKey.INTEREST);
		}
	}

	private void fixedCharges(YearMonth month) {
		book.spend(CHECKING, day(month, 3), new BigDecimal("890.00"), "Loyer — Résidence des Tilleuls",
				CategoryKey.HOUSING);
		book.spend(CHECKING, day(month, 6), new BigDecimal("16.80"), "Assurance habitation — Mutuelle Alpha",
				CategoryKey.HOUSING);
		boolean winter = month.getMonthValue() <= 3 || month.getMonthValue() >= 11;
		book.spend(CHECKING, day(month, 12), winter ? book.amount(84, 118) : book.amount(48, 66),
				"Électricité — Volta Énergie", CategoryKey.HOUSING);
		book.spend(CHECKING, day(month, 2), new BigDecimal("86.40"), "Pass transports — Métropole",
				CategoryKey.TRANSPORT);
		book.spend(CHECKING, day(month, 8), new BigDecimal("29.99"), "Box internet — Fibra", CategoryKey.SUBSCRIPTIONS);
		book.spend(CHECKING, day(month, 9), new BigDecimal("12.99"), "Forfait mobile — Lumo",
				CategoryKey.SUBSCRIPTIONS);
		book.spend(CHECKING, day(month, 15), new BigDecimal("13.49"), "StreamFlix", CategoryKey.SUBSCRIPTIONS);
		book.spend(CHECKING, day(month, 21), new BigDecimal("10.99"), "Sonora Premium", CategoryKey.SUBSCRIPTIONS);
		book.spend(CHECKING, day(month, 5), new BigDecimal("34.90"), "Salle de sport — Forme+", CategoryKey.SUBSCRIPTIONS);
		book.spend(CHECKING, day(month, 7), new BigDecimal("42.50"), "Complémentaire santé — Mutuelle Alpha",
				CategoryKey.HEALTH);
	}

	private void groceries(YearMonth month) {
		int count = book.between(7, 10);
		for (int i = 0; i < count; i++) {
			book.spend(CHECKING, book.randomDay(month), book.amount(14, 96), pick(GROCERS), CategoryKey.GROCERIES);
		}
	}

	private void outings(YearMonth month) {
		boolean summer = month.getMonth() == Month.JULY || month.getMonth() == Month.AUGUST;
		int meals = book.between(2, 4) + (summer ? 2 : 0);
		for (int i = 0; i < meals; i++) {
			book.spend(CHECKING, book.randomDay(month), book.amount(16, 62), pick(RESTAURANTS), CategoryKey.RESTAURANTS);
		}
		for (int i = book.between(1, 3); i > 0; i--) {
			book.spend(CHECKING, book.randomDay(month), book.amount(9, 48), pick(LEISURE), CategoryKey.LEISURE);
		}
		if (month.getMonth() == Month.AUGUST) {
			book.spend(CHECKING, day(month, 4), new BigDecimal("640.00"), "Location vacances — Gîte des Pins",
					CategoryKey.LEISURE);
			book.spend(CHECKING, day(month, 3), book.amount(95, 140), "Billets de train — Rail Express",
					CategoryKey.TRANSPORT);
		}
	}

	private void occasional(YearMonth month) {
		if (book.chance(0.45)) {
			book.spend(CHECKING, book.randomDay(month), book.amount(35, 110), "Billet de train — Rail Express",
					CategoryKey.TRANSPORT);
		}
		if (book.chance(0.55)) {
			book.spend(CHECKING, book.randomDay(month), book.amount(6, 32), "Pharmacie Centrale", CategoryKey.HEALTH);
		}
		if (book.chance(0.3)) {
			LocalDate visit = day(month, book.between(2, 20));
			book.spend(CHECKING, visit, new BigDecimal("30.00"), "Consultation — Dr Morel", CategoryKey.HEALTH);
			book.earn(CHECKING, visit.plusDays(5), new BigDecimal("20.00"), "Remboursement Assurance Maladie",
					CategoryKey.REFUNDS);
		}
		for (int i = book.between(0, 2); i > 0; i--) {
			book.spend(CHECKING, book.randomDay(month), book.amount(19, 160), pick(SHOPS), CategoryKey.SHOPPING);
		}
		if (month.getMonth() == Month.DECEMBER) {
			book.spend(CHECKING, day(month, book.between(10, 22)), book.amount(280, 380), "Cadeaux de Noël — Grand Bazar",
					CategoryKey.SHOPPING);
		}
	}

	private void savings(YearMonth month) {
		book.transfer(CHECKING, SAVINGS, payday(month).plusDays(1), new BigDecimal("300.00"), "Épargne mensuelle");
	}

	/** Retrait au distributeur un mois sur deux, puis petites depenses en liquide. */
	private void pocketMoney(YearMonth month) {
		LocalDate withdrawal = day(month, 2);
		if (month.getMonthValue() % 2 == 0 && book.transfer(CHECKING, CASH, withdrawal, new BigDecimal("60.00"),
				"Retrait distributeur")) {
			cash = cash.add(new BigDecimal("60.00"));
		}
		for (int i = 0; i < 2; i++) {
			BigDecimal amount = book.amount(3, 14);
			LocalDate date = day(month, book.between(4, 27));
			if (cash.compareTo(amount) >= 0
					&& book.spend(CASH, date, amount, i == 0 ? "Boulangerie du Coin" : "Marché — primeur",
							CategoryKey.GROCERIES)) {
				cash = cash.subtract(amount);
			}
		}
	}

	/** Salaire verse le 28, avance au vendredi si le 28 tombe un week-end. */
	static LocalDate payday(YearMonth month) {
		LocalDate date = day(month, 28);
		while (date.getDayOfWeek() == DayOfWeek.SATURDAY || date.getDayOfWeek() == DayOfWeek.SUNDAY) {
			date = date.minusDays(1);
		}
		return date;
	}

	private String pick(List<String> options) {
		return options.get(book.random.nextInt(options.size()));
	}
}
