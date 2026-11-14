package com.toonlira.translationgateway.domain;

import java.util.List;

/**
 * Provider paragraph plus its words, used only before the manifest is built (balloon-aware splitting). Word texts
 * concatenate to exactly the region text; an empty word list means the provider gave no word geometry.
 */
public record OcrParagraph(OcrManifest.Region region, List<Word> words) {
    public OcrParagraph { words = List.copyOf(words); }

    /** {@code confidence} is the provider's word confidence in [0,1], or NaN when it gave none. */
    public record Word(String text, List<OcrManifest.Vertex> polygon, double confidence) {
        public Word { polygon = List.copyOf(polygon); }
        public Word(String text, List<OcrManifest.Vertex> polygon) { this(text, polygon, Double.NaN); }
    }
}
