package com.toonlira.translationgateway.domain;

import java.util.List;

/**
 * Provider paragraph plus its words, used only before the manifest is built (balloon-aware splitting). Word texts
 * concatenate to exactly the region text; an empty word list means the provider gave no word geometry.
 */
public record OcrParagraph(OcrManifest.Region region, List<Word> words) {
    public OcrParagraph { words = List.copyOf(words); }

    public record Word(String text, List<OcrManifest.Vertex> polygon) {
        public Word { polygon = List.copyOf(polygon); }
    }
}
