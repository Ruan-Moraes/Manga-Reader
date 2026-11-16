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
    private LetteringRepair() { }

    public static List<OcrManifest.Region> repair(List<OcrManifest.Region> regions, String sourceLanguage) {
        return repair(regions, sourceLanguage, Lexicon.NONE);
    }

    /**
     * {@code lexicon}: the language's clause openers and alternative words ({@link Lexicon#CLAUSE_OPENERS},
     * {@link Lexicon#ALTERNATIVES}); without them only a mark opening a sentence is repaired.
     */
    public static List<OcrManifest.Region> repair(List<OcrManifest.Region> regions, String sourceLanguage, Lexicon lexicon) {
        if (!"en".equals(sourceLanguage)) return regions;
        var clause = clausePattern(lexicon);
        return regions.stream().map(region -> {
            var text = repairText(region.sourceText(), clause);
            return text.equals(region.sourceText()) ? region
                : new OcrManifest.Region(region.id(), region.readingOrder(), text, region.polygon());
        }).toList();
    }

    static String repairText(String text, Pattern clause) {
        int start = 0;
        while (start < text.length() && Character.isWhitespace(text.charAt(start))) start++;
        var repaired = CROSSBAR_I.matcher(text.substring(start)).replaceAll("$1I");
        return text.substring(0, start) + (clause == null ? repaired : clause.matcher(repaired).replaceAll("$1I"));
    }

    /**
     * Mid-sentence, after a word that opens a clause ("THEN / THINK"), never before an alternative ("AND / OR"):
     * both word classes come from the language's lists, not from this code.
     */
    static Pattern clausePattern(Lexicon lexicon) {
        var openers = lexicon.list(Lexicon.CLAUSE_OPENERS);
        if (openers.isEmpty()) return null;
        var alternatives = lexicon.list(Lexicon.ALTERNATIVES);
        String notAlternative = alternatives.isEmpty() ? "" : "(?!(?:" + join(alternatives) + ")\\b)";
        return Pattern.compile("(?i)(\\b(?:" + join(openers) + ")\\s+)[/|](?=\\s+" + notAlternative + "\\p{Lu})");
    }

    private static String join(java.util.Set<String> words) {
        return String.join("|", words.stream().sorted().map(Pattern::quote).toList());
    }
}
