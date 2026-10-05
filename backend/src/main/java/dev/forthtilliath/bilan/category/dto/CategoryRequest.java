package dev.forthtilliath.bilan.category.dto;

import java.math.BigDecimal;

import dev.forthtilliath.bilan.category.CategoryKind;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
		@NotBlank(message = "Le nom est obligatoire.") @Size(max = 60) String name,
		@NotNull(message = "Le type est obligatoire.") CategoryKind kind,
		@Min(1) @Max(8) int color,
		@Size(max = 20) String icon,
		@Positive(message = "Le budget doit être positif.")
		@Digits(integer = 10, fraction = 2, message = "Deux décimales au plus.") BigDecimal monthlyBudget) {
}
