package com.toonlira.translationgateway.domain.rendering;

/** Internal contract failure. Never attaches raw input or a provider/native cause. */
public final class RenderValidationException extends RuntimeException {
    public enum Failure { INVALID_INPUT, INVALID_OUTPUT, INVALID_POLICY }

    private final Failure failure;

    public RenderValidationException(Failure failure) {
        super(failure.name());
        this.failure = failure;
    }

    public Failure failure() { return failure; }
}
