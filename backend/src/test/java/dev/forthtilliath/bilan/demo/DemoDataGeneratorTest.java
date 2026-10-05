package dev.forthtilliath.bilan.demo;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.junit.jupiter.api.Test;

import dev.forthtilliath.bilan.account.Account;
import dev.forthtilliath.bilan.demo.DemoDataGenerator.DemoData;
import dev.forthtilliath.bilan.investment.PriceBook;
import dev.forthtilliath.bilan.investment.TradeSide;
import dev.forthtilliath.bilan.investment.position.Position;
import dev.forthtilliath.bilan.transaction.Transaction;
import dev.forthtilliath.bilan.transaction.TransactionLine;
import dev.forthtilliath.bilan.wealth.LedgerLoader;
import dev.forthtilliath.bilan.wealth.SampleDates;
import dev.forthtilliath.bilan.wealth.WealthTimeline;

class DemoDataGeneratorTest {

	private static final LocalDate TODAY = LocalDate.of(2026, 10, 5);
	private final DemoData data = DemoDataGenerator.generate(TODAY);

	@Test
	void everyMovementIsDatedBetweenAccountOpeningAndToday() {
		Map<UUID, Account> accounts = data.accounts().stream()
				.collect(Collectors.toMap(Account::getId, Function.identity()));

		assertThat(data.transactions()).isNotEmpty().allSatisfy(tx -> {
			assertThat(tx.getBookedOn()).isBeforeOrEqualTo(TODAY);
			assertThat(tx.getBookedOn()).isAfterOrEqualTo(accounts.get(tx.getAccountId()).getOpenedOn());
		});
		assertThat(data.trades()).isNotEmpty().allSatisfy(trade -> {
			assertThat(trade.getTradedOn()).isBeforeOrEqualTo(TODAY);
			assertThat(accounts.get(trade.getAccountId()).getType().holdsAssets()).isTrue();
		});
	}

	@Test
	void transfersComeInBalancedPairs() {
		Map<UUID, List<Transaction>> legs = data.transactions().stream().filter(Transaction::isTransfer)
				.collect(Collectors.groupingBy(Transaction::getTransferId));

		assertThat(legs).isNotEmpty().allSatisfy((id, pair) -> {
			assertThat(pair).hasSize(2);
			assertThat(pair.get(0).getAmount().add(pair.get(1).getAmount())).isZero();
			assertThat(pair).allSatisfy(leg -> assertThat(leg.getCategoryId()).isNull());
		});
	}

	@Test
	void noPositionIsEverOversoldAndBothKindsOfRealizedResultExist() {
		Map<String, List<dev.forthtilliath.bilan.investment.Trade>> byPosition = data.trades().stream()
				.collect(Collectors.groupingBy(t -> t.getAccountId() + "/" + t.getAssetId()));

		BigDecimal[] realized = byPosition.values().stream()
				.map(trades -> Position.replay(trades.stream().map(t -> t.toEvent()).toList()).realizedGain())
				.filter(gain -> gain.signum() != 0).toArray(BigDecimal[]::new);
		assertThat(data.trades()).anyMatch(t -> t.getSide() == TradeSide.SELL);
		assertThat(realized).anyMatch(g -> g.signum() > 0).anyMatch(g -> g.signum() < 0);
	}

	@Test
	void noAccountEverHoldsNegativeCash() {
		PriceBook prices = new PriceBook();
		data.prices().forEach(p -> prices.put(p.assetId(), p.date(), p.close()));
		List<TransactionLine> lines = data.transactions().stream().map(t -> new TransactionLine(t.getAccountId(),
				t.getCategoryId(), t.getTransferId(), t.getBookedOn(), t.getAmount())).toList();
		WealthTimeline timeline = LedgerLoader.timeline(data.accounts(), lines, data.trades(), prices);
		LocalDate first = data.accounts().stream().map(Account::getOpenedOn).min(Comparator.naturalOrder()).orElseThrow();

		List<LocalDate> everyDay = first.datesUntil(TODAY.plusDays(1)).toList();
		assertThat(timeline.sample(everyDay)).allSatisfy(snapshot -> assertThat(snapshot.accounts().values())
				.allSatisfy(valuation -> assertThat(valuation.cash().signum()).isNotNegative()));
		assertThat(timeline.at(TODAY).total()).isGreaterThan(timeline.at(first).total());
		assertThat(SampleDates.weekly(first, TODAY)).last().isEqualTo(TODAY);
	}

	@Test
	void pricesReachEachAssetTargetReturn() {
		DemoCatalog.ASSETS.forEach(def -> {
			List<PriceSimulator.Close> closes = PriceSimulator.simulate(def, TODAY.minusYears(2), TODAY);
			double ratio = closes.getLast().price().doubleValue() / closes.getFirst().price().doubleValue();
			assertThat(ratio).isCloseTo(1 + def.totalReturn(), org.assertj.core.data.Offset.offset(0.001));
			assertThat(closes).allSatisfy(c -> assertThat(c.price()).isPositive());
		});
	}

	@Test
	void sameDayGivesSameStory() {
		DemoData again = DemoDataGenerator.generate(TODAY);

		assertThat(again.transactions()).hasSameSizeAs(data.transactions());
		assertThat(again.transactions()).extracting(Transaction::getAmount)
				.containsExactlyElementsOf(data.transactions().stream().map(Transaction::getAmount).toList());
	}
}
