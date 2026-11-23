package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.OcrManifest;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class AdmittedRenderFaultsTest {
    @TempDir Path temporary;

    @Test void scratchFaultCannotFillAnUnboundedOrNonTmpfsHostFilesystem() throws Exception {
        assertThatThrownBy(() -> AdmittedRenderFaults.fillScratch(temporary))
            .hasMessage("test-fault-invalid-scratch");
        assertThat(Files.exists(temporary.resolve("test-pressure.bin"))).isFalse();
    }

    @Test void processSignalsAreRefusedOutsideTheOwnedContainerChild() {
        assertThatThrownBy(() -> AdmittedRenderFaults.signalOwnedChild(null, true)).hasMessage("test-fault-invalid-child");
    }

    @Test void changesExactlyOneLimitAndKeepsRequestSourceTextGeometryAndPolicyUnchanged() throws Exception {
        var original = temporary.resolve("original.png");
        ImageIO.write(CleanBoxPainterTest.fixture(32, 22, 0xffeeeeee), "png", original.toFile());
        var region = new OcrManifest.Region(new UUID(0, 1), 0, "漢😀<b> source\n", List.of(
            new OcrManifest.Vertex(.1, .1), new OcrManifest.Vertex(.4, .1),
            new OcrManifest.Vertex(.4, .4), new OcrManifest.Vertex(.1, .4)));
        var request = LocalFileRenderAdapterTest.request(LocalFileRenderAdapterTest.metadata(original), List.of(region), RenderPolicy.initial());
        var codec = new NativeRenderChildSettings(temporary.resolve("libwebp.so"), "a".repeat(64),
            temporary.resolve("libsharp.so"), "b".repeat(64), Duration.ofSeconds(60));
        var file = temporary.resolve("request.bin");
        RenderSubprocessProtocol.writeRequest(file, original, new BoundedNativeRenderChildSettings(codec, NativeProcessLimits.initial()), request);
        var before = Files.readAllBytes(file); var parsedBefore = RenderSubprocessProtocol.readRequest(file);
        int offset = AdmittedRenderFaults.lowerChildAddressCeiling(file);
        var after = Files.readAllBytes(file); var parsedAfter = RenderSubprocessProtocol.readRequest(file);
        assertThat(after).hasSameSizeAs(before);
        for (int index = 0; index < before.length; index++) if (index < offset || index >= offset + Long.BYTES)
            assertThat(after[index]).isEqualTo(before[index]);
        assertThat(parsedAfter.original()).isEqualTo(parsedBefore.original());
        var actual = parsedAfter.request(); var expected = parsedBefore.request();
        assertThat(actual.jobRef()).isEqualTo(expected.jobRef());
        assertThat(actual.source()).isEqualTo(expected.source());
        assertThat(actual.pair()).isEqualTo(expected.pair());
        assertThat(actual.ocrSha256()).isEqualTo(expected.ocrSha256());
        assertThat(actual.translationSha256()).isEqualTo(expected.translationSha256());
        assertThat(actual.policy()).isEqualTo(expected.policy());
        assertThat(actual.regions()).containsExactlyElementsOf(expected.regions());
        var changed = (BoundedNativeRenderChildSettings) parsedAfter.settings();
        assertThat(changed.codec()).isEqualTo(codec);
        assertThat(changed.limits().addressSpaceBytes()).isEqualTo(AdmittedRenderFaults.FAILURE_ADDRESS_BYTES);
        assertThat(changed.limits().cpuSeconds()).isEqualTo(NativeProcessLimits.initial().cpuSeconds());
        assertThat(changed.limits().fileBytes()).isEqualTo(NativeProcessLimits.initial().fileBytes());
        assertThat(changed.limits().openFiles()).isEqualTo(NativeProcessLimits.initial().openFiles());
        assertThatThrownBy(() -> AdmittedRenderFaults.lowerChildAddressCeiling(file)).hasMessage("test-fault-invalid-envelope");
    }
}
