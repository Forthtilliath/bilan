package dev.forthtilliath.bilan.dashboard;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import dev.forthtilliath.bilan.transaction.dto.TransactionView;

/**
 * Tableau de bord d'un mois : patrimoine (a date du jour), flux du mois et des 12 mois precedents,
 * depenses par categorie avec budgets, dernieres operations.
 */
public record DashboardView(
		String month,
		NetWorth netWorth,
		MonthFlow current,
		MonthFlow previous,
		BigDecimal savingsRate,
		List<WealthPoint> history,
		List<MonthFlow> cashflow,
		List<CategorySpending> spending,
		List<TransactionView> recent) {

	/** {@code investments} : part placee (comptes-titres et crypto, liquidites incluses). */
	public record NetWorth(BigDecimal total, BigDecimal investments, BigDecimal change30d, BigDecimal change30dPct) {
	}

	public record WealthPoint(LocalDate date, BigDecimal total, BigDecimal investments) {
	}

	/** Revenus et depenses (valeurs positives) hors virements internes. {@code month} au format AAAA-MM. */
	public record MonthFlow(String month, BigDecimal income, BigDecimal expense, BigDecimal net) {
	}

	/** Categorie de depense du mois. {@code categoryId} null = operations non categorisees. */
	public record CategorySpending(UUID categoryId, String name, Integer color, String icon, BigDecimal amount,
			BigDecimal budget) {
	}
}
