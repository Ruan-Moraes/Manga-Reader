package com.toonlira.translationgateway.domain.layout;

/** Only allowlisted codes cross the experimental boundary; never attach native exceptions. */
public final class LayoutFailure extends RuntimeException {
    public enum Code { UNAVAILABLE, TIMEOUT, INVALID_RESPONSE, LIMIT_EXCEEDED }

    public LayoutFailure(Code code) {
        super(switch (code) {
            case UNAVAILABLE -> "layout-unavailable";
            case TIMEOUT -> "layout-timeout";
            case INVALID_RESPONSE -> "layout-invalid-response";
            case LIMIT_EXCEEDED -> "layout-limit-exceeded";
        });
    }
}
