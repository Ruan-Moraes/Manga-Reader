package com.toonlira.translationgateway.domain.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.toonlira.translationgateway.domain.GatewayException;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

class ReadyResultReferenceTest {
    private final Instant now = Instant.parse("2026-10-04T12:00:00Z");

    @ParameterizedTest @CsvSource({"0,200", "100,0", "12001,200", "100,12001", "12000,12000"})
    void rejectsInvalidDimensions(int width, int height) {
        assertThatThrownBy(() -> reference(width, height, "private/rendering/a", "a".repeat(64), 1024, "private/rendering/b", now))
            .isInstanceOf(GatewayException.class).hasMessage("storage-unavailable").hasNoCause();
    }

    @Test void validatesArtifactsAndRedactsRepresentations() {
        var result = reference(100, 200, "private/rendering/a", "a".repeat(64), 1024, "private/rendering/b", now);
        assertThat(result.toString()).doesNotContain("private/", "a".repeat(64));
        assertThatThrownBy(() -> reference(100, 200, "private/rendering/a", "a".repeat(64), 1024, "private/rendering/a", now))
            .isInstanceOf(GatewayException.class);
        assertThatThrownBy(() -> reference(100, 200, "private/rendering/a", "a".repeat(64), 1024, "private/rendering/b", null))
            .isInstanceOf(GatewayException.class);
        assertThatThrownBy(() -> reference(100, 200, "private/rendering/a", "invalid", 1024, "private/rendering/b", now))
            .isInstanceOf(GatewayException.class);
        assertThatThrownBy(() -> reference(100, 200, "https://untrusted/image", "a".repeat(64), 1024, "private/rendering/b", now))
            .isInstanceOf(GatewayException.class);
        assertThatThrownBy(() -> reference(100, 200, "private/rendering/a", "a".repeat(64), 0, "private/rendering/b", now))
            .isInstanceOf(GatewayException.class);
    }

    @ParameterizedTest @ValueSource(ints = {0, -1, 3601})
    void explicitDeadlineRejectsEmptyExpiredOrExcessLifetime(int seconds) {
        assertThatThrownBy(() -> new ReadyResultReference(1, 1, "private/rendering/legacy/image", "a".repeat(64), 32,
            "private/rendering/legacy/manifest", "b".repeat(64), now, now.plusSeconds(seconds)))
            .isInstanceOf(GatewayException.class).hasMessage("storage-unavailable").hasNoCause();
    }
    private ReadyResultReference reference(int width, int height, String key, String hash, long bytes, String manifest, Instant at) {
        return new ReadyResultReference(width, height, key, hash, bytes, manifest, "b".repeat(64), at);
    }
}
