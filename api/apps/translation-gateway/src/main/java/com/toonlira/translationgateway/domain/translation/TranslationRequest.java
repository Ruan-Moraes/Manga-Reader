package com.toonlira.translationgateway.domain.translation;

import static com.toonlira.translationgateway.domain.translation.TranslationValidationException.Failure.INVALID_INPUT;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

public record TranslationRequest(UUID jobRef, LanguagePair pair, List<Region> regions) {
    public TranslationRequest {
        if (regions == null || regions.size() > TranslationLimits.MAX_REGIONS || regions.stream().anyMatch(Objects::isNull)) {
            throw new TranslationValidationException(INVALID_INPUT);
        }
        regions = List.copyOf(regions);
    }

    @Override
    public String toString() { return "TranslationRequest[redacted]"; }

    /**
     * {@code kind} is the layout detector's class of the region ("text_bubble", "text_free" or "unknown"), or null
     * when the page has no layout: context for the language review, never a reason to drop text.
     */
    public record Region(UUID id, int readingOrder, String sourceText, String kind) {
        public Region(UUID id, int readingOrder, String sourceText) { this(id, readingOrder, sourceText, null); }

        @Override
        public String toString() { return "TranslationRequest.Region[redacted]"; }
    }
}
