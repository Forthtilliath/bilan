package dev.forthtilliath.bilan.account;

public enum AccountType {
	CHECKING,
	SAVINGS,
	BROKERAGE,
	CRYPTO,
	CASH;

	/** Comptes pouvant porter des titres : leur valeur = liquidites + positions valorisees. */
	public boolean holdsAssets() {
		return this == BROKERAGE || this == CRYPTO;
	}
}
