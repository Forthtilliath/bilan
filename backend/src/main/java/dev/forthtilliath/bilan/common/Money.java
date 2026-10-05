package dev.forthtilliath.bilan.common;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Arrondis monetaires : les calculs gardent leur precision, seuls les resultats exposes passent au centime. */
public final class Money {

	public static final int SCALE = 2;

	private Money() {
	}

	public static BigDecimal cents(BigDecimal value) {
		return value == null ? BigDecimal.ZERO.setScale(SCALE) : value.setScale(SCALE, RoundingMode.HALF_UP);
	}

	/** Variation relative en pourcentage (2 decimales), ou {@code null} si la base est nulle. */
	public static BigDecimal percentChange(BigDecimal from, BigDecimal to) {
		if (from == null || from.signum() == 0) {
			return null;
		}
		return to.subtract(from).multiply(BigDecimal.valueOf(100)).divide(from.abs(), SCALE, RoundingMode.HALF_UP);
	}

	/** Part de {@code part} dans {@code total} en pourcentage (2 decimales), 0 si le total est nul. */
	public static BigDecimal share(BigDecimal part, BigDecimal total) {
		if (total == null || total.signum() == 0) {
			return BigDecimal.ZERO.setScale(SCALE);
		}
		return part.multiply(BigDecimal.valueOf(100)).divide(total, SCALE, RoundingMode.HALF_UP);
	}
}
