package dev.forthtilliath.bilan.investment.position;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;

import dev.forthtilliath.bilan.investment.TradeSide;

class PositionTest {

	private static final LocalDate DAY = LocalDate.of(2026, 3, 2);

	private static TradeEvent buy(String quantity, String price, String fees) {
		return new TradeEvent(DAY, TradeSide.BUY, new BigDecimal(quantity), new BigDecimal(price), new BigDecimal(fees));
	}

	private static TradeEvent sell(String quantity, String price, String fees) {
		return new TradeEvent(DAY.plusDays(30), TradeSide.SELL, new BigDecimal(quantity), new BigDecimal(price),
				new BigDecimal(fees));
	}

	@Test
	void averageCostIncludesBuyingFees() {
		Position position = Position.replay(List.of(buy("10", "100", "2"), buy("10", "110", "2")));

		assertThat(position.quantity()).isEqualByComparingTo("20");
		assertThat(position.costBasis()).isEqualByComparingTo("2104");
		assertThat(position.averageCost()).isEqualByComparingTo("105.2");
	}

	@Test
	void partialSaleRealizesGainAtAverageCostAndKeepsItForTheRest() {
		Position position = Position.replay(List.of(buy("10", "100", "0"), buy("10", "120", "0"), sell("5", "150", "3")));

		// PRU 110 : 5 x 110 sortent du prix de revient, produit net 750 - 3 = 747.
		assertThat(position.realizedGain()).isEqualByComparingTo("197");
		assertThat(position.quantity()).isEqualByComparingTo("15");
		assertThat(position.averageCost()).isEqualByComparingTo("110");
	}

	@Test
	void closingAPositionResetsCostBasisAndCanRealizeALoss() {
		Position position = Position.replay(List.of(buy("3", "40", "1"), sell("3", "30", "1")));

		assertThat(position.isOpen()).isFalse();
		assertThat(position.costBasis()).isZero();
		assertThat(position.averageCost()).isZero();
		assertThat(position.realizedGain()).isEqualByComparingTo("-32");
	}

	@Test
	void sellingMoreThanHeldIsRejected() {
		assertThatThrownBy(() -> Position.replay(List.of(buy("2", "10", "0"), sell("2.5", "11", "0"))))
				.isInstanceOf(OversellException.class)
				.satisfies(ex -> assertThat(((OversellException) ex).getHeld()).isEqualByComparingTo("2"));
	}

	@Test
	void fractionalQuantitiesKeepTheirPrecision() {
		Position position = Position.replay(List.of(buy("0.00123456", "40000", "0.25"), buy("0.001", "50000", "0.25")));

		assertThat(position.quantity()).isEqualByComparingTo("0.00223456");
		assertThat(position.costBasis()).isEqualByComparingTo("99.8824");
	}

	@Test
	void cashFlowDebitsBuysAndCreditsSalesNetOfFees() {
		assertThat(buy("2", "50", "1.5").cashFlow()).isEqualByComparingTo("-101.5");
		assertThat(sell("2", "50", "1.5").cashFlow()).isEqualByComparingTo("98.5");
	}
}
