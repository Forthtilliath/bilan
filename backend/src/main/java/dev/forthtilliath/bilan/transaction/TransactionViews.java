package dev.forthtilliath.bilan.transaction;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import dev.forthtilliath.bilan.account.Account;
import dev.forthtilliath.bilan.account.AccountRepository;
import dev.forthtilliath.bilan.category.Category;
import dev.forthtilliath.bilan.category.CategoryRepository;
import dev.forthtilliath.bilan.transaction.dto.TransactionView;

/** Resout comptes, categories et contreparties de virement pour un lot d'operations (3 requetes au plus). */
@Component
public class TransactionViews {

	private final AccountRepository accounts;
	private final CategoryRepository categories;
	private final TransactionRepository transactions;

	public TransactionViews(AccountRepository accounts, CategoryRepository categories,
			TransactionRepository transactions) {
		this.accounts = accounts;
		this.categories = categories;
		this.transactions = transactions;
	}

	public List<TransactionView> of(Collection<Transaction> page) {
		if (page.isEmpty()) {
			return List.of();
		}
		Map<UUID, Account> accountsById = accounts.findAll().stream()
				.collect(Collectors.toMap(Account::getId, Function.identity()));
		Map<UUID, Category> categoriesById = categories.findAll().stream()
				.collect(Collectors.toMap(Category::getId, Function.identity()));
		List<UUID> transferIds = page.stream().map(Transaction::getTransferId).filter(Objects::nonNull).toList();
		List<Transaction> legs = transferIds.isEmpty() ? List.of() : transactions.findAllByTransferIdIn(transferIds);

		return page.stream().map(tx -> {
			Account account = accountsById.get(tx.getAccountId());
			Category category = tx.getCategoryId() == null ? null : categoriesById.get(tx.getCategoryId());
			Account counterpart = tx.isTransfer() ? legs.stream()
					.filter(leg -> tx.getTransferId().equals(leg.getTransferId()) && !leg.getId().equals(tx.getId()))
					.findFirst().map(leg -> accountsById.get(leg.getAccountId())).orElse(null) : null;
			return new TransactionView(tx.getId(), tx.getAccountId(), account == null ? "?" : account.getName(),
					account == null ? 1 : account.getColor(), category == null ? null : category.getId(),
					category == null ? null : category.getName(), category == null ? null : category.getColor(),
					category == null ? null : category.getIcon(), tx.getBookedOn(), tx.getAmount(), tx.getLabel(),
					tx.getNote(), tx.getTransferId(), counterpart == null ? null : counterpart.getId(),
					counterpart == null ? null : counterpart.getName());
		}).toList();
	}

	public TransactionView of(Transaction transaction) {
		return of(List.of(transaction)).getFirst();
	}
}
