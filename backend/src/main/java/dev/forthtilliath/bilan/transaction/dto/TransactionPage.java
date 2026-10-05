package dev.forthtilliath.bilan.transaction.dto;

import java.math.BigDecimal;
import java.util.List;

/** Page de resultats + totaux calcules sur l'ensemble filtre. */
public record TransactionPage(
		List<TransactionView> items,
		long total,
		int page,
		int size,
		BigDecimal inflow,
		BigDecimal outflow) {
}
