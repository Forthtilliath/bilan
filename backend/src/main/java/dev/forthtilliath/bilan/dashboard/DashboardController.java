package dev.forthtilliath.bilan.dashboard;

import java.time.YearMonth;
import java.time.format.DateTimeParseException;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import dev.forthtilliath.bilan.common.FieldErrorsException;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

	private final DashboardService service;

	public DashboardController(DashboardService service) {
		this.service = service;
	}

	/** @param month mois analyse au format AAAA-MM (defaut : mois courant). */
	@GetMapping
	public DashboardView dashboard(@RequestParam(required = false) String month) {
		return service.dashboard(parse(month));
	}

	private static YearMonth parse(String month) {
		if (month == null || month.isBlank()) {
			return null;
		}
		try {
			return YearMonth.parse(month);
		} catch (DateTimeParseException ex) {
			throw FieldErrorsException.of("month", "Mois attendu au format AAAA-MM.");
		}
	}
}
