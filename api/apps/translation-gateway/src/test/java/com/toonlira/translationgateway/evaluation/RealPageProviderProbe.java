package com.toonlira.translationgateway.evaluation;

import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.toonlira.translationgateway.application.OcrManifestService;
import com.toonlira.translationgateway.application.TranslationManifestService;
import com.toonlira.translationgateway.application.port.OcrPort;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationValidator;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.toonlira.translationgateway.infrastructure.ocr.EvaluationVisionCapture;
import com.toonlira.translationgateway.infrastructure.ocr.LegacyVisionOcrAdapter;
import com.toonlira.translationgateway.infrastructure.storage.EvaluationStorageFactory;
import com.toonlira.translationgateway.infrastructure.translation.CloudTranslationAdapter;
import com.toonlira.translationgateway.infrastructure.translation.EvaluationTranslationCapture;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.nio.file.attribute.PosixFilePermissions;
import java.time.Instant;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Operator-only real-provider pilot. Token arrives on stdin, stays in memory, and is never passed to the app. */
public final class RealPageProviderProbe {
    private RealPageProviderProbe() { }

    public static void main(String[] arguments) throws Exception {
        if (arguments.length != 1) throw new IllegalArgumentException("real-page-pilot-not-admitted");
        var input = RealPagePilotAdmission.admit(Path.of(arguments[0]),
            "one-synthetic-en-pt-BR".equals(System.getenv("TOONLIRA_REAL_PAGE_APPROVAL")));
        RealPagePilotAdmission.claim(input);
        var output = Files.createDirectory(input.root().resolve("provider-output"),
            PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rwx------")));
        var mapper = GatewayJsonMapper.create();
        var result = new LinkedHashMap<String, Object>();
        result.put("outcome", "failed"); result.put("startedAt", Instant.now().toString());
        result.put("sourceSha256", input.sha256()); result.put("sourceLanguage", "en"); result.put("targetLanguage", "pt-BR");
        result.put("credentialMode", "explicit-short-lived-operator-access-token"); result.put("providerMode", "real");
        result.put("automaticRetries", false); result.put("ocrCallsStarted", 0); result.put("translationCallsStarted", 0);
        var jobRef = UUID.randomUUID();
        var key = "private/originals/real-page-" + UUID.randomUUID() + ".png";
        var blobId = BlobId.of(input.bucket(), key);
        var owner = UUID.randomUUID().toString();
        Storage storage = null;
        boolean objectAttempted = false;
        var visionCapture = new EvaluationVisionCapture(output, false);
        var translationCapture = new EvaluationTranslationCapture(output, false);
        String phase = "credentials";
        try {
            byte[] tokenBytes = System.in.readNBytes(8193);
            if (tokenBytes.length > 8192) throw new IllegalArgumentException();
            var token = new String(tokenBytes, StandardCharsets.US_ASCII).strip();
            if (!token.startsWith("ya29.") || token.contains("\n") || token.length() < 32) throw new IllegalArgumentException();
            var credentials = GoogleCredentials.create(new AccessToken(token, Date.from(Instant.now().plusSeconds(900))))
                .createWithQuotaProject(input.project());
            writePrivate(output.resolve("source.png"), input.sourceBytes());
            writePrivate(output.resolve("request.json"), mapper.writeValueAsBytes(Map.of(
                "jobRef", jobRef.toString(), "sourceSha256", input.sha256(), "sourceLanguage", "en", "targetLanguage", "pt-BR",
                "visionEndpoint", "us-vision.googleapis.com:443", "translationEndpoint", "translate.googleapis.com:443",
                "model", "general/translation-llm", "maxCostCents", 100)));
            phase = "storage-preflight";
            storage = EvaluationStorageFactory.options(credentials, input.project()).getService();
            var bucket = storage.get(input.bucket());
            if (bucket == null || !bucket.getLocation().toUpperCase(Locale.ROOT).startsWith("US")
                || bucket.getIamConfiguration() == null
                || !Boolean.TRUE.equals(bucket.getIamConfiguration().isUniformBucketLevelAccessEnabled())
                || !"enforced".equalsIgnoreCase(String.valueOf(bucket.getIamConfiguration().getPublicAccessPrevention()))) {
                throw new IllegalArgumentException();
            }
            phase = "original-upload";
            writePrivate(output.resolve("object-intent.json"), mapper.writeValueAsBytes(Map.of(
                "bucket", input.bucket(), "objectKey", key, "owner", owner, "sourceSha256", input.sha256())));
            objectAttempted = true;
            var blob = storage.create(BlobInfo.newBuilder(blobId).setContentType("image/png")
                .setMetadata(Map.of("source-sha256", input.sha256(), "pilot-owner", owner)).build(),
                input.sourceBytes(), Storage.BlobTargetOption.doesNotExist());
            writePrivate(output.resolve("object-receipt.json"), mapper.writeValueAsBytes(Map.of("generation", blob.getGeneration())));
            try (var vision = new LegacyVisionOcrAdapter(EvaluationVisionCapture.client(credentials, visionCapture), input.project(), input.bucket());
                 var translation = new CloudTranslationAdapter(EvaluationTranslationCapture.client(credentials, translationCapture), input.projectNumber())) {
                phase = "ocr"; result.put("ocrCallsStarted", 1);
                var regions = vision.recognize(new OcrPort.Command(key, "en", jobRef, 900, 600));
                if (!"captured".equals(visionCapture.metadata().get("status")) || regions.isEmpty()
                    || regions.size() > 16 || regions.stream().mapToInt(region -> region.sourceText().length()).sum() > 1024) {
                    throw new IllegalStateException();
                }
                var ocr = new OcrManifest("1.0", jobRef, "en", 900, 600, regions);
                var encodedOcr = new OcrManifestService(mapper).encode(ocr);
                writePrivate(output.resolve("ocr-manifest.json"), encodedOcr.bytes());
                result.put("ocrManifestSha256", encodedOcr.sha256()); result.put("ocrRegions", regions.size());
                var request = new TranslationRequest(jobRef, new LanguagePair("en", "pt-BR"), regions.stream()
                    .map(region -> new TranslationRequest.Region(region.id(), region.readingOrder(), region.sourceText())).toList());
                phase = "translation"; result.put("translationCallsStarted", 1);
                var response = translation.translate(request);
                if (!"captured".equals(translationCapture.metadata().get("status"))) throw new IllegalStateException();
                var validated = new TranslationValidator(Set.of(request.pair())).validateResponse(request, response);
                var manifests = new TranslationManifestService(mapper);
                var encoded = manifests.encode(validated, encodedOcr.sha256());
                manifests.decode(encoded.bytes(), encoded.sha256(), request, encodedOcr.sha256());
                writePrivate(output.resolve("translation-manifest.json"), encoded.bytes());
                result.put("translationManifestSha256", encoded.sha256()); result.put("translationRegions", validated.regions().size());
                result.put("sourceCharacters", request.regions().stream().mapToInt(region -> region.sourceText().length()).sum());
                result.put("translatedCharacters", validated.regions().stream().mapToInt(region -> region.translatedText().length()).sum());
                result.put("model", "general/translation-llm"); result.put("outcome", "providers-succeeded");
            }
        } catch (Exception error) {
            result.put("failedPhase", phase);
            result.put("errorCode", error instanceof GatewayException gateway ? gateway.code().value() : "real-page-pilot-unavailable");
            result.put("failureType", error.getClass().getSimpleName());
        } finally {
            result.put("visionCapture", visionCapture.metadata()); result.put("translationCapture", translationCapture.metadata());
            boolean cleanupPending = objectAttempted;
            if (storage != null && objectAttempted) {
                try {
                    var stored = storage.get(blobId);
                    if (stored == null) cleanupPending = false;
                    else if (stored.getMetadata() != null && owner.equals(stored.getMetadata().get("pilot-owner"))
                        && input.sha256().equals(stored.getMetadata().get("source-sha256"))) {
                        storage.delete(stored.getBlobId(), Storage.BlobSourceOption.generationMatch(stored.getGeneration()));
                        cleanupPending = storage.get(blobId) != null;
                    }
                } catch (Exception ignored) { cleanupPending = true; }
            }
            result.put("cleanupPending", cleanupPending); result.put("finishedAt", Instant.now().toString());
            writePrivate(output.resolve("result.json"), mapper.writeValueAsBytes(result));
        }
        System.out.println(mapper.writeValueAsString(Map.of("outcome", result.get("outcome"),
            "cleanupPending", result.get("cleanupPending"), "ocrCallsStarted", result.get("ocrCallsStarted"),
            "translationCallsStarted", result.get("translationCallsStarted"))));
        if (!"providers-succeeded".equals(result.get("outcome")) || Boolean.TRUE.equals(result.get("cleanupPending"))) System.exit(1);
    }

    private static void writePrivate(Path path, byte[] bytes) throws Exception {
        Files.createFile(path, PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rw-------")));
        Files.write(path, bytes, StandardOpenOption.WRITE);
    }
}
