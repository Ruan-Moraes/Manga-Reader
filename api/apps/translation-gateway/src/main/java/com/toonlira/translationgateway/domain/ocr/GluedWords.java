package com.toonlira.translationgateway.domain.ocr;

import com.toonlira.translationgateway.domain.OcrManifest;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Words the OCR ran together in tight lettering ("Martayalos" for "Marta y a los"). The provider reads such a run as
 * one word — it never reports two letter words without a break between them — so the merged token, capitalised and
 * unknown to the dictionary, would pass for a name and reach the page untranslated.
 *
 * <p>The evidence comes from the page itself, never from a list: a run is split only when it starts with a name that
 * stands alone elsewhere on the same page and the rest decomposes into dictionary words. A real name ("Gabriela") is
 * never cut unless its own beginning appears alone on the page. Scripts without spaces are left as they are.
 */
public final class GluedWords {
    private static final Pattern WORD = Pattern.compile("\\p{L}+");
    /** Shortest stand-alone name taken as the start of a run, and shortest run considered. */
    static final int MIN_NAME = 3, MIN_RUN = 5;
    /** Most dictionary words a remainder may be cut into: a long chain is more likely chance than glued speech. */
    static final int MAX_PARTS = 4;

    private GluedWords() { }

    public static List<OcrManifest.Region> split(List<OcrManifest.Region> regions, Lexicon lexicon) {
        if (regions == null || regions.isEmpty() || lexicon == null || !lexicon.available()) return regions;
        var names = new HashSet<String>();
        for (var region : regions) {
            var words = WORD.matcher(region.sourceText());
            while (words.find()) {
                String word = words.group();
                if (word.length() >= MIN_NAME && Character.isUpperCase(word.codePointAt(0)) && latin(word)) names.add(word);
            }
        }
        if (names.isEmpty()) return regions;
        var result = new ArrayList<OcrManifest.Region>(regions.size());
        for (var region : regions) {
            String text = repair(region.sourceText(), names, lexicon);
            result.add(text.equals(region.sourceText()) ? region
                : new OcrManifest.Region(region.id(), region.readingOrder(), text, region.polygon()));
        }
        return List.copyOf(result);
    }

    static String repair(String text, Set<String> names, Lexicon lexicon) {
        var words = WORD.matcher(text);
        var out = new StringBuilder();
        int offset = 0;
        while (words.find()) {
            String word = words.group();
            String fixed = splitRun(word, names, lexicon);
            if (fixed == null) continue;
            out.append(text, offset, words.start()).append(fixed);
            offset = words.end();
        }
        return offset == 0 ? text : out.append(text.substring(offset)).toString();
    }

    /** The run cut as "Name word word", or null when it is not one. */
    private static String splitRun(String word, Set<String> names, Lexicon lexicon) {
        if (word.length() < MIN_RUN || !Character.isUpperCase(word.codePointAt(0)) || !latin(word)
            || lexicon.knows(Lexicon.core(word))) return null;
        String best = null;
        for (var name : names) {
            if (name.length() >= word.length() || !word.startsWith(name)) continue;
            if (best != null && name.length() <= best.length()) continue;
            var parts = segment(word.substring(name.length()).toLowerCase(java.util.Locale.ROOT), lexicon);
            if (parts != null) best = name + " " + String.join(" ", parts);
        }
        return best == null ? null : restoreCase(best, word);
    }

    /** Fewest dictionary words that make up {@code rest} (at most {@link #MAX_PARTS}), or null. */
    private static List<String> segment(String rest, Lexicon lexicon) {
        int n = rest.length();
        var best = new int[n + 1];
        var from = new int[n + 1];
        java.util.Arrays.fill(best, Integer.MAX_VALUE);
        best[0] = 0;
        for (int end = 1; end <= n; end++) for (int start = 0; start < end; start++) {
            if (best[start] == Integer.MAX_VALUE || best[start] + 1 >= best[end]) continue;
            if (lexicon.knows(rest.substring(start, end))) { best[end] = best[start] + 1; from[end] = start; }
        }
        if (best[n] == Integer.MAX_VALUE || best[n] > MAX_PARTS) return null;
        var parts = new ArrayList<String>();
        for (int end = n; end > 0; end = from[end]) parts.addFirst(rest.substring(from[end], end));
        return parts;
    }

    /** Keeps the run's original letters (the split only inserts spaces). */
    private static String restoreCase(String spaced, String original) {
        var out = new StringBuilder();
        int k = 0;
        for (int i = 0; i < spaced.length(); i++) {
            char c = spaced.charAt(i);
            if (c == ' ') out.append(' ');
            else out.append(original.charAt(k++));
        }
        return out.toString();
    }

    private static boolean latin(String word) {
        return word.codePoints().allMatch(c -> Character.UnicodeScript.of(c) == Character.UnicodeScript.LATIN);
    }
}
