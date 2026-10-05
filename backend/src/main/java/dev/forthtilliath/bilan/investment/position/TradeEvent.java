package dev.forthtilliath.bilan.investment.position;

import java.math.BigDecimal;
import java.time.LocalDate;

import dev.forthtilliath.bilan.investment.TradeSide;

/** Ordre reduit a ce qui compte pour le calcul de position, independant de JPA. */
public record TradeEvent(LocalDate date, TradeSide side, BigDecimal quantity, BigDecimal price, BigDecimal fees) {

	public BigDecimal gross() {
		return quantity.multiply(price);
	}

	/** Effet sur les liquidites du compte : un achat debite montant + frais, une vente credite montant - frais. */
	public BigDecimal cashFlow() {
		return side == TradeSide.BUY ? gross().add(fees).negate() : gross().subtract(fees);
	}

	/** Effet sur la quantite detenue. */
	public BigDecimal quantityDelta() {
		return side == TradeSide.BUY ? quantity : quantity.negate();
	}
}
