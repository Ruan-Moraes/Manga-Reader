package com.toonlira.translationgateway.domain.translation;

/** Internal contract failure; no HTTP mapping or provider cause is attached. */
public final class TranslationValidationException extends RuntimeException {
    public enum Failure { INVALID_INPUT, UNSUPPORTED_PAIR, INVALID_OUTPUT }

    private final Failure failure;

    public TranslationValidationException(Failure failure) {
        super(failure.name(), null, false, true);
        this.failure = failure;
    }

    public Failure failure() { return failure; }
}
