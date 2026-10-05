package dev.forthtilliath.bilan.investment.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import dev.forthtilliath.bilan.investment.AssetClass;

/** Titre avec son dernier cours, ses variations (en %) et une tendance de 12 fins de mois. */
public record AssetView(
		UUID id,
		String symbol,
		String name,
		AssetClass assetClass,
		BigDecimal price,
		LocalDate priceDate,
		BigDecimal change1d,
		BigDecimal change1y,
		List<BigDecimal> trend) {
}
