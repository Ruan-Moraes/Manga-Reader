package com.toonlira.translationgateway.infrastructure.rendering;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import com.google.auth.oauth2.ComputeEngineCredentials;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import com.toonlira.translationgateway.application.AcknowledgeResultUseCase;
import com.toonlira.translationgateway.application.AuthenticateSessionUseCase;
import com.toonlira.translationgateway.application.CancelJobUseCase;
import com.toonlira.translationgateway.application.CleanupAcknowledgedResultsUseCase;
import com.toonlira.translationgateway.application.GetJobResultUseCase;
import com.toonlira.translationgateway.application.JobResultSnapshotUseCase;
import com.toonlira.translationgateway.application.ResultAcknowledgementPersistenceUseCase;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.CredentialHasher;
import com.toonlira.translationgateway.application.port.GatewayRepository;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.toonlira.translationgateway.infrastructure.security.SessionAuthenticationFilter;
import com.toonlira.translationgateway.infrastructure.storage.PrivateDownloadClientFactory;
import com.toonlira.translationgateway.infrastructure.storage.GoogleCloudStorageAdapter;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.presentation.LegacyGatewayController;
import com.toonlira.translationgateway.presentation.GatewayExceptionHandler;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.context.ApplicationContext;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.web.servletapi.SecurityContextHolderAwareRequestFilter;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import tools.jackson.databind.JsonNode;

/** Explicitly opted-in diagnostic, using only a dedicated synthetic GCS bucket and metadata credentials. */
final class CloudPrivateDeliveryProbe {
    record Configuration(String project, String bucket, String signer) { }
    private CloudPrivateDeliveryProbe() { }

    static Configuration configuration(Map<String, String> environment) {
        var project = environment.getOrDefault("MOB020_GCP_PROJECT", "");
        var bucket = environment.getOrDefault("MOB020_GCS_BUCKET", "");
        var signer = environment.getOrDefault("MOB020_GCS_SIGNER", "");
        if (!"1".equals(environment.get("MOB020_GCS_TEST")) || !"toonlira-rm".equals(project)
            || !bucket.matches("mob020-[a-z0-9][a-z0-9-]{1,49}[a-z0-9]")
            || !signer.matches("mob020-[a-z0-9-]{1,22}[a-z0-9]@toonlira-rm\\.iam\\.gserviceaccount\\.com")
            || environment.containsKey("GOOGLE_APPLICATION_CREDENTIALS")) throw new IllegalArgumentException("invalid-cloud-probe-configuration");
        return new Configuration(project, bucket, signer);
    }

    static void checkLocation(URI location, String bucket, String key) {
        if (!"https".equals(location.getScheme()) || !"storage.googleapis.com".equals(location.getHost())
            || location.getPort() != -1 || location.getUserInfo() != null || location.getFragment() != null
            || !("/" + bucket + "/" + key).equals(location.getRawPath()) || location.getRawQuery() == null)
            throw new IllegalArgumentException("invalid-cloud-probe-location");
    }

    static void verifyMetadataCredentials() throws Exception {
        if (!(GoogleCredentials.getApplicationDefault() instanceof ComputeEngineCredentials))
            throw new IllegalStateException("metadata-credentials-required");
    }

    static void requireAbsent(Configuration configuration, String key) {
        var storage = StorageOptions.getDefaultInstance().getService();
        for (var blob : storage.list(configuration.bucket(), Storage.BlobListOption.prefix(key),
                Storage.BlobListOption.versions(true)).iterateAll())
            check(!key.equals(blob.getName()));
    }

    static Map<String, Object> verify(ApplicationContext context, Configuration configuration, UUID owner, UUID jobRef, UUID jobId,
                                      String originalKey, String ocrKey, String translationKey, String imageKey, String manifestKey) throws Exception {
        var storage = StorageOptions.getDefaultInstance().getService();
        for (var key : List.of(imageKey, manifestKey)) {
            var blob = storage.get(configuration.bucket(), key);
            check(blob != null);
            storage.create(BlobInfo.newBuilder(configuration.bucket(), key).setContentType(blob.getContentType())
                .setMetadata(blob.getMetadata()).build(), blob.getContent());
            int versions = 0;
            for (var candidate : storage.list(configuration.bucket(), Storage.BlobListOption.prefix(key),
                    Storage.BlobListOption.versions(true)).iterateAll()) if (key.equals(candidate.getName())) versions++;
            check(versions >= 2);
        }
        var neighborKey = neighborKey(imageKey);
        var neighbor = storage.create(BlobInfo.newBuilder(configuration.bucket(), neighborKey)
            .setContentType("text/plain").build(), new byte[] {1, 2, 3});
        var properties = context.getBean(GatewayProperties.class);
        properties.getResultDownload().setMode(GatewayProperties.ResultDownload.Mode.GCS);
        properties.getResultDownload().setProjectId(configuration.project());
        properties.getResultDownload().setSignerServiceAccount(configuration.signer());
        var signer = new PrivateDownloadClientFactory().create(properties, Clock.systemUTC());
        var signingCalls = new AtomicInteger();
        var resultUseCase = new GetJobResultUseCase(context.getBean(JobResultSnapshotUseCase.class), request -> {
            signingCalls.incrementAndGet();
            return signer.sign(request);
        }, properties, Clock.systemUTC());
        boolean recoveryProbe = "1".equals(System.getenv("MOB020_ACK_FAILURE_PROBE"));
        var acknowledgement = context.getBean(AcknowledgeResultUseCase.class);
        if (recoveryProbe) {
            var persistence = context.getBean(ResultAcknowledgementPersistenceUseCase.class);
            var failedStorage = new GoogleCloudStorageAdapter(properties) {
                @Override public void delete(String key) {
                    throw new GatewayException(GatewayErrorCode.STORAGE_UNAVAILABLE, 503, true);
                }
            };
            acknowledgement = new AcknowledgeResultUseCase(persistence,
                new CleanupAcknowledgedResultsUseCase(persistence, failedStorage, Clock.systemUTC()), Clock.systemUTC());
        }
        var controller = new LegacyGatewayController(null, null, null, null, resultUseCase,
            context.getBean(CancelJobUseCase.class), acknowledgement);
        byte[] secret = new byte[32]; new SecureRandom().nextBytes(secret);
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
        var mvc = MockMvcBuilders.standaloneSetup(controller).setControllerAdvice(new GatewayExceptionHandler())
            .addFilters(new SessionAuthenticationFilter(context.getBean(AuthenticateSessionUseCase.class),
                GatewayJsonMapper.create()), requestWrapper).build();
        check(mvc.perform(get("/v1/page-jobs/{ref}", jobRef)).andReturn().getResponse().getStatus() == 401);
        check(mvc.perform(post("/v1/page-jobs/{ref}/ack", jobRef)).andReturn().getResponse().getStatus() == 401);
        check(mvc.perform(get("/v1/page-jobs/{ref}", jobRef).header("Authorization", "Bearer " + otherToken))
            .andReturn().getResponse().getStatus() == 404 && signingCalls.get() == 0);
        check(mvc.perform(post("/v1/page-jobs/{ref}/ack", jobRef).header("Authorization", "Bearer " + otherToken))
            .andReturn().getResponse().getStatus() == 404);
        var jdbc = context.getBean(JdbcClient.class);
        check(jdbc.sql("SELECT count(*) FROM processing_job_result_acknowledgements WHERE job_id = :id")
            .param("id", jobId).query(Integer.class).single() == 0);
        var response = mvc.perform(get("/v1/page-jobs/{ref}", jobRef).header("Authorization", "Bearer " + token))
            .andReturn().getResponse();
        check(response.getStatus() == 200, "query-status-" + response.getStatus());
        check(response.getHeader("Cache-Control").contains("no-store"), "query-cache-control");
        var envelope = GatewayJsonMapper.create().readTree(response.getContentAsByteArray());
        check("READY".equals(envelope.path("status").textValue()) && signingCalls.get() == 2);
        var result = envelope.path("result");
        check(result.path("widthPx").intValue() == 320 && result.path("heightPx").intValue() == 220);
        var client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(15)).build();
        byte[] image = download(client, result.path("image"), configuration.bucket(), imageKey);
        byte[] manifest = download(client, result.path("manifest"), configuration.bucket(), manifestKey);
        check("image/webp".equals(result.path("image").path("mimeType").textValue()));
        check("application/json".equals(result.path("manifest").path("mimeType").textValue()));
        checkManifest(GatewayJsonMapper.create().readTree(manifest), result, jobRef);
        check(result.path("image").path("sha256").textValue().equals(hash(image)));
        checkLosslessDimensions(image, result.path("widthPx").intValue(), result.path("heightPx").intValue());
        var imageLocation = URI.create(result.path("image").path("url").textValue());
        var unsigned = URI.create("https://storage.googleapis.com/" + configuration.bucket() + "/" + imageKey);
        int unsignedStatus = client.send(HttpRequest.newBuilder(unsigned).timeout(Duration.ofSeconds(30)).GET().build(),
            HttpResponse.BodyHandlers.discarding()).statusCode();
        check(unsignedStatus == 401 || unsignedStatus == 403);
        var tampered = tamperedSignature(imageLocation);
        check(client.send(HttpRequest.newBuilder(tampered).timeout(Duration.ofSeconds(30)).GET().build(),
            HttpResponse.BodyHandlers.discarding()).statusCode() == 403, "tampered-signature-status");
        if (recoveryProbe) {
            check(mvc.perform(post("/v1/page-jobs/{ref}/ack", jobRef).header("Authorization", "Bearer " + token))
                .andReturn().getResponse().getStatus() == 503);
            check(jdbc.sql("SELECT count(*) FROM processing_job_result_acknowledgements WHERE job_id = :id AND completed_at IS NULL")
                .param("id", jobId).query(Integer.class).single() == 1);
            check(storage.get(configuration.bucket(), imageKey) != null && storage.get(configuration.bucket(), manifestKey) != null);
            check(storage.get(neighbor.getBlobId()) != null);
            return Map.of("privateDownloadsVerified", true, "gcsReal", true, "ackResponses", 1,
                "ackFailureStatus", 503, "ackIntents", 1, "ackCleanupPending", true, "neighborPreserved", true);
        }
        for (int i = 0; i < 2; i++) {
            check(mvc.perform(post("/v1/page-jobs/{ref}/ack", jobRef)
                .header("Authorization", "Bearer " + token)).andReturn().getResponse().getStatus() == 202);
            // Observe storage before any explicit maintenance call, including after the first response.
            for (var key : List.of(originalKey, ocrKey, translationKey, imageKey, manifestKey)) requireAbsent(configuration, key);
            check(storage.get(neighbor.getBlobId()) != null);
        }
        var expired = mvc.perform(get("/v1/page-jobs/{ref}", jobRef).header("Authorization", "Bearer " + token))
            .andReturn().getResponse();
        var expiredBody = GatewayJsonMapper.create().readTree(expired.getContentAsByteArray());
        check(expired.getStatus() == 200 && "RESULT_EXPIRED".equals(expiredBody.path("status").textValue()) && !expiredBody.has("result"));
        check(jdbc.sql("SELECT count(*) FROM processing_job_result_acknowledgements WHERE job_id = :id")
            .param("id", jobId).query(Integer.class).single() == 1);
        check(jdbc.sql("SELECT completed_at IS NOT NULL FROM processing_job_result_acknowledgements WHERE job_id = :id")
            .param("id", jobId).query(Boolean.class).single());
        var cleanup = context.getBean(CleanupAcknowledgedResultsUseCase.class).execute();
        check(cleanup.completed() == 0 && cleanup.deferred() == 0);
        for (var key : List.of(originalKey, ocrKey, translationKey, imageKey, manifestKey)) requireAbsent(configuration, key);
        for (var item : List.of(result.path("image"), result.path("manifest"))) {
            check(Instant.now().isBefore(Instant.parse(item.path("expiresAt").textValue())));
            var location = URI.create(item.path("url").textValue());
            int status = client.send(HttpRequest.newBuilder(location).timeout(Duration.ofSeconds(30)).GET().build(),
                HttpResponse.BodyHandlers.discarding()).statusCode();
            check(status == 403 || status == 404);
        }
        check(storage.delete(neighbor.getBlobId()));
        return Map.of("privateDownloadsVerified", true, "gcsReal", true, "ackResponses", 2, "ackIntents", 1,
            "ackCleanupCompleted", true, "deletedSignedUrlsDenied", true, "versionedCleanupVerified", true,
            "neighborPreserved", true, "unsignedDownloadDenied", true, "signatureMutationDenied", true);
    }

    static URI tamperedSignature(URI location) {
        var query = location.getRawQuery();
        check(query != null);
        var fields = query.split("&", -1);
        boolean found = false;
        for (int index = 0; index < fields.length; index++) {
            var prefix = "X-Goog-Signature=";
            if (!fields[index].startsWith(prefix)) continue;
            check(!found);
            var signature = fields[index].substring(prefix.length());
            check(signature.matches("[0-9a-fA-F]+"));
            fields[index] = prefix + (signature.charAt(0) == '0' ? '1' : '0') + signature.substring(1);
            found = true;
        }
        check(found);
        var base = location.toASCIIString();
        return URI.create(base.substring(0, base.indexOf('?') + 1) + String.join("&", fields));
    }

    static String neighborKey(String imageKey) {
        int leaf = imageKey.lastIndexOf('/') + 1;
        check(imageKey.endsWith(".webp"));
        var id = UUID.fromString(imageKey.substring(leaf, imageKey.length() - ".webp".length()));
        var neighbor = new UUID(id.getMostSignificantBits() ^ Long.MIN_VALUE, id.getLeastSignificantBits());
        return imageKey.substring(0, leaf) + neighbor + ".webp";
    }

    static void checkManifest(JsonNode document, JsonNode result, UUID jobRef) {
        check("1.0".equals(document.path("version").textValue()) && jobRef.toString().equals(document.path("jobRef").textValue()));
        var image = document.path("image");
        for (var field : List.of("sha256", "mimeType", "byteSize"))
            check(result.path("image").path(field).equals(image.path(field)));
        for (var field : List.of("widthPx", "heightPx")) check(result.path(field).equals(image.path(field)));
    }

    private static byte[] download(HttpClient client, JsonNode metadata, String bucket, String key) throws Exception {
        var location = URI.create(metadata.path("url").textValue());
        checkLocation(location, bucket, key);
        var response = client.send(HttpRequest.newBuilder(location).timeout(Duration.ofSeconds(30)).GET().build(),
            HttpResponse.BodyHandlers.ofInputStream());
        try (var body = response.body()) {
            byte[] bytes = body.readNBytes(64 * 1024 * 1024 + 1);
            check(response.statusCode() == 200, "download-status-" + response.statusCode());
            check(bytes.length <= 64 * 1024 * 1024 && bytes.length == metadata.path("byteSize").longValue(), "download-size");
            check(response.headers().firstValue("Content-Type").orElse("").equals(metadata.path("mimeType").textValue()), "download-content-type");
            check(hash(bytes).equals(metadata.path("sha256").textValue()), "download-sha256");
            return bytes;
        }
    }

    private static String hash(byte[] bytes) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
    }

    static void checkLosslessDimensions(byte[] bytes, int width, int height) {
        check(bytes.length >= 26 && tag(bytes, 0, "RIFF") && tag(bytes, 8, "WEBP")
            && littleEndian(bytes, 4) == bytes.length - 8L);
        for (int offset = 12; offset <= bytes.length - 8;) {
            long size = littleEndian(bytes, offset + 4);
            long next = (long) offset + 8 + size + (size & 1);
            check(next <= bytes.length);
            if (tag(bytes, offset, "VP8L")) {
                check(size >= 5 && bytes[offset + 8] == 0x2f);
                long bits = littleEndian(bytes, offset + 9);
                check((bits & 0x3fff) + 1 == width && ((bits >>> 14) & 0x3fff) + 1 == height
                    && (bits >>> 29) == 0);
                return;
            }
            offset = (int) next;
        }
        throw new IllegalStateException("cloud-private-delivery-probe-failed");
    }
    private static boolean tag(byte[] bytes, int offset, String value) {
        for (int index = 0; index < 4; index++) if ((bytes[offset + index] & 0xff) != value.charAt(index)) return false;
        return true;
    }
    private static long littleEndian(byte[] bytes, int offset) {
        return (bytes[offset] & 0xffL) | ((bytes[offset + 1] & 0xffL) << 8)
            | ((bytes[offset + 2] & 0xffL) << 16) | ((bytes[offset + 3] & 0xffL) << 24);
    }
    private static void check(boolean condition) { if (!condition) throw new IllegalStateException("cloud-private-delivery-probe-failed"); }
    private static void check(boolean condition, String code) { if (!condition) throw new IllegalStateException("cloud-probe-" + code); }
}
