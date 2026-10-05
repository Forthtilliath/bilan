package dev.forthtilliath.bilan.wealth;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import dev.forthtilliath.bilan.account.Account;
import dev.forthtilliath.bilan.investment.Asset;
import dev.forthtilliath.bilan.investment.PriceBook;
import dev.forthtilliath.bilan.investment.Trade;
import dev.forthtilliath.bilan.transaction.TransactionLine;

/**
 * Photo complete des donnees financieres, chargee en memoire pour une requete :
 * comptes, operations, ordres, titres et cours, plus la chronologie de valorisation qui en decoule.
 */
public record Ledger(
		LocalDate today,
		List<Account> accounts,
		List<TransactionLine> transactions,
		List<Trade> trades,
		List<Asset> assets,
		PriceBook prices,
		WealthTimeline timeline) {

	public Map<UUID, Account> accountsById() {
		return accounts.stream().collect(Collectors.toMap(Account::getId, Function.identity()));
	}

	public Map<UUID, Asset> assetsById() {
		return assets.stream().collect(Collectors.toMap(Asset::getId, Function.identity()));
	}

	public Predicate<UUID> investmentAccounts() {
		Map<UUID, Account> byId = accountsById();
		return id -> byId.containsKey(id) && byId.get(id).getType().holdsAssets();
	}

	/** Date la plus ancienne a partir de laquelle une serie a du sens (premiere ouverture de compte). */
	public LocalDate firstDay() {
		return accounts.stream().map(Account::getOpenedOn).min(Comparator.naturalOrder()).orElse(today);
	}
}
