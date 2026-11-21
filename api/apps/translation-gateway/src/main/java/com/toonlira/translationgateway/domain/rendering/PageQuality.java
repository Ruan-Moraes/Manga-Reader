package com.toonlira.translationgateway.domain.rendering;

import java.util.ArrayList;
import java.util.List;

/**
 * Page-level quality verdict derived from the per-region placements. It never blocks delivery: the page stays
 * READY, but a reader or reviewer can tell that some text was left in its original form.
 */
public record PageQuality(String status, List<String> issues) {
    public static final String OK = "OK";
    public static final String NEEDS_REVIEW = "NEEDS_REVIEW";
    public static final String TEXT_NOT_RENDERED = "TEXT_NOT_RENDERED";
    public static final String ALL_TEXT_NOT_RENDERED = "ALL_TEXT_NOT_RENDERED";
    /** Some translation was drawn far smaller than its source lettering ({@link RenderTextCounts#TOO_SMALL_SHARE}). */
    public static final String TEXT_TOO_SMALL = "TEXT_TOO_SMALL";

    public PageQuality { issues = List.copyOf(issues); }

    public static PageQuality evaluate(List<RenderManifest.Region> regions, int widthPx, int heightPx) {
        return of(RenderTextCounts.of(regions, widthPx, heightPx));
    }

    /** Derived from persisted counts too, so manifest and ReadyResult can never disagree. */
    public static PageQuality of(RenderTextCounts counts) {
        var issues = new ArrayList<String>();
        if (counts.missing() > 0) issues.add(TEXT_NOT_RENDERED);
        if (counts.missing() > 0 && counts.missing() == counts.textRegions()) issues.add(ALL_TEXT_NOT_RENDERED);
        if (counts.small() > 0) issues.add(TEXT_TOO_SMALL);
        return new PageQuality(issues.isEmpty() ? OK : NEEDS_REVIEW, issues);
    }
}
