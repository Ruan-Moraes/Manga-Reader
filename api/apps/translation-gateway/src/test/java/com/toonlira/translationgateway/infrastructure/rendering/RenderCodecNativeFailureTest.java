package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class RenderCodecNativeFailureTest {
    @Test void nativeAllocationReasonsRemainSanitizedAndDoNotChangeThePublicFailure() {
        assertReason(1, "ALLOCATION");
        assertReason(2, "BITSTREAM_ALLOCATION");
        for (int value : new int[] {-1, 0, 3, 8, 10, 11, Integer.MAX_VALUE}) assertReason(value, "OTHER");
    }

    @Test void ordinaryExceptionsDoNotInventANativeReason() {
        for (var failure : RenderCodecException.Failure.values()) {
            var error = new RenderCodecException(failure);
            assertThat(error.nativeFailure()).isNull();
            assertThat(error.getCause()).isNull();
        }
    }

    private static void assertReason(int value, String expected) {
        var error = RenderCodecException.nativeEncodeFailure(value);
        assertThat(error.failure()).isEqualTo(RenderCodecException.Failure.UNAVAILABLE);
        assertThat(error.nativeFailure().name()).isEqualTo(expected);
        assertThat(error.getMessage()).isEqualTo("codec-unavailable");
        assertThat(error.getCause()).isNull();
        assertThat(error.toString()).isEqualTo(RenderCodecException.class.getName() + ": codec-unavailable");
    }
}
