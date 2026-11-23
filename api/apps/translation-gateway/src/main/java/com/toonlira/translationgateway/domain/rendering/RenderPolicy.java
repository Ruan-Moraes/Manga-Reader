package com.toonlira.translationgateway.domain.rendering;

import static com.toonlira.translationgateway.domain.rendering.RenderValidationException.Failure.INVALID_POLICY;

/** Bounded policy snapshot; operational capabilities may only restrict media limits. */
public record RenderPolicy(String version, long maxOriginalBytes, int maxWidthPx, int maxHeightPx,
                           long maxPixels, long maxOutputBytes, int maxManifestBytes,
                           int minimumFontPx, int maximumFontPx, int paddingPx) {
    public static final long MAX_ORIGINAL_BYTES = 12L * 1024 * 1024;
    public static final int MAX_DIMENSION_PX = 12_000;
    public static final long MAX_PIXELS = 80_000_000;
    public static final long MAX_OUTPUT_BYTES = 64L * 1024 * 1024;
    public static final int MAX_MANIFEST_BYTES = 4 * 1024 * 1024;
    /**
     * Absolute legibility floor. Each region's own minimum is {@link #COMFORT_FONT_PX}, or its source lettering's size
     * when that is smaller (a low-resolution scan): never below this.
     */
    private static final int MINIMUM_FONT_PX = 8;
    /** Smallest size chosen for text whose source lettering is at least this big. */
    public static final int COMFORT_FONT_PX = 12;
    private static final int MAXIMUM_FONT_PX = 48;
    /**
     * Ceiling of hand-drawn lettering retyped at its own size (a page title, a big shout), above the speech ceiling
     * {@link #maximumFontPx}: the size a title of a full-width page is drawn at.
     */
    public static final int MAXIMUM_LETTERING_FONT_PX = 256;
    private static final int PADDING_PX = 2;
    private static final String CURRENT_VERSION = "clean-box-1.2";

    public RenderPolicy {
        if (version == null || !version.matches("[a-z0-9][a-z0-9.-]{0,63}")
            || maxOriginalBytes <= 0 || maxOriginalBytes > MAX_ORIGINAL_BYTES
            || maxWidthPx <= 0 || maxWidthPx > MAX_DIMENSION_PX
            || maxHeightPx <= 0 || maxHeightPx > MAX_DIMENSION_PX
            || maxPixels <= 0 || maxPixels > MAX_PIXELS
            || maxOutputBytes <= 0 || maxOutputBytes > MAX_OUTPUT_BYTES
            || maxManifestBytes <= 0 || maxManifestBytes > MAX_MANIFEST_BYTES
            || minimumFontPx <= 0 || maximumFontPx < minimumFontPx
            || maximumFontPx > MAX_DIMENSION_PX || paddingPx < 0 || paddingPx > MAX_DIMENSION_PX) {
            throw new RenderValidationException(INVALID_POLICY);
        }
    }

    /** Largest font a render may report: speech stays under {@link #maximumFontPx}, retyped lettering under this. */
    public int largestFontPx() { return Math.max(maximumFontPx, MAXIMUM_LETTERING_FONT_PX); }

    public static RenderPolicy initial() {
        return new RenderPolicy(CURRENT_VERSION, MAX_ORIGINAL_BYTES, MAX_DIMENSION_PX,
            MAX_DIMENSION_PX, MAX_PIXELS, MAX_OUTPUT_BYTES, MAX_MANIFEST_BYTES,
            MINIMUM_FONT_PX, MAXIMUM_FONT_PX, PADDING_PX);
    }

    public String encoding() { return "webp-lossless"; }

    /** Compression effort, not pixel loss. Earlier/custom policy snapshots keep the legacy encoder method. */
    public int compressionMethod() { return CURRENT_VERSION.equals(version) ? 0 : 4; }
}
