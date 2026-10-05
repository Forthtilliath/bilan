package dev.forthtilliath.bilan.investment.position;

import java.math.BigDecimal;
import java.math.MathContext;
import java.util.List;

import dev.forthtilliath.bilan.investment.TradeSide;

/**
 * Position sur un titre, methode du cout moyen pondere (PRU, frais d'achat inclus) :
 * une vente sort du prix de revient au prorata de la quantite vendue, la difference avec le produit net
 * (montant - frais) est la plus-value realisee.
 */
public record Position(BigDecimal quantity, BigDecimal costBasis, BigDecimal realizedGain) {

	public static final Position EMPTY = new Position(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);

	public static Position replay(List<TradeEvent> events) {
		Position position = EMPTY;
		for (TradeEvent event : events) {
			position = position.apply(event);
		}
		return position;
	}

	public Position apply(TradeEvent event) {
		if (event.side() == TradeSide.BUY) {
			return new Position(quantity.add(event.quantity()), costBasis.add(event.gross()).add(event.fees()),
					realizedGain);
		}
		if (event.quantity().compareTo(quantity) > 0) {
			throw new OversellException(event.date(), quantity, event.quantity());
		}
		boolean closes = event.quantity().compareTo(quantity) == 0;
		BigDecimal costOut = closes ? costBasis
				: costBasis.multiply(event.quantity()).divide(quantity, MathContext.DECIMAL64);
		BigDecimal proceeds = event.gross().subtract(event.fees());
		return new Position(closes ? BigDecimal.ZERO : quantity.subtract(event.quantity()),
				closes ? BigDecimal.ZERO : costBasis.subtract(costOut), realizedGain.add(proceeds).subtract(costOut));
	}

	public boolean isOpen() {
		return quantity.signum() > 0;
	}

	/** Prix de revient unitaire, 0 pour une position soldee. */
	public BigDecimal averageCost() {
		return isOpen() ? costBasis.divide(quantity, MathContext.DECIMAL64) : BigDecimal.ZERO;
	}

	public Position plus(Position other) {
		return new Position(quantity.add(other.quantity), costBasis.add(other.costBasis),
				realizedGain.add(other.realizedGain));
	}
}
