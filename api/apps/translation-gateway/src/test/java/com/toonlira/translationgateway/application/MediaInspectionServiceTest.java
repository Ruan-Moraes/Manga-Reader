package com.toonlira.translationgateway.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import java.io.ByteArrayInputStream;
import java.nio.ByteBuffer;
import org.junit.jupiter.api.Test;

class MediaInspectionServiceTest {
    private final MediaInspectionService inspector = new MediaInspectionService();

    @Test
    void shouldInspectPngFromItsSignatureAndIhdr() {
        var bytes = new byte[32];
        byte[] signature = {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a};
        System.arraycopy(signature, 0, bytes, 0, signature.length);
        bytes[12] = 'I'; bytes[13] = 'H'; bytes[14] = 'D'; bytes[15] = 'R';
        ByteBuffer.wrap(bytes, 16, 8).putInt(320).putInt(640);

        var result = inspector.inspect(new ByteArrayInputStream(bytes), 1024);
        try {
            assertThat(result.mimeType()).isEqualTo("image/png");
            assertThat(result.widthPx()).isEqualTo(320);
            assertThat(result.heightPx()).isEqualTo(640);
            assertThat(result.sha256()).hasSize(64);
        } finally {
            inspector.deleteQuietly(result.path());
        }
    }

    @Test
    void shouldRejectUnknownOrOversizedContent() {
        assertThatThrownBy(() -> inspector.inspect(new ByteArrayInputStream(new byte[40]), 1024))
            .isInstanceOfSatisfying(GatewayException.class,
                error -> assertThat(error.code()).isEqualTo(GatewayErrorCode.UNSUPPORTED_MEDIA_TYPE));
        assertThatThrownBy(() -> inspector.inspect(new ByteArrayInputStream(new byte[20]), 10))
            .isInstanceOfSatisfying(GatewayException.class,
                error -> assertThat(error.code()).isEqualTo(GatewayErrorCode.PAYLOAD_TOO_LARGE));
    }

    @Test
    void shouldRejectARecognizedHeaderWithInvalidDimensions() {
        var bytes = new byte[32];
        byte[] signature = {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a};
        System.arraycopy(signature, 0, bytes, 0, signature.length);
        bytes[12] = 'I'; bytes[13] = 'H'; bytes[14] = 'D'; bytes[15] = 'R';
        ByteBuffer.wrap(bytes, 16, 8).putInt(0).putInt(640);

        assertThatThrownBy(() -> inspector.inspect(new ByteArrayInputStream(bytes), 1024))
            .isInstanceOfSatisfying(GatewayException.class,
                error -> assertThat(error.code()).isEqualTo(GatewayErrorCode.INVALID_REQUEST));
    }
}
