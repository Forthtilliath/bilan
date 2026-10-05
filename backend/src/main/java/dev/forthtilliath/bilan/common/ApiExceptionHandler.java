package dev.forthtilliath.bilan.common;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/** Toutes les erreurs de l'API sortent en ProblemDetail (RFC 9457), avec {@code errors} par champ si besoin. */
@RestControllerAdvice
public class ApiExceptionHandler {

	@ExceptionHandler(NotFoundException.class)
	public ProblemDetail notFound(NotFoundException ex) {
		return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
	}

	@ExceptionHandler(FieldErrorsException.class)
	public ProblemDetail fieldErrors(FieldErrorsException ex) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_CONTENT, ex.getMessage());
		problem.setProperty("errors", ex.getErrors());
		return problem;
	}

	@ExceptionHandler(TooManyRequestsException.class)
	public ResponseEntity<ProblemDetail> tooManyRequests(TooManyRequestsException ex) {
		return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
				.header(HttpHeaders.RETRY_AFTER, String.valueOf(ex.getRetryAfterSeconds()))
				.body(ProblemDetail.forStatusAndDetail(HttpStatus.TOO_MANY_REQUESTS, ex.getMessage()));
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ProblemDetail unreadableBody(HttpMessageNotReadableException ex) {
		return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Corps JSON illisible ou mal formé.");
	}

	@ExceptionHandler(MethodArgumentTypeMismatchException.class)
	public ProblemDetail badParameter(MethodArgumentTypeMismatchException ex) {
		return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
				"Paramètre « " + ex.getName() + " » invalide.");
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ProblemDetail invalidBody(MethodArgumentNotValidException ex) {
		Map<String, String> errors = new LinkedHashMap<>();
		ex.getBindingResult().getFieldErrors()
				.forEach(error -> errors.putIfAbsent(error.getField(), error.getDefaultMessage()));
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Requête invalide.");
		problem.setProperty("errors", errors);
		return problem;
	}
}
