package dev.forthtilliath.bilan.common;

import java.time.Clock;
import java.time.ZoneId;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.validation.autoconfigure.ValidationConfigurationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Horloge injectee partout ou l'on parle d'« aujourd'hui » : les tests la figent. */
@Configuration
public class ClockConfig {

	@Bean
	Clock clock(@Value("${app.zone:Europe/Paris}") String zone) {
		return Clock.system(ZoneId.of(zone));
	}

	/**
	 * Bean Validation (@PastOrPresent, @Past…) juge « aujourd'hui » avec cette horloge, pas avec le
	 * fuseau de la JVM : sur un serveur en UTC, une operation datee du jour etait refusee comme future
	 * entre minuit et 1 h (2 h l'ete) a Paris.
	 */
	@Bean
	ValidationConfigurationCustomizer validationClock(Clock clock) {
		return configuration -> configuration.clockProvider(() -> clock);
	}
}
