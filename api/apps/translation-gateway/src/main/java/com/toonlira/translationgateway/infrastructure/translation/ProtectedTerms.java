package com.toonlira.translationgateway.infrastructure.translation;

import com.toonlira.translationgateway.domain.ocr.Lexicon;
import com.toonlira.translationgateway.infrastructure.ocr.ClasspathLexicons;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;
import java.util.regex.Pattern;

/**
 * Literals that must reach the page exactly as written in the source: formats (URLs, $variables, file names,
 * snake_case identifiers) and names recognised from the text itself — never a fixed list of words, which would only
 * know the work it was written for (docs/principios-de-correcao.md). A name is a word with a capital inside it
 * ("YouTube"), or, outside all-caps lettering, an acronym or a capitalised word mid-sentence that the source
 * language's dictionary does not know ("GNOME", "Akane"); in Japanese or Chinese text, any Latin word ("Ubuntu").
 * All-caps lettering carries no such signal and is left to the translator and the language layer.
 */
final class ProtectedTerms {
    static final String OPEN = "<span translate=\"no\">";
    static final String CLOSE = "</span>";
    // URLs, $variables, file names ("Skegness.pdf": lower-case extension right after the dot) and snake_case
    // identifiers ("case_ubuntu_v2"): names a translator would mangle ("caso_Wellcome.pdf").
    private static final Pattern FORMATS = Pattern.compile("https?://[^\\s<>\"]+|\\$[A-Za-z_][A-Za-z0-9_]*"
        + "|[\\p{L}\\p{N}_-]+\\.[a-z][a-z0-9]{1,3}(?![\\p{L}\\p{N}.])"
        + "|[\\p{L}\\p{N}]+(?:_[\\p{L}\\p{N}]*)+");
    /** An upper-case letter right after a lower-case one, inside one word. */
    private static final Pattern CAMEL = Pattern.compile("\\p{Ll}\\p{Lu}");
    private static final Pattern WORD = Pattern.compile("[\\p{L}\\p{N}](?:[\\p{L}\\p{N}'’+-]*[\\p{L}\\p{N}+])?");
    /** Share of upper-case letters from which a text is all-caps lettering. */
    static final double CAPS_LETTERING = .6;
    private final Function<String, Lexicon> lexicons;

    ProtectedTerms() {
        var bundled = new ClasspathLexicons();
        this.lexicons = bundled::forLanguage;
    }

    ProtectedTerms(Function<String, Lexicon> lexicons) { this.lexicons = lexicons; }

    /** Literal tokens found in the source text, in order. */
    List<String> find(String text, String language) {
        var found = new ArrayList<String>();
        for (var span : spans(text, language)) found.add(text.substring(span[0], span[1]));
        return found;
    }

    /** True when the text is only protected literals, digits and punctuation: nothing a translator should touch. */
    boolean isLiteralOnly(String text, String language) {
        var rest = new StringBuilder(text);
        var spans = spans(text, language);
        for (int i = spans.size() - 1; i >= 0; i--) rest.delete(spans.get(i)[0], spans.get(i)[1]);
        return rest.codePoints().noneMatch(Character::isLetter);
    }

    /** Escapes plain text and wraps every protected literal in a translate="no" span. */
    String wrap(String text, String language, java.util.function.UnaryOperator<String> escape) {
        return wrap(text, language, escape, java.util.Map.of());
    }

    /**
     * Same, and every occurrence of a term the chapter already decided ({@code decided}: source term -> translation,
     * see ChapterTerms) goes out as its decided translation inside a translate="no" span, so the page keeps it.
     */
    String wrap(String text, String language, java.util.function.UnaryOperator<String> escape, java.util.Map<String, String> decided) {
        var out = new StringBuilder();
        int offset = 0;
        var spans = spans(text, language);
        var replacements = new java.util.HashMap<Integer, String>();
        for (var occurrence : com.toonlira.translationgateway.domain.translation.ChapterTerms.occurrences(text, decided)) {
            if (spans.stream().anyMatch(span -> occurrence.start() < span[1] && occurrence.end() > span[0])) continue;
            spans.add(new int[]{occurrence.start(), occurrence.end()});
            replacements.put(occurrence.start(), occurrence.target());
        }
        spans.sort(java.util.Comparator.comparingInt(span -> span[0]));
        for (var span : spans) {
            var literal = replacements.getOrDefault(span[0], text.substring(span[0], span[1]));
            out.append(escape.apply(text.substring(offset, span[0]))).append(OPEN).append(escape.apply(literal)).append(CLOSE);
            offset = span[1];
        }
        return out.append(escape.apply(text.substring(offset))).toString();
    }

    /** Non-overlapping [start, end) of formats and names, in order. */
    private List<int[]> spans(String text, String language) {
        var spans = new ArrayList<int[]>();
        var formats = FORMATS.matcher(text);
        while (formats.find()) spans.add(new int[]{formats.start(), formats.end()});
        var lexicon = lexicons.apply(language);
        boolean caps = capsLettering(text), cjk = text.codePoints().anyMatch(ProtectedTerms::cjk);
        var words = WORD.matcher(text);
        while (words.find()) {
            int start = words.start(), end = words.end();
            if (spans.stream().anyMatch(span -> start < span[1] && end > span[0])) continue;
            if (name(words.group(), text, start, lexicon, caps, cjk)) spans.add(new int[]{start, end});
        }
        spans.sort(java.util.Comparator.comparingInt(span -> span[0]));
        return spans;
    }

    private static boolean name(String word, String text, int start, Lexicon lexicon, boolean caps, boolean cjk) {
        long letters = word.codePoints().filter(Character::isLetter).count();
        if (letters < 2) return false;
        boolean latin = word.codePoints().filter(Character::isLetter).allMatch(c -> Character.UnicodeScript.of(c) == Character.UnicodeScript.LATIN);
        if (!latin) return false;
        // Latin inside Japanese/Chinese text is a name or a term ("Ubuntu を").
        if (cjk) return true;
        // A capital inside a word that also has lower case: "YouTube", "OpenOffice", "iPhone".
        if (CAMEL.matcher(word).find()) return true;
        if (caps || !lexicon.available()) return false;
        boolean known = lexicon.knows(Lexicon.core(word));
        boolean upper = word.codePoints().filter(Character::isLetter).allMatch(Character::isUpperCase);
        if (upper) return !known; // acronym in ordinary text: "GNOME", "VPN" (not "OK")
        return Character.isUpperCase(word.codePointAt(0)) && !sentenceStart(text, start) && !known;
    }

    private static boolean capsLettering(String text) {
        long upper = text.codePoints().filter(Character::isUpperCase).count();
        long letters = text.codePoints().filter(c -> Character.isUpperCase(c) || Character.isLowerCase(c)).count();
        return letters > 0 && upper >= CAPS_LETTERING * letters;
    }

    /** Nothing but punctuation, quotes or spaces since the start or the end of a sentence. */
    private static boolean sentenceStart(String text, int start) {
        for (int i = start - 1; i >= 0; i--) {
            char c = text.charAt(i);
            if (Character.isWhitespace(c) || "\"'“‘([«¡¿-—".indexOf(c) >= 0) continue;
            return ".!?…:".indexOf(c) >= 0;
        }
        return true;
    }

    private static boolean cjk(int c) {
        var script = Character.UnicodeScript.of(c);
        return script == Character.UnicodeScript.HAN || script == Character.UnicodeScript.HIRAGANA
            || script == Character.UnicodeScript.KATAKANA || script == Character.UnicodeScript.HANGUL;
    }
}
