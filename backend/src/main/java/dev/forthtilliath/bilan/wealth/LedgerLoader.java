package dev.forthtilliath.bilan.wealth;

import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import dev.forthtilliath.bilan.account.Account;
import dev.forthtilliath.bilan.account.AccountRepository;
import dev.forthtilliath.bilan.investment.Asset;
import dev.forthtilliath.bilan.investment.AssetRepository;
import dev.forthtilliath.bilan.investment.PriceBook;
import dev.forthtilliath.bilan.investment.Trade;
import dev.forthtilliath.bilan.investment.TradeRepository;
import dev.forthtilliath.bilan.transaction.TransactionLine;
import dev.forthtilliath.bilan.transaction.TransactionRepository;
import dev.forthtilliath.bilan.wealth.WealthTimeline.AccountSeed;
import dev.forthtilliath.bilan.wealth.WealthTimeline.CashMovement;
import dev.forthtilliath.bilan.wealth.WealthTimeline.HoldingMovement;

/** Charge le {@link Ledger} en 5 requetes : volumes d'un particulier, tout tient en memoire. */
@Component
public class LedgerLoader {

	private final AccountRepository accounts;
	private final TransactionRepository transactions;
	private final TradeRepository trades;
	private final AssetRepository assets;
	private final Clock clock;

	public LedgerLoader(AccountRepository accounts, TransactionRepository transactions, TradeRepository trades,
			AssetRepository assets, Clock clock) {
		this.accounts = accounts;
		this.transactions = transactions;
		this.trades = trades;
		this.assets = assets;
		this.clock = clock;
	}

	@Transactional(readOnly = true)
	public Ledger load() {
		List<Account> allAccounts = accounts.findAllByOrderByArchivedAscCreatedAtAsc();
		List<TransactionLine> lines = transactions.findAllLines();
		List<Trade> allTrades = trades.findAllByOrderByTradedOnAscCreatedAtAsc();
		List<Asset> allAssets = assets.findAllByOrderByAssetClassAscSymbolAsc();
		PriceBook prices = PriceBook.fromRows(assets.findAllPriceRows());
		return new Ledger(LocalDate.now(clock), allAccounts, lines, allTrades, allAssets, prices,
				timeline(allAccounts, lines, allTrades, prices));
	}

	public static WealthTimeline timeline(List<Account> accounts, List<TransactionLine> lines, List<Trade> trades,
			PriceBook prices) {
		List<AccountSeed> seeds = accounts.stream()
				.map(a -> new AccountSeed(a.getId(), a.getOpenedOn(), a.getOpeningBalance())).toList();
		var cash = new ArrayList<CashMovement>(lines.size() + trades.size());
		lines.forEach(l -> cash.add(new CashMovement(l.accountId(), l.bookedOn(), l.amount())));
		trades.forEach(t -> cash.add(new CashMovement(t.getAccountId(), t.getTradedOn(), t.toEvent().cashFlow())));
		List<HoldingMovement> holdings = trades.stream().map(t -> new HoldingMovement(t.getAccountId(),
				t.getAssetId(), t.getTradedOn(), t.toEvent().quantityDelta())).toList();
		return new WealthTimeline(seeds, cash, holdings, prices);
	}
}
