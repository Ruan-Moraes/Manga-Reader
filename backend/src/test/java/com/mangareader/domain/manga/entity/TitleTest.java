package com.mangareader.domain.manga.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.mangareader.domain.manga.valueobject.Chapter;

class TitleTest {

    @Test
    @DisplayName("Deve iniciar com listas vazias de genres e chapters no builder padrão")
    void shouldInitializeDefaultListsWhenUsingBuilder() {
        Title title = Title.builder()
                .name("Solo Leveling")
                .type("manhwa")
                .build();

        assertNotNull(title.getGenres());
        assertTrue(title.getGenres().isEmpty());
        assertNotNull(title.getChapters());
        assertTrue(title.getChapters().isEmpty());
    }

    @Test
    @DisplayName("Deve permitir definir todos os campos via builder")
    void shouldSetAllFieldsViaBuilder() {
        Chapter ch1 = Chapter.builder()
                .number("1")
                .title("O Despertar")
                .releaseDate("2024-01-15")
                .pages("42")
                .build();

        Title title = Title.builder()
                .id("abc123")
                .type("manga")
                .name("One Piece")
                .cover("https://example.com/cover.jpg")
                .synopsis("Aventura pirata épica")
                .genres(List.of("Action", "Adventure"))
                .chapters(List.of(ch1))
                .popularity("1")
                .score("9.5")
                .author("Eiichiro Oda")
                .artist("Eiichiro Oda")
                .publisher("Shueisha")
                .build();

        assertEquals("abc123", title.getId());
        assertEquals("manga", title.getType());
        assertEquals("One Piece", title.getName());
        assertEquals("https://example.com/cover.jpg", title.getCover());
        assertEquals("Aventura pirata épica", title.getSynopsis());
        assertEquals(2, title.getGenres().size());
        assertEquals("Action", title.getGenres().get(0));
        assertEquals(1, title.getChapters().size());
        assertEquals("1", title.getChapters().getFirst().getNumber());
        assertEquals("1", title.getPopularity());
        assertEquals("9.5", title.getScore());
        assertEquals("Eiichiro Oda", title.getAuthor());
        assertEquals("Eiichiro Oda", title.getArtist());
        assertEquals("Shueisha", title.getPublisher());
    }

    @Test
    @DisplayName("Deve permitir sobrescrever genres com lista personalizada no builder")
    void shouldOverrideDefaultGenresInBuilder() {
        List<String> genres = List.of("Romance", "Drama", "Slice of Life");

        Title title = Title.builder()
                .name("Fruits Basket")
                .genres(genres)
                .build();

        assertEquals(3, title.getGenres().size());
        assertTrue(title.getGenres().contains("Romance"));
        assertTrue(title.getGenres().contains("Drama"));
        assertTrue(title.getGenres().contains("Slice of Life"));
    }

    @Test
    @DisplayName("Deve permitir adicionar capítulos à lista padrão após construção")
    void shouldAllowAddingChaptersAfterConstruction() {
        Title title = Title.builder()
                .name("Naruto")
                .build();

        Chapter ch = Chapter.builder()
                .number("700")
                .title("Capítulo Final")
                .build();

        title.getChapters().add(ch);

        assertEquals(1, title.getChapters().size());
        assertEquals("700", title.getChapters().getFirst().getNumber());
    }

    @Test
    @DisplayName("Construtor vazio deve manter campos opcionais nulos e listas inicializadas via @Builder.Default")
    void shouldKeepFieldsNullOnNoArgsConstructor() {
        Title title = new Title();

        assertNull(title.getId());
        assertNull(title.getName());
        assertNull(title.getType());
        assertNull(title.getCover());
        assertNull(title.getSynopsis());
        assertNull(title.getAuthor());
        assertNull(title.getArtist());
        assertNull(title.getPublisher());
        assertNull(title.getPopularity());
        assertNull(title.getScore());
        assertNull(title.getCreatedAt());
        assertNull(title.getUpdatedAt());
        // Listas com field initializer são inicializadas mesmo no no-args constructor
        assertNotNull(title.getGenres());
        assertTrue(title.getGenres().isEmpty());
        assertNotNull(title.getChapters());
        assertTrue(title.getChapters().isEmpty());
    }

    @Test
    @DisplayName("Deve suportar mutação via setters")
    void shouldSupportMutationViaSetters() {
        Title title = Title.builder()
                .name("Original")
                .build();

        title.setName("Atualizado");
        title.setScore("8.0");
        title.setPopularity("5");

        assertEquals("Atualizado", title.getName());
        assertEquals("8.0", title.getScore());
        assertEquals("5", title.getPopularity());
    }
}
