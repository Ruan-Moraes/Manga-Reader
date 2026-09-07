package com.toonlira.application.manga.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;

import com.toonlira.shared.domain.i18n.LocalizedString;

class TitleSearchTextTest {

    @Test
    void shouldNormalizeUnicodeCasePunctuationAndSpaces() {
        assertThat(TitleSearchText.normalize("  João’s   BIZARRE—Adventure  "))
                .isEqualTo("joao s bizarre adventure");
    }

    @Test
    void shouldCreateUniqueOrderedBigrams() {
        assertThat(TitleSearchText.grams("Anna"))
                .containsExactly("an", "nn", "na");
    }

    @Test
    void shouldBuildIndexForEveryLocalizedName() {
        var names = LocalizedString.of(Map.of(
                "pt-BR", "A Viagem de Chihiro",
                "en-US", "Spirited Away"));

        var index = TitleSearchText.buildIndex(names);

        assertThat(index.getNormalizedNames())
                .containsEntry("pt-BR", "a viagem de chihiro")
                .containsEntry("en-US", "spirited away");
        assertThat(index.getGrams()).contains("vi", "ch", "sp", "aw");
    }

    @Test
    void shouldReturnEmptyIndexForMissingNames() {
        var index = TitleSearchText.buildIndex(null);

        assertThat(index.getNormalizedNames()).isEmpty();
        assertThat(index.getGrams()).isEmpty();
    }
}
