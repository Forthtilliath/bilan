package dev.forthtilliath.bilan.account.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import dev.forthtilliath.bilan.account.Account;
import dev.forthtilliath.bilan.account.AccountType;

/**
 * Compte valorise : {@code balance} = liquidites + positions au dernier cours.
 * {@code trend} : soldes de fin de mois sur un an (12 points, le dernier = aujourd'hui).
 */
public record AccountView(
		UUID id,
		String name,
		AccountType type,
		String institution,
		BigDecimal openingBalance,
		LocalDate openedOn,
		int color,
		boolean archived,
		BigDecimal balance,
		BigDecimal cash,
		BigDecimal holdingsValue,
		BigDecimal change30d,
		long transactionCount,
		List<BigDecimal> trend) {

	public static AccountView of(Account account, BigDecimal cash, BigDecimal holdings, BigDecimal change30d,
			long transactionCount, List<BigDecimal> trend) {
		return new AccountView(account.getId(), account.getName(), account.getType(), account.getInstitution(),
				account.getOpeningBalance(), account.getOpenedOn(), account.getColor(), account.isArchived(),
				cash.add(holdings), cash, holdings, change30d, transactionCount, trend);
	}
}
