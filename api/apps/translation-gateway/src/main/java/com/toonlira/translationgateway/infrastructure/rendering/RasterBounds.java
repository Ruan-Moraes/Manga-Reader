package com.toonlira.translationgateway.infrastructure.rendering;

import com.toonlira.translationgateway.domain.rendering.RenderPolicy;

/** Pure raster admission shared by the memory decoder and native allocation. */
final class RasterBounds {
    private RasterBounds() { }
    static void require(int width, int height, RenderPolicy policy) {
        if (policy == null || width <= 0 || height <= 0 || width > policy.maxWidthPx()
            || height > policy.maxHeightPx() || (long) width * height > policy.maxPixels())
            throw new RenderFileException(RenderFileException.Failure.INVALID_MEDIA);
    }
    static void checkInterrupted() {
        if (Thread.currentThread().isInterrupted()) throw new RenderFileException(RenderFileException.Failure.CANCELLED);
    }
}
