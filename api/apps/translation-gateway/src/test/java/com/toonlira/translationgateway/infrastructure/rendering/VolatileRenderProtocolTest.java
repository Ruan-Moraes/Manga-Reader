package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.*;

import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderSource;
import java.io.*;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Test;

class VolatileRenderProtocolTest {
    @Test void roundTripsBoundedMetadataAndBytesOverPipeFrames() throws Exception {
        var request = LocalFileRenderAdapterTest.request(new RenderSource("image/png", 3, 32, 16, "a".repeat(64)),
            List.of(new OcrManifest.Region(new java.util.UUID(0, 1), 0, "日本語", CleanBoxPainterTest.rectangle(.1, .1, .9, .9))),
            RenderPolicy.initial());
        var codec = new NativeRenderChildSettings(Path.of("/lib/webp.so"), "b".repeat(64), Path.of("/lib/sharp.so"), "c".repeat(64), Duration.ofSeconds(60));
        var stream = new ByteArrayOutputStream();
        VolatileRenderProtocol.writeRequest(new DataOutputStream(stream), new byte[]{1, 2, 3}, request,
            new BoundedNativeRenderChildSettings(codec, NativeProcessLimits.initial()));
        var input = new DataInputStream(new ByteArrayInputStream(stream.toByteArray()));
        var decoded = VolatileRenderProtocol.readSettings(input);
        assertThat(decoded.request().regions()).containsExactlyElementsOf(request.regions());
        assertThat(decoded.settings().codec()).isEqualTo(codec);
        assertThat(VolatileRenderProtocol.readFrame(input, 3)).containsExactly(1, 2, 3);
        assertThat(input.read()).isEqualTo(-1);
        assertThat(decoded.toString()).doesNotContain("日本語", "webp.so");
    }
    @Test void refusesOversizedNegativeEmptyAndTruncatedFramesBeforeAllocatingLargeBuffers() throws Exception {
        for (int size : new int[]{-1, 0, 1025, Integer.MAX_VALUE}) {
            var bytes = new ByteArrayOutputStream(); new DataOutputStream(bytes).writeInt(size);
            assertThatThrownBy(() -> VolatileRenderProtocol.readFrame(new DataInputStream(new ByteArrayInputStream(bytes.toByteArray())), 1024))
                .isInstanceOf(IOException.class);
        }
        var truncated = new byte[]{0, 0, 0, 2, 1};
        assertThatThrownBy(() -> VolatileRenderProtocol.readFrame(new DataInputStream(new ByteArrayInputStream(truncated)), 2))
            .isInstanceOf(IOException.class);
    }
}
