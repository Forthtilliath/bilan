package dev.forthtilliath.bilan.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.assertj.core.data.Offset;
import org.junit.jupiter.api.Test;

class InvestmentsApiTest extends ApiIntegrationTest {

	private static final String TRADE = """
			{"accountId": "%s", "assetId": "%s", "side": "%s", "tradedOn": "%s", "quantity": %s, "price": %s,
			 "fees": %s}""";

	@Test
	void portfolioTotalsAddUp() throws Exception {
		var portfolio = getJson("/api/portfolio").andExpect(status().isOk());
		double value = read(portfolio, "$.totals.value");
		double marketValue = read(portfolio, "$.totals.marketValue");
		double cash = read(portfolio, "$.totals.cash");
		List<Double> holdings = read(portfolio, "$.holdings[*].marketValue");
		List<Double> weights = read(portfolio, "$.allocation[*].weight");

		assertThat(value).isCloseTo(marketValue + cash, Offset.offset(0.01));
		assertThat(holdings.stream().mapToDouble(Double::doubleValue).sum()).isCloseTo(marketValue, Offset.offset(0.05));
		assertThat(weights.stream().mapToDouble(Double::doubleValue).sum()).isCloseTo(100, Offset.offset(0.1));
		assertThat(holdings).isSortedAccordingTo(java.util.Comparator.reverseOrder());
		double realized = read(portfolio, "$.totals.realizedGain");
		assertThat(realized).isNotZero();
	}

	@Test
	void aRoundTripOnANewLineRealizesTheGainNetOfFees() throws Exception {
		String pea = accountId("PEA");
		String aura = assetId("AURA");
		postJson("/api/transfers", """
				{"fromAccountId": "%s", "toAccountId": "%s", "bookedOn": "%s", "amount": 1000}"""
				.formatted(accountId("Compte courant"), pea, today()))
				.andExpect(status().isCreated());

		var buy = postJson("/api/trades", TRADE.formatted(pea, aura, "BUY", today(), "2", "200", "1"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.cashFlow").value(-401.0))
				.andExpect(jsonPath("$.realizedGain").doesNotExist());
		postJson("/api/trades", TRADE.formatted(pea, aura, "SELL", today(), "2", "230", "1"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.realizedGain").value(58.0));

		// L'achat ne peut plus disparaitre : la vente qui en depend deviendrait une vente a decouvert.
		deleteAt("/api/trades/" + read(buy, "$.id")).andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors.id").value(containsString("Position insuffisante")));
	}

	@Test
	void refusesToSellMoreThanHeldOrToBuyWithoutCash() throws Exception {
		String pea = accountId("PEA");
		postJson("/api/trades", TRADE.formatted(pea, assetId("MNDE"), "SELL", today(), "100000", "100", "0"))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors.quantity").value(containsString("Position insuffisante")));
		postJson("/api/trades", TRADE.formatted(pea, assetId("MNDE"), "BUY", today(), "1000", "100", "1"))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors.quantity").value(containsString("Liquidités insuffisantes")));
	}

	@Test
	void tradesOnlyHappenOnInvestmentAccounts() throws Exception {
		postJson("/api/trades", TRADE.formatted(accountId("Compte courant"), assetId("MNDE"), "BUY",
				today(), "1", "100", "0"))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors.accountId").exists());
		postJson("/api/trades", TRADE.formatted(accountId("PEA"), assetId("MNDE"), "BUY",
				today().plusDays(2), "-1", "100", "0"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.quantity").value("La quantité doit être positive."))
				.andExpect(jsonPath("$.errors.tradedOn").exists());
	}

	@Test
	void exposesDailyPricesUpToToday() throws Exception {
		String btc = assetId("BTC");
		var prices = getJson("/api/assets/" + btc + "/prices").andExpect(status().isOk());
		List<String> dates = read(prices, "$[*].date");
		assertThat(dates).isSorted().hasSizeGreaterThan(700).last().isEqualTo(today().toString());
		getJson("/api/assets/" + btc).andExpect(jsonPath("$.trend.length()").value(12));
		getJson("/api/assets/00000000-0000-0000-0000-000000000000/prices").andExpect(status().isNotFound());
	}

	@Test
	void filtersThePortfolioAndTradesByAccount() throws Exception {
		String crypto = accountId("Portefeuille crypto");
		var portfolio = getJson("/api/portfolio?accountId=" + crypto);
		List<String> classes = read(portfolio, "$.holdings[*].assetClass");
		assertThat(classes).isNotEmpty().containsOnly("CRYPTO");
		List<String> accounts = read(getJson("/api/trades?accountId=" + crypto), "$[*].accountName");
		assertThat(accounts).isNotEmpty().containsOnly("Portefeuille crypto");
	}
}
