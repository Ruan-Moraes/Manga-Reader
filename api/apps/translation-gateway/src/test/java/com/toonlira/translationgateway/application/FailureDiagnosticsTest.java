package com.toonlira.translationgateway.application;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import org.junit.jupiter.api.Test;

class FailureDiagnosticsTest {
    @Test
    void namesTypesAndTheOwnFrameButNeverTheMessage() {
        var error = new IllegalStateException("page text: こんにちは gs://bucket/private/originals/x",
            new IOException("secret path /home/user/file"));
        var described = FailureDiagnostics.describe(error);
        assertThat(described).startsWith("IllegalStateException <- IOException at FailureDiagnosticsTest.");
        assertThat(described).doesNotContain("こんにちは", "bucket", "secret", "/home");
    }

    @Test
    void aFixedFailureCodeIsKeptButFreeTextIsNot() {
        var busy = new com.toonlira.translationgateway.infrastructure.rendering.RenderFileException(
            com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.BUSY);
        assertThat(FailureDiagnostics.describe(busy)).isEqualTo("RenderFileException(render-busy)");
        assertThat(FailureDiagnostics.describe(new IllegalStateException("Some Text here"))).startsWith("IllegalStateException at");
    }
}
