package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.toonlira.translationgateway.domain.SupportedLanguages;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class BundledRenderingFontsTest {
    private static final String ROOT = "/rendering/fonts/";
    private static BundledRenderingFonts fonts;

    private static BundledRenderingFonts fonts() {
        if (fonts == null) fonts = new BundledRenderingFonts();
        return fonts;
    }

    @ParameterizedTest
    @MethodSource("destinations")
    void loadsVerifiedPhysicalFaceAndFixtureGlyphsForEachDestination(String code, String face, String text) {
        var font = fonts().fontFor(code, 24);
        assertThat(font.getPSName()).isEqualTo(face);
        assertThat(font.getSize2D()).isEqualTo(24);
        assertThat(fonts().canDisplay(code, text)).isTrue();
        assertThat(fonts().version()).isEqualTo("noto-sans-regular-1.0");
    }

    @Test
    void keepsChineseVariantsDistinctAndNeverSelectsBySourceOrLocale() {
        assertThat(fonts().fontFor("zh-Hans", 20).getPSName()).isEqualTo("NotoSansCJKsc-Regular");
        assertThat(fonts().fontFor("zh-Hant", 20).getPSName()).isEqualTo("NotoSansCJKtc-Regular");
        assertThat(fonts().assets()).hasSize(5);
        assertThat(fonts().assets()).extracting(BundledRenderingFonts.Asset::sha256).doesNotHaveDuplicates();
        assertThatThrownBy(() -> fonts().assets().clear()).isInstanceOf(UnsupportedOperationException.class);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"pt", "zh", "zh-TW", "en-US", "ar", "pt-br"})
    void refusesUnknownDestinationWithoutLogicalFontFallback(String code) {
        assertThatThrownBy(() -> fonts().fontFor(code, 20)).isInstanceOf(RenderFontException.class)
            .hasMessage("font-invalid-input").hasNoCause();
    }

    @ParameterizedTest
    @ValueSource(floats = {0, -1, 12001, Float.NaN, Float.POSITIVE_INFINITY})
    void refusesInvalidSize(float size) {
        assertThatThrownBy(() -> fonts().fontFor("pt-BR", size)).isInstanceOf(RenderFontException.class)
            .hasMessage("font-invalid-input");
    }

    @Test
    void detectsMissingGlyphAndInvalidSurrogateWithoutChangingOrLoggingText() {
        String text = "  café\n<script>ação</script>\t ";
        assertThat(fonts().canDisplay("pt-BR", text)).isTrue();
        assertThat(text).isEqualTo("  café\n<script>ação</script>\t ");
        assertThat(fonts().canDisplay("pt-BR", "😀")).isFalse();
        assertThat(fonts().canDisplay("pt-BR", "\uD800")).isFalse();
        assertThat(fonts().canDisplay("pt-BR", "")).isTrue();
        assertThatThrownBy(() -> fonts().canDisplay("pt-BR", null)).isInstanceOf(RenderFontException.class)
            .hasMessage("font-invalid-input").hasNoCause();
        assertThat(fonts().toString()).doesNotContain(text, "script");
    }

    @Test
    void missingResourceOrLicenseFailsClosedWithoutUsingMachineFonts() {
        for (String missing : new String[]{"font-pack.json", "NotoSans-Regular.ttf", "OFL-NotoSans.txt", "OFL-NotoSansCJK.txt"}) {
            assertThatThrownBy(() -> new BundledRenderingFonts(path -> path.endsWith(missing) ? null : resource(path)))
                .isInstanceOf(RenderFontException.class).hasMessage("font-configuration").hasNoCause();
        }
    }

    @Test
    void corruptedFontIsRejectedBeforeNativeParsingAndRawFailureIsRedacted() {
        var opens = new AtomicInteger();
        assertThatThrownBy(() -> new BundledRenderingFonts(path -> {
            if (path.endsWith("NotoSans-Regular.ttf")) { opens.incrementAndGet(); return new ByteArrayInputStream("private text".getBytes()); }
            return resource(path);
        })).isInstanceOf(RenderFontException.class).hasMessage("font-configuration").hasNoCause();
        assertThat(opens).hasValue(1);
        assertThatThrownBy(() -> new BundledRenderingFonts(path -> { throw new IOException("private path and credentials"); }))
            .isInstanceOf(RenderFontException.class).hasMessage("font-configuration").hasNoCause();
    }

    @Test
    void validatesAndParsesSameSnapshotOpeningEachFontOnlyOnce() {
        var opens = new HashMap<String, Integer>();
        var loaded = new BundledRenderingFonts(path -> {
            int count = opens.merge(path, 1, Integer::sum);
            if (path.endsWith(".ttf") || path.endsWith(".otf")) {
                if (count > 1) return new ByteArrayInputStream("changed after hashing".getBytes());
            }
            return resource(path);
        });
        for (var asset : loaded.assets()) assertThat(opens.get(ROOT + asset.file())).isEqualTo(1);
        for (String code : SupportedLanguages.CODES) assertThat(loaded.fontFor(code, 12).getSize2D()).isEqualTo(12);
    }

    @Test
    void rejectsAmbiguousOrCorruptedPackManifestBeforeOpeningFontFiles() throws Exception {
        String json;
        try (var input = resource(ROOT + "font-pack.json")) { json = new String(input.readAllBytes(), StandardCharsets.UTF_8); }
        for (String invalid : new String[]{json.replace("noto-sans-regular-1.0", "unknown"),
            json.replace("\"assets\":", "\"unexpected\":1,\"assets\":"),
            json + "{}", "{\"version\":\"a\",\"version\":\"b\",\"assets\":[]}",
            json.replace("NotoSans-Regular.ttf", "../private.ttf"), json.replace("NotoSansCJKsc-Regular", "NotoSansCJKtc-Regular")}) {
            var fontOpens = new AtomicInteger();
            assertThatThrownBy(() -> new BundledRenderingFonts(path -> {
                if (path.endsWith("font-pack.json")) return new ByteArrayInputStream(invalid.getBytes(StandardCharsets.UTF_8));
                if (path.endsWith(".ttf") || path.endsWith(".otf")) fontOpens.incrementAndGet();
                return resource(path);
            })).isInstanceOf(RenderFontException.class).hasMessage("font-configuration").hasNoCause();
            assertThat(fontOpens).hasValue(0);
        }
    }

    static Stream<Arguments> destinations() {
        return Stream.of(Arguments.of("ja", "NotoSansCJKjp-Regular", "日本語の漫画。こんにちは！"),
            Arguments.of("en", "NotoSans-Regular", "Hello, reader!"),
            Arguments.of("es", "NotoSans-Regular", "¡Hola! ¿Cómo estás? Niño y acción."),
            Arguments.of("ko", "NotoSansCJKkr-Regular", "한국어 만화 안녕하세요!"),
            Arguments.of("zh-Hans", "NotoSansCJKsc-Regular", "简体中文漫画，阅读顺序。"),
            Arguments.of("zh-Hant", "NotoSansCJKtc-Regular", "繁體中文漫畫，閱讀順序。"),
            Arguments.of("pt-BR", "NotoSans-Regular", "Olá! Ação, coração, sequência e mangá."));
    }

    private static InputStream resource(String path) { return BundledRenderingFontsTest.class.getResourceAsStream(path); }
}
