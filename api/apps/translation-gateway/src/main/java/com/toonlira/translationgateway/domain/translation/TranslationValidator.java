package com.toonlira.translationgateway.domain.translation;

import static com.toonlira.translationgateway.domain.translation.TranslationLimits.MAX_SOURCE_PER_REGION;
import static com.toonlira.translationgateway.domain.translation.TranslationLimits.MAX_SOURCE_TOTAL;
import static com.toonlira.translationgateway.domain.translation.TranslationLimits.MAX_TRANSLATED_PER_REGION;
import static com.toonlira.translationgateway.domain.translation.TranslationLimits.MAX_TRANSLATED_TOTAL;
import static com.toonlira.translationgateway.domain.translation.TranslationValidationException.Failure.INVALID_INPUT;
import static com.toonlira.translationgateway.domain.translation.TranslationValidationException.Failure.INVALID_OUTPUT;
import static com.toonlira.translationgateway.domain.translation.TranslationValidationException.Failure.UNSUPPORTED_PAIR;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/** A policy snapshot supplied by the caller; never infers operationally enabled pairs. */
public final class TranslationValidator {
    private final Set<LanguagePair> enabledPairs;

    public TranslationValidator(Set<LanguagePair> enabledPairs) {
        if (enabledPairs == null || enabledPairs.stream().anyMatch(Objects::isNull)) {
            throw new TranslationValidationException(INVALID_INPUT);
        }
        this.enabledPairs = Set.copyOf(enabledPairs);
    }

    public void validateRequest(TranslationRequest request) {
        if (request == null || request.jobRef() == null || request.pair() == null) invalidInput();
        if (!enabledPairs.contains(request.pair())) throw new TranslationValidationException(UNSUPPORTED_PAIR);
        var ids = new HashSet<UUID>();
        long total = 0;
        for (int order = 0; order < request.regions().size(); order++) {
            var region = request.regions().get(order);
            if (region.id() == null || !ids.add(region.id()) || region.readingOrder() != order
                || invalidText(region.sourceText(), MAX_SOURCE_PER_REGION)) invalidInput();
            total += region.sourceText().length();
            if (total > MAX_SOURCE_TOTAL) invalidInput();
        }
    }

    public TranslationResult validateResponse(TranslationRequest request, TranslationResponse response) {
        validateRequest(request);
        if (response == null || response.regions().size() != request.regions().size()) invalidOutput();
        var expectedIds = new HashSet<UUID>();
        request.regions().forEach(region -> expectedIds.add(region.id()));
        var translated = new HashMap<UUID, String>();
        long total = 0;
        for (var region : response.regions()) {
            if (region.id() == null || !expectedIds.contains(region.id()) || translated.containsKey(region.id())
                || invalidText(region.translatedText(), MAX_TRANSLATED_PER_REGION)) invalidOutput();
            total += region.translatedText().length();
            if (total > MAX_TRANSLATED_TOTAL) invalidOutput();
            translated.put(region.id(), region.translatedText());
        }
        // Equal cardinality and unique expected IDs establish complete association before producing any result.
        var ordered = request.regions().stream().map(region -> new TranslationResult.Region(
            region.id(), region.readingOrder(), translated.get(region.id()))).toList();
        return new TranslationResult(request.jobRef(), request.pair(), ordered);
    }

    private static boolean invalidText(String text, int limit) {
        return text == null || text.isBlank() || text.length() > limit;
    }

    private static void invalidInput() { throw new TranslationValidationException(INVALID_INPUT); }
    private static void invalidOutput() { throw new TranslationValidationException(INVALID_OUTPUT); }
}
