package dev.forthtilliath.bilan.account.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import dev.forthtilliath.bilan.account.AccountType;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

public record AccountRequest(
		@NotBlank(message = "Le nom est obligatoire.") @Size(max = 80) String name,
		@NotNull(message = "Le type est obligatoire.") AccountType type,
		@Size(max = 80) String institution,
		@NotNull(message = "Le solde initial est obligatoire.")
		@Digits(integer = 12, fraction = 2, message = "Deux décimales au plus.") BigDecimal openingBalance,
		@NotNull(message = "La date d'ouverture est obligatoire.")
		@PastOrPresent(message = "La date d'ouverture ne peut pas être dans le futur.") LocalDate openedOn,
		@Min(1) @Max(8) int color,
		boolean archived) {
}
