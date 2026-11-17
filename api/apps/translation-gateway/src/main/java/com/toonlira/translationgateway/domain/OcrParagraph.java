package com.toonlira.translationgateway.domain;

import java.util.List;

/**
 * Provider paragraph plus its words, used only before the manifest is built (balloon-aware splitting). Word texts
 * concatenate to exactly the region text; an empty word list means the provider gave no word geometry.
 */
public record OcrParagraph(OcrManifest.Region region, List<Word> words) {
    public OcrParagraph { words = List.copyOf(words); }

    /** Mean word confidence below which a paragraph is a guess, see {@link #isGuess()}. */
    public static final double GUESS_CONFIDENCE = .5;

    /**
     * A paragraph the provider read only by guessing (mean word confidence below {@link #GUESS_CONFIDENCE}): another
     * script forced into the page language (瀬尾 浩史 read as "WE" on an English cover), stray marks ("gg", "@@@@") or
     * stylised lettering read as made-up words (a crowd of drawn sound effects read as a sentence). Leaving it out keeps
     * the drawing as it is, which is right for all of them; real speech read with this little confidence would be a
     * wrong translation anyway. On the validation corpus real speech reads at 0.56 or more.
     */
    public boolean isGuess() {
        if (words.isEmpty()) return false;
        double sum = 0;
        for (var word : words) {
            if (Double.isNaN(word.confidence())) return false;
            sum += word.confidence();
        }
        return sum / words.size() < GUESS_CONFIDENCE;
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
