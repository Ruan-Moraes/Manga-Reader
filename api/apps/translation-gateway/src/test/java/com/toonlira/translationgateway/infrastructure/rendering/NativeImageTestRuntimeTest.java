package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class NativeImageTestRuntimeTest {
    private static final String ARM = "sha256:" + "a".repeat(64);
    private static final String AMD = "sha256:" + "b".repeat(64);

    @Test
    void defaultRuntimeRemainsTemurin() {
        assertThat(NativeImageTestRuntime.executable(null, ARM, null, null))
            .isEqualTo("/opt/java/openjdk/bin/java");
        assertThat(NativeImageTestRuntime.executable("temurin", AMD, ARM, AMD))
            .isEqualTo("/opt/java/openjdk/bin/java");
    }

    @Test
    void ubuntuMustSelectExplicitArchitectureWithoutChangingTheDefault() {
        assertThat(NativeImageTestRuntime.executable("ubuntu", ARM, ARM, AMD))
            .isEqualTo("/usr/lib/jvm/java-25-openjdk-arm64/bin/java");
        assertThat(NativeImageTestRuntime.executable("ubuntu", AMD, ARM, AMD))
            .isEqualTo("/usr/lib/jvm/java-25-openjdk-amd64/bin/java");
    }

    @Test
    void unknownAmbiguousOrUnpinnedSelectionFailsClosedWithoutRawInputs() {
        for (var arguments : new String[][] {
            {"unknown-private-runtime", ARM, ARM, AMD}, {"ubuntu", ARM, ARM, ARM},
            {"ubuntu", ARM, null, AMD}, {"ubuntu", ARM, ARM, "mutable-tag"},
            {"ubuntu", "sha256:" + "c".repeat(64), ARM, AMD}, {"ubuntu", null, ARM, AMD}
        }) {
            assertThatThrownBy(() -> NativeImageTestRuntime.executable(arguments[0], arguments[1], arguments[2], arguments[3]))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("linux-render-test-configuration").hasNoCause();
        }
    }
}
