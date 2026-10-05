package dev.forthtilliath.bilan.demo;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Remise a zero de la demo publique : un visiteur peut tout casser, puis tout reconstruire. */
@RestController
@RequestMapping("/api/demo")
public class DemoController {

	private final DemoDataSeeder seeder;

	public DemoController(DemoDataSeeder seeder) {
		this.seeder = seeder;
	}

	@PostMapping("/reset")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void reset() {
		seeder.reset();
	}
}
