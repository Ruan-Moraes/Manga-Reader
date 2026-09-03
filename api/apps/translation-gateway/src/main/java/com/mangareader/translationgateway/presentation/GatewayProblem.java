package com.mangareader.translationgateway.presentation;

import com.mangareader.translationgateway.domain.GatewayErrorCode;
import java.net.URI;
import java.util.UUID;

public record GatewayProblem(URI type, String title, int status, String code, String contractVersion,
                             UUID correlationRef, boolean retryable) {
    public static GatewayProblem of(GatewayErrorCode code, int status, boolean retryable) {
        return new GatewayProblem(URI.create("https://translation-api.mangareader.app/problems/" + code.value()),
            code.value(), status, code.value(), "1.0", UUID.randomUUID(), retryable);
    }
}
