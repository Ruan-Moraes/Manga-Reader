package com.mangareader.domain.library.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.mangareader.domain.library.valueobject.ReadingListType;
import com.mangareader.domain.user.entity.User;

class SavedMangaTest {

    private User createTestUser() {
        return User.builder()
                .name("Leitor")
                .email("leitor@test.com")
                .passwordHash("hash")
                .build();
    }

    @Nested
    @DisplayName("Builder")
    class BuilderTests {

        @Test
        @DisplayName("Deve criar SavedManga com todos os campos obrigatórios")
        void shouldCreateWithRequiredFields() {
            User user = createTestUser();

            SavedManga saved = SavedManga.builder()
                    .user(user)
                    .titleId("mongo-title-id-123")
                    .name("One Piece")
                    .list(ReadingListType.LENDO)
                    .build();

            assertEquals(user, saved.getUser());
            assertEquals("mongo-title-id-123", saved.getTitleId());
            assertEquals("One Piece", saved.getName());
            assertEquals(ReadingListType.LENDO, saved.getList());
        }

        @Test
        @DisplayName("Deve criar SavedManga com campos desnormalizados")
        void shouldCreateWithDenormalizedFields() {
            SavedManga saved = SavedManga.builder()
                    .user(createTestUser())
                    .titleId("title-1")
                    .name("Naruto")
                    .cover("https://example.com/naruto.jpg")
                    .type("Manga")
                    .list(ReadingListType.CONCLUIDO)
                    .build();

            assertEquals("https://example.com/naruto.jpg", saved.getCover());
            assertEquals("Manga", saved.getType());
        }

        @Test
        @DisplayName("Campos desnormalizados opcionais devem ser nulos se não definidos")
        void shouldHaveNullOptionalFields() {
            SavedManga saved = SavedManga.builder()
                    .user(createTestUser())
                    .titleId("title-1")
                    .name("Solo Leveling")
                    .list(ReadingListType.QUERO_LER)
                    .build();

            assertNull(saved.getCover());
            assertNull(saved.getType());
        }
    }

    @Nested
    @DisplayName("Mudança de lista de leitura")
    class ReadingListChangeTests {

        @Test
        @DisplayName("Deve permitir mudar de 'Quero Ler' para 'Lendo'")
        void shouldChangeFromWantToReadToReading() {
            SavedManga saved = SavedManga.builder()
                    .user(createTestUser())
                    .titleId("title-1")
                    .name("Attack on Titan")
                    .list(ReadingListType.QUERO_LER)
                    .build();

            assertEquals(ReadingListType.QUERO_LER, saved.getList());

            saved.setList(ReadingListType.LENDO);
            assertEquals(ReadingListType.LENDO, saved.getList());
        }

        @Test
        @DisplayName("Deve permitir mudar de 'Lendo' para 'Concluído'")
        void shouldChangeFromReadingToCompleted() {
            SavedManga saved = SavedManga.builder()
                    .user(createTestUser())
                    .titleId("title-1")
                    .name("Death Note")
                    .list(ReadingListType.LENDO)
                    .build();

            saved.setList(ReadingListType.CONCLUIDO);
            assertEquals(ReadingListType.CONCLUIDO, saved.getList());
        }
    }

    @Nested
    @DisplayName("ReadingListType enum")
    class ReadingListTypeTests {

        @Test
        @DisplayName("Deve ter 3 tipos de lista")
        void shouldHaveThreeListTypes() {
            assertEquals(3, ReadingListType.values().length);
        }

        @Test
        @DisplayName("Cada tipo deve ter displayName em português")
        void shouldHavePortugueseDisplayNames() {
            assertEquals("Lendo", ReadingListType.LENDO.getDisplayName());
            assertEquals("Quero Ler", ReadingListType.QUERO_LER.getDisplayName());
            assertEquals("Concluído", ReadingListType.CONCLUIDO.getDisplayName());
        }
    }

    @Nested
    @DisplayName("Construtor vazio")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Construtor vazio deve manter campos nulos")
        void shouldKeepFieldsNullOnNoArgsConstructor() {
            SavedManga saved = new SavedManga();

            assertNull(saved.getId());
            assertNull(saved.getUser());
            assertNull(saved.getTitleId());
            assertNull(saved.getName());
            assertNull(saved.getCover());
            assertNull(saved.getType());
            assertNull(saved.getList());
            assertNull(saved.getSavedAt());
        }
    }
}
