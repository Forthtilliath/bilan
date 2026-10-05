package dev.forthtilliath.bilan.dashboard;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import dev.forthtilliath.bilan.dashboard.DashboardView.MonthFlow;
import dev.forthtilliath.bilan.transaction.TransactionLine;

class CashflowTest {

	private static final UUID ACCOUNT = UUID.randomUUID();
	private static final UUID FOOD = UUID.randomUUID();
	private static final UUID TRANSFER = UUID.randomUUID();

	private static TransactionLine line(String date, String amount, UUID category, UUID transfer) {
		return new TransactionLine(ACCOUNT, category, transfer, LocalDate.parse(date), new BigDecimal(amount));
	}

	private static final List<TransactionLine> LINES = List.of(
			line("2026-01-28", "2000", null, null),
			line("2026-02-03", "-800", null, null),
			line("2026-02-10", "-45.20", FOOD, null),
			line("2026-02-12", "-30", FOOD, null),
			line("2026-02-28", "2100", null, null),
			line("2026-02-28", "-300", null, TRANSFER),
			line("2026-02-28", "300", null, TRANSFER));

	@Test
	void monthlyFlowsIgnoreTransfersAndFillEmptyMonths() {
		List<MonthFlow> flows = Cashflow.monthly(LINES, YearMonth.of(2026, 3), 3);

		assertThat(flows).extracting(MonthFlow::month).containsExactly("2026-01", "2026-02", "2026-03");
		assertThat(flows.get(1).income()).isEqualByComparingTo("2100");
		assertThat(flows.get(1).expense()).isEqualByComparingTo("875.20");
		assertThat(flows.get(1).net()).isEqualByComparingTo("1224.80");
		assertThat(flows.get(2).income()).isZero();
	}

	@Test
	void groupsExpensesByCategoryWithAnUncategorizedBucket() {
		var byCategory = Cashflow.expensesByCategory(LINES, YearMonth.of(2026, 2));

		assertThat(byCategory).containsOnlyKeys(FOOD, Cashflow.UNCATEGORIZED);
		assertThat(byCategory.get(FOOD)).isEqualByComparingTo("75.20");
		assertThat(byCategory.get(Cashflow.UNCATEGORIZED)).isEqualByComparingTo("800");
	}

	@Test
	void savingsRateIsNetOverIncome() {
		MonthFlow february = Cashflow.monthly(LINES, YearMonth.of(2026, 2), 1).getFirst();

		assertThat(Cashflow.savingsRate(february)).isEqualByComparingTo("58.32");
		assertThat(Cashflow.savingsRate(new MonthFlow("2026-03", BigDecimal.ZERO, BigDecimal.TEN, BigDecimal.TEN.negate())))
				.isNull();
	}
}
