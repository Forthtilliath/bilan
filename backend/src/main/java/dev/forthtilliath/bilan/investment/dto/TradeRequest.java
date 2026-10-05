package dev.forthtilliath.bilan.investment.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import dev.forthtilliath.bilan.investment.TradeSide;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public record TradeRequest(
		@NotNull(message = "Choisissez un compte.") UUID accountId,
		@NotNull(message = "Choisissez un titre.") UUID assetId,
		@NotNull(message = "Achat ou vente ?") TradeSide side,
		@NotNull(message = "La date est obligatoire.")
		@PastOrPresent(message = "Un ordre ne peut pas être daté dans le futur.") LocalDate tradedOn,
		@NotNull(message = "La quantité est obligatoire.") @Positive(message = "La quantité doit être positive.")
		@Digits(integer = 10, fraction = 8, message = "Huit décimales au plus.") BigDecimal quantity,
		@NotNull(message = "Le prix est obligatoire.") @Positive(message = "Le prix doit être positif.")
		@Digits(integer = 12, fraction = 4, message = "Quatre décimales au plus.") BigDecimal price,
		@NotNull(message = "Les frais sont obligatoires (0 si aucun).")
		@PositiveOrZero(message = "Les frais ne peuvent pas être négatifs.")
		@Digits(integer = 8, fraction = 2, message = "Deux décimales au plus.") BigDecimal fees) {
}
