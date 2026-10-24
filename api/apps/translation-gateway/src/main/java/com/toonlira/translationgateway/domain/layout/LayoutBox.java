package com.toonlira.translationgateway.domain.layout;

/** Normalized coordinates, right/bottom exclusive for raster detection. */
public record LayoutBox(double left, double top, double right, double bottom) {
    public LayoutBox {
        if (!Double.isFinite(left) || !Double.isFinite(top) || !Double.isFinite(right)
            || !Double.isFinite(bottom) || left < 0 || top < 0 || right > 1 || bottom > 1
            || left >= right || top >= bottom) throw new IllegalArgumentException("Invalid layout box");
    }
}
