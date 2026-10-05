package dev.forthtilliath.bilan.common;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

class MoneyTest {

	private static BigDecimal eur(String value) {
		return new BigDecimal(value);
	}

	@Test
	void roundsToTheCentHalfUpAndTreatsNullAsZero() {
		assertThat(Money.cents(eur("12.345"))).isEqualByComparingTo("12.35").hasScaleOf(2);
		assertThat(Money.cents(eur("-0.005"))).isEqualByComparingTo("-0.01");
		assertThat(Money.cents(null)).isEqualByComparingTo("0").hasScaleOf(2);
	}

	@Test
	void percentChangeIsRelativeToTheAbsoluteBase() {
		assertThat(Money.percentChange(eur("200"), eur("250"))).isEqualByComparingTo("25");
		assertThat(Money.percentChange(eur("-100"), eur("-50"))).isEqualByComparingTo("50");
		assertThat(Money.percentChange(BigDecimal.ZERO, eur("10"))).isNull();
		assertThat(Money.percentChange(null, eur("10"))).isNull();
	}

	@Test
	void shareOfAZeroTotalIsZero() {
		assertThat(Money.share(eur("1"), eur("3"))).isEqualByComparingTo("33.33");
		assertThat(Money.share(eur("5"), BigDecimal.ZERO)).isEqualByComparingTo("0");
	}
}
