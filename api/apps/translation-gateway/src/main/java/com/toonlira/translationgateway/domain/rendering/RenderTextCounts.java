package com.toonlira.translationgateway.domain.rendering;

import static com.toonlira.translationgateway.domain.rendering.RenderValidationException.Failure.INVALID_OUTPUT;

import com.toonlira.translationgateway.domain.OcrLimits;
import java.util.List;

/**
 * Immutable text facts of one rendered page, persisted with the rendering stage: regions whose translation differs
 * from the source, how many of those kept the original instead of being drawn, and how many of the drawn ones came
 * out far smaller than their source lettering. Page quality derives from them.
 */
public record RenderTextCounts(int textRegions, int missing, int small) {
    /**
     * A drawn translation is too small below this share of its source lettering's size, sqrt(box area / letters):
     * on the validation corpus that is a title retyped at a third of its size or a caption at 13 px beside 40 px kana,
     * never ordinary speech.
     */
    public static final double TOO_SMALL_SHARE = .4;

    public RenderTextCounts {
        if (textRegions < 0 || textRegions > OcrLimits.MAX_REGIONS || missing < 0 || missing > textRegions
            || small < 0 || small > textRegions - missing)
            throw new RenderValidationException(INVALID_OUTPUT);
    }

    /** Counts of a page rendered before the small-text count existed: none is known. */
    public RenderTextCounts(int textRegions, int missing) { this(textRegions, missing, 0); }

    public static RenderTextCounts of(List<RenderManifest.Region> regions, int widthPx, int heightPx) {
        int text = 0, missing = 0, small = 0;
        for (var region : regions) {
            // An unchanged region keeps its original lettering on purpose; it is not text to review.
            if (UnchangedText.unchanged(region.sourceText(), region.translatedText())) continue;
            // Drawn text kept as drawn (sound effects, screens) is not missing either.
            if (region.kept()) continue;
            text++;
            if (region.overflow()) missing++;
            else if (tooSmall(region, widthPx, heightPx)) small++;
        }
        return new RenderTextCounts(text, missing, small);
    }

    static boolean tooSmall(RenderManifest.Region region, int widthPx, int heightPx) {
        long letters = region.sourceText().codePoints().filter(Character::isLetterOrDigit).count();
        if (letters == 0) return false;
        double left = 1, top = 1, right = 0, bottom = 0;
        for (var vertex : region.polygon()) {
            left = Math.min(left, vertex.x()); right = Math.max(right, vertex.x());
            top = Math.min(top, vertex.y()); bottom = Math.max(bottom, vertex.y());
        }
        if (right <= left || bottom <= top) return false;
        double pitch = Math.sqrt((right - left) * widthPx * (bottom - top) * heightPx / letters);
        return region.fontSizePx() < TOO_SMALL_SHARE * pitch;
    }

    public PageQuality quality() { return PageQuality.of(this); }
}
