package dev.forthtilliath.bilan.category.dto;

import java.math.BigDecimal;
import java.util.UUID;

import dev.forthtilliath.bilan.category.Category;
import dev.forthtilliath.bilan.category.CategoryKind;

/** Categorie avec le montant du mois courant (valeur absolue) et le nombre total d'operations. */
public record CategoryView(
		UUID id,
		String name,
		CategoryKind kind,
		int color,
		String icon,
		BigDecimal monthlyBudget,
		BigDecimal currentMonth,
		BigDecimal monthlyAverage,
		long transactionCount) {

	public static CategoryView of(Category category, BigDecimal currentMonth, BigDecimal monthlyAverage,
			long transactionCount) {
		return new CategoryView(category.getId(), category.getName(), category.getKind(), category.getColor(),
				category.getIcon(), category.getMonthlyBudget(), currentMonth, monthlyAverage, transactionCount);
	}
}
