package com.toonlira.translationgateway.infrastructure.rendering;

/** Internal failure, never carries text, paths, parser diagnostics or native causes. */
public final class RenderFontException extends RuntimeException {
    public enum Failure { CONFIGURATION, INVALID_INPUT }
    private final Failure failure;

    public RenderFontException(Failure failure) {
        super(failure == Failure.CONFIGURATION ? "font-configuration" : "font-invalid-input");
        this.failure = failure;
    }

    public Failure failure() { return failure; }
}
