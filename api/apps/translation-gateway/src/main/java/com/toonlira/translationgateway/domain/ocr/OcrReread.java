package com.toonlira.translationgateway.domain.ocr;

import com.toonlira.translationgateway.domain.OcrGeometry;
import com.toonlira.translationgateway.domain.OcrParagraph;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;

/**
 * Confidence-driven OCR re-reading, language and title agnostic.
 *
 * <p>{@link #suspects} picks the paragraphs whose words the provider was unsure of, or that are not words of the
 * source language. Each one is re-read from several image variants; {@link #choose} then votes between the
 * original reading and the re-readings: provider confidence + share of dictionary words + agreement between
 * variants. A re-reading replaces the original only when at least two variants agree on it, it stays close to the
 * original (the crop must not pull in neighbouring text) and it wins by a clear margin.
 */
public final class OcrReread {
    public static final double WEAK_CONFIDENCE = .8;
    private static final int MAX_WORDS = 120;
    private static final double MIN_SIMILARITY = .5, MIN_MARGIN = .15, AGREEMENT_WEIGHT = .2;
    private static final int MIN_AGREEMENT = 2;

    private OcrReread() { }

    /** One reading of a paragraph: its text and the mean provider confidence (NaN when unknown). */
    public record Reading(String text, double confidence) { }

    /** Indexes of up to {@code max} paragraphs to re-read, most doubtful first. */
    public static List<Integer> suspects(List<OcrParagraph> paragraphs, Lexicon lexicon, int max) {
        // Ranked by the weakest word first: one badly read word matters more than several so-so ones.
        record Doubt(int index, int weak, double lowest) { }
        var doubts = new ArrayList<Doubt>();
        for (int i = 0; i < paragraphs.size(); i++) {
            var words = paragraphs.get(i).words();
            if (words.isEmpty() || words.size() > MAX_WORDS || !OcrGeometry.valid(paragraphs.get(i).region().polygon())) continue;
            int weak = 0;
            double lowest = 1;
            for (var word : words) {
                // Punctuation is not lettering to re-read: its confidence is noise ("RISA ," at 0.43).
                if (word.text().codePoints().noneMatch(Character::isLetterOrDigit)) continue;
                boolean unsure = !Double.isNaN(word.confidence()) && word.confidence() < WEAK_CONFIDENCE;
                boolean unknown = lexicon.available() && !lexicon.knows(Lexicon.core(word.text()));
                if (unsure || unknown) weak++;
                if (!Double.isNaN(word.confidence())) lowest = Math.min(lowest, word.confidence());
            }
            if (weak > 0) doubts.add(new Doubt(i, weak, lowest));
        }
        doubts.sort(Comparator.comparingDouble(Doubt::lowest).thenComparing(Comparator.comparingInt(Doubt::weak).reversed()));
        return doubts.stream().limit(Math.max(0, max)).map(Doubt::index).toList();
    }

    /** Text to keep: the original reading unless a re-reading clearly wins the vote. */
    public static String choose(Reading original, List<Reading> rereads, Lexicon lexicon) {
        var support = new HashMap<String, Integer>();
        for (var reading : rereads) if (!normalize(reading.text()).isEmpty()) support.merge(normalize(reading.text()), 1, Integer::sum);
        double originalScore = score(original, support.getOrDefault(normalize(original.text()), 0), lexicon);
        Reading best = null;
        double bestScore = originalScore + MIN_MARGIN;
        for (var reading : rereads) {
            var key = normalize(reading.text());
            int agreement = support.getOrDefault(key, 0);
            if (key.isEmpty() || key.equals(normalize(original.text())) || agreement < MIN_AGREEMENT
                || similarity(key, normalize(original.text())) < MIN_SIMILARITY) continue;
            double score = score(reading, agreement, lexicon);
            if (score > bestScore) { bestScore = score; best = reading; }
        }
        return best == null ? original.text() : best.text();
    }

    static double score(Reading reading, int agreement, Lexicon lexicon) {
        double confidence = Double.isNaN(reading.confidence()) ? WEAK_CONFIDENCE : reading.confidence();
        double score = confidence + AGREEMENT_WEIGHT * agreement;
        if (lexicon.available()) {
            int candidates = 0, known = 0;
            for (var token : reading.text().split("\\s+")) {
                // Share of tokens that are words of the language. A number counts as "not a word": between two
                // readings of the same lettering, the one made of words is the more plausible sentence. Real
                // numbers are safe because a change still needs agreeing variants that read letters there.
                if (token.codePoints().noneMatch(Character::isLetterOrDigit)) continue;
                candidates++;
                var core = Lexicon.core(token);
                if (!core.isEmpty() && lexicon.knows(core)) known++;
            }
            if (candidates > 0) score += (double) known / candidates;
        }
        return score;
    }

    /**
     * Case and whitespace insensitive key: readings that differ only in spacing ("SAYING, WHY" / "SAYING , WHY")
     * are the same reading and never win a vote against each other. Punctuation is kept (it changes meaning).
     */
    static String normalize(String text) {
        return text == null ? "" : text.replaceAll("\\s+", "").toLowerCase(Locale.ROOT);
    }

    /** 1 - normalized Levenshtein distance. */
    static double similarity(String a, String b) {
        if (a.isEmpty() && b.isEmpty()) return 1;
        var previous = new int[b.length() + 1];
        var current = new int[b.length() + 1];
        for (int j = 0; j <= b.length(); j++) previous[j] = j;
        for (int i = 1; i <= a.length(); i++) {
            current[0] = i;
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                current[j] = Math.min(Math.min(current[j - 1] + 1, previous[j] + 1), previous[j - 1] + cost);
            }
            var swap = previous; previous = current; current = swap;
        }
        return 1 - (double) previous[b.length()] / Math.max(a.length(), b.length());
    }
}
