package dev.forthtilliath.bilan.transaction;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;

/**
 * Criteres de recherche des operations, tous optionnels.
 * {@code categoryId} et {@code uncategorized} s'excluent : le second cible les operations sans categorie (hors virements).
 */
public record TransactionFilter(
		UUID accountId,
		UUID categoryId,
		boolean uncategorized,
		Kind kind,
		LocalDate from,
		LocalDate to,
		String q) {

	public enum Kind {
		INCOME,
		EXPENSE,
		TRANSFER
	}

	public Specification<Transaction> toSpecification() {
		return (root, query, cb) -> {
			List<Predicate> predicates = new ArrayList<>();
			if (accountId != null) {
				predicates.add(cb.equal(root.get("accountId"), accountId));
			}
			if (categoryId != null) {
				predicates.add(cb.equal(root.get("categoryId"), categoryId));
			} else if (uncategorized) {
				predicates.add(cb.isNull(root.get("categoryId")));
				predicates.add(cb.isNull(root.get("transferId")));
			}
			if (kind != null) {
				switch (kind) {
					case TRANSFER -> predicates.add(cb.isNotNull(root.get("transferId")));
					case INCOME -> {
						predicates.add(cb.isNull(root.get("transferId")));
						predicates.add(cb.gt(root.get("amount"), 0));
					}
					case EXPENSE -> {
						predicates.add(cb.isNull(root.get("transferId")));
						predicates.add(cb.lt(root.get("amount"), 0));
					}
				}
			}
			if (from != null) {
				predicates.add(cb.greaterThanOrEqualTo(root.get("bookedOn"), from));
			}
			if (to != null) {
				predicates.add(cb.lessThanOrEqualTo(root.get("bookedOn"), to));
			}
			if (q != null && !q.isBlank()) {
				String pattern = "%" + q.strip().toLowerCase(Locale.ROOT).replace("%", "\\%").replace("_", "\\_") + "%";
				predicates.add(cb.or(
						cb.like(cb.lower(root.get("label")), pattern, '\\'),
						cb.like(cb.lower(cb.coalesce(root.get("note"), "")), pattern, '\\')));
			}
			return cb.and(predicates.toArray(Predicate[]::new));
		};
	}
}
