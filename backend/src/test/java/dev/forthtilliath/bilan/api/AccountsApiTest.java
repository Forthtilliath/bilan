package dev.forthtilliath.bilan.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;

class AccountsApiTest extends ApiIntegrationTest {

	private static final String NEW_ACCOUNT = """
			{"name": "Livret jeune", "type": "SAVINGS", "institution": "Banque Test",
			 "openingBalance": 150.00, "openedOn": "%s", "color": 6, "archived": false}""";

	@Test
	void listsTheSeededAccountsWithAConsistentValuation() throws Exception {
		var result = getJson("/api/accounts").andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(5)));

		List<Double> balances = read(result, "$[*].balance");
		List<Double> cash = read(result, "$[*].cash");
		List<Double> holdings = read(result, "$[*].holdingsValue");
		for (int i = 0; i < balances.size(); i++) {
			assertThat(balances.get(i)).isCloseTo(cash.get(i) + holdings.get(i), org.assertj.core.data.Offset.offset(0.01));
		}
		List<List<Double>> trends = read(result, "$[*].trend");
		assertThat(trends).allSatisfy(trend -> assertThat(trend).hasSize(12));
	}

	@Test
	void createsUpdatesAndDeletesAnAccount() throws Exception {
		var created = postJson("/api/accounts", NEW_ACCOUNT.formatted(today().minusDays(3)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.balance").value(150.0))
				.andExpect(jsonPath("$.transactionCount").value(0));
		String id = read(created, "$.id");

		putJson("/api/accounts/" + id, NEW_ACCOUNT.formatted(today().minusDays(3)).replace("false", "true"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.archived").value(true));
		getJson("/api/accounts/" + id + "/history").andExpect(status().isOk())
				.andExpect(jsonPath("$[-1].value").value(150.0));

		deleteAt("/api/accounts/" + id).andExpect(status().isNoContent());
		getJson("/api/accounts/" + id).andExpect(status().isNotFound())
				.andExpect(jsonPath("$.detail").value("Compte introuvable."));
	}

	@Test
	void rejectsAnInvalidAccountWithFieldErrors() throws Exception {
		postJson("/api/accounts", NEW_ACCOUNT.formatted(today().plusDays(5)).replace("Livret jeune", " "))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.name").value("Le nom est obligatoire."))
				.andExpect(jsonPath("$.errors.openedOn").value(containsString("futur")));
	}

	@Test
	void deletingAnAccountAlsoRemovesTheOtherLegOfItsTransfers() throws Exception {
		String id = read(postJson("/api/accounts", NEW_ACCOUNT.formatted(today().minusDays(3))), "$.id");
		postJson("/api/transfers", """
				{"fromAccountId": "%s", "toAccountId": "%s", "bookedOn": "%s", "amount": 75, "label": "Virement test"}"""
				.formatted(accountId("Compte courant"), id, today()))
				.andExpect(status().isCreated());
		getJson("/api/transactions?q=Virement test").andExpect(jsonPath("$.total").value(2));

		deleteAt("/api/accounts/" + id).andExpect(status().isNoContent());

		getJson("/api/transactions?q=Virement test").andExpect(jsonPath("$.total").value(0));
	}

	@Test
	void anInvestmentAccountWithTradesKeepsItsType() throws Exception {
		String pea = accountId("PEA");
		putJson("/api/accounts/" + pea, """
				{"name": "PEA", "type": "CHECKING", "openingBalance": 500, "openedOn": "%s", "color": 7}"""
				.formatted(today().minusYears(3)))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors.type").exists())
				.andExpect(jsonPath("$.errors.openedOn").doesNotExist());
	}

	@Test
	void theOpeningDateCannotMovePastTheFirstMovement() throws Exception {
		String checking = accountId("Compte courant");
		putJson("/api/accounts/" + checking, """
				{"name": "Compte courant", "type": "CHECKING", "openingBalance": 2900, "openedOn": "%s", "color": 1}"""
				.formatted(today()))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors.openedOn").value(containsString("Une opération existe dès le")));
	}
}
