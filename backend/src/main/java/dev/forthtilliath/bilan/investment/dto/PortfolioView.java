package dev.forthtilliath.bilan.investment.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import dev.forthtilliath.bilan.investment.AssetClass;

/** Synthese des comptes d'investissement : positions, repartition et performance dans le temps. */
public record PortfolioView(
		Totals totals,
		List<Holding> holdings,
		List<Slice> allocation,
		List<PerformancePoint> performance) {

	/**
	 * {@code value} = positions + liquidites ; {@code contributed} = versements nets (solde initial + virements recus).
	 * Plus-value latente en euros et en % du prix de revient.
	 */
	public record Totals(
			BigDecimal value,
			BigDecimal marketValue,
			BigDecimal cash,
			BigDecimal costBasis,
			BigDecimal unrealizedGain,
			BigDecimal unrealizedPct,
			BigDecimal realizedGain,
			BigDecimal contributed,
			BigDecimal dayChange) {
	}

	public record Holding(
			UUID assetId,
			String symbol,
			String name,
			AssetClass assetClass,
			BigDecimal quantity,
			BigDecimal averageCost,
			BigDecimal price,
			BigDecimal marketValue,
			BigDecimal costBasis,
			BigDecimal unrealizedGain,
			BigDecimal unrealizedPct,
			BigDecimal weight,
			BigDecimal change1d) {
	}

	/** Part de la valeur totale. {@code key} : une classe d'actif, ou {@code CASH} pour les liquidites. */
	public record Slice(String key, BigDecimal value, BigDecimal weight) {
	}

	public record PerformancePoint(LocalDate date, BigDecimal value, BigDecimal contributed) {
	}
}
