package com.toonlira.translationgateway.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class OriginalObjectKeyTest {
    private static final Instant CREATED = Instant.parse("2026-10-09T00:00:00.123456789Z");
    @ParameterizedTest @ValueSource(ints = {1, 900, 3600})
    void deadlineAndRandomTokenAreImmutableAndNanoExact(int seconds) {
        var first = OriginalObjectKey.create(CREATED, seconds);
        assertThat(OriginalObjectKey.expiry(first)).contains(CREATED.plusSeconds(seconds));
        OriginalObjectKey.validateForStore(first, CREATED);
        assertThat(first).isNotEqualTo(OriginalObjectKey.create(CREATED, seconds));
    }
    @ParameterizedTest @ValueSource(ints = {-1, 0, 3601, Integer.MAX_VALUE})
    void refusesInvalidPolicyWithoutContentOrCause(int seconds) {
        assertThatThrownBy(() -> OriginalObjectKey.create(CREATED, seconds)).isInstanceOfSatisfying(IllegalArgumentException.class, e -> {
            assertThat(e.getMessage()).isEqualTo("Invalid original retention locator");
            assertThat(e.getCause()).isNull();
        });
    }
    @ParameterizedTest @ValueSource(strings = {"private/originals/v1/bad/key", "private/originals/v1/1-1000000000/00000000-0000-0000-0000-000000000000", "private/originals/v1/001-0/00000000-0000-0000-0000-000000000000", "private/originals/v1/1-0/../unsafe"})
    void malformedVersionedLocatorNeverFallsBackToLegacy(String key) {
        assertThatThrownBy(() -> OriginalObjectKey.expiry(key)).isInstanceOf(IllegalArgumentException.class).hasMessage("Invalid original retention locator");
    }
    @Test void legacyIsExplicitAndAChangedCreationTimeCannotExtendTheWindow() {
        assertThat(OriginalObjectKey.expiry("private/originals/legacy")).isEmpty();
        var key = OriginalObjectKey.create(CREATED, 3600);
        assertThatThrownBy(() -> OriginalObjectKey.validateForStore(key, CREATED.minusSeconds(1))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> OriginalObjectKey.validateForStore(key, CREATED.plusSeconds(3600))).isInstanceOf(IllegalArgumentException.class);
    }
}
