package dev.forthtilliath.bilan.transaction.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Operation prete a afficher : compte et categorie resolus.
 * Pour un virement, {@code counterpartAccountId} designe l'autre compte.
 */
public record TransactionView(
		UUID id,
		UUID accountId,
		String accountName,
		int accountColor,
		UUID categoryId,
		String categoryName,
		Integer categoryColor,
		String categoryIcon,
		LocalDate bookedOn,
		BigDecimal amount,
		String label,
		String note,
		UUID transferId,
		UUID counterpartAccountId,
		String counterpartAccountName) {
}
