package com.toonlira.translationgateway.domain.ocr;

import com.toonlira.translationgateway.domain.OcrManifest;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Misreadings typical of comic lettering, repaired before translation. English lettering draws the pronoun "I" with
 * serifs, and OCR reads it as a lone slash or bar: "/ AGREE!", "| THINK THE PROBLEM…". Only a lone mark opening the
 * speech or a sentence, before a capitalised word, is taken as "I" — a slash between words ("CLI / GUI") stays.
 */
public final class LetteringRepair {
    private static final Pattern CROSSBAR_I = Pattern.compile("(^|[.!?…]\\s+|\\R\\s*)[/|](?=\\s+\\p{Lu})");

    private LetteringRepair() { }

    public static List<OcrManifest.Region> repair(List<OcrManifest.Region> regions, String sourceLanguage) {
        if (!"en".equals(sourceLanguage)) return regions;
        return regions.stream().map(region -> {
            var text = repairText(region.sourceText());
            return text.equals(region.sourceText()) ? region
                : new OcrManifest.Region(region.id(), region.readingOrder(), text, region.polygon());
        }).toList();
    }

    static String repairText(String text) {
        int start = 0;
        while (start < text.length() && Character.isWhitespace(text.charAt(start))) start++;
        return text.substring(0, start) + CROSSBAR_I.matcher(text.substring(start)).replaceAll("$1I");
    }
}
