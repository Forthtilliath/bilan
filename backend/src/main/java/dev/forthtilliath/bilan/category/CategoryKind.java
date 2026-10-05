package dev.forthtilliath.bilan.category;

import java.math.BigDecimal;

public enum CategoryKind {
	INCOME,
	EXPENSE;

	/** Une categorie de revenu n'accepte que des montants positifs, une de depense que des negatifs. */
	public boolean accepts(BigDecimal amount) {
		return this == INCOME ? amount.signum() > 0 : amount.signum() < 0;
	}
}
