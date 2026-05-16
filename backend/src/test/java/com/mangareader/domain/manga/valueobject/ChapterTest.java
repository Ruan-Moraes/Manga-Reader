package com.mangareader.domain.manga.valueobject;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.mangareader.shared.domain.i18n.LocalizedString;

class ChapterTest {
    @Test
    @DisplayName("Deve definir todos os campos via builder")
    void shouldSetAllFieldsViaBuilder() {
        Chapter chapter = Chapter.builder()
                .number("42")
                .title(LocalizedString.ofDefault("A Grande Batalha"))
                .releaseDate("2025-06-15")
                .pages("36")
                .build();

        assertThat(chapter.getNumber()).isEqualTo("42");
        assertThat(chapter.getTitle().resolve(null)).isEqualTo("A Grande Batalha");
        assertThat(chapter.getReleaseDate()).isEqualTo("2025-06-15");
        assertThat(chapter.getPages()).isEqualTo("36");
    }

    @Test
    @DisplayName("Construtor vazio deve manter todos os campos nulos")
    void shouldKeepAllFieldsNullOnNoArgsConstructor() {
        Chapter chapter = new Chapter();

        assertThat(chapter.getNumber()).isNull();
        assertThat(chapter.getTitle()).isNull();
        assertThat(chapter.getReleaseDate()).isNull();
        assertThat(chapter.getPages()).isNull();
    }

    @Test
    @DisplayName("Deve suportar mutação via setters")
    void shouldSupportMutationViaSetters() {
        Chapter chapter = new Chapter();

        chapter.setNumber("1");
        chapter.setTitle(LocalizedString.ofDefault("Prólogo"));
        chapter.setReleaseDate("2024-01-01");
        chapter.setPages("24");

        assertThat(chapter.getNumber()).isEqualTo("1");
        assertThat(chapter.getTitle().resolve(null)).isEqualTo("Prólogo");
        assertThat(chapter.getReleaseDate()).isEqualTo("2024-01-01");
        assertThat(chapter.getPages()).isEqualTo("24");
    }

    @Test
    @DisplayName("Deve criar instância com todos os campos via AllArgsConstructor")
    void shouldCreateInstanceViaAllArgsConstructor() {
        Chapter chapter = new Chapter("10", LocalizedString.ofDefault("Revelação"), "2025-03-01", "30");

        assertThat(chapter.getNumber()).isEqualTo("10");
        assertThat(chapter.getTitle().resolve(null)).isEqualTo("Revelação");
        assertThat(chapter.getReleaseDate()).isEqualTo("2025-03-01");
        assertThat(chapter.getPages()).isEqualTo("30");
    }

    @Test
    @DisplayName("Builder deve permitir campos parciais com restante nulo")
    void shouldAllowPartialFieldsInBuilder() {
        Chapter chapter = Chapter.builder()
                .number("5")
                .build();

        assertThat(chapter.getNumber()).isEqualTo("5");
        assertThat(chapter.getTitle()).isNull();
        assertThat(chapter.getReleaseDate()).isNull();
        assertThat(chapter.getPages()).isNull();
    }
}
