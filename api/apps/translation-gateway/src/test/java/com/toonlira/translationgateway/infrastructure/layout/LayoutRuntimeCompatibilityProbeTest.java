package com.toonlira.translationgateway.infrastructure.layout;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;

class LayoutRuntimeCompatibilityProbeTest {
    @Test void nestedLinkerErrorsExposeOnlyAllowlistedCategory() {
        var error = new ExceptionInInitializerError(new UnsatisfiedLinkError("secret/path/model: libc.so.6 unavailable"));
        assertThat(LayoutRuntimeCompatibilityProbe.classify(error)).isEqualTo("missing-glibc");
        assertThat(LayoutRuntimeCompatibilityProbe.classify(new UnsatisfiedLinkError("private path libstdc++.so.6 missing")))
            .isEqualTo("missing-libstdcxx");
        assertThat(LayoutRuntimeCompatibilityProbe.classify(new UnsatisfiedLinkError("private GLIBC_2.27 mismatch")))
            .isEqualTo("glibc-version-mismatch");
    }
    @Test void unknownCauseNeverLeaksMessageOrChangesIntoSuccessfulBootstrap() {
        assertThat(LayoutRuntimeCompatibilityProbe.classify(new IllegalStateException("token raw-provider text")))
            .isEqualTo("bootstrap-unavailable");
        assertThat(LayoutRuntimeCompatibilityProbe.classify(new UnsatisfiedLinkError("unknown native sensitive detail")))
            .isEqualTo("native-linkage-unavailable");
    }
}
