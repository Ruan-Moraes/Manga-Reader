package com.toonlira.translationgateway.domain.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.toonlira.translationgateway.domain.GatewayException;
import java.net.URI;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class PrivateDownloadTest {
    private static final Instant DEADLINE = Instant.parse("2026-10-04T12:00:00Z");
    private static final String HASH = "a".repeat(64);

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"public/file", "private/rendering/../secret", "gs://bucket/file", "private/rendering/a?x=1", "private/rendering//a"})
    void invalidKeyIsRejectedWithoutDisclosure(String key) {
        assertThatThrownBy(() -> new PrivateDownloadRequest(key, PrivateDownloadRequest.Kind.IMAGE, HASH, 12L, DEADLINE))
            .isInstanceOf(GatewayException.class).hasMessage("storage-unavailable").hasNoCause();
    }

    @Test
    void metadataBoundsAndMandatoryInputsAreValidated() {
        assertThatThrownBy(() -> request(null, HASH, 12L, DEADLINE)).isInstanceOf(GatewayException.class);
        assertThatThrownBy(() -> request(PrivateDownloadRequest.Kind.IMAGE, "not-a-hash", 12L, DEADLINE)).isInstanceOf(GatewayException.class);
        assertThatThrownBy(() -> request(PrivateDownloadRequest.Kind.IMAGE, HASH, null, DEADLINE)).isInstanceOf(GatewayException.class);
        assertThatThrownBy(() -> request(PrivateDownloadRequest.Kind.IMAGE, HASH, 0L, DEADLINE)).isInstanceOf(GatewayException.class);
        assertThatThrownBy(() -> request(PrivateDownloadRequest.Kind.IMAGE, HASH, RenderPolicy.MAX_OUTPUT_BYTES + 1, DEADLINE)).isInstanceOf(GatewayException.class);
        assertThatThrownBy(() -> request(PrivateDownloadRequest.Kind.IMAGE, HASH, 12L, null)).isInstanceOf(GatewayException.class);
        assertThat(request(PrivateDownloadRequest.Kind.MANIFEST, HASH, null, DEADLINE).kind().maxBytes())
            .isEqualTo(RenderPolicy.MAX_MANIFEST_BYTES);
    }

    @Test
    void requestsAndDownloadsNeverPrintKeysUrlsOrHashes() {
        var request = request(PrivateDownloadRequest.Kind.IMAGE, HASH, 12L, DEADLINE);
        var download = new PrivateDownload(URI.create("https://storage.googleapis.com/bucket/private/rendering/image?signature=synthetic"),
            "image/webp", 12, HASH, DEADLINE);
        assertThat(request.toString()).isEqualTo("PrivateDownloadRequest[redacted]");
        assertThat(download.toString()).isEqualTo("PrivateDownload[redacted]");
    }

    @ParameterizedTest
    @ValueSource(strings = {"http://storage.googleapis.com/b/a?q=1", "https://evil.test/b/a?q=1", "file:///tmp/a", "https://user@storage.googleapis.com/b/a?q=1", "https://storage.googleapis.com:8443/b/a?q=1", "https://storage.googleapis.com/b/a?q=1#fragment"})
    void downloadRejectsUnsafeLocation(String url) {
        assertThatThrownBy(() -> new PrivateDownload(URI.create(url), "image/webp", 12, HASH, DEADLINE))
            .isInstanceOf(GatewayException.class).hasMessage("storage-unavailable").hasNoCause();
    }

    private PrivateDownloadRequest request(PrivateDownloadRequest.Kind kind, String hash, Long bytes, Instant deadline) {
        return new PrivateDownloadRequest("private/rendering/image", kind, hash, bytes, deadline);
    }
}
