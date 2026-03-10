package com.mangareader.domain.manga.valueobject;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class ChapterTest {

    @Test
    @DisplayName("Deve definir todos os campos via builder")
    void shouldSetAllFieldsViaBuilder() {
        Chapter chapter = Chapter.builder()
                .number("42")
                .title("A Grande Batalha")
                .releaseDate("2025-06-15")
                .pages("36")
                .build();

        assertEquals("42", chapter.getNumber());
        assertEquals("A Grande Batalha", chapter.getTitle());
        assertEquals("2025-06-15", chapter.getReleaseDate());
        assertEquals("36", chapter.getPages());
    }

    @Test
    @DisplayName("Construtor vazio deve manter todos os campos nulos")
    void shouldKeepAllFieldsNullOnNoArgsConstructor() {
        Chapter chapter = new Chapter();

        assertNull(chapter.getNumber());
        assertNull(chapter.getTitle());
        assertNull(chapter.getReleaseDate());
        assertNull(chapter.getPages());
    }

    @Test
    @DisplayName("Deve suportar mutação via setters")
    void shouldSupportMutationViaSetters() {
        Chapter chapter = new Chapter();

        chapter.setNumber("1");
        chapter.setTitle("Prólogo");
        chapter.setReleaseDate("2024-01-01");
        chapter.setPages("24");

        assertEquals("1", chapter.getNumber());
        assertEquals("Prólogo", chapter.getTitle());
        assertEquals("2024-01-01", chapter.getReleaseDate());
        assertEquals("24", chapter.getPages());
    }

    @Test
    @DisplayName("Deve criar instância com todos os campos via AllArgsConstructor")
    void shouldCreateInstanceViaAllArgsConstructor() {
        Chapter chapter = new Chapter("10", "Revelação", "2025-03-01", "30");

        assertEquals("10", chapter.getNumber());
        assertEquals("Revelação", chapter.getTitle());
        assertEquals("2025-03-01", chapter.getReleaseDate());
        assertEquals("30", chapter.getPages());
    }

    @Test
    @DisplayName("Builder deve permitir campos parciais com restante nulo")
    void shouldAllowPartialFieldsInBuilder() {
        Chapter chapter = Chapter.builder()
                .number("5")
                .build();

        assertEquals("5", chapter.getNumber());
        assertNull(chapter.getTitle());
        assertNull(chapter.getReleaseDate());
        assertNull(chapter.getPages());
    }
}
