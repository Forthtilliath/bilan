package dev.forthtilliath.bilan.transaction;

import java.time.LocalDate;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import dev.forthtilliath.bilan.transaction.dto.TransactionPage;
import dev.forthtilliath.bilan.transaction.dto.TransactionRequest;
import dev.forthtilliath.bilan.transaction.dto.TransactionView;
import dev.forthtilliath.bilan.transaction.dto.TransferRequest;

/** Operations (recherche paginee, saisie) et virements internes. */
@RestController
@RequestMapping("/api")
public class TransactionController {

	private final TransactionService service;

	public TransactionController(TransactionService service) {
		this.service = service;
	}

	@GetMapping("/transactions")
	public TransactionPage search(
			@RequestParam(required = false) UUID accountId,
			@RequestParam(required = false) UUID categoryId,
			@RequestParam(defaultValue = "false") boolean uncategorized,
			@RequestParam(required = false) TransactionFilter.Kind kind,
			@RequestParam(required = false) LocalDate from,
			@RequestParam(required = false) LocalDate to,
			@RequestParam(required = false) String q,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "25") int size) {
		var filter = new TransactionFilter(accountId, categoryId, uncategorized, kind, from, to, q);
		return service.search(filter, page, size);
	}

	@PostMapping("/transactions")
	@ResponseStatus(HttpStatus.CREATED)
	public TransactionView create(@Validated @RequestBody TransactionRequest request) {
		return service.create(request);
	}

	@PutMapping("/transactions/{id}")
	public TransactionView update(@PathVariable UUID id, @Validated @RequestBody TransactionRequest request) {
		return service.update(id, request);
	}

	/** Supprimer une jambe de virement supprime le virement entier. */
	@DeleteMapping("/transactions/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable UUID id) {
		service.delete(id);
	}

	@PostMapping("/transfers")
	@ResponseStatus(HttpStatus.CREATED)
	public List<TransactionView> createTransfer(@Validated @RequestBody TransferRequest request) {
		return service.createTransfer(request);
	}

	@PutMapping("/transfers/{transferId}")
	public List<TransactionView> updateTransfer(@PathVariable UUID transferId,
			@Validated @RequestBody TransferRequest request) {
		return service.updateTransfer(transferId, request);
	}
}
