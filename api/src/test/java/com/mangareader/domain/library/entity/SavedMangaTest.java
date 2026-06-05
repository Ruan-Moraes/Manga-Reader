package com.mangareader.domain.library.entity;

import static org.assertj.core.api.Assertions.assertThat;

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

            assertThat(saved.getUser()).isEqualTo(user);
            assertThat(saved.getTitleId()).isEqualTo("mongo-title-id-123");
            assertThat(saved.getName()).isEqualTo("One Piece");
            assertThat(saved.getList()).isEqualTo(ReadingListType.LENDO);
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

            assertThat(saved.getCover()).isEqualTo("https://example.com/naruto.jpg");
            assertThat(saved.getType()).isEqualTo("Manga");
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

            assertThat(saved.getCover()).isNull();
            assertThat(saved.getType()).isNull();
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

            assertThat(saved.getList()).isEqualTo(ReadingListType.QUERO_LER);

            saved.setList(ReadingListType.LENDO);
            assertThat(saved.getList()).isEqualTo(ReadingListType.LENDO);
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
            assertThat(saved.getList()).isEqualTo(ReadingListType.CONCLUIDO);
        }
    }

    @Nested
    @DisplayName("ReadingListType enum")
    class ReadingListTypeTests {

        @Test
        @DisplayName("Deve ter 3 tipos de lista")
        void shouldHaveThreeListTypes() {
            assertThat(ReadingListType.values().length).isEqualTo(3);
        }

        @Test
        @DisplayName("Cada tipo deve ter displayName em português")
        void shouldHavePortugueseDisplayNames() {
            assertThat(ReadingListType.LENDO.getDisplayName()).isEqualTo("Lendo");
            assertThat(ReadingListType.QUERO_LER.getDisplayName()).isEqualTo("Quero Ler");
            assertThat(ReadingListType.CONCLUIDO.getDisplayName()).isEqualTo("Concluído");
        }
    }

    @Nested
    @DisplayName("Construtor vazio")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Construtor vazio deve manter campos nulos")
        void shouldKeepFieldsNullOnNoArgsConstructor() {
            SavedManga saved = new SavedManga();

            assertThat(saved.getId()).isNull();
            assertThat(saved.getUser()).isNull();
            assertThat(saved.getTitleId()).isNull();
            assertThat(saved.getName()).isNull();
            assertThat(saved.getCover()).isNull();
            assertThat(saved.getType()).isNull();
            assertThat(saved.getList()).isNull();
            assertThat(saved.getSavedAt()).isNull();
        }
    }
}
