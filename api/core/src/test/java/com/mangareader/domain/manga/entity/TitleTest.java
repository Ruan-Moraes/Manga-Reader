package com.mangareader.domain.manga.entity;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class TitleTest {
    @Test
    @DisplayName("Deve iniciar com lista vazia de genres no builder padrão")
    void shouldInitializeDefaultListsWhenUsingBuilder() {
        Title title = Title.builder()
                .name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Solo Leveling"))
                .type("manhwa")
                .build();

        assertThat(title.getGenres()).isNotNull();
        assertThat(title.getGenres().isEmpty()).isTrue();
    }

    @Test
    @DisplayName("Deve permitir definir todos os campos via builder")
    void shouldSetAllFieldsViaBuilder() {
        Title title = Title.builder()
                .id("abc123")
                .type("manga")
                .name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("One Piece"))
                .cover("https://example.com/cover.jpg")
                .synopsis(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Aventura pirata épica"))
                .genres(List.of("Action", "Adventure"))
                .popularity("1")
                .author("Eiichiro Oda")
                .artist("Eiichiro Oda")
                .publisher("Shueisha")
                .build();

        assertThat(title.getId()).isEqualTo("abc123");
        assertThat(title.getType()).isEqualTo("manga");
        assertThat(title.getName().resolve(java.util.Locale.forLanguageTag("pt-BR"))).isEqualTo("One Piece");
        assertThat(title.getCover()).isEqualTo("https://example.com/cover.jpg");
        assertThat(title.getSynopsis().resolve(java.util.Locale.forLanguageTag("pt-BR"))).isEqualTo("Aventura pirata épica");
        assertThat(title.getGenres().size()).isEqualTo(2);
        assertThat(title.getGenres().get(0)).isEqualTo("Action");
        assertThat(title.getPopularity()).isEqualTo("1");
        assertThat(title.getAuthor()).isEqualTo("Eiichiro Oda");
        assertThat(title.getArtist()).isEqualTo("Eiichiro Oda");
        assertThat(title.getPublisher()).isEqualTo("Shueisha");
    }

    @Test
    @DisplayName("Deve permitir sobrescrever genres com lista personalizada no builder")
    void shouldOverrideDefaultGenresInBuilder() {
        List<String> genres = List.of("Romance", "Drama", "Slice of Life");

        Title title = Title.builder()
                .name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Fruits Basket"))
                .genres(genres)
                .build();

        assertThat(title.getGenres().size()).isEqualTo(3);
        assertThat(title.getGenres().contains("Romance")).isTrue();
        assertThat(title.getGenres().contains("Drama")).isTrue();
        assertThat(title.getGenres().contains("Slice of Life")).isTrue();
    }

    @Test
    @DisplayName("Construtor vazio deve manter campos opcionais nulos e listas inicializadas via @Builder.Default")
    void shouldKeepFieldsNullOnNoArgsConstructor() {
        Title title = new Title();

        assertThat(title.getId()).isNull();
        assertThat(title.getName().isEmpty()).isTrue();
        assertThat(title.getType()).isNull();
        assertThat(title.getCover()).isNull();
        assertThat(title.getSynopsis().isEmpty()).isTrue();
        assertThat(title.getAuthor()).isNull();
        assertThat(title.getArtist()).isNull();
        assertThat(title.getPublisher()).isNull();
        assertThat(title.getPopularity()).isNull();
        assertThat(title.getCreatedAt()).isNull();
        assertThat(title.getUpdatedAt()).isNull();

        // Lista com field initializer é inicializada mesmo no no-args constructor
        assertThat(title.getGenres()).isNotNull();
        assertThat(title.getGenres().isEmpty()).isTrue();
    }

    @Test
    @DisplayName("Deve inicializar adult como false via @Builder.Default")
    void shouldInitializeAdultAsFalse() {
        Title title = Title.builder().name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Test")).build();

        assertThat(title.isAdult()).isFalse();
    }

    @Test
    @DisplayName("Deve permitir definir adult como true via builder")
    void shouldSetAdultViaBuilder() {
        Title title = Title.builder().name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Test")).adult(true).build();

        assertThat(title.isAdult()).isTrue();
    }

    @Test
    @DisplayName("Deve inicializar status como null via builder padrão")
    void shouldInitializeStatusAsNull() {
        Title title = Title.builder().name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Test")).build();

        assertThat(title.getStatus()).isNull();
    }

    @Test
    @DisplayName("Deve permitir definir status via builder")
    void shouldSetStatusViaBuilder() {
        Title title = Title.builder().name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Test")).status("ONGOING").build();

        assertThat(title.getStatus()).isEqualTo("ONGOING");
    }

    @Test
    @DisplayName("Deve suportar mutação via setters")
    void shouldSupportMutationViaSetters() {
        Title title = Title.builder()
                .name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Original"))
                .build();

        title.setName(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Atualizado"));
        title.setPopularity("5");

        assertThat(title.getName().resolve(java.util.Locale.forLanguageTag("pt-BR"))).isEqualTo("Atualizado");
        assertThat(title.getPopularity()).isEqualTo("5");
    }
}
