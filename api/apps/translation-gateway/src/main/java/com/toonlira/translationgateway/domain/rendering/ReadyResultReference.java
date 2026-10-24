package com.toonlira.translationgateway.domain.rendering;

import static com.toonlira.translationgateway.domain.GatewayErrorCode.STORAGE_UNAVAILABLE;

import com.toonlira.translationgateway.domain.GatewayException;
import java.time.Instant;
import java.time.Duration;

/** Persisted metadata snapshot, never a bearer URL or OCR text. */
public record ReadyResultReference(int widthPx, int heightPx, String imageObjectKey, String imageSha256,
                                   long imageByteSize, String manifestObjectKey, String manifestSha256,
                                   Instant completedAt, Instant resultExpiresAt) {
    /** Historical one-hour boundary; persistence must supply the stored deadline explicitly. */
    public ReadyResultReference(int widthPx, int heightPx, String imageObjectKey, String imageSha256,
                                long imageByteSize, String manifestObjectKey, String manifestSha256, Instant completedAt) {
        this(widthPx, heightPx, imageObjectKey, imageSha256, imageByteSize, manifestObjectKey, manifestSha256,
            completedAt, legacyExpiry(completedAt));
    }
    public ReadyResultReference {
        if (widthPx <= 0 || heightPx <= 0 || widthPx > RenderPolicy.MAX_DIMENSION_PX
            || heightPx > RenderPolicy.MAX_DIMENSION_PX || (long) widthPx * heightPx > RenderPolicy.MAX_PIXELS
            || completedAt == null || resultExpiresAt == null || !resultExpiresAt.isAfter(completedAt)
            || Duration.between(completedAt, resultExpiresAt).compareTo(Duration.ofSeconds(3600)) > 0
            || imageObjectKey == null || imageObjectKey.equals(manifestObjectKey)) {
            throw new GatewayException(STORAGE_UNAVAILABLE, 503, true);
        }
        new PrivateDownloadRequest(imageObjectKey, PrivateDownloadRequest.Kind.IMAGE, imageSha256, imageByteSize, completedAt);
        new PrivateDownloadRequest(manifestObjectKey, PrivateDownloadRequest.Kind.MANIFEST, manifestSha256, null, completedAt);
        try {
            var imageExpiry = ResultObjectKey.expiry(imageObjectKey);
            var manifestExpiry = ResultObjectKey.expiry(manifestObjectKey);
            if (!imageExpiry.equals(manifestExpiry) || (imageExpiry.isPresent() && !imageExpiry.orElseThrow().equals(resultExpiresAt))) {
                throw new GatewayException(STORAGE_UNAVAILABLE, 503, true);
            }
        } catch (IllegalArgumentException invalid) { throw new GatewayException(STORAGE_UNAVAILABLE, 503, true); }
    }
    private static Instant legacyExpiry(Instant completedAt) {
        try { return completedAt.plusSeconds(3600); }
        catch (RuntimeException invalid) { throw new GatewayException(STORAGE_UNAVAILABLE, 503, true); }
    }
    @Override public String toString() { return "ReadyResultReference[redacted]"; }
}
