package com.toonlira.translationgateway.domain.layout;

/** Read-only raster boundary; no image framework in domain. */
public interface PixelImage {
    int width();
    int height();
    int rgb(int x, int y);
}
