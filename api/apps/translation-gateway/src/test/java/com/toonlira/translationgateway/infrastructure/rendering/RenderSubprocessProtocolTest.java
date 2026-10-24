package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderManifest;
import com.toonlira.translationgateway.domain.rendering.RenderedImage;
import com.toonlira.translationgateway.domain.rendering.RenderSource;
import com.toonlira.translationgateway.application.port.RenderPort;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.Arrays;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class RenderSubprocessProtocolTest {
    @TempDir Path temporary;

    @Test
    void privateProtocolPreservesValidatedRequestWithoutTextNormalization() throws Exception {
        var request = LocalFileRenderAdapterTest.request(new RenderSource("image/png", 42, 320, 220, "a".repeat(64)),
            List.of(new OcrManifest.Region(new UUID(0, 1), 0, "日本語 😀 <b>\n ç", CleanBoxPainterTest.rectangle(.1, .1, .9, .9))),
            RenderPolicy.initial());
        var file = temporary.resolve("request.bin");
        var original = temporary.resolve("original.png");
        RenderSubprocessProtocol.writeRequest(file, original, settings(), request);
        var decoded = RenderSubprocessProtocol.readRequest(file);
        assertThat(decoded.original()).isEqualTo(original);
        assertThat(decoded.settings()).isEqualTo(settings());
        assertThat(decoded.request().regions()).containsExactlyElementsOf(request.regions());
        assertThat(decoded.request().source()).isEqualTo(request.source());
        assertThat(decoded.request().policy()).isEqualTo(request.policy());
        assertThat(decoded.request().pair()).isEqualTo(request.pair());
        assertThat(decoded.request().jobRef()).isEqualTo(request.jobRef());
        assertThat(decoded.request().ocrSha256()).isEqualTo(request.ocrSha256());
        assertThat(decoded.request().translationSha256()).isEqualTo(request.translationSha256());
        assertThat(decoded.toString()).isEqualTo("RenderSubprocess.Request[redacted]");
        assertThat(decoded.settings().toString()).isEqualTo("RenderChildSettings[redacted]");
        assertThatThrownBy(() -> RenderSubprocessProtocol.writeRequest(file, original, settings(), request))
            .isInstanceOf(RenderFileException.class).hasMessage("render-unavailable").hasNoCause();
    }

    @Test
    void refusesTruncationUnknownVersionTrailingDataAndOversizedFile() throws Exception {
        var request = LocalFileRenderAdapterTest.request(new RenderSource("image/png", 42, 1, 1, "a".repeat(64)),
            List.of(), RenderPolicy.initial());
        var file = temporary.resolve("request.bin");
        RenderSubprocessProtocol.writeRequest(file, temporary.resolve("image.png"), settings(), request);
        var valid = Files.readAllBytes(file);
        for (var bytes : List.of(new byte[0], new byte[] {1, 2, 3}, Arrays.copyOf(valid, valid.length - 1),
            Arrays.copyOf(valid, valid.length + 1), new byte[RenderSubprocessProtocol.MAX_REQUEST_BYTES + 1])) {
            Files.write(file, bytes);
            assertThatThrownBy(() -> RenderSubprocessProtocol.readRequest(file))
                .isInstanceOf(RenderFileException.class).hasMessage("render-unavailable").hasNoCause();
        }
        valid[0] ^= 1;
        Files.write(file, valid);
        assertThatThrownBy(() -> RenderSubprocessProtocol.readRequest(file)).isInstanceOf(RenderFileException.class);
    }

    @Test
    void childSettingsRejectInvalidPathsHashesAndTimeoutWithoutLeakingValues() {
        assertThatThrownBy(() -> new RenderChildSettings(Path.of("secret-relative"), "secret-token",
            temporary.resolve("decoder"), "a".repeat(64), Duration.ofSeconds(1)))
            .isInstanceOf(RenderFileException.class).hasMessage("render-configuration").hasNoCause();
        assertThatThrownBy(() -> new RenderChildSettings(temporary.resolve("encoder"), "a".repeat(64),
            temporary.resolve("decoder"), "a".repeat(64), Duration.ofSeconds(61)))
            .isInstanceOf(RenderFileException.class).hasMessage("render-configuration");
    }

    @Test
    void countsAreBoundedBeforeAllocationAndNoUnknownFieldsAreAccepted() throws Exception {
        var request = LocalFileRenderAdapterTest.request(new RenderSource("image/png", 42, 1, 1, "a".repeat(64)),
            List.of(), RenderPolicy.initial());
        var file = temporary.resolve("request.bin");
        RenderSubprocessProtocol.writeRequest(file, temporary.resolve("image.png"), settings(), request);
        var bytes = Files.readAllBytes(file);
        for (int count : new int[] {-1, 1025, Integer.MAX_VALUE}) {
            ByteBuffer.wrap(bytes).putInt(bytes.length - Integer.BYTES, count);
            Files.write(file, bytes);
            assertThatThrownBy(() -> RenderSubprocessProtocol.readRequest(file)).hasMessage("render-unavailable");
        }
    }

    @Test
    void resultContainsOnlyPlacementsAndMetadataAndRemainsBoundToOriginalRequest() throws Exception {
        var request = LocalFileRenderAdapterTest.request(new RenderSource("image/png", 42, 32, 22, "a".repeat(64)),
            List.of(new OcrManifest.Region(new UUID(0, 1), 0, "PRIVATE SOURCE", CleanBoxPainterTest.rectangle(.1, .1, .9, .9))),
            RenderPolicy.initial());
        var image = new RenderedImage("image/webp", 30, 32, 22, "d".repeat(64));
        var result = new RenderPort.Output(temporary.resolve("render-fixture.webp"), RenderManifest.create(request, image,
            List.of(new RenderManifest.Placement(request.regions().getFirst().id(), false, 12))));
        var file = temporary.resolve("result.bin");
        RenderSubprocessProtocol.writeResult(file, result);
        var bytes = Files.readAllBytes(file);
        assertThat(new String(bytes, StandardCharsets.ISO_8859_1)).doesNotContain("PRIVATE SOURCE", "Olá");
        var decoded = RenderSubprocessProtocol.readResult(file, temporary, request);
        assertThat(decoded.path()).isEqualTo(result.path());
        assertThat(decoded.manifest().regions()).containsExactlyElementsOf(result.manifest().regions());
        var missing = LocalFileRenderAdapterTest.request(request.source(), List.of(), request.policy());
        assertThatThrownBy(() -> RenderSubprocessProtocol.readResult(file, temporary, missing)).hasMessage("render-unavailable");
        bytes[bytes.length - Integer.BYTES - 1] = 2;
        Files.write(file, bytes);
        assertThatThrownBy(() -> RenderSubprocessProtocol.readResult(file, temporary, request)).hasMessage("render-unavailable");
    }

    @Test
    void resultPathNeverAcceptsOriginalOrDirectoryTraversalAndSymlinkIpcIsRejected() throws Exception {
        var request = LocalFileRenderAdapterTest.request(new RenderSource("image/png", 42, 1, 1, "a".repeat(64)),
            List.of(), RenderPolicy.initial());
        var manifest = RenderManifest.create(request, new RenderedImage("image/webp", 30, 1, 1, "d".repeat(64)), List.of());
        var file = temporary.resolve("result.bin");
        RenderSubprocessProtocol.writeResult(file, new RenderPort.Output(temporary.resolve("original.png"), manifest));
        assertThatThrownBy(() -> RenderSubprocessProtocol.readResult(file, temporary, request)).hasMessage("render-unavailable");
        var alias = temporary.resolve("alias.bin");
        Files.createSymbolicLink(alias, file);
        assertThatThrownBy(() -> RenderSubprocessProtocol.readResult(alias, temporary, request)).hasMessage("render-unavailable");
    }

    private RenderChildSettings settings() {
        return new RenderChildSettings(temporary.resolve("encoder"), "d".repeat(64),
            temporary.resolve("decoder"), "e".repeat(64), Duration.ofSeconds(10));
    }
}
