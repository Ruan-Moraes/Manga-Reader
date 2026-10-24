package com.toonlira.translationgateway.domain.rendering;

import static com.toonlira.translationgateway.domain.GatewayErrorCode.STORAGE_UNAVAILABLE;

import com.toonlira.translationgateway.domain.GatewayException;
import java.time.Instant;

/** Internal persisted references only; callers must first verify ownership and READY. */
public record PrivateDownloadRequest(String objectKey, Kind kind, String sha256,
                                     Long expectedByteSize, Instant resultExpiresAt) {
    public PrivateDownloadRequest {
        if (objectKey == null || objectKey.length() > 512
            || !objectKey.matches("private/rendering/[A-Za-z0-9._/-]+")
            || objectKey.contains("..") || objectKey.contains("//") || objectKey.endsWith("/")
            || kind == null || sha256 == null || !sha256.matches("[0-9a-f]{64}")
            || resultExpiresAt == null || (kind == Kind.IMAGE && expectedByteSize == null)
            || (expectedByteSize != null && (expectedByteSize <= 0 || expectedByteSize > kind.maxBytes()))) {
            throw new GatewayException(STORAGE_UNAVAILABLE, 503, true);
        }
    }

    public enum Kind {
        IMAGE("image/webp", RenderPolicy.MAX_OUTPUT_BYTES),
        MANIFEST("application/json", RenderPolicy.MAX_MANIFEST_BYTES);

        private final String mimeType;
        private final long maxBytes;
        Kind(String mimeType, long maxBytes) { this.mimeType = mimeType; this.maxBytes = maxBytes; }
        public String mimeType() { return mimeType; }
        public long maxBytes() { return maxBytes; }
    }

    @Override public String toString() { return "PrivateDownloadRequest[redacted]"; }
}
