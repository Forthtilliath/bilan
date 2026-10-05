package dev.forthtilliath.bilan.wealth;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import dev.forthtilliath.bilan.investment.PriceBook;
import dev.forthtilliath.bilan.wealth.WealthTimeline.AccountSeed;
import dev.forthtilliath.bilan.wealth.WealthTimeline.CashMovement;
import dev.forthtilliath.bilan.wealth.WealthTimeline.HoldingMovement;
import dev.forthtilliath.bilan.wealth.WealthTimeline.Snapshot;

class WealthTimelineTest {

	private static final UUID CHECKING = UUID.randomUUID();
	private static final UUID BROKER = UUID.randomUUID();
	private static final UUID ETF = UUID.randomUUID();
	private static final LocalDate JAN_1 = LocalDate.of(2026, 1, 1);

	private static BigDecimal eur(String value) {
		return new BigDecimal(value);
	}

	private WealthTimeline timeline() {
		PriceBook prices = new PriceBook();
		prices.put(ETF, JAN_1.plusDays(10), eur("100"));
		prices.put(ETF, JAN_1.plusDays(20), eur("120"));
		return new WealthTimeline(
				List.of(new AccountSeed(CHECKING, JAN_1, eur("1000")), new AccountSeed(BROKER, JAN_1.plusDays(5), eur("0"))),
				List.of(new CashMovement(CHECKING, JAN_1.plusDays(6), eur("-500")),
						new CashMovement(BROKER, JAN_1.plusDays(6), eur("500")),
						new CashMovement(BROKER, JAN_1.plusDays(10), eur("-401")),
						new CashMovement(CHECKING, JAN_1.plusDays(2), eur("-25.50"))),
				List.of(new HoldingMovement(BROKER, ETF, JAN_1.plusDays(10), eur("4"))),
				prices);
	}

	@Test
	void accountsAppearOnlyOnceOpened() {
		Snapshot snapshot = timeline().at(JAN_1.plusDays(3));

		assertThat(snapshot.accounts()).containsOnlyKeys(CHECKING);
		assertThat(snapshot.total()).isEqualByComparingTo("974.50");
	}

	@Test
	void valuesHoldingsAtTheLatestKnownClose() {
		List<Snapshot> snapshots = timeline().sample(List.of(JAN_1.plusDays(10), JAN_1.plusDays(15), JAN_1.plusDays(25)));

		assertThat(snapshots.get(0).account(BROKER).cash()).isEqualByComparingTo("99");
		assertThat(snapshots.get(0).account(BROKER).holdings()).isEqualByComparingTo("400");
		// Le 16, pas de cotation : dernier cours connu (100).
		assertThat(snapshots.get(1).account(BROKER).holdings()).isEqualByComparingTo("400");
		assertThat(snapshots.get(2).account(BROKER).holdings()).isEqualByComparingTo("480");
		assertThat(snapshots.get(2).total()).isEqualByComparingTo("1053.50");
	}

	@Test
	void transfersDoNotChangeNetWorth() {
		WealthTimeline timeline = timeline();

		assertThat(timeline.at(JAN_1.plusDays(5)).total()).isEqualByComparingTo(timeline.at(JAN_1.plusDays(6)).total());
	}

	@Test
	void samplesInChronologicalOrderWhateverTheInputOrder() {
		List<Snapshot> snapshots = timeline().sample(List.of(JAN_1.plusDays(25), JAN_1));

		assertThat(snapshots).extracting(Snapshot::date).containsExactly(JAN_1, JAN_1.plusDays(25));
	}

	@Test
	void weeklyDatesEndTodayAndStartAtTheFirstDay() {
		List<LocalDate> dates = SampleDates.weekly(JAN_1, JAN_1.plusDays(17));

		assertThat(dates).containsExactly(JAN_1, JAN_1.plusDays(3), JAN_1.plusDays(10), JAN_1.plusDays(17));
	}

	@Test
	void monthEndsFinishWithToday() {
		List<LocalDate> dates = SampleDates.monthEnds(LocalDate.of(2026, 3, 14), 3);

		assertThat(dates).containsExactly(LocalDate.of(2026, 1, 31), LocalDate.of(2026, 2, 28), LocalDate.of(2026, 3, 14));
	}
}
