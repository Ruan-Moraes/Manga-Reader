package com.toonlira.translationgateway.application.port;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderValidationException;
import com.toonlira.translationgateway.domain.rendering.RenderedImage;
import com.toonlira.translationgateway.domain.rendering.ResultObjectKey;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class RenderingArtifactsTest {
    @Test
    void acceptsExactMetadataLimitsWithoutExposingObjectReferences() {
        var image = new RenderedImage("image/webp", RenderPolicy.MAX_OUTPUT_BYTES, 100, 200, "a".repeat(64));
        var artifacts = new RenderingJobRepository.Artifacts("i".repeat(512), image, "m".repeat(512), "b".repeat(64));
        assertThat(artifacts.image()).isSameAs(image);
        assertThat(artifacts.imageObjectKey()).hasSize(512);
        assertThat(artifacts.manifestObjectKey()).hasSize(512);
        assertThat(artifacts.toString()).doesNotContain("i".repeat(512), "m".repeat(512), "a".repeat(64), "b".repeat(64));
    }

    @Test void pairedLocatorsMustShareOneDeadlineWithoutMixingLegacyAndVersioned() {
        var at = Instant.parse("2026-10-09T00:00:00Z");
        var image = new RenderedImage("image/webp", 32, 1, 1, "a".repeat(64));
        var imageKey = ResultObjectKey.create(at, "webp");
        var manifestKey = ResultObjectKey.create(at, "json");
        assertThat(new RenderingJobRepository.Artifacts(imageKey, image, manifestKey, "b".repeat(64)).resultExpiresAt()).contains(at);
        assertThatThrownBy(() -> new RenderingJobRepository.Artifacts(imageKey, image, ResultObjectKey.create(at.plusSeconds(1), "json"), "b".repeat(64)))
            .isInstanceOf(RenderValidationException.class).hasMessage("INVALID_OUTPUT").hasNoCause();
        assertThatThrownBy(() -> new RenderingJobRepository.Artifacts(imageKey, image, "private/rendering/legacy.json", "b".repeat(64)))
            .isInstanceOf(RenderValidationException.class).hasMessage("INVALID_OUTPUT").hasNoCause();
    }

    @ParameterizedTest
    @ValueSource(strings = {"null-image-key", "blank-image-key", "long-image-key", "null-manifest-key", "blank-manifest-key",
        "long-manifest-key", "equal-keys", "null-image", "oversized-image", "null-hash", "short-hash", "upper-hash"})
    void rejectsInvalidMetadataWithSanitizedRepresentations(String failure) {
        String imageKey = failure.equals("null-image-key") ? null : failure.equals("blank-image-key") ? " \n\t"
            : failure.equals("long-image-key") ? "i".repeat(513) : "private/image-secret";
        String manifestKey = failure.equals("null-manifest-key") ? null : failure.equals("blank-manifest-key") ? " \n\t"
            : failure.equals("long-manifest-key") ? "m".repeat(513) : failure.equals("equal-keys") ? imageKey : "private/manifest-secret";
        var image = failure.equals("null-image") ? null : new RenderedImage("image/webp",
            failure.equals("oversized-image") ? RenderPolicy.MAX_OUTPUT_BYTES + 1 : 1024, 100, 200, "a".repeat(64));
        String hash = failure.equals("null-hash") ? null : failure.equals("short-hash") ? "a".repeat(63)
            : failure.equals("upper-hash") ? "A".repeat(64) : "b".repeat(64);
        assertThatThrownBy(() -> new RenderingJobRepository.Artifacts(imageKey, image, manifestKey, hash))
            .isInstanceOf(RenderValidationException.class)
            .hasMessage("INVALID_OUTPUT").hasNoCause()
            .hasToString("com.toonlira.translationgateway.domain.rendering.RenderValidationException: INVALID_OUTPUT");
    }
}
