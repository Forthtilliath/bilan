package dev.forthtilliath.bilan.transaction;

import java.math.BigDecimal;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import dev.forthtilliath.bilan.common.Money;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Root;

/** Sommes des entrees et des sorties sur l'ensemble filtre (pas seulement la page affichee). */
@Component
public class TransactionTotals {

	private final EntityManager entityManager;

	public TransactionTotals(EntityManager entityManager) {
		this.entityManager = entityManager;
	}

	public record Totals(BigDecimal inflow, BigDecimal outflow) {
	}

	public Totals sum(Specification<Transaction> specification) {
		CriteriaBuilder cb = entityManager.getCriteriaBuilder();
		CriteriaQuery<Object[]> query = cb.createQuery(Object[].class);
		Root<Transaction> root = query.from(Transaction.class);
		Expression<BigDecimal> amount = root.get("amount");
		Expression<BigDecimal> zero = cb.literal(BigDecimal.ZERO);
		query.multiselect(
				cb.sum(cb.<BigDecimal>selectCase().when(cb.gt(amount, 0), amount).otherwise(zero)),
				cb.sum(cb.<BigDecimal>selectCase().when(cb.lt(amount, 0), amount).otherwise(zero)));
		query.where(specification.toPredicate(root, query, cb));
		Object[] row = entityManager.createQuery(query).getSingleResult();
		return new Totals(Money.cents((BigDecimal) row[0]), Money.cents((BigDecimal) row[1]).negate());
	}
}
