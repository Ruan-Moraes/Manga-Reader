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
    private final Set<String> sounds;

    public Lexicon(Set<String> words) { this(words, Set.of()); }

    /** {@code sounds}: onomatopoeia of the language (sound effects drawn in comics), possibly empty. */
    public Lexicon(Set<String> words, Set<String> sounds) {
        this.words = Set.copyOf(words);
        this.sounds = Set.copyOf(sounds);
    }

    /** A sound effect word, also when drawn stretched ("Pooof", "BEEEP"). */
    public boolean isSound(String core) {
        if (core.isEmpty()) return false;
        // A drawn chain of sounds ("clickty-tap-clack-key"): at least half of its parts are sounds.
        var parts = core.split("-");
        if (parts.length > 1) return java.util.Arrays.stream(parts).filter(this::isSound).count() * 2 >= parts.length;
        if (sounds.contains(core)) return true;
        String twice = core.replaceAll("(\\p{L})\\1{2,}", "$1$1"), once = core.replaceAll("(\\p{L})\\1+", "$1");
        return sounds.contains(twice) || sounds.contains(once);
    }

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
