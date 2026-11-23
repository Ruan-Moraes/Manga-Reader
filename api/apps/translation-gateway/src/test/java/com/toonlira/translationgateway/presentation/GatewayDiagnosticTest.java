package com.toonlira.translationgateway.presentation;

import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class GatewayDiagnosticTest {
    @Test void knownFailureReturnsOnlyCodeAndCorrelationHeaders() {
        var result = new GatewayExceptionHandler().gateway(new GatewayException(GatewayErrorCode.OCR_UNAVAILABLE, 503, true));
        assertThat(result.getHeaders().getFirst("X-Toonlira-Error")).isEqualTo("ocr-unavailable");
        assertThat(UUID.fromString(result.getHeaders().getFirst("X-Toonlira-Correlation"))).isEqualTo(result.getBody().correlationRef());
        assertThat(result.getStatusCode().value()).isEqualTo(503);
    }
}
