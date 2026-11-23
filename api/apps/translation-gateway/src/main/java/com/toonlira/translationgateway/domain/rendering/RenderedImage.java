package com.toonlira.translationgateway.domain.rendering;

import static com.toonlira.translationgateway.domain.rendering.RenderValidationException.Failure.INVALID_OUTPUT;

/** Metadata of the final encoded file; the adapter must compute and verify its bytes. */
public record RenderedImage(String mimeType, long byteSize, int widthPx, int heightPx, String sha256) {
    public RenderedImage {
        if (!"image/webp".equals(mimeType) || byteSize <= 0 || widthPx <= 0 || heightPx <= 0
            || sha256 == null || !sha256.matches("[0-9a-f]{64}")) {
            throw new RenderValidationException(INVALID_OUTPUT);
        }
    }

    @Override public String toString() { return "RenderedImage[redacted]"; }
}
