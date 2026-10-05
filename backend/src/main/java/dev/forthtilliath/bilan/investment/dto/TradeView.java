package dev.forthtilliath.bilan.investment.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import dev.forthtilliath.bilan.investment.AssetClass;
import dev.forthtilliath.bilan.investment.TradeSide;

/**
 * Ordre pret a afficher. {@code cashFlow} : effet signe sur les liquidites du compte.
 * {@code realizedGain} : plus- ou moins-value degagee par une vente (null pour un achat).
 */
public record TradeView(
		UUID id,
		UUID accountId,
		String accountName,
		UUID assetId,
		String symbol,
		String assetName,
		AssetClass assetClass,
		TradeSide side,
		LocalDate tradedOn,
		BigDecimal quantity,
		BigDecimal price,
		BigDecimal fees,
		BigDecimal cashFlow,
		BigDecimal realizedGain) {
}
