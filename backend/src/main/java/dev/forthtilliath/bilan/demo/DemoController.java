package dev.forthtilliath.bilan.demo;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicReference;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import dev.forthtilliath.bilan.common.TooManyRequestsException;

/**
 * Remise a zero de la demo publique : un visiteur peut tout casser, puis tout reconstruire.
 * Une remise a zero regenere des milliers de lignes : elle est espacee d'au moins {@code reset-cooldown}.
 */
@RestController
@RequestMapping("/api/demo")
public class DemoController {

	private final DemoDataSeeder seeder;
	private final Clock clock;
	private final Duration cooldown;
	private final AtomicReference<Instant> lastReset = new AtomicReference<>(Instant.MIN);

	public DemoController(DemoDataSeeder seeder, Clock clock,
			@Value("${app.demo.reset-cooldown:PT10S}") Duration cooldown) {
		this.seeder = seeder;
		this.clock = clock;
		this.cooldown = cooldown;
	}

	@PostMapping("/reset")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void reset() {
		Instant now = clock.instant();
		Instant previous = lastReset.get();
		Instant allowedFrom = previous.equals(Instant.MIN) ? Instant.MIN : previous.plus(cooldown);
		if (now.isBefore(allowedFrom) || !lastReset.compareAndSet(previous, now)) {
			long wait = Math.max(1, Duration.between(now, allowedFrom).toSeconds());
			throw new TooManyRequestsException(
					"Réinitialisation trop rapprochée : réessayez dans " + wait + " s.", wait);
		}
		seeder.reset();
	}
}
