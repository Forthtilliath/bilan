package dev.forthtilliath.bilan.common;

/** Action limitee dans le temps, rejouee trop tot (429 + en-tete Retry-After). */
public class TooManyRequestsException extends RuntimeException {

	private static final long serialVersionUID = 1L;

	private final long retryAfterSeconds;

	public TooManyRequestsException(String message, long retryAfterSeconds) {
		super(message);
		this.retryAfterSeconds = retryAfterSeconds;
	}

	public long getRetryAfterSeconds() {
		return retryAfterSeconds;
	}
}
