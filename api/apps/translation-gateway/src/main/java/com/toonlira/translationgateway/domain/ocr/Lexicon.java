package com.toonlira.translationgateway.domain.ocr;

import java.text.Normalizer;
import java.util.Locale;
import java.util.Set;

/**
 * Word list of one source language, used only to score OCR readings ("is this a word?"). Tokens are compared
 * lowercased and without surrounding punctuation; contractions count when every part is known ("don't", "I'm").
 */
public final class Lexicon {
    public static final Lexicon NONE = new Lexicon(Set.of());
    private final Set<String> words;

    public Lexicon(Set<String> words) { this.words = Set.copyOf(words); }

    public boolean available() { return !words.isEmpty(); }

    /** Normalized alphabetic core of a token, or "" when it is not a word candidate (numbers, symbols). */
    public static String core(String token) {
        var stripped = token.strip().replaceAll("^[^\\p{L}\\p{N}]+|[^\\p{L}\\p{N}]+$", "");
        if (stripped.isEmpty() || stripped.chars().allMatch(Character::isDigit)) return "";
        return Normalizer.normalize(stripped, Normalizer.Form.NFC).toLowerCase(Locale.ROOT);
    }

    public boolean knows(String core) {
        if (core.isEmpty()) return true;
        if (words.contains(core)) return true;
        var parts = core.split("['’-]");
        if (parts.length < 2) return false;
        for (var part : parts) if (!part.isEmpty() && !words.contains(part)) return false;
        return true;
    }
}
