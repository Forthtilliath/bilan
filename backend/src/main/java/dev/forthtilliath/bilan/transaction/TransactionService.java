package dev.forthtilliath.bilan.transaction;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.forthtilliath.bilan.account.Account;
import dev.forthtilliath.bilan.account.AccountRepository;
import dev.forthtilliath.bilan.category.Category;
import dev.forthtilliath.bilan.category.CategoryKind;
import dev.forthtilliath.bilan.category.CategoryRepository;
import dev.forthtilliath.bilan.common.FieldErrorsException;
import dev.forthtilliath.bilan.common.Money;
import dev.forthtilliath.bilan.common.NotFoundException;
import dev.forthtilliath.bilan.transaction.dto.TransactionPage;
import dev.forthtilliath.bilan.transaction.dto.TransactionRequest;
import dev.forthtilliath.bilan.transaction.dto.TransactionView;
import dev.forthtilliath.bilan.transaction.dto.TransferRequest;

@Service
@Transactional
public class TransactionService {

	static final int MAX_PAGE_SIZE = 5000;
	private static final DateTimeFormatter FR_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
	private static final Sort NEWEST_FIRST = Sort.by(Sort.Order.desc("bookedOn"), Sort.Order.desc("createdAt"),
			Sort.Order.desc("id"));

	private final TransactionRepository transactions;
	private final AccountRepository accounts;
	private final CategoryRepository categories;
	private final TransactionTotals totals;
	private final TransactionViews views;

	public TransactionService(TransactionRepository transactions, AccountRepository accounts,
			CategoryRepository categories, TransactionTotals totals, TransactionViews views) {
		this.transactions = transactions;
		this.accounts = accounts;
		this.categories = categories;
		this.totals = totals;
		this.views = views;
	}

	@Transactional(readOnly = true)
	public TransactionPage search(TransactionFilter filter, int page, int size) {
		int safeSize = Math.clamp(size, 1, MAX_PAGE_SIZE);
		Specification<Transaction> spec = filter.toSpecification();
		Page<Transaction> result = transactions.findAll(spec, PageRequest.of(Math.max(page, 0), safeSize, NEWEST_FIRST));
		TransactionTotals.Totals sums = totals.sum(spec);
		return new TransactionPage(views.of(result.getContent()), result.getTotalElements(), result.getNumber(),
				safeSize, sums.inflow(), sums.outflow());
	}

	/** 6 dernieres operations ; un virement n'apparait qu'une fois (cote debit, avec son compte destinataire). */
	@Transactional(readOnly = true)
	public List<TransactionView> recent() {
		return views.of(transactions.findTop12ByOrderByBookedOnDescCreatedAtDesc().stream()
				.filter(tx -> !tx.isTransfer() || tx.getAmount().signum() < 0).limit(6).toList());
	}

	public TransactionView create(TransactionRequest request) {
		Transaction tx = new Transaction(request.accountId(), request.bookedOn(), request.amount(), "");
		apply(tx, request);
		return views.of(transactions.save(tx));
	}

	public TransactionView update(UUID id, TransactionRequest request) {
		Transaction tx = find(id);
		if (tx.isTransfer()) {
			throw FieldErrorsException.of("transferId", "Cette opération est un virement : modifiez le virement.");
		}
		apply(tx, request);
		return views.of(transactions.saveAndFlush(tx));
	}

	public void delete(UUID id) {
		Transaction tx = find(id);
		if (tx.isTransfer()) {
			transactions.deleteAll(transactions.findAllByTransferId(tx.getTransferId()));
		} else {
			transactions.delete(tx);
		}
	}

	public List<TransactionView> createTransfer(TransferRequest request) {
		UUID transferId = UUID.randomUUID();
		Transaction debit = new Transaction(request.fromAccountId(), request.bookedOn(), request.amount().negate(), "");
		Transaction credit = new Transaction(request.toAccountId(), request.bookedOn(), request.amount(), "");
		debit.setTransferId(transferId);
		credit.setTransferId(transferId);
		applyTransfer(debit, credit, request);
		return views.of(transactions.saveAll(List.of(debit, credit)));
	}

	public List<TransactionView> updateTransfer(UUID transferId, TransferRequest request) {
		List<Transaction> legs = transactions.findAllByTransferId(transferId);
		Transaction debit = legs.stream().filter(t -> t.getAmount().signum() < 0).findFirst()
				.orElseThrow(() -> new NotFoundException("Virement introuvable."));
		Transaction credit = legs.stream().filter(t -> t.getAmount().signum() > 0).findFirst()
				.orElseThrow(() -> new NotFoundException("Virement introuvable."));
		applyTransfer(debit, credit, request);
		return views.of(transactions.saveAllAndFlush(List.of(debit, credit)));
	}

	private Transaction find(UUID id) {
		return transactions.findById(id).orElseThrow(() -> new NotFoundException("Opération introuvable."));
	}

	private void apply(Transaction tx, TransactionRequest request) {
		Map<String, String> errors = new LinkedHashMap<>();
		checkAccountDate(request.accountId(), request.bookedOn(), errors, "accountId");
		if (request.amount().signum() == 0) {
			errors.put("amount", "Le montant ne peut pas être nul.");
		}
		if (request.categoryId() != null) {
			Category category = categories.findById(request.categoryId()).orElse(null);
			if (category == null) {
				errors.put("categoryId", "Catégorie introuvable.");
			} else if (request.amount().signum() != 0 && !category.getKind().accepts(request.amount())) {
				errors.put("categoryId", category.getKind() == CategoryKind.INCOME
						? "Une catégorie de revenu attend un montant positif."
						: "Une catégorie de dépense attend un montant négatif.");
			}
		}
		throwIfAny(errors);
		tx.setAccountId(request.accountId());
		tx.setCategoryId(request.categoryId());
		tx.setBookedOn(request.bookedOn());
		tx.setAmount(Money.cents(request.amount()));
		tx.setLabel(request.label().strip());
		tx.setNote(blankToNull(request.note()));
	}

	private void applyTransfer(Transaction debit, Transaction credit, TransferRequest request) {
		Map<String, String> errors = new LinkedHashMap<>();
		Account from = checkAccountDate(request.fromAccountId(), request.bookedOn(), errors, "fromAccountId");
		Account to = checkAccountDate(request.toAccountId(), request.bookedOn(), errors, "toAccountId");
		if (request.fromAccountId().equals(request.toAccountId())) {
			errors.put("toAccountId", "Choisissez deux comptes différents.");
		}
		throwIfAny(errors);
		String label = blankToNull(request.label());
		String note = blankToNull(request.note());
		debit.setAccountId(from.getId());
		debit.setAmount(Money.cents(request.amount()).negate());
		debit.setLabel(label != null ? label : "Virement vers " + to.getName());
		credit.setAccountId(to.getId());
		credit.setAmount(Money.cents(request.amount()));
		credit.setLabel(label != null ? label : "Virement depuis " + from.getName());
		for (Transaction leg : List.of(debit, credit)) {
			leg.setBookedOn(request.bookedOn());
			leg.setNote(note);
			leg.setCategoryId(null);
		}
	}

	/** Verifie que le compte existe et que la date n'est pas anterieure a son ouverture. */
	private Account checkAccountDate(UUID accountId, LocalDate bookedOn, Map<String, String> errors, String field) {
		Account account = accounts.findById(accountId).orElse(null);
		if (account == null) {
			errors.put(field, "Compte introuvable.");
			return null;
		}
		if (bookedOn.isBefore(account.getOpenedOn())) {
			errors.putIfAbsent("bookedOn", "Date antérieure à l'ouverture du compte « " + account.getName() + " » ("
					+ FR_DATE.format(account.getOpenedOn()) + ").");
		}
		return account;
	}

	private static void throwIfAny(Map<String, String> errors) {
		if (!errors.isEmpty()) {
			throw new FieldErrorsException("Opération invalide.", errors);
		}
	}

	private static String blankToNull(String value) {
		return value == null || value.isBlank() ? null : value.strip();
	}
}
