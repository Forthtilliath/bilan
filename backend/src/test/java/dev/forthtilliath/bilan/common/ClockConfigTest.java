package dev.forthtilliath.bilan.common;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

import org.junit.jupiter.api.Test;

import jakarta.validation.Configuration;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import jakarta.validation.constraints.PastOrPresent;

class ClockConfigTest {

	private record Dated(@PastOrPresent LocalDate on) {
	}

	// 23 h 30 UTC le 1er janvier = 0 h 30 a Paris le 2. Figee dans le passe : sans le correctif, le
	// validateur prendrait l'heure reelle et accepterait aussi le 3.
	private static final Clock PARIS_AFTER_MIDNIGHT = Clock.fixed(Instant.parse("2020-01-01T23:30:00Z"),
			ZoneId.of("Europe/Paris"));

	@Test
	void pastOrPresentFollowsTheApplicationClock() {
		Configuration<?> configuration = Validation.byDefaultProvider().configure();
		new ClockConfig().validationClock(PARIS_AFTER_MIDNIGHT).customize(configuration);
		try (ValidatorFactory factory = configuration.buildValidatorFactory()) {
			Validator validator = factory.getValidator();
			assertThat(validator.validate(new Dated(LocalDate.of(2020, 1, 2)))).isEmpty();
			assertThat(validator.validate(new Dated(LocalDate.of(2020, 1, 3)))).hasSize(1);
		}
	}
}
