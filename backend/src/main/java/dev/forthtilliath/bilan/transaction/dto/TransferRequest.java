package dev.forthtilliath.bilan.transaction.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/** Virement interne : debite {@code fromAccountId}, credite {@code toAccountId} du meme montant (positif). */
public record TransferRequest(
		@NotNull(message = "Choisissez le compte à débiter.") UUID fromAccountId,
		@NotNull(message = "Choisissez le compte à créditer.") UUID toAccountId,
		@NotNull(message = "La date est obligatoire.") LocalDate bookedOn,
		@NotNull(message = "Le montant est obligatoire.") @Positive(message = "Le montant doit être positif.")
		@Digits(integer = 12, fraction = 2, message = "Deux décimales au plus.") BigDecimal amount,
		@Size(max = 140) String label,
		@Size(max = 500) String note) {
}
