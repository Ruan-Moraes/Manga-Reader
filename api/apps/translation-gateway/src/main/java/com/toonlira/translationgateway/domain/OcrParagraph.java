package com.toonlira.translationgateway.domain;

import java.util.List;

/**
 * Provider paragraph plus its words, used only before the manifest is built (balloon-aware splitting). Word texts
 * concatenate to exactly the region text; an empty word list means the provider gave no word geometry.
 */
public record OcrParagraph(OcrManifest.Region region, List<Word> words) {
    public OcrParagraph { words = List.copyOf(words); }

    /** Below this every word of a paragraph is a guess, see {@link #isGuess()}. */
    public static final double GUESS_CONFIDENCE = .5;
    public static final int MAX_GUESS_LETTERS = 4;

    /**
     * A short paragraph the provider read only by guessing (every word below {@link #GUESS_CONFIDENCE}): usually another
     * script forced into the page language (瀬尾 浩史 read as "WE" on an English cover) or stray marks ("gg", "@@@@").
     * Leaving it out keeps the drawing as it is, which is right for both; a real word read with this little confidence
     * would be a wrong translation anyway.
     */
    public boolean isGuess() {
        if (words.isEmpty()) return false;
        for (var word : words) if (Double.isNaN(word.confidence()) || word.confidence() >= GUESS_CONFIDENCE) return false;
        return region.sourceText().codePoints().filter(Character::isLetter).count() <= MAX_GUESS_LETTERS;
    }

    public static List<OcrParagraph> withoutGuesses(List<OcrParagraph> paragraphs) {
        return paragraphs.stream().filter(paragraph -> !paragraph.isGuess()).toList();
    }

    /** {@code confidence} is the provider's word confidence in [0,1], or NaN when it gave none. */
    public record Word(String text, List<OcrManifest.Vertex> polygon, double confidence) {
        public Word { polygon = List.copyOf(polygon); }
        public Word(String text, List<OcrManifest.Vertex> polygon) { this(text, polygon, Double.NaN); }
    }
}
