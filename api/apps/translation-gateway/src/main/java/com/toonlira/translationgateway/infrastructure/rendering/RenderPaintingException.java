package com.toonlira.translationgateway.infrastructure.rendering;

/** No raster, text, region identifier or underlying cause crosses the failure boundary. */
public final class RenderPaintingException extends RuntimeException {
    public enum Failure { INVALID_INPUT, CANCELLED, UNAVAILABLE }
    private final Failure failure;

    public RenderPaintingException(Failure failure) {
        super(switch (failure) {
            case INVALID_INPUT -> "paint-invalid-input";
            case CANCELLED -> "paint-cancelled";
            case UNAVAILABLE -> "paint-unavailable";
        });
        this.failure = failure;
    }

    public Failure failure() { return failure; }
}
