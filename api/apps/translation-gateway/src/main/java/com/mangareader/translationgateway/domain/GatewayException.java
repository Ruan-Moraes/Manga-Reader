package com.mangareader.translationgateway.domain;

public final class GatewayException extends RuntimeException {
    private final GatewayErrorCode code;
    private final int status;
    private final boolean retryable;

    public GatewayException(GatewayErrorCode code, int status, boolean retryable) {
        super(code.value());
        this.code = code;
        this.status = status;
        this.retryable = retryable;
    }

    public GatewayErrorCode code() {
        return code;
    }

    public int status() {
        return status;
    }

    public boolean retryable() {
        return retryable;
    }
}
