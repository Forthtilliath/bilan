package dev.forthtilliath.bilan.wealth;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Predicate;

import dev.forthtilliath.bilan.common.Money;
import dev.forthtilliath.bilan.investment.PriceBook;

/**
 * Rejoue les mouvements de liquidites et de titres de chaque compte pour le valoriser a n'importe quelle date :
 * valeur = solde initial + mouvements de liquidites + quantites detenues x cours du jour.
 * Les dates echantillonnees sont parcourues dans l'ordre, chaque mouvement n'est applique qu'une fois.
 */
public final class WealthTimeline {

	public record AccountSeed(UUID id, LocalDate openedOn, BigDecimal openingBalance) {
	}

	public record CashMovement(UUID accountId, LocalDate date, BigDecimal amount) {
	}

	public record HoldingMovement(UUID accountId, UUID assetId, LocalDate date, BigDecimal quantity) {
	}

	public record Valuation(BigDecimal cash, BigDecimal holdings) {

		public BigDecimal total() {
			return cash.add(holdings);
		}
	}

	public record Snapshot(LocalDate date, Map<UUID, Valuation> accounts) {

		public Valuation account(UUID accountId) {
			return accounts.getOrDefault(accountId, new Valuation(Money.cents(null), Money.cents(null)));
		}

		public BigDecimal total() {
			return total(id -> true);
		}

		public BigDecimal total(Predicate<UUID> accountFilter) {
			return accounts.entrySet().stream().filter(e -> accountFilter.test(e.getKey()))
					.map(e -> e.getValue().total()).reduce(Money.cents(null), BigDecimal::add);
		}

		public BigDecimal holdings(Predicate<UUID> accountFilter) {
			return accounts.entrySet().stream().filter(e -> accountFilter.test(e.getKey()))
					.map(e -> e.getValue().holdings()).reduce(Money.cents(null), BigDecimal::add);
		}
	}

	private final List<AccountSeed> accounts;
	private final List<CashMovement> cash;
	private final List<HoldingMovement> holdings;
	private final PriceBook prices;

	public WealthTimeline(List<AccountSeed> accounts, List<CashMovement> cash, List<HoldingMovement> holdings,
			PriceBook prices) {
		this.accounts = List.copyOf(accounts);
		this.cash = cash.stream().sorted(Comparator.comparing(CashMovement::date)).toList();
		this.holdings = holdings.stream().sorted(Comparator.comparing(HoldingMovement::date)).toList();
		this.prices = prices;
	}

	/** Valorise chaque compte a chacune des dates (triees au prealable). Un compte pas encore ouvert est absent. */
	public List<Snapshot> sample(List<LocalDate> dates) {
		Map<UUID, BigDecimal> cashByAccount = new HashMap<>();
		Map<UUID, Map<UUID, BigDecimal>> quantities = new HashMap<>();
		int cashCursor = 0;
		int holdingCursor = 0;
		List<Snapshot> snapshots = new ArrayList<>(dates.size());

		for (LocalDate date : dates.stream().sorted().toList()) {
			while (cashCursor < cash.size() && !cash.get(cashCursor).date().isAfter(date)) {
				CashMovement move = cash.get(cashCursor++);
				cashByAccount.merge(move.accountId(), move.amount(), BigDecimal::add);
			}
			while (holdingCursor < holdings.size() && !holdings.get(holdingCursor).date().isAfter(date)) {
				HoldingMovement move = holdings.get(holdingCursor++);
				quantities.computeIfAbsent(move.accountId(), id -> new HashMap<>())
						.merge(move.assetId(), move.quantity(), BigDecimal::add);
			}
			Map<UUID, Valuation> valuations = new LinkedHashMap<>();
			for (AccountSeed account : accounts) {
				if (date.isBefore(account.openedOn())) {
					continue;
				}
				BigDecimal balance = account.openingBalance().add(cashByAccount.getOrDefault(account.id(), BigDecimal.ZERO));
				BigDecimal value = quantities.getOrDefault(account.id(), Map.of()).entrySet().stream()
						.map(q -> q.getValue().multiply(prices.priceAt(q.getKey(), date)))
						.reduce(BigDecimal.ZERO, BigDecimal::add);
				valuations.put(account.id(), new Valuation(Money.cents(balance), Money.cents(value)));
			}
			snapshots.add(new Snapshot(date, valuations));
		}
		return snapshots;
	}

	public Snapshot at(LocalDate date) {
		return sample(List.of(date)).getFirst();
	}
}
