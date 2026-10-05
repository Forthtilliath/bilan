package dev.forthtilliath.bilan.account;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import dev.forthtilliath.bilan.account.dto.AccountRequest;
import dev.forthtilliath.bilan.account.dto.AccountView;
import dev.forthtilliath.bilan.wealth.SeriesPoint;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

	private final AccountService service;

	public AccountController(AccountService service) {
		this.service = service;
	}

	@GetMapping
	public List<AccountView> list() {
		return service.list();
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public AccountView create(@Validated @RequestBody AccountRequest request) {
		return service.create(request);
	}

	@GetMapping("/{id}")
	public AccountView get(@PathVariable UUID id) {
		return service.get(id);
	}

	@GetMapping("/{id}/history")
	public List<SeriesPoint> history(@PathVariable UUID id) {
		return service.history(id);
	}

	@PutMapping("/{id}")
	public AccountView update(@PathVariable UUID id, @Validated @RequestBody AccountRequest request) {
		return service.update(id, request);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable UUID id) {
		service.delete(id);
	}
}
