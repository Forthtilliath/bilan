package dev.forthtilliath.bilan.investment;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.forthtilliath.bilan.account.Account;
import dev.forthtilliath.bilan.common.FieldErrorsException;
import dev.forthtilliath.bilan.common.Money;
import dev.forthtilliath.bilan.common.NotFoundException;
import dev.forthtilliath.bilan.investment.dto.TradeRequest;
import dev.forthtilliath.bilan.investment.dto.TradeView;
import dev.forthtilliath.bilan.investment.position.OversellException;
import dev.forthtilliath.bilan.investment.position.Position;
import dev.forthtilliath.bilan.investment.position.TradeEvent;
import dev.forthtilliath.bilan.wealth.Ledger;
import dev.forthtilliath.bilan.wealth.LedgerLoader;

/** Ordres de bourse : saisie controlee (pas de vente a decouvert, pas de liquidites negatives) et historique. */
@Service
@Transactional
public class TradeService {

	private static final DateTimeFormatter FR_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
	private static final Comparator<Trade> CHRONOLOGICAL = Comparator.comparing(Trade::getTradedOn)
			.thenComparing(t -> t.getCreatedAt() == null ? Instant.MAX : t.getCreatedAt());

	private final TradeRepository trades;
	private final LedgerLoader ledgers;

	public TradeService(TradeRepository trades, LedgerLoader ledgers) {
		this.trades = trades;
		this.ledgers = ledgers;
	}

	/** Historique (plus recent d'abord), filtrable par compte et par titre, avec la plus-value de chaque vente. */
	@Transactional(readOnly = true)
	public List<TradeView> list(UUID accountId, UUID assetId) {
		Ledger ledger = ledgers.load();
		Map<UUID, Account> accounts = ledger.accountsById();
		Map<UUID, Asset> assets = ledger.assetsById();
		Map<String, Position> running = new HashMap<>();
		List<TradeView> views = new ArrayList<>();
		for (Trade trade : ledger.trades()) {
			String key = trade.getAccountId() + "/" + trade.getAssetId();
			Position before = running.getOrDefault(key, Position.EMPTY);
			Position after = before.apply(trade.toEvent());
			running.put(key, after);
			if ((accountId == null || accountId.equals(trade.getAccountId()))
					&& (assetId == null || assetId.equals(trade.getAssetId()))) {
				BigDecimal realized = trade.getSide() == TradeSide.SELL
						? Money.cents(after.realizedGain().subtract(before.realizedGain()))
						: null;
				views.add(view(trade, accounts.get(trade.getAccountId()), assets.get(trade.getAssetId()), realized));
			}
		}
		return views.reversed();
	}

	public TradeView create(TradeRequest request) {
		Ledger ledger = ledgers.load();
		Account account = ledger.accountsById().get(request.accountId());
		Asset asset = ledger.assetsById().get(request.assetId());
		Map<String, String> errors = new LinkedHashMap<>();
		if (account == null || !account.getType().holdsAssets()) {
			errors.put("accountId", "Choisissez un compte d'investissement (compte-titres, PEA, crypto).");
		} else if (request.tradedOn().isBefore(account.getOpenedOn())) {
			errors.put("tradedOn", "Date antérieure à l'ouverture du compte (" + FR_DATE.format(account.getOpenedOn())
					+ ").");
		}
		if (asset == null) {
			errors.put("assetId", "Titre introuvable.");
		}
		if (!errors.isEmpty()) {
			throw new FieldErrorsException("Ordre invalide.", errors);
		}
		Trade trade = new Trade(account.getId(), asset.getId(), request.side(), request.tradedOn(),
				request.quantity(), request.price(), request.fees());
		List<Trade> next = new ArrayList<>(ledger.trades());
		next.add(trade);
		checkPositions(next, account.getId(), asset, "quantity");
		checkCash(ledger, next, account, trade);
		Trade saved = trades.saveAndFlush(trade);
		return list(saved.getAccountId(), saved.getAssetId()).stream().filter(v -> v.id().equals(saved.getId()))
				.findFirst().orElseThrow();
	}

	/** Refuse la suppression d'un achat dont une vente ulterieure depend. */
	public void delete(UUID id) {
		Trade trade = trades.findById(id).orElseThrow(() -> new NotFoundException("Ordre introuvable."));
		Ledger ledger = ledgers.load();
		List<Trade> remaining = ledger.trades().stream().filter(t -> !t.getId().equals(id)).toList();
		checkPositions(remaining, trade.getAccountId(), ledger.assetsById().get(trade.getAssetId()), "id");
		trades.delete(trade);
	}

	private static void checkPositions(List<Trade> all, UUID accountId, Asset asset, String field) {
		List<TradeEvent> events = all.stream()
				.filter(t -> t.getAccountId().equals(accountId) && t.getAssetId().equals(asset.getId()))
				.sorted(CHRONOLOGICAL).map(Trade::toEvent).toList();
		try {
			Position.replay(events);
		} catch (OversellException ex) {
			throw FieldErrorsException.of(field, "Position insuffisante : " + ex.getHeld().stripTrailingZeros()
					.toPlainString() + " " + asset.getSymbol() + " détenu(s) le " + FR_DATE.format(ex.getDate()) + ".", ex);
		}
	}

	/** Les liquidites du compte doivent rester positives le jour de l'ordre et aujourd'hui. */
	private static void checkCash(Ledger ledger, List<Trade> next, Account account, Trade trade) {
		if (trade.getSide() == TradeSide.SELL) {
			return;
		}
		var timeline = LedgerLoader.timeline(ledger.accounts(), ledger.transactions(), next, ledger.prices());
		for (var date : List.of(trade.getTradedOn(), ledger.today())) {
			BigDecimal cash = timeline.at(date).account(account.getId()).cash();
			if (cash.signum() < 0) {
				BigDecimal available = cash.subtract(trade.toEvent().cashFlow());
				throw FieldErrorsException.of("quantity", "Liquidités insuffisantes sur « " + account.getName()
						+ " » : " + Money.cents(available).toPlainString() + " € disponibles le "
						+ FR_DATE.format(date) + ".");
			}
		}
	}

	private static TradeView view(Trade trade, Account account, Asset asset, BigDecimal realized) {
		return new TradeView(trade.getId(), trade.getAccountId(), account == null ? "?" : account.getName(),
				trade.getAssetId(), asset.getSymbol(), asset.getName(), asset.getAssetClass(), trade.getSide(),
				trade.getTradedOn(), trade.getQuantity(), trade.getPrice(), trade.getFees(),
				Money.cents(trade.toEvent().cashFlow()), realized);
	}
}
