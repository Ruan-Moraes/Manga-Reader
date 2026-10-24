package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;

import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.toonlira.translationgateway.application.RenderManifestService;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderRequest;
import com.toonlira.translationgateway.domain.rendering.RenderedImage;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import com.toonlira.translationgateway.domain.translation.TranslationValidator;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;
import java.time.Duration;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/** Real local child JVM/libwebp, synthetic text only. Not cloud, linguistic approval or a volume benchmark. */
@EnabledIfSystemProperty(named = "renderer.native.enabled", matches = "true")
class IsolatedRenderAdapterNativeTest {
    @TempDir Path temporary;

    @ParameterizedTest
    @ValueSource(strings = {"ja", "en", "es", "ko", "zh-Hans", "zh-Hant", "pt-BR"})
    void isolatedOutputIsPixelEquivalentToExistingPainterAndManifestForEveryDestination(String target) throws Exception {
        assertEquivalent(temporary, new IsolatedRenderAdapter(temporary, settings(), Duration.ofSeconds(60), 768), target);
    }

    static void assertEquivalent(Path temporary, IsolatedRenderAdapter adapter, String target) throws Exception {
        var original = temporary.resolve("original.png");
        assertThat(ImageIO.write(CleanBoxPainterTest.fixture(320, 220, 0x7fa4c1e3), "png", original.toFile())).isTrue();
        var before = Files.readAllBytes(original);
        var request = request(original, target);
        var settings = settings();
        var codec = new WebpProcessCodec(settings.encoder(), settings.encoderSha256(), settings.decoder(),
            settings.decoderSha256(), settings.nativeTimeout());
        var expected = new LocalFileRenderAdapter(codec, new PageRasterPainter(Fonts.VALUE), temporary).render(original, request);
        var actual = adapter.render(original, request);
        assertThat(actual.manifest().regions()).containsExactlyElementsOf(expected.manifest().regions());
        assertThat(actual.manifest().originalSha256()).isEqualTo(request.source().sha256());
        assertThat(actual.manifest().ocrSha256()).isEqualTo(request.ocrSha256());
        assertThat(actual.manifest().translationSha256()).isEqualTo(request.translationSha256());
        var first = codec.decode(expected.path(), expected.manifest().image(), request.policy());
        var second = codec.decode(actual.path(), actual.manifest().image(), request.policy());
        try {
            assertThat(second.getRGB(0, 0, 320, 220, null, 0, 320)).containsExactly(first.getRGB(0, 0, 320, 220, null, 0, 320));
        } finally { first.flush(); second.flush(); }
        assertThat(Files.readAllBytes(original)).containsExactly(before);
        assertThat(Files.getPosixFilePermissions(actual.path())).isEqualTo(PosixFilePermissions.fromString("rw-------"));
        var service = new RenderManifestService(GatewayJsonMapper.create());
        var encoded = service.encode(actual.manifest(), request.policy());
        assertThat(service.decode(encoded.bytes(), encoded.sha256(), request, actual.manifest().image()).regions())
            .containsExactlyElementsOf(actual.manifest().regions());
        try (var files = Files.list(temporary.toRealPath())) {
            assertThat(files.toList()).containsExactlyInAnyOrder(original.toRealPath(), expected.path(), actual.path());
        }
    }

    @ParameterizedTest
    @ValueSource(strings = {"png", "webp"})
    void emptyPagePassesThroughChildWithoutInventingTextOrBoxes(String format) throws Exception {
        assertEmpty(temporary, new IsolatedRenderAdapter(temporary, settings(), Duration.ofSeconds(60), 768), format);
    }

    static void assertEmpty(Path temporary, IsolatedRenderAdapter adapter, String format) throws Exception {
        var settings = settings();
        var codec = new WebpProcessCodec(settings.encoder(), settings.encoderSha256(), settings.decoder(),
            settings.decoderSha256(), settings.nativeTimeout());
        var image = CleanBoxPainterTest.fixture(320, 220, 0x7fa4c1e3);
        var original = temporary.resolve("original." + format);
        if (format.equals("webp")) Files.move(codec.encode(image, temporary, RenderPolicy.initial()).path(), original);
        else assertThat(ImageIO.write(image, format, original.toFile())).isTrue();
        var before = Files.readAllBytes(original);
        var source = LocalFileRenderAdapterTest.metadata(original);
        var request = LocalFileRenderAdapterTest.request(source, List.of(), RenderPolicy.initial());
        var output = adapter.render(original, request);
        var baseline = format.equals("webp") ? codec.decode(original, new RenderedImage("image/webp", source.byteSize(),
            source.widthPx(), source.heightPx(), source.sha256()), request.policy()) : ImageIO.read(original.toFile());
        var decoded = codec.decode(output.path(), output.manifest().image(), request.policy());
        try {
            assertThat(decoded.getRGB(0, 0, 320, 220, null, 0, 320)).containsExactly(baseline.getRGB(0, 0, 320, 220, null, 0, 320));
        } finally { baseline.flush(); decoded.flush(); image.flush(); }
        assertThat(output.manifest().regions()).isEmpty();
        assertThat(Files.readAllBytes(original)).containsExactly(before);
        try (var files = Files.list(temporary.toRealPath())) { assertThat(files.toList()).containsExactlyInAnyOrder(original.toRealPath(), output.path()); }
    }

    static RenderRequest request(Path original, String target) throws Exception {
        var source = LocalFileRenderAdapterTest.metadata(original);
        var pair = new LanguagePair(target.equals("en") ? "pt-BR" : "en", target);
        var job = new UUID(0, 123);
        var id = new UUID(0, 1);
        var text = switch (target) {
            case "ja" -> "漫画のページ。";
            case "ko" -> "만화 페이지.";
            case "zh-Hans" -> "漫画页面。";
            case "zh-Hant" -> "漫畫頁面。";
            case "es" -> "¡Página de manga!";
            case "pt-BR" -> "Olá, mangá!";
            default -> "Manga page!";
        };
        var ocr = new OcrManifest("1.0", job, pair.source(), source.widthPx(), source.heightPx(),
            List.of(new OcrManifest.Region(id, 0, "source", CleanBoxPainterTest.rectangle(.1, .1, .9, .9))));
        var translation = new TranslationValidator(Set.of(pair)).validateResponse(new TranslationRequest(job, pair,
            List.of(new TranslationRequest.Region(id, 0, "source"))), new TranslationResponse(List.of(new TranslationResponse.Region(id, text))));
        return RenderRequest.create(source, ocr, translation, "b".repeat(64), "c".repeat(64), RenderPolicy.initial());
    }

    static RenderChildSettings settings() {
        return new RenderChildSettings(Path.of(System.getProperty("renderer.cwebp.path")), System.getProperty("renderer.cwebp.sha256"),
            Path.of(System.getProperty("renderer.dwebp.path")), System.getProperty("renderer.dwebp.sha256"), Duration.ofSeconds(10));
    }
    private static final class Fonts { private static final BundledRenderingFonts VALUE = new BundledRenderingFonts(); }
}
