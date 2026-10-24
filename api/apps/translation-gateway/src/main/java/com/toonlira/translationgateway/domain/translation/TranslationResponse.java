package com.toonlira.translationgateway.domain.translation;

import static com.toonlira.translationgateway.domain.translation.TranslationValidationException.Failure.INVALID_OUTPUT;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

public record TranslationResponse(List<Region> regions) {
    public TranslationResponse {
        if (regions == null || regions.size() > TranslationLimits.MAX_REGIONS || regions.stream().anyMatch(Objects::isNull)) {
            throw new TranslationValidationException(INVALID_OUTPUT);
        }
        regions = List.copyOf(regions);
    }

    @Override
    public String toString() { return "TranslationResponse[redacted]"; }

    public record Region(UUID id, String translatedText) {
        @Override
        public String toString() { return "TranslationResponse.Region[redacted]"; }
    }
}
