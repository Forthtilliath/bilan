package dev.forthtilliath.bilan.dashboard;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Predicate;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.forthtilliath.bilan.category.Category;
import dev.forthtilliath.bilan.category.CategoryKind;
import dev.forthtilliath.bilan.category.CategoryRepository;
import dev.forthtilliath.bilan.common.Money;
import dev.forthtilliath.bilan.dashboard.DashboardView.CategorySpending;
import dev.forthtilliath.bilan.dashboard.DashboardView.MonthFlow;
import dev.forthtilliath.bilan.dashboard.DashboardView.NetWorth;
import dev.forthtilliath.bilan.dashboard.DashboardView.WealthPoint;
import dev.forthtilliath.bilan.transaction.TransactionService;
import dev.forthtilliath.bilan.wealth.Ledger;
import dev.forthtilliath.bilan.wealth.LedgerLoader;
import dev.forthtilliath.bilan.wealth.SampleDates;
import dev.forthtilliath.bilan.wealth.WealthTimeline.Snapshot;

@Service
@Transactional(readOnly = true)
public class DashboardService {

	static final int CASHFLOW_MONTHS = 12;

	private final LedgerLoader ledgers;
	private final CategoryRepository categories;
	private final TransactionService transactions;

	public DashboardService(LedgerLoader ledgers, CategoryRepository categories, TransactionService transactions) {
		this.ledgers = ledgers;
		this.categories = categories;
		this.transactions = transactions;
	}

	/** @param month mois des flux et des depenses (le patrimoine est toujours a date du jour), null = mois courant. */
	public DashboardView dashboard(YearMonth month) {
		Ledger ledger = ledgers.load();
		YearMonth selected = month != null ? month : YearMonth.from(ledger.today());
		Predicate<UUID> investment = ledger.investmentAccounts();

		List<Snapshot> snapshots = ledger.timeline().sample(SampleDates.weekly(ledger.firstDay(), ledger.today()));
		List<WealthPoint> history = snapshots.stream()
				.map(s -> new WealthPoint(s.date(), s.total(), s.total(investment))).toList();
		Snapshot now = snapshots.getLast();
		Snapshot monthAgo = ledger.timeline().at(ledger.today().minusDays(30));
		BigDecimal change = now.total().subtract(monthAgo.total());
		NetWorth netWorth = new NetWorth(now.total(), now.total(investment), change,
				Money.percentChange(monthAgo.total(), now.total()));

		List<MonthFlow> cashflow = Cashflow.monthly(ledger.transactions(), selected, CASHFLOW_MONTHS);
		MonthFlow current = cashflow.getLast();
		MonthFlow previous = cashflow.get(cashflow.size() - 2);

		return new DashboardView(selected.toString(), netWorth, current, previous, Cashflow.savingsRate(current),
				history, cashflow, spending(ledger, selected), transactions.recent());
	}

	/** Depenses du mois par categorie (decroissantes), plus les categories budgetees encore a zero. */
	private List<CategorySpending> spending(Ledger ledger, YearMonth month) {
		Map<UUID, BigDecimal> amounts = Cashflow.expensesByCategory(ledger.transactions(), month);
		List<CategorySpending> spending = new ArrayList<>();
		for (Category category : categories.findAllByOrderByKindAscNameAsc()) {
			if (category.getKind() != CategoryKind.EXPENSE) {
				continue;
			}
			BigDecimal amount = amounts.get(category.getId());
			if (amount != null || category.getMonthlyBudget() != null) {
				spending.add(new CategorySpending(category.getId(), category.getName(), category.getColor(),
						category.getIcon(), Money.cents(amount), category.getMonthlyBudget()));
			}
		}
		BigDecimal uncategorized = amounts.get(Cashflow.UNCATEGORIZED);
		if (uncategorized != null) {
			spending.add(new CategorySpending(null, "Non catégorisé", null, null, Money.cents(uncategorized), null));
		}
		spending.sort(Comparator.comparing(CategorySpending::amount).reversed());
		return spending;
	}
}
