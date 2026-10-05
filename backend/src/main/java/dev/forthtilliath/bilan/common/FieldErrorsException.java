package dev.forthtilliath.bilan.common;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Rejet metier portant des erreurs par champ du formulaire concerne
 * (categorie incompatible avec le signe du montant, vente superieure a la position...).
 */
public class FieldErrorsException extends RuntimeException {

	private final transient Map<String, String> errors;

	public FieldErrorsException(String message, Map<String, String> errors) {
		super(message);
		this.errors = Collections.unmodifiableMap(new LinkedHashMap<>(errors));
	}

	public static FieldErrorsException of(String field, String message) {
		return new FieldErrorsException(message, Map.of(field, message));
	}

	public Map<String, String> getErrors() {
		return errors;
	}
}
