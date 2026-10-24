package com.toonlira.translationgateway.application.config;

import static com.toonlira.translationgateway.domain.translation.TranslationValidationException.Failure.INVALID_INPUT;

import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationValidationException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/** Shared, fail-closed interpretation of the explicitly configured operational pairs. */
public final class ConfiguredTranslationPairs {
    private ConfiguredTranslationPairs() { }

    public static Set<LanguagePair> parse(List<String> configured) {
        if (configured == null) throw new TranslationValidationException(INVALID_INPUT);
        var pairs = new HashSet<LanguagePair>();
        for (var value : configured) {
            if (value == null) throw new TranslationValidationException(INVALID_INPUT);
            var codes = value.split(":", -1);
            if (codes.length != 2 || !pairs.add(new LanguagePair(codes[0], codes[1]))) {
                throw new TranslationValidationException(INVALID_INPUT);
            }
        }
        return Set.copyOf(pairs);
    }
}
