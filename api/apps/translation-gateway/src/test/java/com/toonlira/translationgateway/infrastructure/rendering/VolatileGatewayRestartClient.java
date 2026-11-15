package com.toonlira.translationgateway.infrastructure.rendering;

import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
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

/** Private test client keeps its synthetic installation credential only in its own memory across server restart. */
public final class VolatileGatewayRestartClient {
    private static final String BASE = "http://server:8084", DIAGNOSTICS = "http://server:8085/metrics";
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3))
        .followRedirects(HttpClient.Redirect.NEVER).build();
    private String stage = "initialization";
    private VolatileGatewayRestartClient() { }
    public static void main(String[] args) {
        var test = new VolatileGatewayRestartClient();
        try { test.run(); }
        catch (Throwable error) {
            System.err.println("volatile-restart-client-failed:" + test.stage + ":" + error.getClass().getSimpleName());
            System.exit(1);
        } finally { test.client.shutdownNow(); }
    }
    private void run() throws Exception {
        byte[] original = Files.readAllBytes(Path.of("/inputs/small.png"));
        try {
            stage = "initial-delivery";
            var installation = json(send(HttpRequest.newBuilder(URI.create(BASE + "/v1/anonymous/installations"))
                .POST(HttpRequest.BodyPublishers.noBody()).build()), 201);
            String token = session(installation);
            var key = key();
            verifyPage(original, key, token, 200);
            var receipt = receipt(key, token);
            require(receipt.path("receipt").path("status").asText().equals("FINISHED") && !receipt.path("contentRecoverable").booleanValue());
            var before = metrics();
            String runtime = before.path("runtimeInstance").asText(); require(!runtime.isBlank());
            long rows = before.path("volatileReceiptRows").longValue();
            System.out.println("volatile-restart-client-awaiting-restart");
            System.out.flush();
            stage = "awaiting-new-process";
            long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(120);
            JsonNode after = null;
            while (System.nanoTime() < deadline) {
                try {
                    var observed = metrics();
                    if (!observed.path("runtimeInstance").asText().equals(runtime) && observed.has("volatileReceiptRows")) {
                        after = observed; break;
                    }
                } catch (Exception restarting) { /* Expected connection loss; no content retry. */ }
                Thread.sleep(250);
            }
            require(after != null && after.path("ocrCalls").intValue() == 0 && after.path("translationCalls").intValue() == 0);
            stage = "durable-receipt-only";
            token = session(installation);
            require(receipt.equals(receipt(key, token)));
            verifyPage(original, key, token, 409);
            var replay = metrics();
            require(replay.path("ocrCalls").intValue() == 0 && replay.path("translationCalls").intValue() == 0);
            require(replay.path("volatileReceiptRows").longValue() == rows);
            require(send(HttpRequest.newBuilder(URI.create(BASE + "/v1/page-jobs/" + receipt.path("receipt").path("operationRef").asText()))
                .header("Authorization", "Bearer " + token).GET().build()).statusCode() == 410);
            stage = "valid-page-after-restart";
            verifyPage(original, key(), token, 200);
            var result = metrics();
            require(result.path("ocrCalls").intValue() == 1 && result.path("translationCalls").intValue() == 1);
            require(result.path("volatileReceiptRows").longValue() == rows + 1);
            require(result.path("contentFiles").intValue() == 0 && result.path("regularFiles").intValue() == 0
                && result.path("legacyJobRows").longValue() == 0 && result.path("nativeChildren").isEmpty());
            require(result.path("pidsEvents").asText().trim().equals("max 0") && result.path("memoryEvents").asText().contains("oom_kill 0"));
            System.out.println("volatile-restart-client-result:" + result);
        } finally { Arrays.fill(original, (byte) 0); }
    }
    private void verifyPage(byte[] original, UUID key, String token, int expected) throws Exception {
        var response = send(HttpRequest.newBuilder(URI.create(BASE + "/v2/page-translations"))
            .timeout(Duration.ofMinutes(2)).header("Content-Type", "image/png").header("Idempotency-Key", key.toString())
            .header("X-Image-Byte-Size", Integer.toString(original.length)).header("X-Image-Width", "320").header("X-Image-Height", "220")
            .header("X-Source-Language", "ja").header("X-Target-Language", "pt-BR").header("X-Disclosure-Version", "volatile-fixture-1")
            .header("Authorization", "Bearer " + token).POST(HttpRequest.BodyPublishers.ofByteArray(original)).build());
        try {
            require(response.statusCode() == expected);
            if (expected == 200) VolatileGatewayIntegrationClient.verifyResponse(response, original, 320, 220);
        } finally { Arrays.fill(response.body(), (byte) 0); }
    }
    private String session(JsonNode installation) throws Exception {
        return json(send(HttpRequest.newBuilder(URI.create(BASE + "/v1/anonymous/sessions")).header("Content-Type", "application/json")
            .header("Authorization", "Bearer " + installation.path("credential").asText())
            .POST(HttpRequest.BodyPublishers.ofString("{\"installationRef\":\"" + installation.path("installationRef").asText() + "\"}")).build()), 201)
            .path("accessToken").asText();
    }
    private UUID key() throws Exception {
        long now = Instant.parse(json(send(HttpRequest.newBuilder(URI.create(BASE + "/v2/capabilities")).GET().build()), 200)
            .path("generatedAt").asText()).toEpochMilli();
        var random = UUID.randomUUID();
        return new UUID((now << 16) | 0x7000L | (random.getMostSignificantBits() & 0xfff), random.getLeastSignificantBits());
    }
    private JsonNode receipt(UUID key, String token) throws Exception {
        return json(send(HttpRequest.newBuilder(URI.create(BASE + "/v2/page-translations/by-idempotency/" + key))
            .header("Authorization", "Bearer " + token).GET().build()), 200);
    }
    private JsonNode metrics() throws Exception {
        return json(send(HttpRequest.newBuilder(URI.create(DIAGNOSTICS)).timeout(Duration.ofSeconds(5)).GET().build()), 200);
    }
    private HttpResponse<byte[]> send(HttpRequest request) throws Exception { return client.send(request, HttpResponse.BodyHandlers.ofByteArray()); }
    private static JsonNode json(HttpResponse<byte[]> response, int expected) throws Exception {
        require(response.statusCode() == expected);
        return GatewayJsonMapper.create().readTree(response.body());
    }
    private static void require(boolean condition) { if (!condition) throw new IllegalStateException("Synthetic restart assertion failed"); }
}
