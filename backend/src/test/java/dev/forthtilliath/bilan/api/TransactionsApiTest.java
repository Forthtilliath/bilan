package dev.forthtilliath.bilan.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.assertj.core.data.Offset;
import org.junit.jupiter.api.Test;

class TransactionsApiTest extends ApiIntegrationTest {

	private static final String EXPENSE = """
			{"accountId": "%s", "categoryId": "%s", "bookedOn": "%s", "amount": %s, "label": "%s"}""";

	@Test
	void filtersByKindAndTextWithTotalsOverTheWholeSelection() throws Exception {
		var expenses = getJson("/api/transactions?kind=EXPENSE&size=5000").andExpect(status().isOk())
				.andExpect(jsonPath("$.inflow").value(0.0));
		List<Double> amounts = read(expenses, "$.items[*].amount");
		assertThat(amounts).isNotEmpty().allSatisfy(amount -> assertThat(amount).isNegative());
		double outflow = read(expenses, "$.outflow");
		assertThat(amounts.stream().mapToDouble(Double::doubleValue).sum()).isCloseTo(-outflow, Offset.offset(0.01));

		getJson("/api/transactions?q=LOYER&size=3")
				.andExpect(jsonPath("$.items", hasSize(3)))
				.andExpect(jsonPath("$.items[0].label").value(containsString("Loyer")))
				.andExpect(jsonPath("$.total").value(org.hamcrest.Matchers.greaterThanOrEqualTo(23)));
	}

	@Test
	void paginatesNewestFirst() throws Exception {
		var page = getJson("/api/transactions?page=1&size=10").andExpect(jsonPath("$.items", hasSize(10)))
				.andExpect(jsonPath("$.page").value(1));
		List<String> dates = read(page, "$.items[*].bookedOn");
		assertThat(dates).isSortedAccordingTo(java.util.Comparator.reverseOrder());
	}

	@Test
	void createsUpdatesAndDeletesAnExpense() throws Exception {
		String checking = accountId("Compte courant");
		String groceries = categoryId("Courses");
		var created = postJson("/api/transactions",
				EXPENSE.formatted(checking, groceries, today(), "-42.50", "Marché test"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.categoryName").value("Courses"))
				.andExpect(jsonPath("$.accountName").value("Compte courant"));
		String id = read(created, "$.id");

		putJson("/api/transactions/" + id, EXPENSE.formatted(checking, groceries, today(), "-12", "Marché corrigé"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.amount").value(-12.0))
				.andExpect(jsonPath("$.label").value("Marché corrigé"));

		deleteAt("/api/transactions/" + id).andExpect(status().isNoContent());
		getJson("/api/transactions?q=Marché corrigé").andExpect(jsonPath("$.total").value(0));
	}

	@Test
	void rejectsACategoryThatContradictsTheSignAndADateBeforeOpening() throws Exception {
		postJson("/api/transactions", EXPENSE.formatted(accountId("Compte courant"), categoryId("Salaire"),
				today().minusYears(10), "-10", "Incohérent"))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors.categoryId").value("Une catégorie de revenu attend un montant positif."))
				.andExpect(jsonPath("$.errors.bookedOn").value(containsString("antérieure à l'ouverture")));
	}

	@Test
	void aTransferIsTwoLinkedLegsEditedAndDeletedAsOne() throws Exception {
		String checking = accountId("Compte courant");
		String savings = accountId("Livret d'épargne");
		var created = postJson("/api/transfers", """
				{"fromAccountId": "%s", "toAccountId": "%s", "bookedOn": "%s", "amount": 120}"""
				.formatted(checking, savings, today()))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$", hasSize(2)))
				.andExpect(jsonPath("$[0].amount").value(-120.0))
				.andExpect(jsonPath("$[0].counterpartAccountName").value("Livret d'épargne"))
				.andExpect(jsonPath("$[1].label").value("Virement depuis Compte courant"));
		String transferId = read(created, "$[0].transferId");
		String debitLeg = read(created, "$[0].id");

		putJson("/api/transfers/" + transferId, """
				{"fromAccountId": "%s", "toAccountId": "%s", "bookedOn": "%s", "amount": 80, "label": "Virement test unique"}"""
				.formatted(checking, savings, today()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[*].amount", org.hamcrest.Matchers.containsInAnyOrder(-80.0, 80.0)));

		putJson("/api/transactions/" + debitLeg, EXPENSE.formatted(checking, categoryId("Courses"), today(), "-5", "x"))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors.transferId").exists());

		deleteAt("/api/transactions/" + debitLeg).andExpect(status().isNoContent());
		getJson("/api/transactions?q=Virement test unique")
				.andExpect(jsonPath("$.total").value(0));
	}

	@Test
	void aTransferNeedsTwoDistinctAccounts() throws Exception {
		String checking = accountId("Compte courant");
		postJson("/api/transfers", """
				{"fromAccountId": "%s", "toAccountId": "%s", "bookedOn": "%s", "amount": 10}"""
				.formatted(checking, checking, today()))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors.toAccountId").value("Choisissez deux comptes différents."));
	}

	@Test
	void deletingACategoryLeavesItsTransactionsUncategorized() throws Exception {
		int before = read(getJson("/api/transactions?uncategorized=true"), "$.total");
		int count = read(getJson("/api/transactions?categoryId=" + categoryId("Shopping")), "$.total");

		deleteAt("/api/categories/" + categoryId("Shopping")).andExpect(status().isNoContent());

		getJson("/api/transactions?uncategorized=true").andExpect(jsonPath("$.total").value(before + count));
	}

	@Test
	void reportsBadParametersAndUnreadableBodiesAsProblems() throws Exception {
		getJson("/api/transactions?kind=NOPE").andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.detail").value("Paramètre « kind » invalide."));
		postJson("/api/transactions", "{not json").andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.detail").value("Corps JSON illisible ou mal formé."));
		getJson("/api/transactions?q=" + "x".repeat(5000)).andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(0));
	}
}
