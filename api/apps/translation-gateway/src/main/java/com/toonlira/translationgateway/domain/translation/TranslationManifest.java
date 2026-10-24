package com.toonlira.translationgateway.domain.translation;

import java.util.List;
import java.util.UUID;

/** Ephemeral private artifact; no source text or image geometry is duplicated. */
public record TranslationManifest(String version, UUID jobRef, String sourceLanguage,
                                  String targetLanguage, String ocrManifestSha256,
                                  String model, List<Region> regions) {
    public TranslationManifest { regions = List.copyOf(regions); }

    @Override
    public String toString() { return "TranslationManifest[redacted]"; }

    public record Region(UUID id, int readingOrder, String translatedText) {
        @Override
        public String toString() { return "TranslationManifest.Region[redacted]"; }
    }
}
