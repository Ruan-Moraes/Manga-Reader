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
    /** Onomatopoeia drawn in comics ({@code <language>-sounds.txt}). */
    public static final String SOUNDS = "sounds";
    /** Words that open a clause ({@code <language>-clause-openers.txt}): "then", "so", "but". */
    public static final String CLAUSE_OPENERS = "clause-openers";
    /** Words that join alternatives ({@code <language>-alternatives.txt}): "and", "or". */
    public static final String ALTERNATIVES = "alternatives";
    /** Grammatical particles written in kana ({@code <language>-particles.txt}, one character per line). */
    public static final String PARTICLES = "particles";
    public static final java.util.List<String> LISTS = java.util.List.of(SOUNDS, CLAUSE_OPENERS, ALTERNATIVES, PARTICLES);

    private final Set<String> words;
    private final java.util.Map<String, Set<String>> lists;

    public Lexicon(Set<String> words) { this(words, java.util.Map.of()); }

    /** {@code sounds}: onomatopoeia of the language (sound effects drawn in comics), possibly empty. */
    public Lexicon(Set<String> words, Set<String> sounds) { this(words, java.util.Map.of(SOUNDS, sounds)); }

    /** {@code lists}: named lists of the language ({@link #LISTS}), each possibly absent. */
    public Lexicon(Set<String> words, java.util.Map<String, Set<String>> lists) {
        this.words = Set.copyOf(words);
        var copy = new java.util.HashMap<String, Set<String>>();
        lists.forEach((name, list) -> copy.put(name, Set.copyOf(list)));
        this.lists = java.util.Map.copyOf(copy);
    }

    /** A named list of the language, empty when the language has none. */
    public Set<String> list(String name) { return lists.getOrDefault(name, Set.of()); }

    /** A sound effect word, also when drawn stretched ("Pooof", "BEEEP"). */
    public boolean isSound(String core) {
        if (core.isEmpty()) return false;
        // A drawn chain of sounds ("clickty-tap-clack-key"): at least half of its parts are sounds.
        var parts = core.split("-");
        if (parts.length > 1) return java.util.Arrays.stream(parts).filter(this::isSound).count() * 2 >= parts.length;
        var sounds = list(SOUNDS);
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
