package com.toonlira.translationgateway.infrastructure.rendering;

/** Internal local-render failure; no input, path, job reference or raw cause escapes. */
public final class RenderFileException extends RuntimeException {
    public enum Failure {
        CONFIGURATION("render-configuration"), INVALID_MEDIA("render-invalid-media"),
        UNAVAILABLE("render-unavailable"), CANCELLED("render-cancelled"),
        BUSY("render-busy"), TIMEOUT("render-timeout"), CLEANUP_FAILED("render-cleanup-failed");

        private final String code;
        Failure(String code) { this.code = code; }
    }

    private final Failure failure;
    public RenderFileException(Failure failure) {
        super(failure.code, null, false, false);
        this.failure = failure;
    }
    public Failure failure() { return failure; }
}
