package dev.forthtilliath.bilan.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.YearMonth;
import java.util.List;

import org.assertj.core.data.Offset;
import org.junit.jupiter.api.Test;

class DashboardApiTest extends ApiIntegrationTest {

	@Test
	void summarizesTheCurrentMonthAndTheWholeHistory() throws Exception {
		var dashboard = getJson("/api/dashboard").andExpect(status().isOk())
				.andExpect(jsonPath("$.month").value(YearMonth.from(today()).toString()))
				.andExpect(jsonPath("$.cashflow", hasSize(12)))
				.andExpect(jsonPath("$.history[-1].date").value(today().toString()))
				.andExpect(jsonPath("$.recent", hasSize(6)));

		double total = read(dashboard, "$.netWorth.total");
		double lastPoint = read(dashboard, "$.history[-1].total");
		assertThat(total).isCloseTo(lastPoint, Offset.offset(0.01));
		List<Double> spending = read(dashboard, "$.spending[*].amount");
		assertThat(spending).isSortedAccordingTo(java.util.Comparator.reverseOrder());
	}

	@Test
	void analysesAPastMonthWithItsSavingsRate() throws Exception {
		String month = YearMonth.from(today()).minusMonths(1).toString();
		var dashboard = getJson("/api/dashboard?month=" + month).andExpect(jsonPath("$.month").value(month))
				.andExpect(jsonPath("$.cashflow[-1].month").value(month));
		double income = read(dashboard, "$.current.income");
		double net = read(dashboard, "$.current.net");
		double rate = read(dashboard, "$.savingsRate");
		assertThat(rate).isCloseTo(net * 100 / income, Offset.offset(0.01));

		getJson("/api/dashboard?month=2026-13").andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors.month").exists());
	}

	@Test
	void categoriesAreUniquePerKindAndKeepTheirKindOnceUsed() throws Exception {
		postJson("/api/categories", """
				{"name": "courses", "kind": "EXPENSE", "color": 2, "icon": "cart"}""")
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors.name").exists());
		putJson("/api/categories/" + categoryId("Courses"), """
				{"name": "Courses", "kind": "INCOME", "color": 2}""")
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors.kind").exists());

		postJson("/api/categories", """
				{"name": "Animaux", "kind": "EXPENSE", "color": 5, "icon": "heart", "monthlyBudget": 40}""")
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.monthlyBudget").value(40.0))
				.andExpect(jsonPath("$.transactionCount").value(0));
		postJson("/api/categories", """
				{"name": "Primes", "kind": "INCOME", "color": 1, "monthlyBudget": 40}""")
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.monthlyBudget").doesNotExist());
	}

	@Test
	void theDemoResetIsThrottled() throws Exception {
		postJson("/api/demo/reset", "").andExpect(status().isNoContent());
		postJson("/api/demo/reset", "").andExpect(status().isTooManyRequests())
				.andExpect(header().exists("Retry-After"))
				.andExpect(jsonPath("$.detail").exists());
	}

	@Test
	void exposesOnlyTheHealthEndpoint() throws Exception {
		getJson("/actuator/health").andExpect(status().isOk()).andExpect(jsonPath("$.status").value("UP"));
		getJson("/actuator/env").andExpect(status().isNotFound());
	}
}
