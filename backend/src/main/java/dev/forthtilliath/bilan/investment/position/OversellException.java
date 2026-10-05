package dev.forthtilliath.bilan.investment.position;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Vente d'une quantite superieure a celle detenue a cette date. */
public class OversellException extends RuntimeException {

	private final LocalDate date;
	private final BigDecimal held;

	public OversellException(LocalDate date, BigDecimal held, BigDecimal sold) {
		super("Vente de " + sold.stripTrailingZeros().toPlainString() + " le " + date + " pour "
				+ held.stripTrailingZeros().toPlainString() + " detenu(s).");
		this.date = date;
		this.held = held;
	}

	public LocalDate getDate() {
		return date;
	}

	public BigDecimal getHeld() {
		return held;
	}
}
