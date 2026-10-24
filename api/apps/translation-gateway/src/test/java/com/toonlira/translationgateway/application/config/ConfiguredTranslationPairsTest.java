package com.toonlira.translationgateway.application.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationValidationException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Test;

class ConfiguredTranslationPairsTest {
    @Test
    void parsesAllPairsAndReturnsAnImmutableIndependentSet() {
        var configured = new ArrayList<>(LanguagePair.all().stream().map(pair -> pair.source() + ":" + pair.target()).toList());
        var result = ConfiguredTranslationPairs.parse(configured);
        configured.clear();
        assertThat(result).hasSize(42).containsAll(LanguagePair.all());
        assertThatThrownBy(result::clear).isInstanceOf(UnsupportedOperationException.class);
        assertThat(ConfiguredTranslationPairs.parse(List.of())).isEmpty();
    }

    @Test
    void rejectsNullValuesWithoutExposingConfiguration() {
        assertThatThrownBy(() -> ConfiguredTranslationPairs.parse(null)).isInstanceOf(TranslationValidationException.class).hasMessage("INVALID_INPUT");
        assertThatThrownBy(() -> ConfiguredTranslationPairs.parse(Arrays.asList("ja:pt-BR", null)))
            .isInstanceOf(TranslationValidationException.class).hasMessage("INVALID_INPUT");
    }
}
