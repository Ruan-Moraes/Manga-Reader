package com.toonlira.translationgateway.infrastructure.rendering;

import static com.toonlira.translationgateway.infrastructure.rendering.RenderFontException.Failure.CONFIGURATION;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderFontException.Failure.INVALID_INPUT;

import tools.jackson.core.StreamReadFeature;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.MapperFeature;
import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import java.awt.Font;
import java.awt.FontFormatException;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Verified physical fonts, explicitly instantiated; no network, system fallback or global registration. */
public final class BundledRenderingFonts {
    public static final String VERSION = "noto-sans-regular-1.0";
    private static final String ROOT = "/rendering/fonts/";
    private static final int MAX_MANIFEST_BYTES = 32 * 1024;
    private static final int MAX_LICENSE_BYTES = 64 * 1024;
    private static final int MAX_FONT_BYTES = 32 * 1024 * 1024;
    private static final String LATIN_REVISION = "ffebf8c1ee449e544955a7e813c54f9b73848eac";
    private static final String CJK_REVISION = "523d033d6cb47f4a80c58a35753646f5c3608a78";
    private static final Map<String, String> DESTINATIONS = Map.of("en", "latin", "es", "latin", "pt-BR", "latin",
        "ja", "ja", "ko", "ko", "zh-Hans", "zh-Hans", "zh-Hant", "zh-Hant");
    private static final Map<String, String> FACES = Map.of("latin", "NotoSans-Regular", "ja", "NotoSansCJKjp-Regular",
        "ko", "NotoSansCJKkr-Regular", "zh-Hans", "NotoSansCJKsc-Regular", "zh-Hant", "NotoSansCJKtc-Regular");
    private static final Map<String, String> CJK_DIRECTORIES = Map.of("ja", "Japanese", "ko", "Korean",
        "zh-Hans", "SimplifiedChinese", "zh-Hant", "TraditionalChinese");
    private static final Set<String> LICENSE_FILES = Set.of("OFL-NotoSans.txt", "OFL-NotoSansCJK.txt");
    private final List<Asset> assets;
    private final Map<String, Font> fonts;

    public BundledRenderingFonts() { this(BundledRenderingFonts.class::getResourceAsStream); }

    BundledRenderingFonts(ResourceSource resources) {
        try {
            if (resources == null) invalid();
            var mapper = GatewayJsonMapper.create().rebuild().disable(MapperFeature.ALLOW_COERCION_OF_SCALARS).build();
            var reader = mapper.readerFor(Pack.class)
                .with(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, DeserializationFeature.FAIL_ON_TRAILING_TOKENS,
                    DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES, DeserializationFeature.FAIL_ON_MISSING_CREATOR_PROPERTIES,
                    DeserializationFeature.FAIL_ON_NULL_CREATOR_PROPERTIES)
                .without(DeserializationFeature.ACCEPT_FLOAT_AS_INT).with(StreamReadFeature.STRICT_DUPLICATE_DETECTION);
            Pack pack = reader.readValue(utf8(read(resources, "font-pack.json", MAX_MANIFEST_BYTES)));
            validate(pack);
            for (var license : pack.licenses()) {
                byte[] bytes = verified(resources, license.file(), license.byteSize(), license.sha256(), MAX_LICENSE_BYTES);
                String text = utf8(bytes);
                if (!text.contains("SIL OPEN FONT LICENSE Version 1.1")) invalid();
            }
            var loaded = new HashMap<String, Font>();
            for (var asset : pack.assets()) {
                byte[] bytes = verified(resources, asset.file(), asset.byteSize(), asset.sha256(), MAX_FONT_BYTES);
                var blobDigest = MessageDigest.getInstance("SHA-1");
                // Hash the Git header and font snapshot without allocating a second complete font copy.
                blobDigest.update(("blob " + bytes.length + "\0").getBytes(StandardCharsets.US_ASCII));
                String blob = HexFormat.of().formatHex(blobDigest.digest(bytes));
                if (!blob.equals(asset.gitBlobSha1())) invalid();
                var font = Font.createFont(Font.TRUETYPE_FONT, new ByteArrayInputStream(bytes));
                if (!font.getPSName().equals(asset.postScriptName())) invalid();
                loaded.put(asset.id(), font);
            }
            this.assets = List.copyOf(pack.assets());
            this.fonts = Map.copyOf(loaded);
        } catch (IOException | FontFormatException | NoSuchAlgorithmException | RuntimeException error) {
            throw new RenderFontException(CONFIGURATION);
        }
    }

    public Font fontFor(String destination, float sizePx) {
        if (!Float.isFinite(sizePx) || sizePx <= 0 || sizePx > RenderPolicy.MAX_DIMENSION_PX)
            throw new RenderFontException(INVALID_INPUT);
        return face(destination).deriveFont(sizePx);
    }

    /** Unsupported text is left intact for the renderer's full fallback, not drawn with a substitute font. */
    public boolean canDisplay(String destination, String text) {
        Font font = face(destination);
        if (text == null) throw new RenderFontException(INVALID_INPUT);
        for (int offset = 0; offset < text.length();) {
            int point = text.codePointAt(offset);
            offset += Character.charCount(point);
            if (point >= Character.MIN_SURROGATE && point <= Character.MAX_SURROGATE) return false;
            if (point != '\n' && point != '\r' && point != '\t' && !font.canDisplay(point)) return false;
        }
        return true;
    }

    public String version() { return VERSION; }
    public List<Asset> assets() { return assets; }
    @Override public String toString() { return "BundledRenderingFonts[redacted]"; }

    private Font face(String destination) {
        String id = destination == null ? null : DESTINATIONS.get(destination);
        if (id == null) throw new RenderFontException(INVALID_INPUT);
        return fonts.get(id);
    }

    private static void validate(Pack pack) {
        if (pack == null || !VERSION.equals(pack.version()) || pack.assets() == null || pack.assets().size() != FACES.size()
            || pack.licenses() == null || pack.licenses().size() != LICENSE_FILES.size()) invalid();
        var ids = new HashMap<String, Asset>();
        for (var asset : pack.assets()) {
            if (asset == null || !FACES.containsKey(asset.id()) || ids.putIfAbsent(asset.id(), asset) != null
                || !FACES.get(asset.id()).equals(asset.postScriptName())) invalid();
            boolean latin = "latin".equals(asset.id());
            String expectedFile = asset.postScriptName() + (latin ? ".ttf" : ".otf");
            String expectedPath = latin ? "hinted/ttf/NotoSans/" + expectedFile
                : "Sans/OTF/" + CJK_DIRECTORIES.get(asset.id()) + "/" + expectedFile;
            if (!expectedFile.equals(asset.file()) || asset.byteSize() <= 0 || asset.byteSize() > MAX_FONT_BYTES
                || !hash(asset.sha256(), 64) || !hash(asset.gitBlobSha1(), 40)
                || !(latin ? "notofonts/noto-fonts" : "notofonts/noto-cjk").equals(asset.upstreamRepository())
                || !(latin ? LATIN_REVISION : CJK_REVISION).equals(asset.upstreamRevision())
                || !expectedPath.equals(asset.upstreamPath()) || !(latin ? "2.008" : "2.004").equals(asset.fontVersion())
                || !(latin ? "OFL-NotoSans.txt" : "OFL-NotoSansCJK.txt").equals(asset.licenseFile())
                || asset.copyright() == null || asset.copyright().isBlank()) invalid();
        }
        if (!ids.keySet().equals(FACES.keySet())) invalid();
        var licenses = new HashMap<String, License>();
        for (var license : pack.licenses()) {
            if (license == null || !LICENSE_FILES.contains(license.file())
                || licenses.putIfAbsent(license.file(), license) != null || license.byteSize() <= 0
                || license.byteSize() > MAX_LICENSE_BYTES || !hash(license.sha256(), 64)) invalid();
        }
        if (!licenses.keySet().equals(LICENSE_FILES)) invalid();
    }

    private static byte[] verified(ResourceSource source, String file, long expectedBytes, String sha256, int limit)
        throws IOException, NoSuchAlgorithmException {
        if (expectedBytes <= 0 || expectedBytes > limit) invalid();
        byte[] bytes = read(source, file, (int) expectedBytes);
        if (bytes.length != expectedBytes || !HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes))
            .equals(sha256)) invalid();
        return bytes;
    }

    private static byte[] read(ResourceSource source, String file, int limit) throws IOException {
        try (var input = source.open(ROOT + file)) {
            if (input == null) invalid();
            byte[] bytes = input.readNBytes(limit + 1);
            if (bytes.length == 0 || bytes.length > limit) invalid();
            return bytes;
        }
    }

    private static String utf8(byte[] bytes) throws IOException {
        return StandardCharsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT)
            .onUnmappableCharacter(CodingErrorAction.REPORT).decode(ByteBuffer.wrap(bytes)).toString();
    }

    private static boolean hash(String value, int length) {
        return value != null && value.matches("[0-9a-f]{" + length + "}");
    }
    private static void invalid() { throw new RenderFontException(CONFIGURATION); }

    public record Asset(String id, String file, long byteSize, String sha256, String postScriptName, String fontVersion,
                        String upstreamRepository, String upstreamRevision, String upstreamPath, String gitBlobSha1,
                        String copyright, String licenseFile) {
        @Override public String toString() { return "RenderingFontAsset[redacted]"; }
    }
    private record License(String file, long byteSize, String sha256) { }
    private record Pack(String version, List<License> licenses, List<Asset> assets) { }
    @FunctionalInterface interface ResourceSource { InputStream open(String path) throws IOException; }
}
