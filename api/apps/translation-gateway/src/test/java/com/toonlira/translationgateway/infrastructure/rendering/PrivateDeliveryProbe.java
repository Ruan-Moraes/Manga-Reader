package com.toonlira.translationgateway.infrastructure.rendering;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import com.sun.net.httpserver.HttpServer;
import com.toonlira.translationgateway.application.AcknowledgeResultUseCase;
import com.toonlira.translationgateway.application.AuthenticateSessionUseCase;
import com.toonlira.translationgateway.application.CancelJobUseCase;
import com.toonlira.translationgateway.application.CleanupAcknowledgedResultsUseCase;
import com.toonlira.translationgateway.application.GetJobResultUseCase;
import com.toonlira.translationgateway.application.JobResultSnapshotUseCase;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.ObjectStoragePort;
import com.toonlira.translationgateway.application.port.CredentialHasher;
import com.toonlira.translationgateway.application.port.GatewayRepository;
import com.toonlira.translationgateway.domain.rendering.PrivateDownload;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.toonlira.translationgateway.infrastructure.security.SessionAuthenticationFilter;
import com.toonlira.translationgateway.presentation.LegacyGatewayController;
import com.toonlira.translationgateway.presentation.GatewayExceptionHandler;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.context.ApplicationContext;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.web.servletapi.SecurityContextHolderAwareRequestFilter;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/** Local transport fixture. No production mode, DNS override, credential or external request. */
final class PrivateDeliveryProbe {
    private PrivateDeliveryProbe() { }

    static Map<String, Object> verify(ApplicationContext context, UUID owner, UUID jobRef, UUID jobId,
                                      String originalKey, String ocrKey, String translationKey,
                                      String imageKey, String manifestKey) throws Exception {
        var storage = context.getBean(ObjectStoragePort.class);
        byte[] secret = new byte[32]; new SecureRandom().nextBytes(secret);
        var issued = new ConcurrentHashMap<String, String>();
        var server = HttpServer.create(new InetSocketAddress(InetAddress.getByName("127.0.0.1"), 0), 0);
        server.createContext("/private", exchange -> {
            try {
                var query = exchange.getRequestURI().getRawQuery();
                var parts = query == null ? new String[0] : query.split("&", -1);
                if (!"GET".equals(exchange.getRequestMethod()) || parts.length != 3
                    || !parts[0].equals("generation=1") || !parts[1].startsWith("expires=")
                    || !parts[2].startsWith("signature=")) throw new IllegalArgumentException();
                long expires = Long.parseLong(parts[1].substring(8));
                String key = exchange.getRequestURI().getRawPath().substring(1);
                String payload = key + "\n1\n" + expires;
                if (Instant.now().getEpochSecond() >= expires || !issued.containsKey(key)
                    || !MessageDigest.isEqual(signature(secret, payload).getBytes(StandardCharsets.US_ASCII),
                        parts[2].substring(10).getBytes(StandardCharsets.US_ASCII))) throw new IllegalArgumentException();
                byte[] bytes;
                try (var input = storage.open(key)) { bytes = input.readNBytes(64 * 1024 * 1024 + 1); }
                if (bytes.length > 64 * 1024 * 1024) throw new IllegalArgumentException();
                exchange.getResponseHeaders().set("Content-Type", issued.get(key));
                exchange.sendResponseHeaders(200, bytes.length);
                exchange.getResponseBody().write(bytes);
            } catch (Exception error) { exchange.sendResponseHeaders(403, -1); }
            finally { exchange.close(); }
        });
        server.start();
        try {
            var resultUseCase = new GetJobResultUseCase(context.getBean(JobResultSnapshotUseCase.class), request -> {
                try {
                    byte[] bytes;
                    try (var input = storage.open(request.objectKey())) { bytes = input.readNBytes((int) request.kind().maxBytes() + 1); }
                    if (bytes.length > request.kind().maxBytes() || !hash(bytes).equals(request.sha256())) throw new IllegalArgumentException();
                    long expires = Math.min(request.resultExpiresAt().getEpochSecond(), Instant.now().plusSeconds(60).getEpochSecond());
                    String payload = request.objectKey() + "\n1\n" + expires;
                    issued.put(request.objectKey(), request.kind().mimeType());
                    var uri = URI.create("https://storage.googleapis.com/test-bucket/" + request.objectKey()
                        + "?generation=1&expires=" + expires + "&signature=" + signature(secret, payload));
                    return new PrivateDownload(uri, request.kind().mimeType(), bytes.length, request.sha256(), Instant.ofEpochSecond(expires));
                } catch (Exception error) { throw new IllegalStateException("test-signing-failed"); }
            }, context.getBean(GatewayProperties.class), Clock.systemUTC());
            var controller = new LegacyGatewayController(null, null, null, null, resultUseCase,
                context.getBean(CancelJobUseCase.class), context.getBean(AcknowledgeResultUseCase.class));
            var token = HexFormat.of().formatHex(secret);
            var now = Instant.now();
            var repository = context.getBean(GatewayRepository.class);
            var hasher = context.getBean(CredentialHasher.class);
            repository.createSession(UUID.randomUUID(), owner, hasher.hashToken(token), now, now.plusSeconds(300));
            var otherOwner = UUID.randomUUID();
            var otherToken = UUID.randomUUID().toString() + UUID.randomUUID();
            repository.createInstallation(otherOwner, "synthetic-other-" + otherOwner, now);
            repository.createSession(UUID.randomUUID(), otherOwner, hasher.hashToken(otherToken), now, now.plusSeconds(300));
            var requestWrapper = new SecurityContextHolderAwareRequestFilter();
            requestWrapper.afterPropertiesSet();
            var mvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GatewayExceptionHandler())
                .addFilters(new SessionAuthenticationFilter(context.getBean(AuthenticateSessionUseCase.class),
                    GatewayJsonMapper.create()), requestWrapper).build();
            check(mvc.perform(get("/v1/page-jobs/{ref}", jobRef)).andReturn().getResponse().getStatus() == 401);
            check(mvc.perform(post("/v1/page-jobs/{ref}/ack", jobRef)).andReturn().getResponse().getStatus() == 401);
            var otherLookup = mvc.perform(get("/v1/page-jobs/{ref}", jobRef)
                .header("Authorization", "Bearer " + otherToken)).andReturn().getResponse();
            check(otherLookup.getStatus() == 404 && !GatewayJsonMapper.create()
                .readTree(otherLookup.getContentAsByteArray()).has("result") && issued.isEmpty());
            check(mvc.perform(post("/v1/page-jobs/{ref}/ack", jobRef)
                .header("Authorization", "Bearer " + otherToken)).andReturn().getResponse().getStatus() == 404);
            check(context.getBean(JdbcClient.class).sql("SELECT count(*) FROM processing_job_result_acknowledgements WHERE job_id = :id")
                .param("id", jobId).query(Integer.class).single() == 0);
            var response = mvc.perform(get("/v1/page-jobs/{ref}", jobRef)
                .header("Authorization", "Bearer " + token)).andReturn().getResponse();
            check(response.getStatus() == 200 && response.getHeader("Cache-Control").contains("no-store"));
            var envelope = GatewayJsonMapper.create().readTree(response.getContentAsByteArray());
            check("READY".equals(envelope.path("status").textValue()));
            var result = envelope.path("result");
            check(result.path("widthPx").intValue() == 320 && result.path("heightPx").intValue() == 220);
            var client = HttpClient.newHttpClient();
            byte[] image = download(client, server, result.path("image"), imageKey);
            byte[] manifest = download(client, server, result.path("manifest"), manifestKey);
            var signedImage = URI.create(result.path("image").path("url").textValue());
            var tampered = URI.create("http://127.0.0.1:" + server.getAddress().getPort() + "/" + imageKey
                + "?" + signedImage.getRawQuery() + "0");
            check(client.send(HttpRequest.newBuilder(tampered).GET().build(), HttpResponse.BodyHandlers.discarding()).statusCode() == 403);
            long past = Instant.now().minusSeconds(1).getEpochSecond();
            var expiredUrl = URI.create("http://127.0.0.1:" + server.getAddress().getPort() + "/" + imageKey
                + "?generation=1&expires=" + past + "&signature=" + signature(secret, imageKey + "\n1\n" + past));
            check(client.send(HttpRequest.newBuilder(expiredUrl).GET().build(), HttpResponse.BodyHandlers.discarding()).statusCode() == 403);
            long future = Instant.now().plusSeconds(60).getEpochSecond();
            var wrongGeneration = URI.create("http://127.0.0.1:" + server.getAddress().getPort() + "/" + imageKey
                + "?generation=2&expires=" + future + "&signature=" + signature(secret, imageKey + "\n2\n" + future));
            check(client.send(HttpRequest.newBuilder(wrongGeneration).GET().build(), HttpResponse.BodyHandlers.discarding()).statusCode() == 403);
            var document = GatewayJsonMapper.create().readTree(manifest);
            check(jobRef.toString().equals(document.path("jobRef").textValue()));
            check(result.path("image").path("sha256").textValue().equals(hash(image)));
            check("image/webp".equals(result.path("image").path("mimeType").textValue()));
            check("application/json".equals(result.path("manifest").path("mimeType").textValue()));
            for (int i = 0; i < 2; i++) check(mvc.perform(post("/v1/page-jobs/{ref}/ack", jobRef)
                .header("Authorization", "Bearer " + token)).andReturn().getResponse().getStatus() == 202);
            var expired = mvc.perform(get("/v1/page-jobs/{ref}", jobRef)
                .header("Authorization", "Bearer " + token)).andReturn().getResponse();
            check(expired.getStatus() == 200);
            var expiredBody = GatewayJsonMapper.create().readTree(expired.getContentAsByteArray());
            check("RESULT_EXPIRED".equals(expiredBody.path("status").textValue()) && !expiredBody.has("result"));
            var jdbc = context.getBean(JdbcClient.class);
            check(jdbc.sql("SELECT count(*) FROM processing_job_result_acknowledgements WHERE job_id = :id")
                .param("id", jobId).query(Integer.class).single() == 1);
            var cleanup = context.getBean(CleanupAcknowledgedResultsUseCase.class).execute();
            check(cleanup.completed() == 0 && cleanup.deferred() == 0);
            for (var key : List.of(originalKey, ocrKey, translationKey, imageKey, manifestKey))
                check(!java.nio.file.Files.exists(java.nio.file.Path.of("/work/objects").resolve(key)));
            for (var item : Map.of("image", imageKey, "manifest", manifestKey).entrySet()) {
                var previouslySigned = URI.create(result.path(item.getKey()).path("url").textValue());
                var local = URI.create("http://127.0.0.1:" + server.getAddress().getPort() + "/" + item.getValue()
                    + "?" + previouslySigned.getRawQuery());
                var expires = previouslySigned.getRawQuery().split("&")[1].substring("expires=".length());
                check(Instant.now().getEpochSecond() < Long.parseLong(expires));
                check(client.send(HttpRequest.newBuilder(local).GET().build(), HttpResponse.BodyHandlers.discarding()).statusCode() == 403);
            }
            check(jdbc.sql("SELECT completed_at IS NOT NULL FROM processing_job_result_acknowledgements WHERE job_id = :id")
                .param("id", jobId).query(Boolean.class).single());
            return Map.of("privateDownloadsVerified", true, "ackResponses", 2, "ackIntents", 1, "ackCleanupCompleted", true);
        } finally { server.stop(0); }
    }

    private static byte[] download(HttpClient client, HttpServer server, tools.jackson.databind.JsonNode metadata, String key) throws Exception {
        var signed = URI.create(metadata.path("url").textValue());
        check("https".equals(signed.getScheme()) && "storage.googleapis.com".equals(signed.getHost())
            && signed.getRawPath().equals("/test-bucket/" + key));
        // Only the test transport maps the signed location to its loopback server.
        var local = URI.create("http://127.0.0.1:" + server.getAddress().getPort() + "/" + key + "?" + signed.getRawQuery());
        var response = client.send(HttpRequest.newBuilder(local).GET().build(), HttpResponse.BodyHandlers.ofByteArray());
        check(response.statusCode() == 200 && response.body().length == metadata.path("byteSize").longValue()
            && response.headers().firstValue("Content-Type").orElse("").equals(metadata.path("mimeType").textValue())
            && hash(response.body()).equals(metadata.path("sha256").textValue()));
        return response.body();
    }

    private static String signature(byte[] key, String payload) throws Exception {
        var mac = Mac.getInstance("HmacSHA256"); mac.init(new SecretKeySpec(key, "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
    }
    private static String hash(byte[] bytes) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
    }
    private static void check(boolean condition) { if (!condition) throw new IllegalStateException("private-delivery-probe-failed"); }
}
