package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.toonlira.translationgateway.application.port.RenderPort;
import com.toonlira.translationgateway.application.RenderManifestService;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderRequest;
import java.awt.image.BufferedImage;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/** Opt-in Linux/ARM64 packaged renderer and official codecs. No Spring, network, credentials or real media. */
@Tag("testcontainers")
@EnabledIfSystemProperty(named = "renderer.linux.enabled", matches = "true")
class RenderLinuxNativeTest {
    @TempDir Path temporary;

    @BeforeAll static void requireCurrentArchive() throws Exception { RenderArchiveNativeTest.requireCurrentArchive(); }

    @ParameterizedTest
    @ValueSource(strings = {"ja", "en", "es", "ko", "zh-Hans", "zh-Hant", "pt-BR"})
    void packagedLinuxChildRendersEveryDestinationWithCompleteFallbackAndUnchangedOriginal(String target) throws Exception {
        var original = png();
        var before = Files.readAllBytes(original);
        var request = IsolatedRenderAdapterNativeTest.request(original, target);
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            var output = render(fixture, original, request);
            var region = output.manifest().regions().getFirst();
            var input = request.regions().getFirst();
            assertThat(region.id()).isEqualTo(input.id());
            assertThat(region.readingOrder()).isEqualTo(input.readingOrder());
            assertThat(region.sourceText()).isEqualTo(input.sourceText());
            assertThat(region.translatedText()).isEqualTo(input.translatedText());
            assertThat(region.polygon()).containsExactlyElementsOf(input.polygon());
            assertThat(region.overflow()).isFalse();
            assertThat(region.fontSizePx()).isBetween(request.policy().minimumFontPx(), request.policy().maximumFontPx());
            var decoded = decode(fixture, output.path());
            try {
                assertThat(decoded.getWidth()).isEqualTo(320);
                assertThat(decoded.getHeight()).isEqualTo(220);
                assertThat(decoded.getRGB(0, 0)).isEqualTo(0x7fa4c1e3);
            } finally { decoded.flush(); }
            assertThat(Files.readAllBytes(original)).containsExactly(before);
        }
    }

    @ParameterizedTest
    @ValueSource(strings = {"png", "webp"})
    void emptyPageHasNoInventedRegionsAndIsPixelEquivalentAfterLinuxRoundTrip(String format) throws Exception {
        var png = png();
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            Path original = png;
            if (format.equals("webp")) {
                var seed = Files.createDirectory(temporary.resolve("seed"));
                fixture.encode(png, seed, "original.webp");
                original = seed.resolve("original.webp");
            }
            var before = Files.readAllBytes(original);
            var request = LocalFileRenderAdapterTest.request(LocalFileRenderAdapterTest.metadata(original), List.of(), RenderPolicy.initial());
            var output = render(fixture, original, request);
            assertThat(output.manifest().regions()).isEmpty();
            var decoded = decode(fixture, output.path());
            var baseline = ImageIO.read(png.toFile());
            try {
                assertThat(decoded.getRGB(0, 0, 320, 220, null, 0, 320))
                    .containsExactly(baseline.getRGB(0, 0, 320, 220, null, 0, 320));
            } finally { decoded.flush(); baseline.flush(); }
            assertThat(Files.readAllBytes(original)).containsExactly(before);
        }
    }

    @ParameterizedTest
    @ValueSource(strings = {"media", "codec"})
    void childRejectsTamperedMediaOrCodecHashWithoutInventingSuccess(String failure) throws Exception {
        var original = png();
        var request = LocalFileRenderAdapterTest.request(LocalFileRenderAdapterTest.metadata(original), List.of(), RenderPolicy.initial());
        var staging = Files.createDirectory(temporary.resolve("rejected"));
        var settings = new RenderChildSettings(Path.of("/codecs/cwebp"),
            failure.equals("codec") ? "0".repeat(64) : LinuxRenderContainerFixture.ENCODER_SHA256,
            Path.of("/codecs/dwebp"), LinuxRenderContainerFixture.DECODER_SHA256, Duration.ofSeconds(10));
        RenderSubprocessProtocol.writeRequest(staging.resolve("request.bin"), Path.of("/original"), settings, request);
        if (failure.equals("media")) Files.write(original, new byte[] {1, 2, 3});
        var before = Files.readAllBytes(original);
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            assertThatThrownBy(() -> fixture.render(original, staging))
                .isInstanceOf(AssertionError.class).hasMessage("linux-render-test-process-failed").hasNoCause();
            assertThat(Files.readAllBytes(original)).containsExactly(before);
            try (var files = Files.list(staging)) { assertThat(files.toList()).containsExactly(staging.resolve("request.bin")); }
        }
    }

    private RenderPort.Output render(LinuxRenderContainerFixture fixture, Path original, RenderRequest request) throws Exception {
        var staging = Files.createDirectory(temporary.resolve("render"));
        var settings = new RenderChildSettings(Path.of("/codecs/cwebp"), LinuxRenderContainerFixture.ENCODER_SHA256,
            Path.of("/codecs/dwebp"), LinuxRenderContainerFixture.DECODER_SHA256, Duration.ofSeconds(10));
        RenderSubprocessProtocol.writeRequest(staging.resolve("request.bin"), Path.of("/original"), settings, request);
        // The packaged bootstrap must not consult this external configuration in Linux either.
        Files.writeString(staging.resolve("loader.properties"), "loader.main=unexpected.Main\nloader.args=unexpected\n");
        fixture.render(original, staging);
        var output = RenderSubprocessProtocol.readResult(staging.resolve("result.bin"), staging, request);
        var actual = LocalFileRenderAdapterTest.metadata(output.path());
        assertThat(actual.mimeType()).isEqualTo("image/webp");
        assertThat(actual.sha256()).isEqualTo(output.manifest().image().sha256());
        assertThat(actual.byteSize()).isEqualTo(output.manifest().image().byteSize());
        assertThat(actual.widthPx()).isEqualTo(request.source().widthPx());
        assertThat(actual.heightPx()).isEqualTo(request.source().heightPx());
        assertThat(output.manifest().originalSha256()).isEqualTo(request.source().sha256());
        var service = new RenderManifestService(GatewayJsonMapper.create());
        var encoded = service.encode(output.manifest(), request.policy());
        assertThat(service.decode(encoded.bytes(), encoded.sha256(), request, output.manifest().image()).regions())
            .containsExactlyElementsOf(output.manifest().regions());
        try (var files = Files.list(staging)) {
            assertThat(files.toList()).containsExactlyInAnyOrder(staging.resolve("request.bin"), staging.resolve("result.bin"),
                staging.resolve("loader.properties"), output.path());
        }
        return output;
    }

    private BufferedImage decode(LinuxRenderContainerFixture fixture, Path original) throws Exception {
        var staging = Files.createTempDirectory(temporary, "decode-");
        fixture.decode(original, staging);
        var decoded = ImageIO.read(staging.resolve("decoded.png").toFile());
        assertThat(decoded).isNotNull();
        return decoded;
    }

    private Path png() throws Exception {
        var original = temporary.resolve("original.png");
        var image = CleanBoxPainterTest.fixture(320, 220, 0x7fa4c1e3);
        try { assertThat(ImageIO.write(image, "png", original.toFile())).isTrue(); }
        finally { image.flush(); }
        return original;
    }
}
