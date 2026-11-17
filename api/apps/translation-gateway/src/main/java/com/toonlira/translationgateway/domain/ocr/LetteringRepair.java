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
    /** A dash drawn low between two words of capitals, read as an underscore: "RIO_I MUST", "BUSINESS_I SUPPOSE". */
    /** Angle quotes read as two "less/greater than" signs (or one of each half) against a word: «Hechizos», <<Hechizos»>. */
    private static final Pattern OPEN_QUOTE = Pattern.compile("(?:<<|«<|<«)(?=\\p{L})");
    private static final Pattern CLOSE_QUOTE = Pattern.compile("(?<=[\\p{L}.!?…])(?:>>|»>|>»)");
    private static final Pattern LOW_DASH = Pattern.compile("(?<=\\p{Lu}[!?.]?)_(?=\\s*\\p{Lu})");
    private LetteringRepair() { }

    public static List<OcrManifest.Region> repair(List<OcrManifest.Region> regions, String sourceLanguage) {
        return repair(regions, sourceLanguage, Lexicon.NONE);
    }

    /**
     * {@code lexicon}: the language's clause openers and alternative words ({@link Lexicon#CLAUSE_OPENERS},
     * {@link Lexicon#ALTERNATIVES}); without them only a mark opening a sentence is repaired.
     */
    public static List<OcrManifest.Region> repair(List<OcrManifest.Region> regions, String sourceLanguage, Lexicon lexicon) {
        boolean english = "en".equals(sourceLanguage);
        var clause = english ? clausePattern(lexicon) : null;
        return regions.stream().map(region -> {
            var text = quotes(dashes(region.sourceText()));
            if (english) text = repairText(text, clause);
            return text.equals(region.sourceText()) ? region
                : new OcrManifest.Region(region.id(), region.readingOrder(), text, region.polygon());
        }).toList();
    }

    /**
     * Lettering in capitals has no underscores: one between two capitals is the dash of an interrupted sentence, drawn
     * low. Text with lowercase letters (file names, addresses on a drawn screen: "case_ubuntu") keeps it.
     */
    static String dashes(String text) {
        if (text.indexOf('_') < 0 || text.codePoints().anyMatch(Character::isLowerCase)) return text;
        return LOW_DASH.matcher(text).replaceAll("—");
    }

    /** Lettered angle quotes misread as doubled comparison signs; signs not against a word (code, arrows) stay. */
    static String quotes(String text) {
        if (text.indexOf('<') < 0 && text.indexOf('>') < 0) return text;
        return CLOSE_QUOTE.matcher(OPEN_QUOTE.matcher(text).replaceAll("«")).replaceAll("»");
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
