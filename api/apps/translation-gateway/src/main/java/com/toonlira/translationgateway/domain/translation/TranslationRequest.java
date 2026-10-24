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

    public record Region(UUID id, int readingOrder, String sourceText) {
        @Override
        public String toString() { return "TranslationRequest.Region[redacted]"; }
    }
}
