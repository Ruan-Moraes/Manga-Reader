package com.toonlira.translationgateway.infrastructure.rendering;

import com.toonlira.translationgateway.domain.rendering.InMemoryMedia;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import java.io.ByteArrayInputStream;
import java.io.DataInputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/** Test client only: received content is saved on its private output mount, never on the server. */
public final class VolatileVisualIntegrationClient {
    private static final String BASE = "http://server:8084", DIAGNOSTICS = "http://server:8085";
    private static String stage = "initialization";
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).followRedirects(HttpClient.Redirect.NEVER).build();
    private VolatileVisualIntegrationClient() { }
    public static void main(String[] arguments) {
        var test = new VolatileVisualIntegrationClient();
        try { test.run(); }
        catch (Throwable error) {
            System.err.println("volatile-visual-client-failed:" + stage + ":" + error.getClass().getSimpleName());
            System.exit(1);
        } finally { test.client.shutdownNow(); }
    }
    private void run() throws Exception {
        byte[] original = Files.readAllBytes(Path.of("/inputs/visual.png"));
        byte[] empty = Files.readAllBytes(Path.of("/inputs/empty.png"));
        try {
            String token = identity();
            require(postMode("visual").statusCode() == 200);
            for (String target : List.of("pt-BR", "en", "es", "ja", "ko", "zh-Hans", "zh-Hant")) {
                stage = "target-" + target;
                save(send(page(original, token, target)), original, "render-" + target, target, false, false);
            }
            stage = "empty";
            require(postMode("empty").statusCode() == 200);
            save(send(page(empty, token, "pt-BR")), empty, "render-empty", "pt-BR", true, false);
            stage = "overflow";
            require(postMode("visual-overflow").statusCode() == 200);
            save(send(page(original, token, "pt-BR")), original, "render-overflow", "pt-BR", false, true);
            var metrics = GatewayJsonMapper.create().readTree(send(HttpRequest.newBuilder(URI.create(DIAGNOSTICS + "/metrics")).GET().build()).body());
            require(metrics.path("ocrCalls").intValue() == 9 && metrics.path("translationCalls").intValue() == 8);
            require(metrics.path("contentFiles").intValue() == 0 && metrics.path("regularFiles").intValue() == 0);
            require(metrics.path("inlineViolations").intValue() == 0 && metrics.path("nativeChildren").size() == 0);
            require(metrics.path("pidsEvents").asText().trim().equals("max 0"));
            require(metrics.path("parentAddressSpaceBytes").longValue() == 3L * 1024 * 1024 * 1024);
            require(metrics.path("memoryEvents").asText().contains("oom_kill 0"));
            Files.writeString(Path.of("/outputs/metrics.json"), GatewayJsonMapper.create().writeValueAsString(metrics), StandardOpenOption.CREATE_NEW);
            System.out.println("volatile-visual-client-result:" + metrics);
        } finally { Arrays.fill(original, (byte) 0); Arrays.fill(empty, (byte) 0); }
    }
    private void save(HttpResponse<byte[]> response, byte[] original, String basename, String target, boolean empty, boolean overflow) throws Exception {
        require(response.statusCode() == 200 && response.headers().firstValue("Cache-Control").orElse("").equals("no-store"));
        require(response.headers().firstValue("Content-Type").orElse("").startsWith("application/vnd.toonlira.translation+binary"));
        byte[] wire = response.body(), manifest = null, image = null;
        try (var input = new DataInputStream(new ByteArrayInputStream(wire))) {
            require(wire.length <= 12 + 4 * 1024 * 1024 + 64 * 1024 * 1024 && input.readInt() == 0x54565231);
            int size = input.readInt(); require(size > 0 && size <= 4 * 1024 * 1024);
            manifest = input.readNBytes(size); require(manifest.length == size);
            size = input.readInt(); require(size > 0 && size <= 64 * 1024 * 1024);
            image = input.readNBytes(size); require(image.length == size && input.read() == -1);
            var metadata = GatewayJsonMapper.create().readTree(manifest);
            var actual = InMemoryMedia.inspectOutput(image, RenderPolicy.initial());
            require(actual.widthPx() == 960 && actual.heightPx() == 1280 && actual.mimeType().equals("image/webp"));
            require(metadata.path("originalSha256").asText().equals(InMemoryMedia.sha256(original)));
            require(metadata.path("image").path("sha256").asText().equals(actual.sha256()));
            require(metadata.path("targetLanguage").asText().equals(target));
            require(metadata.path("sourceLanguage").asText().equals(target.equals("ja") ? "en" : "ja"));
            require(metadata.path("regions").size() == (empty ? 0 : 1));
            if (!empty) {
                var region = metadata.path("regions").get(0);
                require(region.path("sourceText").asText().equals(VolatileGatewayIntegrationProbe.SOURCE));
                require(region.path("overflow").booleanValue() == overflow);
                if (overflow) require(region.path("translatedText").asText().equals("Long overflow translation. ".repeat(180)));
                else require(region.path("fontSizePx").intValue() >= RenderPolicy.initial().minimumFontPx());
            }
            Files.write(Path.of("/outputs/" + basename + ".webp"), image, StandardOpenOption.CREATE_NEW);
            Files.write(Path.of("/outputs/" + basename + ".json"), manifest, StandardOpenOption.CREATE_NEW);
        } finally {
            Arrays.fill(wire, (byte) 0);
            if (manifest != null) Arrays.fill(manifest, (byte) 0);
            if (image != null) Arrays.fill(image, (byte) 0);
        }
    }
    private String identity() throws Exception {
        var created = send(HttpRequest.newBuilder(URI.create(BASE + "/v1/anonymous/installations")).POST(HttpRequest.BodyPublishers.noBody()).build());
        require(created.statusCode() == 201);
        var body = GatewayJsonMapper.create().readTree(created.body());
        var session = send(HttpRequest.newBuilder(URI.create(BASE + "/v1/anonymous/sessions")).header("Content-Type", "application/json")
            .header("Authorization", "Bearer " + body.path("credential").asText())
            .POST(HttpRequest.BodyPublishers.ofString("{\"installationRef\":\"" + body.path("installationRef").asText() + "\"}")).build());
        require(session.statusCode() == 201);
        return GatewayJsonMapper.create().readTree(session.body()).path("accessToken").asText();
    }
    private UUID key() throws Exception {
        var result = send(HttpRequest.newBuilder(URI.create(BASE + "/v2/capabilities")).GET().build()); require(result.statusCode() == 200);
        long now = Instant.parse(GatewayJsonMapper.create().readTree(result.body()).path("generatedAt").asText()).toEpochMilli();
        var entropy = UUID.randomUUID();
        return new UUID((now << 16) | 0x7000L | (entropy.getMostSignificantBits() & 0xfff), entropy.getLeastSignificantBits());
    }
    private HttpRequest page(byte[] image, String token, String target) throws Exception {
        return HttpRequest.newBuilder(URI.create(BASE + "/v2/page-translations")).timeout(Duration.ofSeconds(120))
            .header("Authorization", "Bearer " + token).header("Content-Type", "image/png").header("Idempotency-Key", key().toString())
            .header("X-Image-Byte-Size", Integer.toString(image.length)).header("X-Image-Width", "960").header("X-Image-Height", "1280")
            .header("X-Source-Language", target.equals("ja") ? "en" : "ja").header("X-Target-Language", target)
            .header("X-Disclosure-Version", "volatile-fixture-1").POST(HttpRequest.BodyPublishers.ofByteArray(image)).build();
    }
    private HttpResponse<byte[]> postMode(String mode) throws Exception {
        return send(HttpRequest.newBuilder(URI.create(DIAGNOSTICS + "/mode/" + mode)).POST(HttpRequest.BodyPublishers.noBody()).build());
    }
    private HttpResponse<byte[]> send(HttpRequest request) throws Exception { return client.send(request, HttpResponse.BodyHandlers.ofByteArray()); }
    private static void require(boolean condition) { if (!condition) throw new IllegalStateException("Synthetic visual assertion failed"); }
}
