package com.toonlira.translationgateway.domain;

public final class OcrLimits {
    public static final int MAX_REGIONS = 1_024;
    public static final int MAX_TEXT_PER_REGION = 4_096;
    public static final int MAX_TEXT_TOTAL = 262_144;
    public static final int MAX_MANIFEST_BYTES = 1_048_576;
    public static final int MAX_RESPONSE_BYTES = 4 * 1_048_576;

    private OcrLimits() { }
}
