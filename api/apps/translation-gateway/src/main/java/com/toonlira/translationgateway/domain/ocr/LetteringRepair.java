package com.toonlira.translationgateway.domain.ocr;

import com.toonlira.translationgateway.domain.OcrManifest;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Misreadings typical of comic lettering, repaired before translation. English lettering draws the pronoun "I" with
 * serifs, and OCR reads it as a lone slash or bar: "/ AGREE!", "| THINK THE PROBLEM…". Only a lone mark opening the
 * speech or a sentence, or following a word that opens a clause, before a capitalised word, is taken as "I" — a
 * slash between alternatives ("CLI / GUI", "AND / OR") stays.
 */
public final class LetteringRepair {
    private static final Pattern CROSSBAR_I = Pattern.compile("(^|[.!?…]\\s+|\\R\\s*)[/|](?=\\s+\\p{Lu})");
    /**
     * Mid-sentence, after a word that opens a clause ("THEN / THINK", "SO | GUESS"): a closed class of conjunctions and
     * discourse words, never followed by an alternative ("AND / OR", "YES / NO" and "CLI / GUI" stay).
     */
    private static final Pattern CLAUSE_I = Pattern.compile(
        "(?i)(\\b(?:then|so|but|and|because|now|well|if|when|maybe|actually|also|oh|ah|yeah|ok|okay)\\s+)[/|]"
            + "(?=\\s+(?!(?:and|or|not|nor)\\b)\\p{Lu})");

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
        var repaired = CROSSBAR_I.matcher(text.substring(start)).replaceAll("$1I");
        return text.substring(0, start) + CLAUSE_I.matcher(repaired).replaceAll("$1I");
    }
}
