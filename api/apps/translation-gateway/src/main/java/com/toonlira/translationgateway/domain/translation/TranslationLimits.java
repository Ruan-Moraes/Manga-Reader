package com.toonlira.translationgateway.domain.translation;

import com.toonlira.translationgateway.domain.OcrLimits;

/** UTF-16 units, matching String.length(); not provider or transport quotas. */
public final class TranslationLimits {
    public static final int MAX_REGIONS = OcrLimits.MAX_REGIONS;
    public static final int MAX_SOURCE_PER_REGION = OcrLimits.MAX_TEXT_PER_REGION;
    public static final int MAX_SOURCE_TOTAL = OcrLimits.MAX_TEXT_TOTAL;
    public static final int MAX_TRANSLATED_PER_REGION = 2 * MAX_SOURCE_PER_REGION;
    public static final int MAX_TRANSLATED_TOTAL = 2 * MAX_SOURCE_TOTAL;

    private TranslationLimits() { }
}
