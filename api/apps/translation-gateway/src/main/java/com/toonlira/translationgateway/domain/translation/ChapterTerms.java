package com.toonlira.translationgateway.domain.translation;

import com.toonlira.translationgateway.domain.ocr.Lexicon;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Names a chapter must translate the same way on every page, found in the page text itself, never in a list of names
 * (docs/principios-de-correcao.md): a word of the language's dictionary written with a capital in the middle of a
 * sentence of ordinary (not all-caps) text, and never in lower case on the page — "Coriander defies death", "Pimienta
 * acaba de crear". Dictionary words are what a translator renders differently page by page ("Coentro" here,
 * "Coriander" there); words the dictionary does not know are names the translation already keeps as written.
 * A capitalised word that is ordinary on the page ("MY Potion!" beside "this potion") is left alone.
 */
public final class ChapterTerms {
    /** A word stops at an apostrophe: "Coriander's" is the name "Coriander", "I've" holds no name. */
    private static final Pattern WORD = Pattern.compile("[\\p{L}](?:[\\p{L}-]*[\\p{L}])?");
    /** Share of upper-case letters from which a text is all-caps lettering (no capital carries a signal there). */
    static final double CAPS_LETTERING = .6;
    /** Longest term remembered (the column bound), in characters. */
    public static final int MAX_TERM_LENGTH = 64;
    private static final Set<String> SPACED_SOURCES = Set.of("en", "es", "pt-BR");

    private ChapterTerms() { }

    /** Candidate names of one page, in order of appearance, each once. */
    public static Set<String> candidates(Iterable<String> texts, String language, Lexicon lexicon) {
        var found = new LinkedHashSet<String>();
        if (!SPACED_SOURCES.contains(language) || !lexicon.available()) return found;
        var lower = new java.util.HashSet<String>();
        for (var text : texts) {
            var words = WORD.matcher(text);
            while (words.find()) {
                var word = words.group();
                if (word.codePoints().allMatch(c -> !Character.isLetter(c) || Character.isLowerCase(c)))
                    lower.add(word.toLowerCase(Locale.ROOT));
            }
        }
        for (var text : texts) {
            if (capsLettering(text)) continue;
            var words = WORD.matcher(text);
            while (words.find()) {
                var word = words.group();
                if (word.length() < 2 || word.length() > MAX_TERM_LENGTH) continue;
                if (!Character.isUpperCase(word.codePointAt(0))) continue;
                // Only "Coriander": not an acronym, not "YouTube" (both already kept as written).
                if (word.codePoints().skip(1).anyMatch(Character::isUpperCase)) continue;
                if (sentenceStart(text, words.start())) continue;
                var key = word.toLowerCase(Locale.ROOT);
                if (lower.contains(key) || !lexicon.knows(Lexicon.core(word))) continue;
                found.add(word);
            }
        }
        return found;
    }

    /**
     * Words a page writes in lower case, in the capitalised form a name would have ("potion" -> "Potion"): evidence
     * that the chapter's capitalised one was emphasis or a title, not a name.
     */
    public static Set<String> ordinaryWords(Iterable<String> texts) {
        var found = new LinkedHashSet<String>();
        for (var text : texts) {
            var words = WORD.matcher(text);
            while (words.find()) {
                var word = words.group();
                if (word.length() < 2 || word.length() > MAX_TERM_LENGTH) continue;
                if (word.codePoints().allMatch(c -> !Character.isLetter(c) || Character.isLowerCase(c)))
                    found.add(word.substring(0, 1).toUpperCase(Locale.ROOT) + word.substring(1));
            }
        }
        return found;
    }

    /**
     * Occurrences of decided terms in a text, as [start, end) spans and their replacement: the term written as decided
     * ("Coriander"), or in capitals in all-caps lettering ("CORIANDER" -> "COENTRO"). A word only containing the term
     * ("Corianders") is not an occurrence, nor is the lower-case common noun ("coriander").
     */
    public static java.util.List<Occurrence> occurrences(String text, Map<String, String> terms) {
        var found = new java.util.ArrayList<Occurrence>();
        if (terms.isEmpty()) return found;
        var spans = new java.util.ArrayList<int[]>();
        var words = WORD.matcher(text);
        while (words.find()) {
            // The "s" of a possessive belongs to the word before it.
            boolean possessive = words.end() - words.start() == 1 && "sS".indexOf(text.charAt(words.start())) >= 0
                && words.start() > 0 && "'’".indexOf(text.charAt(words.start() - 1)) >= 0;
            if (!possessive) spans.add(new int[]{words.start(), words.end()});
        }
        boolean caps = capsLettering(text);
        for (int i = 0; i < spans.size(); i++) {
            var word = text.substring(spans.get(i)[0], spans.get(i)[1]);
            var target = terms.get(word);
            if (target == null) {
                var upper = word.toUpperCase(Locale.ROOT);
                if (!word.equals(upper)) continue;
                for (var entry : terms.entrySet()) {
                    if (entry.getKey().toUpperCase(Locale.ROOT).equals(upper)) { target = entry.getValue().toUpperCase(Locale.ROOT); break; }
                }
            }
            if (target == null) continue;
            // Part of a name of several capitalised words ("Squirrel's End", "Technologist's Union"): the translator
            // renders the whole name; fixing one word of it would leave the rest stranded ("Esquilo 's Fim").
            if (!caps && (joinedCapital(text, spans, i, i - 1) || joinedCapital(text, spans, i, i + 1))) continue;
            found.add(new Occurrence(spans.get(i)[0], spans.get(i)[1], target));
        }
        return found;
    }

    /** Whether word {@code other} starts with a capital and only spaces or a possessive separate it from {@code at}. */
    private static boolean joinedCapital(String text, java.util.List<int[]> spans, int at, int other) {
        if (other < 0 || other >= spans.size()) return false;
        int from = Math.min(spans.get(at)[1], spans.get(other)[1]), to = Math.max(spans.get(at)[0], spans.get(other)[0]);
        var gap = text.substring(Math.min(from, to), Math.max(from, to));
        if (!gap.matches("(?:['’]s)?[ \\u00A0]+")) return false;
        return Character.isUpperCase(text.codePointAt(spans.get(other)[0]));
    }

    public record Occurrence(int start, int end, String target) { }

    private static boolean capsLettering(String text) {
        long upper = text.codePoints().filter(Character::isUpperCase).count();
        long letters = text.codePoints().filter(c -> Character.isUpperCase(c) || Character.isLowerCase(c)).count();
        return letters > 0 && upper >= CAPS_LETTERING * letters;
    }

    /** Nothing but punctuation, quotes or spaces since the start of the text or the end of a sentence. */
    private static boolean sentenceStart(String text, int start) {
        for (int i = start - 1; i >= 0; i--) {
            char c = text.charAt(i);
            if (Character.isWhitespace(c) || "\"'“‘([«¡¿-—".indexOf(c) >= 0) continue;
            return ".!?…:".indexOf(c) >= 0;
        }
        return true;
    }
}
