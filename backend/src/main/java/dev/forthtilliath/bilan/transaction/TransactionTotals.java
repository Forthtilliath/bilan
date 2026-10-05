package dev.forthtilliath.bilan.transaction;

import java.math.BigDecimal;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import dev.forthtilliath.bilan.common.Money;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Tuple;
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
		CriteriaQuery<Tuple> query = cb.createTupleQuery();
		Root<Transaction> root = query.from(Transaction.class);
		Expression<BigDecimal> amount = root.get("amount");
		Expression<BigDecimal> zero = cb.literal(BigDecimal.ZERO);
		Expression<BigDecimal> inflow = cb.sum(cb.<BigDecimal>selectCase().when(cb.gt(amount, 0), amount).otherwise(zero));
		Expression<BigDecimal> outflow = cb.sum(cb.<BigDecimal>selectCase().when(cb.lt(amount, 0), amount).otherwise(zero));
		query.select(cb.tuple(inflow, outflow));
		query.where(specification.toPredicate(root, query, cb));
		Tuple row = entityManager.createQuery(query).getSingleResult();
		return new Totals(Money.cents(row.get(inflow)), Money.cents(row.get(outflow)).negate());
	}
}
