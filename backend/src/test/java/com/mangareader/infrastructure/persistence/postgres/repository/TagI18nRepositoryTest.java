package com.mangareader.infrastructure.persistence.postgres.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Locale;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import com.mangareader.domain.category.entity.Tag;
import com.mangareader.shared.domain.i18n.LocalizedString;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@DisplayName("Tag — round-trip de LocalizedString via JSONB")
class TagI18nRepositoryTest {
    @Autowired
    private TagJpaRepository tagRepository;

    @Test
    @DisplayName("Deve persistir e recuperar labelI18n com 3 idiomas")
    void roundTrip3Idiomas() {
        var labelI18n = LocalizedString.of(Map.of(
                "pt-BR", "Ação",
                "en-US", "Action",
                "es-ES", "Acción"));

        var tag = Tag.builder()
                .label("Ação")
                .labelI18n(labelI18n)
                .build();

        Long id = tagRepository.saveAndFlush(tag).getId();

        var reloaded = tagRepository.findById(id).orElseThrow();

        assertThat(reloaded.getLabelI18n()).isEqualTo(labelI18n);
        assertThat(reloaded.getLabelI18n().resolve(Locale.forLanguageTag("en-US"))).isEqualTo("Action");
        assertThat(reloaded.getLabelI18n().resolve(Locale.forLanguageTag("es-ES"))).isEqualTo("Acción");
    }

    @Test
    @DisplayName("Deve aplicar fallback pt-BR quando idioma solicitado não existe")
    void fallbackPtBr() {
        var tag = Tag.builder()
                .label("Drama")
                .labelI18n(LocalizedString.ofDefault("Drama"))
                .build();

        var saved = tagRepository.saveAndFlush(tag);
        var reloaded = tagRepository.findById(saved.getId()).orElseThrow();

        assertThat(reloaded.getLabelI18n().resolve(Locale.forLanguageTag("ja-JP"))).isEqualTo("Drama");
    }

    @Test
    @DisplayName("LocalizedString vazia deve persistir como objeto JSON vazio")
    void persisteVazia() {
        var tag = Tag.builder()
                .label("Vazia")
                .labelI18n(LocalizedString.empty())
                .build();

        var saved = tagRepository.saveAndFlush(tag);
        var reloaded = tagRepository.findById(saved.getId()).orElseThrow();

        assertThat(reloaded.getLabelI18n().isEmpty()).isTrue();
    }
}
