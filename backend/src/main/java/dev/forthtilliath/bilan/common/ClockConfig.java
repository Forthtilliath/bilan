package dev.forthtilliath.bilan.common;

import java.time.Clock;
import java.time.ZoneId;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Horloge injectee partout ou l'on parle d'« aujourd'hui » : les tests la figent. */
@Configuration
public class ClockConfig {

	@Bean
	Clock clock(@Value("${app.zone:Europe/Paris}") String zone) {
		return Clock.system(ZoneId.of(zone));
	}
}
