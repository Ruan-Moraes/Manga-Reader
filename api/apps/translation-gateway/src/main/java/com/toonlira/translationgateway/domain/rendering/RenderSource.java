package com.toonlira.translationgateway.domain.rendering;

import static com.toonlira.translationgateway.domain.rendering.RenderValidationException.Failure.INVALID_INPUT;

import java.util.Set;

/** Verified metadata supplied by the caller; construction does not inspect image bytes. */
public record RenderSource(String mimeType, long byteSize, int widthPx, int heightPx, String sha256) {
    private static final Set<String> MIME_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    public RenderSource {
        if (mimeType == null || !MIME_TYPES.contains(mimeType) || byteSize <= 0
            || widthPx <= 0 || heightPx <= 0 || sha256 == null || !sha256.matches("[0-9a-f]{64}")) {
            throw new RenderValidationException(INVALID_INPUT);
        }
    }

    @Override public String toString() { return "RenderSource[redacted]"; }
}
