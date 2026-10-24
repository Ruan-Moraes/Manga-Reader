package com.toonlira.translationgateway.domain.translation;

import static com.toonlira.translationgateway.domain.translation.TranslationValidationException.Failure.INVALID_INPUT;

import com.toonlira.translationgateway.domain.SupportedLanguages;
import java.util.List;

public record LanguagePair(String source, String target) {
    private static final List<LanguagePair> ALL = SupportedLanguages.CODES.stream()
        .flatMap(source -> SupportedLanguages.CODES.stream().filter(target -> !source.equals(target))
            .map(target -> new LanguagePair(source, target))).toList();

    public LanguagePair {
        if (!SupportedLanguages.contains(source) || !SupportedLanguages.contains(target) || source.equals(target)) {
            throw new TranslationValidationException(INVALID_INPUT);
        }
    }

    public static List<LanguagePair> all() { return ALL; }
}
