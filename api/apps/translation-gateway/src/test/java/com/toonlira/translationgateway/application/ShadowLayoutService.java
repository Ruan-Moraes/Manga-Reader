package com.toonlira.translationgateway.application;

import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.application.port.LayoutPort;
import com.toonlira.translationgateway.application.port.ObjectStoragePort;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.layout.LayoutFailure;
import com.toonlira.translationgateway.domain.layout.BubbleDeduplicator;
import com.toonlira.translationgateway.domain.layout.LayoutOutcome;
import com.toonlira.translationgateway.domain.layout.LayoutParameters;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class ShadowLayoutService {
    private final LayoutPort layout;
    private final ObjectStoragePort storage;
    private final ObjectMapper mapper;
    private final Clock clock;

    public ShadowLayoutService(LayoutPort layout, ObjectStoragePort storage, ObjectMapper mapper, Clock clock) {
        this.layout = layout;
        this.storage = storage;
        this.mapper = mapper;
        this.clock = clock;
    }

    public LayoutOutcome prepare(UUID jobId, Path image, OcrManifest ocr, String imageHash, String ocrHash) {
        if (!layout.available()) return null;
        Instant started = Instant.now(clock);
        Path temporary = null;
        String key = null;
        try {
            var result = layout.analyze(image, ocr, imageHash, ocrHash);
            if (result == null || !("1.0".equals(result.layoutVersion()) || "1.1".equals(result.layoutVersion())) || !imageHash.equals(result.imageSha256())
                || !ocrHash.equals(result.ocrManifestSha256()) || result.associations().size() != ocr.regions().size())
                throw new LayoutFailure(LayoutFailure.Code.INVALID_RESPONSE);
            BubbleDeduplicator.validateAudit(result);
            var bytes = mapper.writeValueAsBytes(result);
            if (bytes.length > LayoutParameters.MAX_BYTES) throw new LayoutFailure(LayoutFailure.Code.LIMIT_EXCEEDED);
            var hash = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
            temporary = Files.createTempFile("translation-layout-", ".json");
            Files.write(temporary, bytes);
            key = "private/layout/" + jobId + "/" + UUID.randomUUID() + ".json";
            storage.store(key, temporary, "application/json", hash, Instant.now(clock));
            return new LayoutOutcome(LayoutOutcome.Status.SUCCEEDED, key, hash, null, started, Instant.now(clock));
        } catch (Exception | LinkageError error) {
            if (key != null) deleteBestEffort(key);
            String code = error instanceof LayoutFailure failure ? failure.getMessage() : "layout-unavailable";
            return new LayoutOutcome(LayoutOutcome.Status.FAILED, null, null, code, started, Instant.now(clock));
        } finally {
            if (temporary != null) try { Files.deleteIfExists(temporary); } catch (Exception ignored) { }
        }
    }

    public void discard(LayoutOutcome outcome) {
        if (outcome != null && outcome.objectKey() != null) deleteBestEffort(outcome.objectKey());
    }

    private void deleteBestEffort(String key) { try { storage.delete(key); } catch (RuntimeException ignored) { } }
}
