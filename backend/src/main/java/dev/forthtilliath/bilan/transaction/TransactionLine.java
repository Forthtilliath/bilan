package dev.forthtilliath.bilan.transaction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/** Projection legere d'une operation, pour les calculs de soldes et de flux (sans libelles). */
public record TransactionLine(UUID accountId, UUID categoryId, UUID transferId, LocalDate bookedOn, BigDecimal amount) {

	public boolean isTransfer() {
		return transferId != null;
	}

	/** Revenu ou depense « reels » : les virements internes ne sont ni l'un ni l'autre. */
	public boolean isIncome() {
		return !isTransfer() && amount.signum() > 0;
	}

	public boolean isExpense() {
		return !isTransfer() && amount.signum() < 0;
	}
}
