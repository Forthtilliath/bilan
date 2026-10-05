package dev.forthtilliath.bilan.investment;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Predicate;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.forthtilliath.bilan.account.Account;
import dev.forthtilliath.bilan.common.Money;
import dev.forthtilliath.bilan.investment.dto.PortfolioView;
import dev.forthtilliath.bilan.investment.dto.PortfolioView.Holding;
import dev.forthtilliath.bilan.investment.dto.PortfolioView.PerformancePoint;
import dev.forthtilliath.bilan.investment.dto.PortfolioView.Slice;
import dev.forthtilliath.bilan.investment.dto.PortfolioView.Totals;
import dev.forthtilliath.bilan.investment.position.Position;
import dev.forthtilliath.bilan.transaction.TransactionLine;
import dev.forthtilliath.bilan.wealth.Ledger;
import dev.forthtilliath.bilan.wealth.LedgerLoader;
import dev.forthtilliath.bilan.wealth.SampleDates;
import dev.forthtilliath.bilan.wealth.WealthTimeline.Snapshot;

/** Synthese des comptes d'investissement, tous ou un seul. */
@Service
@Transactional(readOnly = true)
public class PortfolioService {

	private final LedgerLoader ledgers;

	public PortfolioService(LedgerLoader ledgers) {
		this.ledgers = ledgers;
	}

	public PortfolioView portfolio(UUID accountId) {
		Ledger ledger = ledgers.load();
		Predicate<UUID> investment = ledger.investmentAccounts();
		Predicate<UUID> scope = accountId == null ? investment : id -> id.equals(accountId) && investment.test(id);
		PriceBook prices = ledger.prices();

		Map<UUID, Position> positions = positionsByAsset(ledger, scope);
		Map<UUID, Asset> assets = ledger.assetsById();
		Snapshot now = ledger.timeline().at(ledger.today());
		BigDecimal cash = now.total(scope).subtract(now.holdings(scope));

		BigDecimal marketValue = BigDecimal.ZERO;
		BigDecimal costBasis = BigDecimal.ZERO;
		BigDecimal realized = BigDecimal.ZERO;
		BigDecimal dayChange = BigDecimal.ZERO;
		List<Holding> holdings = new ArrayList<>();
		for (var entry : positions.entrySet()) {
			Position position = entry.getValue();
			realized = realized.add(position.realizedGain());
			if (!position.isOpen()) {
				continue;
			}
			UUID assetId = entry.getKey();
			BigDecimal price = prices.latest(assetId);
			BigDecimal value = position.quantity().multiply(price);
			marketValue = marketValue.add(value);
			costBasis = costBasis.add(position.costBasis());
			dayChange = dayChange.add(position.quantity().multiply(price.subtract(prices.previousClose(assetId))));
			Asset asset = assets.get(assetId);
			holdings.add(new Holding(assetId, asset.getSymbol(), asset.getName(), asset.getAssetClass(),
					position.quantity().stripTrailingZeros(), Money.cents(position.averageCost()), price,
					Money.cents(value), Money.cents(position.costBasis()),
					Money.cents(value.subtract(position.costBasis())),
					Money.percentChange(position.costBasis(), value), null,
					Money.percentChange(prices.previousClose(assetId), price)));
		}
		BigDecimal total = Money.cents(marketValue).add(cash);
		holdings = holdings.stream()
				.map(h -> new Holding(h.assetId(), h.symbol(), h.name(), h.assetClass(), h.quantity(), h.averageCost(),
						h.price(), h.marketValue(), h.costBasis(), h.unrealizedGain(), h.unrealizedPct(),
						Money.share(h.marketValue(), total), h.change1d()))
				.sorted(Comparator.comparing(Holding::marketValue).reversed()).toList();

		List<PerformancePoint> performance = performance(ledger, scope);
		BigDecimal contributed = performance.isEmpty() ? BigDecimal.ZERO : performance.getLast().contributed();
		Totals totals = new Totals(total, Money.cents(marketValue), cash, Money.cents(costBasis),
				Money.cents(marketValue.subtract(costBasis)), Money.percentChange(costBasis, marketValue),
				Money.cents(realized), contributed, Money.cents(dayChange));
		return new PortfolioView(totals, holdings, allocation(holdings, cash, total), performance);
	}

	private static Map<UUID, Position> positionsByAsset(Ledger ledger, Predicate<UUID> scope) {
		Map<String, Position> byAccountAndAsset = new LinkedHashMap<>();
		Map<String, UUID> assetOf = new LinkedHashMap<>();
		for (Trade trade : ledger.trades()) {
			if (!scope.test(trade.getAccountId())) {
				continue;
			}
			String key = trade.getAccountId() + "/" + trade.getAssetId();
			byAccountAndAsset.compute(key,
					(k, position) -> (position == null ? Position.EMPTY : position).apply(trade.toEvent()));
			assetOf.put(key, trade.getAssetId());
		}
		Map<UUID, Position> byAsset = new LinkedHashMap<>();
		byAccountAndAsset.forEach((key, position) -> byAsset.merge(assetOf.get(key), position, Position::plus));
		return byAsset;
	}

	private static List<Slice> allocation(List<Holding> holdings, BigDecimal cash, BigDecimal total) {
		Map<String, BigDecimal> byClass = new LinkedHashMap<>();
		for (AssetClass assetClass : AssetClass.values()) {
			BigDecimal value = holdings.stream().filter(h -> h.assetClass() == assetClass).map(Holding::marketValue)
					.reduce(BigDecimal.ZERO, BigDecimal::add);
			if (value.signum() > 0) {
				byClass.put(assetClass.name(), value);
			}
		}
		if (cash.signum() > 0) {
			byClass.put("CASH", cash);
		}
		return byClass.entrySet().stream()
				.map(e -> new Slice(e.getKey(), e.getValue(), Money.share(e.getValue(), total))).toList();
	}

	/** Valeur hebdomadaire vs versements nets cumules, depuis l'ouverture du premier compte du perimetre. */
	private static List<PerformancePoint> performance(Ledger ledger, Predicate<UUID> scope) {
		List<Account> accounts = ledger.accounts().stream().filter(a -> scope.test(a.getId())).toList();
		if (accounts.isEmpty()) {
			return List.of();
		}
		LocalDate start = accounts.stream().map(Account::getOpenedOn).min(Comparator.naturalOrder()).orElseThrow();
		List<TransactionLine> flows = ledger.transactions().stream().filter(l -> scope.test(l.accountId()))
				.sorted(Comparator.comparing(TransactionLine::bookedOn)).toList();
		List<PerformancePoint> points = new ArrayList<>();
		int cursor = 0;
		BigDecimal flowSum = BigDecimal.ZERO;
		for (Snapshot snapshot : ledger.timeline().sample(SampleDates.weekly(start, ledger.today()))) {
			while (cursor < flows.size() && !flows.get(cursor).bookedOn().isAfter(snapshot.date())) {
				flowSum = flowSum.add(flows.get(cursor).amount());
				cursor++;
			}
			BigDecimal opening = accounts.stream().filter(a -> !snapshot.date().isBefore(a.getOpenedOn()))
					.map(Account::getOpeningBalance).reduce(BigDecimal.ZERO, BigDecimal::add);
			points.add(new PerformancePoint(snapshot.date(), snapshot.total(scope), Money.cents(opening.add(flowSum))));
		}
		return points;
	}
}
