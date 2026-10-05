package dev.forthtilliath.bilan.transaction.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Operation simple. Montant signe : negatif pour une depense, positif pour un revenu. */
public record TransactionRequest(
		@NotNull(message = "Choisissez un compte.") UUID accountId,
		UUID categoryId,
		@NotNull(message = "La date est obligatoire.") LocalDate bookedOn,
		@NotNull(message = "Le montant est obligatoire.")
		@Digits(integer = 12, fraction = 2, message = "Deux décimales au plus.") BigDecimal amount,
		@NotBlank(message = "Le libellé est obligatoire.") @Size(max = 140) String label,
		@Size(max = 500) String note) {
}
