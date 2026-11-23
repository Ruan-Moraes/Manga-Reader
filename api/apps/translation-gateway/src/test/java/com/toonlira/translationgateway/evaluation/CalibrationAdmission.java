package com.toonlira.translationgateway.evaluation;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.toonlira.translationgateway.domain.OcrManifest;
import java.nio.ByteBuffer;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.nio.file.attribute.PosixFilePermissions;
import java.security.MessageDigest;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.Map;
import java.util.Set;

/** Test-only admission. Controls never enter the licensed manga catalog. */
final class CalibrationAdmission {
    static final ObjectMapper JSON = GatewayJsonMapper.create();
    private static final int MAX_JSON = 1_048_576;
    private static final String TEXT = "春夏秋冬山川草木日月星空東西南北";
    private static final String WIDE_RECIPE = "kanji-grid-wide-1";
    private static final Set<String> RECIPES = Set.of("kanji-grid-1", WIDE_RECIPE);
    private static final int DEFAULT_SPACING = 220;
    private static final int WIDE_SPACING = 336;
    private static final Set<String> FILES = Set.of("recipe.json", "source.txt", "simulation-tests.json",
        "horizontal.png", "vertical.png", "horizontal-reference.json", "vertical-reference.json");

    record Input(Path image, JsonNode sample, byte[] reference) { }

    static Input admit(Path calibrationRoot, JsonNode request) throws Exception {
        var id = request.path("calibrationId").asText();
        var orientation = request.path("orientation").asText();
        require(request.path("version").asText().equals("calibration-evaluation/1")
            && id.matches("[a-z0-9][a-z0-9-]{0,63}") && Set.of("horizontal", "vertical").contains(orientation));
        var bundle = calibrationRoot.resolve(id);
        directory(bundle);
        var manifestBytes = read(bundle.resolve("manifest.json"), MAX_JSON);
        require(hash(manifestBytes).equals(request.path("source").path("bundleManifestSha256").asText()));
        var manifest = JSON.readTree(manifestBytes);
        require(manifest.path("calibrationVersion").asText().equals("1.0") && manifest.path("id").asText().equals(id)
            && manifest.path("synthetic").asBoolean() && manifest.path("providerStatus").asText().equals("not-executed")
            && manifest.path("providerCalls").asInt(-1) == 0 && manifest.path("credentialReads").asInt(-1) == 0);
        var names = new HashSet<String>(); manifest.path("files").propertyNames().forEach(names::add);
        require(names.equals(FILES));
        for (var name : FILES) {
            var record = manifest.path("files").path(name);
            var bytes = read(bundle.resolve(name), name.endsWith(".png") ? 12 * MAX_JSON : MAX_JSON);
            require(bytes.length == record.path("bytes").asLong(-1) && hash(bytes).equals(record.path("sha256").asText()));
        }
        var referenceBytes = read(bundle.resolve(orientation + "-reference.json"), MAX_JSON);
        require(hash(referenceBytes).equals(request.path("source").path("referenceSha256").asText()));
        var reference = JSON.readTree(referenceBytes);
        var revision = manifest.path("recipeRevision").asText();
        require(RECIPES.contains(revision));
        require(reference.path("referenceVersion").asText().equals("1.0")
            && reference.path("recipeRevision").asText().equals(revision)
            && reference.path("origin").asText().equals("synthetic-typographic-control")
            && reference.path("orientation").asText().equals(orientation)
            && reference.path("direction").asText().equals(orientation.equals("horizontal") ? "horizontal-ltr-ttb" : "vertical-ttb-rtl")
            && reference.path("sequence").asText().equals(TEXT) && reference.path("tokens").size() == 16
            && reference.path("widthPx").asInt() == 1200 && reference.path("heightPx").asInt() == 1200);
        for (int i = 0; i < 16; i++) {
            var token = reference.path("tokens").get(i);
            require(token.path("order").asInt(-1) == i && token.path("text").asText().equals(TEXT.substring(i, i + 1)));
            int spacing = revision.equals(WIDE_RECIPE) ? WIDE_SPACING : DEFAULT_SPACING;
            int x = orientation.equals("horizontal") ? 208 + (i % 8) * 112 : 600 + spacing / 2 - (i / 8) * spacing;
            int y = orientation.equals("horizontal") ? 490 + (i / 8) * DEFAULT_SPACING : 208 + (i % 8) * 112;
            var center = token.path("centerPx");
            require(center.isArray() && center.size() == 2 && center.get(0).isIntegralNumber() && center.get(1).isIntegralNumber()
                && center.get(0).asInt() == x && center.get(1).asInt() == y);
        }
        var image = bundle.resolve(orientation + ".png");
        var bytes = read(image, 12 * MAX_JSON);
        var hash = hash(bytes);
        require(hash.equals(reference.path("imageSha256").asText()) && hash.equals(request.path("source").path("imageSha256").asText()));
        var sample = JSON.valueToTree(Map.of("id", id + "-" + orientation, "language", "ja", "mime", "image/png",
            "sha256", hash, "bytes", bytes.length, "width", 1200, "height", 1200));
        require(sample.equals(request.path("sample")));
        // Worker harness independently inspects signature, dimensions and bytes before storage/provider.
        return new Input(image, sample, referenceBytes);
    }

    static void exportDiagnostic(Path output, Map<String, Object> result) throws Exception {
        if (!"succeeded".equals(result.get("status"))) return;
        var raw = read(output.resolve("vision-response.pb"), 4 * MAX_JSON);
        var capture = JSON.valueToTree(result.get("rawResponse"));
        var manifest = read(output.resolve("manifest.json"), MAX_JSON);
        require(hash(raw).equals(capture.path("sha256").asText()) && hash(manifest).equals(result.get("manifestSha256")));
        var diagnostic = VisionDiagnostic.inspect(raw, JSON.readValue(manifest, OcrManifest.class));
        var bytes = JSON.writeValueAsBytes(diagnostic);
        write(output.resolve("diagnostic.json"), bytes);
        result.put("diagnosticSha256", hash(bytes));
    }

    static void directory(Path path) throws Exception {
        for (var current = path.toAbsolutePath().normalize(); current != null; current = current.getParent()) {
            require(Files.isDirectory(current, LinkOption.NOFOLLOW_LINKS) && !Files.isSymbolicLink(current));
        }
    }

    static byte[] read(Path path, int limit) throws Exception {
        try (var channel = Files.newByteChannel(path, Set.of(StandardOpenOption.READ, LinkOption.NOFOLLOW_LINKS))) {
            require(Files.isRegularFile(path, LinkOption.NOFOLLOW_LINKS) && channel.size() <= limit);
            var buffer = ByteBuffer.allocate((int) channel.size() + 1);
            while (buffer.hasRemaining() && channel.read(buffer) >= 0) { }
            require(buffer.position() == channel.size());
            var bytes = new byte[buffer.position()]; buffer.flip(); buffer.get(bytes); return bytes;
        }
    }
    static void write(Path path, byte[] bytes) throws Exception {
        try (var channel = Files.newByteChannel(path, Set.of(StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE),
            PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rw-------")))) {
            var buffer = ByteBuffer.wrap(bytes);
            while (buffer.hasRemaining()) channel.write(buffer);
        }
    }
    static String hash(byte[] bytes) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
    }
    private static void require(boolean value) { if (!value) throw new IllegalArgumentException("calibration-admission-invalid"); }
}
