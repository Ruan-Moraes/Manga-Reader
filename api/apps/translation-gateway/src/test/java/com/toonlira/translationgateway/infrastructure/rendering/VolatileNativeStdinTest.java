package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import org.junit.jupiter.api.Test;

class VolatileNativeStdinTest {
    @Test void readsOnlyTheBoundedClientPipeWithoutAnOriginalFile() throws Exception {
        byte[] bytes = {1, 2, 3};
        assertThat(VolatileNativeProbe.readClientOriginal(new ByteArrayInputStream(bytes))).containsExactly(bytes);
    }
    @Test void acceptsTheExactTwelveMiBLimit() throws Exception {
        byte[] bytes = new byte[12 * 1024 * 1024];
        assertThat(VolatileNativeProbe.readClientOriginal(new ByteArrayInputStream(bytes))).hasSize(bytes.length);
    }
    @Test void rejectsEmptyAndOversizedClientPipes() {
        assertThatThrownBy(() -> VolatileNativeProbe.readClientOriginal(new ByteArrayInputStream(new byte[0]))).isInstanceOf(IOException.class);
        assertThatThrownBy(() -> VolatileNativeProbe.readClientOriginal(new ByteArrayInputStream(new byte[12 * 1024 * 1024 + 1])))
            .isInstanceOf(IOException.class);
    }
}
