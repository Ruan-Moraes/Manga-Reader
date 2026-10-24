package com.toonlira.translationgateway.domain.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class ResultObjectKeyTest {
    private static final Instant NOW = Instant.parse("2026-10-09T00:00:00.123456Z");
    @ParameterizedTest @ValueSource(ints = {1, 60, 3600})
    void immutableDeadlineRoundTripsWithoutJobOrProviderContent(int seconds) {
        var deadline = NOW.plusSeconds(seconds);
        var image = ResultObjectKey.create(deadline, "webp");
        var manifest = ResultObjectKey.create(deadline, "json");
        assertThat(ResultObjectKey.expiry(image)).contains(deadline);
        assertThat(ResultObjectKey.expiry(manifest)).contains(deadline);
        assertThat(image).isNotEqualTo(ResultObjectKey.create(deadline, "webp"));
        ResultObjectKey.validateForStore(image, NOW);
    }
    @ParameterizedTest @ValueSource(strings = {"private/rendering/v1/invalid/private-sensitive", "private/rendering/v2/unknown",
        "private/rendering/v1/123-1000000000/00000000-0000-0000-0000-000000000000.webp"})
    void malformedAndUnknownVersionNeverFallBackToOneHour(String key) {
        assertThatThrownBy(() -> ResultObjectKey.expiry(key)).isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Invalid result retention locator").hasNoCause();
    }
    @Test void legacyIsExplicitAndStoreCannotExtendOrAcceptExpiredDeadline() {
        assertThat(ResultObjectKey.expiry("private/rendering/legacy/image.webp")).isEmpty();
        var expired = ResultObjectKey.create(NOW, "webp");
        assertThatThrownBy(() -> ResultObjectKey.validateForStore(expired, NOW)).hasMessage("Invalid result retention locator");
        var beyond = ResultObjectKey.create(NOW.plusSeconds(3601), "webp");
        assertThatThrownBy(() -> ResultObjectKey.validateForStore(beyond, NOW)).hasMessage("Invalid result retention locator");
    }
}
