package com.toonlira.translationgateway.domain.translation;

import java.util.List;
import java.util.UUID;

/** Produced only after validation, in the original request's reading order. */
public final class TranslationResult {
    private final UUID jobRef;
    private final LanguagePair pair;
    private final List<Region> regions;

    TranslationResult(UUID jobRef, LanguagePair pair, List<Region> regions) {
        this.jobRef = jobRef;
        this.pair = pair;
        this.regions = List.copyOf(regions);
    }

    public UUID jobRef() { return jobRef; }
    public LanguagePair pair() { return pair; }
    public List<Region> regions() { return regions; }

    @Override
    public String toString() { return "TranslationResult[redacted]"; }

    public record Region(UUID id, int readingOrder, String translatedText) {
        @Override
        public String toString() { return "TranslationResult.Region[redacted]"; }
    }
}
