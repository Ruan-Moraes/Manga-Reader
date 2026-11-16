package com.toonlira.translationgateway.domain.translation;

import static com.toonlira.translationgateway.domain.translation.TranslationLimits.MAX_SOURCE_PER_REGION;
import static com.toonlira.translationgateway.domain.translation.TranslationLimits.MAX_TRANSLATED_PER_REGION;
import static com.toonlira.translationgateway.domain.translation.TranslationLimits.MAX_TRANSLATED_TOTAL;
import static com.toonlira.translationgateway.domain.translation.TranslationValidationException.Failure.INVALID_OUTPUT;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;
import java.util.function.Function;
import java.util.function.Predicate;

/**
 * Accepts a language model's review of a page translation one region at a time. The machine translation is the
 * floor: a proposal replaces it only when it keeps the region (same id, no merge or split), stays inside the
 * translation limits, keeps every protected literal of the source and is a correction rather than a rewrite. A
 * proposal that fails any check leaves that region as the machine translated it; a reply that does not answer every
 * region exactly once is not a review of this page and is rejected whole.
 */
public final class TranslationRefinement {
    /** Max edit distance of a corrected OCR reading, relative to the longer of the two readings. */
    static final double MAX_SOURCE_EDIT_RATIO = 0.4;
    /** Max growth or shrink of a refined translation relative to the machine one ... */
    static final double MAX_LENGTH_RATIO = 2.0;
    /** ... once either text is longer than this: "Ok" -> "Tudo bem" is a fine review of a short line. */
    static final int SHORT_TEXT = 16;

    private TranslationRefinement() { }

    /** One region as reviewed; {@code correctedSource} is null when the OCR reading was kept. */
    public record Proposal(UUID id, String correctedSource, String translatedText) {
        @Override
        public String toString() { return "TranslationRefinement.Proposal[redacted]"; }
    }

    /** Counts only, safe to log: regions changed, of those with a corrected reading, and proposals discarded. */
    public record Outcome(TranslationResponse response, int changed, int correctedSources, int rejected) { }

    /**
     * @param protectedTerms literals of a source text that must reach the page verbatim
     * @param untouchable    source texts the machine translation deliberately kept (numbers, URLs, product names)
     */
    public static Outcome merge(TranslationRequest request, TranslationResponse translated, List<Proposal> proposals,
                                Function<String, List<String>> protectedTerms, Predicate<String> untouchable) {
        if (translated.regions().size() != request.regions().size()) throw new TranslationValidationException(INVALID_OUTPUT);
        var byId = new HashMap<UUID, Proposal>();
        for (var proposal : proposals) {
            if (proposal == null || proposal.id() == null || byId.put(proposal.id(), proposal) != null) {
                throw new TranslationValidationException(INVALID_OUTPUT);
            }
        }
        var sources = new HashMap<UUID, String>();
        request.regions().forEach(region -> sources.put(region.id(), region.sourceText()));
        if (byId.size() != request.regions().size() || !sources.keySet().equals(byId.keySet())) {
            throw new TranslationValidationException(INVALID_OUTPUT);
        }

        var regions = new ArrayList<TranslationResponse.Region>(translated.regions().size());
        long total = 0;
        int changed = 0, corrected = 0, rejected = 0;
        for (var region : translated.regions()) {
            String source = sources.get(region.id());
            if (source == null) throw new TranslationValidationException(INVALID_OUTPUT);
            var proposal = byId.get(region.id());
            String text = region.translatedText();
            boolean correctedSource = proposal.correctedSource() != null && !proposal.correctedSource().strip().equals(source.strip());
            if (!proposal.translatedText().equals(text) || correctedSource) {
                if (acceptable(source, text, proposal, correctedSource, protectedTerms, untouchable)
                    && total + proposal.translatedText().length() <= MAX_TRANSLATED_TOTAL) {
                    if (!proposal.translatedText().equals(text)) changed++;
                    if (correctedSource) corrected++;
                    text = proposal.translatedText();
                } else {
                    rejected++;
                }
            }
            total += text.length();
            regions.add(new TranslationResponse.Region(region.id(), text));
        }
        return new Outcome(new TranslationResponse(regions), changed, corrected, rejected);
    }

    private static boolean acceptable(String source, String machine, Proposal proposal, boolean correctedSource,
                                      Function<String, List<String>> protectedTerms, Predicate<String> untouchable) {
        String refined = proposal.translatedText();
        if (refined == null || refined.isBlank() || refined.length() > MAX_TRANSLATED_PER_REGION) return false;
        if (untouchable.test(source)) return false;
        // A sound the machine translation left as drawn ("Swish Swish", "shuffle", "BEEP") stays: onomatopoeia keeps the
        // original lettering, and a translated one would be retyped over the art. Phrases left untranslated
        // ("No Youtube!") may still be fixed.
        if (machine.strip().equalsIgnoreCase(source.strip()) && sound(source)) return false;
        if (correctedSource) {
            String reading = proposal.correctedSource().strip();
            if (reading.isEmpty() || reading.length() > MAX_SOURCE_PER_REGION
                || editDistance(source.strip(), reading) > MAX_SOURCE_EDIT_RATIO * Math.max(source.strip().length(), reading.length())) {
                return false;
            }
        }
        if (protectedTerms.apply(source).stream().anyMatch(term -> !refined.contains(term))) return false;
        int longer = Math.max(refined.length(), machine.length());
        int shorter = Math.max(1, Math.min(refined.length(), machine.length()));
        return longer <= SHORT_TEXT || longer <= MAX_LENGTH_RATIO * shorter;
    }

    /** Fewer than two different words: one word, or one sound repeated or stretched ("Swish Swish", "Ha Haha"). */
    static boolean sound(String source) {
        var stems = new ArrayList<String>();
        for (var token : source.split("\\s+")) {
            var core = token.replaceAll("^[^\\p{L}\\p{N}]+|[^\\p{L}\\p{N}]+$", "").toLowerCase(java.util.Locale.ROOT);
            if (core.isEmpty() || core.codePoints().noneMatch(Character::isLetter)) continue;
            if (stems.stream().noneMatch(stem -> stem.startsWith(core) || core.startsWith(stem))) stems.add(core);
        }
        return stems.size() < 2;
    }

    /** Levenshtein distance over UTF-16 units; inputs are bounded by the per-region source limit. */
    static int editDistance(String a, String b) {
        int[] previous = new int[b.length() + 1];
        int[] current = new int[b.length() + 1];
        for (int j = 0; j <= b.length(); j++) previous[j] = j;
        for (int i = 1; i <= a.length(); i++) {
            current[0] = i;
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                current[j] = Math.min(Math.min(current[j - 1] + 1, previous[j] + 1), previous[j - 1] + cost);
            }
            var swap = previous;
            previous = current;
            current = swap;
        }
        return previous[b.length()];
    }
}
