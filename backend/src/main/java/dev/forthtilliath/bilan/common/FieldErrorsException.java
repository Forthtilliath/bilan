package dev.forthtilliath.bilan.common;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Rejet metier portant des erreurs par champ du formulaire concerne
 * (categorie incompatible avec le signe du montant, vente superieure a la position...).
 */
public class FieldErrorsException extends RuntimeException {

	private static final long serialVersionUID = 1L;

	private final transient Map<String, String> errors;

	public FieldErrorsException(String message, Map<String, String> errors) {
		super(message);
		this.errors = Collections.unmodifiableMap(new LinkedHashMap<>(errors));
	}

	public static FieldErrorsException of(String field, String message) {
		return new FieldErrorsException(message, Map.of(field, message));
	}

	/** Meme rejet, en conservant l'exception technique d'origine. */
	public static FieldErrorsException of(String field, String message, Throwable cause) {
		FieldErrorsException exception = of(field, message);
		exception.initCause(cause);
		return exception;
	}

	public Map<String, String> getErrors() {
		return errors;
	}
}
