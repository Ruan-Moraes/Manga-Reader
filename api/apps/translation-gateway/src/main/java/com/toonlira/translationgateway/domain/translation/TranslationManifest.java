package com.toonlira.translationgateway.domain.translation;

import java.util.List;
import java.util.UUID;

/**
 * Ephemeral private artifact; no source text or image geometry is duplicated. Since 1.1 it also carries the chapter
 * names this page used ({@code terms}), which the result hands back to the client.
 */
public record TranslationManifest(String version, UUID jobRef, String sourceLanguage,
                                  String targetLanguage, String ocrManifestSha256,
                                  String model, List<Region> regions, List<ChapterTerm> terms) {
    public static final String VERSION = "1.1";

    public TranslationManifest {
        regions = List.copyOf(regions);
        terms = terms == null ? List.of() : List.copyOf(terms);
    }

    @Override
    public String toString() { return "TranslationManifest[redacted]"; }

    public record Region(UUID id, int readingOrder, String translatedText) {
        @Override
        public String toString() { return "TranslationManifest.Region[redacted]"; }
    }
}
