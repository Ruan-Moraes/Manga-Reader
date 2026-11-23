package com.toonlira.translationgateway.domain.translation;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * One name the chapter decided ("Coriander" -> "Coriander"), as the page's result reports it and as a client sends it
 * back with its next pages. Same bounds as the chapter memory columns.
 */
public record ChapterTerm(String source, String target) {
    /** Most terms one page reports. */
    public static final int MAX_PER_PAGE = 64;

    public ChapterTerm {
        if (!usable(source, ChapterTerms.MAX_TERM_LENGTH) || !usable(target, 2 * ChapterTerms.MAX_TERM_LENGTH)) {
            throw new IllegalArgumentException("Invalid chapter term");
        }
    }

    /** Non-blank, single line, stripped and within {@code max} characters. */
    public static boolean usable(String value, int max) {
        return value != null && !value.isBlank() && value.equals(value.strip()) && value.length() <= max && value.lines().count() == 1;
    }

    /** The usable entries of a map, stripped, in source order, at most {@code limit}. */
    public static List<ChapterTerm> of(Map<String, String> terms, int limit) {
        var kept = new ArrayList<ChapterTerm>();
        for (var entry : new java.util.TreeMap<>(terms).entrySet()) {
            if (kept.size() >= limit || entry.getKey() == null || entry.getValue() == null) continue;
            var source = entry.getKey().strip();
            var target = entry.getValue().strip();
            if (usable(source, ChapterTerms.MAX_TERM_LENGTH) && usable(target, 2 * ChapterTerms.MAX_TERM_LENGTH)) kept.add(new ChapterTerm(source, target));
        }
        return List.copyOf(kept);
    }

    public static Map<String, String> asMap(List<ChapterTerm> terms) {
        var map = new LinkedHashMap<String, String>();
        for (var term : terms) map.putIfAbsent(term.source(), term.target());
        return map;
    }

    @Override public String toString() { return "ChapterTerm[redacted]"; }
}
