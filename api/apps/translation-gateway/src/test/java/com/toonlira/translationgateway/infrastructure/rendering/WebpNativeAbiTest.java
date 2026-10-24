package com.toonlira.translationgateway.infrastructure.rendering;

import static java.lang.foreign.MemoryLayout.PathElement.groupElement;
import static org.assertj.core.api.Assertions.assertThat;
import java.util.Map;
import org.junit.jupiter.api.Test;

class WebpNativeAbiTest {
    @Test void configMatchesOfficialLp64Dwarf() {
        assertThat(WebpNativeAbi.CONFIG.byteSize()).isEqualTo(116);
        assertThat(WebpNativeAbi.CONFIG.byteAlignment()).isEqualTo(4);
        Map.of("lossless", 0L, "quality", 4L, "method", 8L, "exact", 96L,
            "thread_level", 84L, "near_lossless", 92L, "qmax", 112L)
            .forEach((name, offset) -> assertThat(WebpNativeAbi.CONFIG.byteOffset(groupElement(name))).isEqualTo(offset));
    }
    @Test void pictureMatchesOfficialLp64Dwarf() {
        assertThat(WebpNativeAbi.PICTURE.byteSize()).isEqualTo(256);
        assertThat(WebpNativeAbi.PICTURE.byteAlignment()).isEqualTo(8);
        Map.of("use_argb", 0L, "width", 8L, "height", 12L, "argb", 72L, "argb_stride", 80L,
            "writer", 96L, "progress_hook", 144L, "error_code", 136L, "memory_", 224L,
            "memory_argb_", 232L)
            .forEach((name, offset) -> assertThat(WebpNativeAbi.PICTURE.byteOffset(groupElement(name))).isEqualTo(offset));
    }
}
