package com.toonlira.translationgateway.domain.rendering;

import static com.toonlira.translationgateway.domain.GatewayErrorCode.STORAGE_UNAVAILABLE;

import com.toonlira.translationgateway.domain.GatewayException;
import java.net.URI;
import java.time.Instant;

/** A short-lived bearer location, never suitable for logs or persistence. */
public record PrivateDownload(URI url, String mimeType, long byteSize, String sha256, Instant expiresAt) {
    public PrivateDownload {
        long limit = "image/webp".equals(mimeType) ? RenderPolicy.MAX_OUTPUT_BYTES
            : "application/json".equals(mimeType) ? RenderPolicy.MAX_MANIFEST_BYTES : 0;
        if (url == null || url.toASCIIString().length() > 8192 || !"https".equals(url.getScheme())
            || !"storage.googleapis.com".equals(url.getHost()) || url.getPort() != -1
            || url.getUserInfo() != null || url.getFragment() != null
            || url.getRawQuery() == null || url.getRawQuery().isBlank()
            || byteSize <= 0 || byteSize > limit || sha256 == null || !sha256.matches("[0-9a-f]{64}")
            || expiresAt == null) {
            throw new GatewayException(STORAGE_UNAVAILABLE, 503, true);
        }
    }

    @Override public String toString() { return "PrivateDownload[redacted]"; }
}
