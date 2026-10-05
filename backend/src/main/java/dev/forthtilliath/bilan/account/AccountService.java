package dev.forthtilliath.bilan.account;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.forthtilliath.bilan.account.dto.AccountRequest;
import dev.forthtilliath.bilan.account.dto.AccountView;
import dev.forthtilliath.bilan.common.FieldErrorsException;
import dev.forthtilliath.bilan.common.NotFoundException;
import dev.forthtilliath.bilan.investment.TradeRepository;
import dev.forthtilliath.bilan.transaction.TransactionRepository;
import dev.forthtilliath.bilan.wealth.Ledger;
import dev.forthtilliath.bilan.wealth.LedgerLoader;
import dev.forthtilliath.bilan.wealth.SampleDates;
import dev.forthtilliath.bilan.wealth.SeriesPoint;
import dev.forthtilliath.bilan.wealth.WealthTimeline.Snapshot;
import dev.forthtilliath.bilan.wealth.WealthTimeline.Valuation;

@Service
@Transactional
public class AccountService {

	private static final int TREND_POINTS = 12;
	private static final DateTimeFormatter FR_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

	private final AccountRepository accounts;
	private final TransactionRepository transactions;
	private final TradeRepository trades;
	private final LedgerLoader ledgers;

	public AccountService(AccountRepository accounts, TransactionRepository transactions, TradeRepository trades,
			LedgerLoader ledgers) {
		this.accounts = accounts;
		this.transactions = transactions;
		this.trades = trades;
		this.ledgers = ledgers;
	}

	@Transactional(readOnly = true)
	public List<AccountView> list() {
		Ledger ledger = ledgers.load();
		Map<UUID, Long> counts = transactions.countByAccount();
		List<Snapshot> trend = ledger.timeline().sample(SampleDates.monthEnds(ledger.today(), TREND_POINTS));
		Snapshot monthAgo = ledger.timeline().at(ledger.today().minusDays(30));
		return ledger.accounts().stream().map(account -> view(account, trend, monthAgo, counts)).toList();
	}

	@Transactional(readOnly = true)
	public AccountView get(UUID id) {
		return list().stream().filter(view -> view.id().equals(id)).findFirst()
				.orElseThrow(() -> new NotFoundException("Compte introuvable."));
	}

	/** Solde hebdomadaire du compte depuis son ouverture. */
	@Transactional(readOnly = true)
	public List<SeriesPoint> history(UUID id) {
		Account account = find(id);
		Ledger ledger = ledgers.load();
		return ledger.timeline().sample(SampleDates.weekly(account.getOpenedOn(), ledger.today())).stream()
				.map(s -> new SeriesPoint(s.date(), s.account(id).total())).toList();
	}

	public AccountView create(AccountRequest request) {
		Account account = new Account(request.name().strip(), request.type(), request.openedOn());
		apply(account, request);
		accounts.saveAndFlush(account);
		return get(account.getId());
	}

	public AccountView update(UUID id, AccountRequest request) {
		Account account = find(id);
		Map<String, String> errors = new LinkedHashMap<>();
		if (account.getType().holdsAssets() && !request.type().holdsAssets() && trades.existsByAccountId(id)) {
			errors.put("type", "Ce compte porte des ordres de bourse : il doit rester un compte d'investissement.");
		}
		LocalDate firstMovement = earliest(transactions.findFirstBookedOn(id), trades.findFirstTradedOn(id));
		if (firstMovement != null && request.openedOn().isAfter(firstMovement)) {
			errors.put("openedOn", "Une opération existe dès le " + FR_DATE.format(firstMovement) + ".");
		}
		if (!errors.isEmpty()) {
			throw new FieldErrorsException("Compte invalide.", errors);
		}
		apply(account, request);
		accounts.saveAndFlush(account);
		return get(id);
	}

	/** Supprime le compte, ses operations et ordres, et l'autre jambe des virements qui le touchaient. */
	public void delete(UUID id) {
		Account account = find(id);
		List<UUID> transferIds = transactions.findTransferIdsByAccountId(id);
		if (!transferIds.isEmpty()) {
			transactions.deleteAllByTransferIdIn(transferIds);
		}
		accounts.delete(account);
	}

	private Account find(UUID id) {
		return accounts.findById(id).orElseThrow(() -> new NotFoundException("Compte introuvable."));
	}

	private static void apply(Account account, AccountRequest request) {
		account.setName(request.name().strip());
		account.setType(request.type());
		account.setInstitution(request.institution() == null || request.institution().isBlank() ? null
				: request.institution().strip());
		account.setOpeningBalance(request.openingBalance());
		account.setOpenedOn(request.openedOn());
		account.setColor(request.color());
		account.setArchived(request.archived());
	}

	private static AccountView view(Account account, List<Snapshot> trend, Snapshot monthAgo,
			Map<UUID, Long> counts) {
		Valuation now = trend.getLast().account(account.getId());
		BigDecimal change = now.total().subtract(monthAgo.account(account.getId()).total());
		List<BigDecimal> points = trend.stream().map(s -> s.account(account.getId()).total()).toList();
		return AccountView.of(account, now.cash(), now.holdings(), change, counts.getOrDefault(account.getId(), 0L),
				points);
	}

	private static LocalDate earliest(LocalDate a, LocalDate b) {
		if (a == null) {
			return b;
		}
		return b == null || a.isBefore(b) ? a : b;
	}
}
