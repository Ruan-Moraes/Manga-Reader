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
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import tools.jackson.databind.JsonNode;

/** Separate private test-client container; source files exist only here and on the fixture host. */
public final class VolatileGatewayIntegrationClient {
    private static final String BASE = "http://server:8084", DIAGNOSTICS = "http://server:8085";
    private static String stage = "initialization";
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).followRedirects(HttpClient.Redirect.NEVER).build();
    private VolatileGatewayIntegrationClient() { }
    public static void main(String[] args) {
        var test = new VolatileGatewayIntegrationClient();
        try { test.run(); }
        catch (Throwable error) {
            System.err.println("volatile-gateway-client-failed:" + stage + ":" + error.getClass().getSimpleName());
            System.exit(1);
        } finally { test.client.shutdownNow(); }
    }
    private void run() throws Exception {
        byte[] small = Files.readAllBytes(Path.of("/inputs/small.png")), large = Files.readAllBytes(Path.of("/inputs/maximum.png"));
        byte[] jpeg = Files.readAllBytes(Path.of("/inputs/maximum.jpg")), webp = Files.readAllBytes(Path.of("/inputs/maximum.webp"));
        byte[] padded = Files.readAllBytes(Path.of("/inputs/maximum-padded.png"));
        try {
            stage = "unauthorized";
            require(send(page(small, key(), null)).statusCode() == 401);
            counts(0, 0);
            stage = "identities";
            String owner = identity(), other = identity();
            stage = "owned-native-failure";
            UUID killedKey = key();
            var killed = client.sendAsync(page(large, killedKey, owner), HttpResponse.BodyHandlers.ofByteArray());
            awaitNativeChild();
            require(send(page(small, key(), owner)).statusCode() == 503);
            require(postDiagnostic("/kill-native").statusCode() == 200);
            require(killed.get(30, TimeUnit.SECONDS).statusCode() == 503);
            require(receipt(killedKey, owner).path("receipt").path("status").asText().equals("FAILED"));
            counts(1, 1);

            stage = "valid-after-native-failure";
            UUID smallKey = key();
            var smallResult = send(page(small, smallKey, owner));
            require(smallResult.statusCode() == 200);
            verifyResponse(smallResult, small, 320, 220); counts(2, 2);
            stage = "replay-and-ownership";
            require(send(page(small, smallKey, owner)).statusCode() == 409); counts(2, 2);
            require(send(HttpRequest.newBuilder(URI.create(BASE + "/v2/page-translations/by-idempotency/" + smallKey))
                .header("Authorization", "Bearer " + other).GET().build()).statusCode() == 404);
            var own = receipt(smallKey, owner);
            require(own.size() == 3 && !own.path("contentRecoverable").booleanValue());
            require(own.path("receipt").size() == 5 && own.path("receipt").path("status").asText().equals("FINISHED"));

            stage = "maximum-page";
            var maximum = send(page(large, key(), owner));
            require(maximum.statusCode() == 200); verifyResponse(maximum, large, 10000, 8000); counts(3, 3);
            stage = "maximum-jpeg";
            var maximumJpeg = send(page(jpeg, key(), owner));
            require(maximumJpeg.statusCode() == 200); verifyResponse(maximumJpeg, jpeg, 10000, 8000); counts(4, 4);
            stage = "maximum-webp";
            var maximumWebp = send(page(webp, key(), owner));
            require(maximumWebp.statusCode() == 200); verifyResponse(maximumWebp, webp, 10000, 8000); counts(5, 5);
            stage = "maximum-bytes-and-pixels";
            require(padded.length == 12 * 1024 * 1024);
            var maximumPadded = send(page(padded, key(), owner));
            require(maximumPadded.statusCode() == 200); verifyResponse(maximumPadded, padded, 10000, 8000); counts(6, 6);
            stage = "provider-failure";
            require(postDiagnostic("/mode/ocr-fail").statusCode() == 200);
            require(send(page(small, key(), owner)).statusCode() == 503); counts(7, 6);
            require(postDiagnostic("/mode/ok").statusCode() == 200);
            stage = "valid-after-provider-failure";
            var recovery = send(page(small, key(), owner));
            require(recovery.statusCode() == 200); verifyResponse(recovery, small, 320, 220); counts(8, 7);

            stage = "owned-address-space-failure";
            var addressKey = key();
            var addressFault = client.sendAsync(page(large, addressKey, owner), HttpResponse.BodyHandlers.ofByteArray());
            awaitNativeChild();
            require(postDiagnostic("/native-address-fault").statusCode() == 200);
            require(addressFault.get(45, TimeUnit.SECONDS).statusCode() == 503);
            require(receipt(addressKey, owner).path("receipt").path("status").asText().equals("FAILED")); counts(9, 8);
            var afterAddress = send(page(small, key(), owner));
            require(afterAddress.statusCode() == 200); verifyResponse(afterAddress, small, 320, 220); counts(10, 9);

            stage = "owned-noncooperative-native-timeout";
            var timeoutKey = key();
            var timeoutFault = client.sendAsync(page(large, timeoutKey, owner), HttpResponse.BodyHandlers.ofByteArray());
            awaitNativeChild();
            require(postDiagnostic("/pause-native").statusCode() == 200);
            require(send(page(small, key(), owner)).statusCode() == 503);
            require(timeoutFault.get(120, TimeUnit.SECONDS).statusCode() == 503);
            require(receipt(timeoutKey, owner).path("receipt").path("status").asText().equals("FAILED")); counts(11, 10);
            var afterTimeout = send(page(small, key(), owner));
            require(afterTimeout.statusCode() == 200); verifyResponse(afterTimeout, small, 320, 220); counts(12, 11);

            stage = "sanitized-metadata-and-resources";
            var metrics = metrics();
            require(metrics.path("contentFiles").intValue() == 0 && metrics.path("inlineViolations").intValue() == 0);
            require(metrics.path("maxOriginalBytes").longValue() == padded.length && metrics.path("nativeChildren").size() == 0);
            require(metrics.path("memoryLimitBytes").longValue() == 8L * 1024 * 1024 * 1024);
            require(metrics.path("swapLimitBytes").longValue() == 0 && metrics.path("pidsLimit").longValue() == 64);
            require(metrics.path("memoryEvents").asText().contains("oom_kill 0"));
            require(metrics.path("pidsEvents").asText().trim().equals("max 0"));
            require(metrics.path("parentAddressSpaceBytes").longValue() == 3L * 1024 * 1024 * 1024);
            require(metrics.path("parentVirtualBytes").longValue() < 3L * 1024 * 1024 * 1024);
            require(metrics.path("cpuMaximum").asText().trim().equals("200000 100000"));
            require(metrics.path("regularFiles").intValue() == 0);
            require(metrics.path("legacyJobRows").longValue() == 0 && metrics.path("volatileReceiptRows").longValue() == 12);
            System.out.println("volatile-gateway-client-result:" + metrics);
        } finally {
            for (var bytes : new byte[][] {small, large, jpeg, webp, padded}) Arrays.fill(bytes, (byte) 0);
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
        var random = UUID.randomUUID();
        return new UUID((now << 16) | 0x7000L | (random.getMostSignificantBits() & 0xfff), random.getLeastSignificantBits());
    }
    private HttpRequest page(byte[] bytes, UUID key, String token) {
        var source = InMemoryMedia.inspect(bytes, RenderPolicy.initial());
        var request = HttpRequest.newBuilder(URI.create(BASE + "/v2/page-translations")).timeout(Duration.ofMinutes(3))
            .header("Content-Type", source.mimeType()).header("Idempotency-Key", key.toString())
            .header("X-Image-Byte-Size", Integer.toString(bytes.length)).header("X-Image-Width", Integer.toString(source.widthPx()))
            .header("X-Image-Height", Integer.toString(source.heightPx())).header("X-Source-Language", "ja")
            .header("X-Target-Language", "pt-BR").header("X-Disclosure-Version", "volatile-fixture-1");
        if (token != null) request.header("Authorization", "Bearer " + token);
        return request.POST(HttpRequest.BodyPublishers.ofByteArray(bytes)).build();
    }
    private HttpResponse<byte[]> send(HttpRequest request) throws Exception { return client.send(request, HttpResponse.BodyHandlers.ofByteArray()); }
    private HttpResponse<byte[]> postDiagnostic(String path) throws Exception {
        return send(HttpRequest.newBuilder(URI.create(DIAGNOSTICS + path)).POST(HttpRequest.BodyPublishers.noBody()).build());
    }
    private JsonNode metrics() throws Exception {
        return GatewayJsonMapper.create().readTree(send(HttpRequest.newBuilder(URI.create(DIAGNOSTICS + "/metrics")).GET().build()).body());
    }
    private JsonNode receipt(UUID key, String token) throws Exception {
        var result = send(HttpRequest.newBuilder(URI.create(BASE + "/v2/page-translations/by-idempotency/" + key))
            .header("Authorization", "Bearer " + token).GET().build());
        require(result.statusCode() == 200 && result.headers().firstValue("Cache-Control").orElse("").equals("no-store"));
        return GatewayJsonMapper.create().readTree(result.body());
    }
    private void counts(int ocr, int translation) throws Exception {
        var metrics = metrics(); require(metrics.path("ocrCalls").intValue() == ocr && metrics.path("translationCalls").intValue() == translation);
    }
    private void awaitNativeChild() throws Exception {
        long until = System.nanoTime() + TimeUnit.SECONDS.toNanos(30);
        while (true) {
            var observed = metrics();
            if (observed.path("nativePeakRssKiB").longValue() >= 384L * 1024) {
                require(observed.path("childAddressSpaceBytes").longValue() == 3L * 1024 * 1024 * 1024);
                return;
            }
            require(System.nanoTime() < until); Thread.sleep(20);
        }
    }
    static void verifyResponse(HttpResponse<byte[]> response, byte[] original, int width, int height) throws Exception {
        require(response.headers().firstValue("Cache-Control").orElse("").equals("no-store"));
        require(response.headers().firstValue("Content-Type").orElse("").startsWith("application/vnd.toonlira.translation+binary"));
        verifyResult(response.body(), original, width, height);
    }
    private static void verifyResult(byte[] wire, byte[] original, int width, int height) throws Exception {
        require(wire.length <= 12 + 4 * 1024 * 1024 + 64 * 1024 * 1024);
        try (var input = new DataInputStream(new ByteArrayInputStream(wire))) {
            require(input.readInt() == 0x54565231);
            int manifestSize = input.readInt(); require(manifestSize > 0 && manifestSize <= 4 * 1024 * 1024);
            var manifest = GatewayJsonMapper.create().readTree(input.readNBytes(manifestSize));
            int imageSize = input.readInt(); require(imageSize > 0 && imageSize <= 64 * 1024 * 1024);
            var image = input.readNBytes(imageSize); require(image.length == imageSize && input.read() == -1);
            var actual = InMemoryMedia.inspectOutput(image, RenderPolicy.initial());
            require(actual.mimeType().equals("image/webp") && actual.widthPx() == width && actual.heightPx() == height);
            require(manifest.path("originalSha256").asText().equals(InMemoryMedia.sha256(original)));
            require(manifest.path("image").path("sha256").asText().equals(actual.sha256()));
            require(manifest.path("regions").size() == 1);
            require(manifest.path("regions").get(0).path("sourceText").asText().equals(VolatileGatewayIntegrationProbe.SOURCE));
            require(manifest.path("regions").get(0).path("translatedText").asText().equals(VolatileGatewayIntegrationProbe.SOURCE));
            Arrays.fill(image, (byte) 0);
        }
    }
    private static void require(boolean condition) { if (!condition) throw new IllegalStateException("Synthetic integration assertion failed"); }
}
