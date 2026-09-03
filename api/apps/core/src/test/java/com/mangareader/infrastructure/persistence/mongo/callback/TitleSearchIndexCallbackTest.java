package com.mangareader.infrastructure.persistence.mongo.callback;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;

import com.mangareader.domain.manga.entity.Title;
import com.mangareader.shared.domain.i18n.LocalizedString;

class TitleSearchIndexCallbackTest {

    private final TitleSearchIndexCallback callback = new TitleSearchIndexCallback();

    @Test
    void shouldRebuildSearchIndexBeforeEverySave() {
        var title = Title.builder()
                .name(LocalizedString.of(Map.of("pt-BR", "Coração de Aço")))
                .build();

        callback.onBeforeConvert(title, "titles");

        assertThat(title.getSearchIndex().getNormalizedNames())
                .containsEntry("pt-BR", "coracao de aco");
        assertThat(title.getSearchIndex().getGrams()).contains("co", "ac");

        title.setName(LocalizedString.ofDefault("Novo Nome"));
        callback.onBeforeConvert(title, "titles");

        assertThat(title.getSearchIndex().getNormalizedNames())
                .containsExactly(Map.entry("pt-BR", "novo nome"));
    }
}
