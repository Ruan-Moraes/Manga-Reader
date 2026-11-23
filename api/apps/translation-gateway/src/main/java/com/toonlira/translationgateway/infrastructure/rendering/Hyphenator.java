package com.toonlira.translationgateway.infrastructure.rendering;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

/**
 * Liang's hyphenation (the TeX algorithm) with the hyph-utf8 patterns of the target language
 * ({@code hyphenation/hyph-<tag>.pat.txt}, licences beside them, see {@code hyphenation/NOTICE.md}). The minimum
 * letters before and after a hyphen also come from the language's own file, not from this code.
 */
final class Hyphenator {
    /** Destination language → hyph-utf8 tag; languages without patterns are never hyphenated. */
    private static final Map<String, String> TAGS = Map.of("pt-BR", "pt", "es", "es", "en", "en-us");
    private static final Pattern MIN = Pattern.compile("^%\\s+(left|right):\\s*(\\d+)\\s*$");
    private static final Map<String, Hyphenator> CACHE = new ConcurrentHashMap<>();
    private static final Hyphenator NONE = new Hyphenator(Map.of(), 1, 1, 0);

    private final Map<String, int[]> patterns;
    private final int left, right, longest;

    private Hyphenator(Map<String, int[]> patterns, int left, int right, int longest) {
        this.patterns = patterns;
        this.left = left;
        this.right = right;
        this.longest = longest;
    }

    static Hyphenator forLanguage(String destination) {
        var tag = destination == null ? null : TAGS.get(destination);
        if (tag == null) return NONE;
        return CACHE.computeIfAbsent(tag, Hyphenator::load);
    }

    boolean available() { return !patterns.isEmpty(); }

    /** Offsets inside {@code word} where a hyphen may go, ascending; empty for words too short or not all letters. */
    List<Integer> points(String word) {
        var points = new ArrayList<Integer>();
        if (patterns.isEmpty() || word.length() < left + right || !word.chars().allMatch(Character::isLetter)) return points;
        String dotted = "." + word.toLowerCase(Locale.ROOT) + ".";
        int[] values = new int[dotted.length() + 1];
        for (int start = 0; start < dotted.length(); start++) {
            for (int end = start + 1; end <= Math.min(dotted.length(), start + longest); end++) {
                int[] found = patterns.get(dotted.substring(start, end));
                if (found == null) continue;
                for (int k = 0; k < found.length; k++) values[start + k] = Math.max(values[start + k], found[k]);
            }
        }
        // values[i] sits before dotted[i]; dotted[1] is the word's first letter, so a hyphen after letter p of the word
        // is values[p + 1].
        for (int p = left; p <= word.length() - right; p++) if (values[p + 1] % 2 == 1) points.add(p);
        return points;
    }

    private static Hyphenator load(String tag) {
        try (InputStream patternStream = Hyphenator.class.getResourceAsStream("/hyphenation/hyph-" + tag + ".pat.txt");
             InputStream licence = Hyphenator.class.getResourceAsStream("/hyphenation/hyph-" + tag + ".license.txt")) {
            if (patternStream == null || licence == null) return NONE;
            var patterns = new HashMap<String, int[]>();
            int longest = 0;
            for (var line : new String(patternStream.readAllBytes(), StandardCharsets.UTF_8).split("\\R")) {
                for (var pattern : line.strip().split("\\s+")) {
                    if (pattern.isEmpty()) continue;
                    var letters = new StringBuilder();
                    var values = new ArrayList<Integer>();
                    int pending = 0;
                    for (int i = 0; i < pattern.length(); i++) {
                        char c = pattern.charAt(i);
                        if (Character.isDigit(c)) pending = c - '0';
                        else { values.add(pending); pending = 0; letters.append(c); }
                    }
                    values.add(pending);
                    patterns.put(letters.toString(), values.stream().mapToInt(Integer::intValue).toArray());
                    longest = Math.max(longest, letters.length());
                }
            }
            // "hyphenmins: typesetting: left: N right: N" in the pattern file's header.
            int left = 2, right = 2;
            boolean typesetting = false;
            for (var line : new String(licence.readAllBytes(), StandardCharsets.UTF_8).split("\\R")) {
                if (line.contains("typesetting:")) { typesetting = true; continue; }
                var matcher = MIN.matcher(line);
                if (typesetting && matcher.matches()) {
                    if (matcher.group(1).equals("left")) left = Integer.parseInt(matcher.group(2));
                    else { right = Integer.parseInt(matcher.group(2)); typesetting = false; }
                }
            }
            return new Hyphenator(Map.copyOf(patterns), Math.max(2, left), Math.max(2, right), longest);
        } catch (IOException | RuntimeException error) {
            return NONE;
        }
    }
}
