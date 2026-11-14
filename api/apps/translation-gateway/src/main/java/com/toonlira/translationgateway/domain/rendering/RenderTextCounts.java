package com.toonlira.translationgateway.domain.rendering;

import static com.toonlira.translationgateway.domain.rendering.RenderValidationException.Failure.INVALID_OUTPUT;

import com.toonlira.translationgateway.domain.OcrLimits;
import java.util.List;

/**
 * Immutable text facts of one rendered page, persisted with the rendering stage: regions whose translation differs
 * from the source, and how many of those kept the original instead of being drawn. Page quality derives from them.
 */
public record RenderTextCounts(int textRegions, int missing) {
    public RenderTextCounts {
        if (textRegions < 0 || textRegions > OcrLimits.MAX_REGIONS || missing < 0 || missing > textRegions)
            throw new RenderValidationException(INVALID_OUTPUT);
    }

    public static RenderTextCounts of(List<RenderManifest.Region> regions) {
        int text = 0, missing = 0;
        for (var region : regions) {
            // An unchanged region keeps its original lettering on purpose; it is not text to review.
            if (UnchangedText.unchanged(region.sourceText(), region.translatedText())) continue;
            text++;
            if (region.overflow()) missing++;
        }
        return new RenderTextCounts(text, missing);
    }

    public PageQuality quality() { return PageQuality.of(this); }
}
