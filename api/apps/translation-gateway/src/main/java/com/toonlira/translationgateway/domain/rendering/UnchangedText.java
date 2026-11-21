package com.toonlira.translationgateway.domain.rendering;

import java.util.Locale;

/**
 * A translation equal to its source (names, sound effects, interjections such as "AKANE!" or "FREEK") has nothing to
 * replace: the original lettering is kept as drawn instead of being erased and retypeset in a plain font.
 */
public final class UnchangedText {
    private UnchangedText() { }

    public static boolean unchanged(String source, String translated) {
        if (source == null || translated == null) return false;
        return normalize(source).equals(normalize(translated));
    }

    private static String normalize(String text) {
        return text.strip().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
    }
}
