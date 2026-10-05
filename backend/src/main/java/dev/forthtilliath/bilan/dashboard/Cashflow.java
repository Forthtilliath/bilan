package dev.forthtilliath.bilan.dashboard;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import dev.forthtilliath.bilan.common.Money;
import dev.forthtilliath.bilan.dashboard.DashboardView.MonthFlow;
import dev.forthtilliath.bilan.transaction.TransactionLine;

/** Agregats de flux mensuels, purs (sans base) : revenus, depenses, et depenses par categorie. */
public final class Cashflow {

	private Cashflow() {
	}

	/** Les {@code count} mois se terminant par {@code last}, du plus ancien au plus recent. */
	public static List<MonthFlow> monthly(List<TransactionLine> lines, YearMonth last, int count) {
		YearMonth first = last.minusMonths(count - 1L);
		Map<YearMonth, BigDecimal[]> sums = new HashMap<>();
		for (TransactionLine line : lines) {
			YearMonth month = YearMonth.from(line.bookedOn());
			if (line.isTransfer() || month.isBefore(first) || month.isAfter(last)) {
				continue;
			}
			BigDecimal[] pair = sums.computeIfAbsent(month, m -> new BigDecimal[] { BigDecimal.ZERO, BigDecimal.ZERO });
			if (line.isIncome()) {
				pair[0] = pair[0].add(line.amount());
			} else {
				pair[1] = pair[1].add(line.amount().negate());
			}
		}
		List<MonthFlow> flows = new ArrayList<>(count);
		for (YearMonth month = first; !month.isAfter(last); month = month.plusMonths(1)) {
			BigDecimal[] pair = sums.getOrDefault(month, new BigDecimal[] { BigDecimal.ZERO, BigDecimal.ZERO });
			flows.add(new MonthFlow(month.toString(), Money.cents(pair[0]), Money.cents(pair[1]),
					Money.cents(pair[0].subtract(pair[1]))));
		}
		return flows;
	}

	/** Depenses du mois par categorie (valeurs positives). */
	public static Map<UUID, BigDecimal> expensesByCategory(List<TransactionLine> lines, YearMonth month) {
		Map<UUID, BigDecimal> byCategory = new HashMap<>();
		for (TransactionLine line : lines) {
			if (!line.isExpense() || !YearMonth.from(line.bookedOn()).equals(month)) {
				continue;
			}
			UUID key = line.categoryId() == null ? UNCATEGORIZED : line.categoryId();
			byCategory.merge(key, line.amount().negate(), BigDecimal::add);
		}
		return byCategory;
	}

	/** Cle de regroupement des depenses sans categorie. */
	public static final UUID UNCATEGORIZED = new UUID(0, 0);

	/** Taux d'epargne du mois en % : (revenus - depenses) / revenus ; null sans revenu. */
	public static BigDecimal savingsRate(MonthFlow flow) {
		if (flow.income().signum() == 0) {
			return null;
		}
		return Money.share(flow.net(), flow.income());
	}
}
