package com.mangareader.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.mangareader.domain.forum.valueobject.ForumCategory;
import com.mangareader.domain.library.valueobject.ReadingListType;
import com.mangareader.domain.news.valueobject.NewsAuthor;
import com.mangareader.domain.news.valueobject.NewsCategory;
import com.mangareader.domain.news.valueobject.NewsReaction;
import com.mangareader.domain.store.valueobject.StoreAvailability;
import com.mangareader.domain.user.valueobject.UserRole;

@DisplayName("Enums e VOs diversos do domain")
class MiscEnumsAndVOsTest {

    @Nested
    @DisplayName("UserRole")
    class UserRoleTests {

        @Test
        @DisplayName("Deve conter 3 valores")
        void shouldHaveThreeValues() {
            assertEquals(3, UserRole.values().length);
        }

        @Test
        @DisplayName("Deve conter ADMIN, MODERATOR, MEMBER")
        void shouldContainExpectedValues() {
            UserRole[] values = UserRole.values();
            assertEquals(UserRole.ADMIN, values[0]);
            assertEquals(UserRole.MODERATOR, values[1]);
            assertEquals(UserRole.MEMBER, values[2]);
        }
    }

    @Nested
    @DisplayName("ForumCategory")
    class ForumCategoryTests {

        @Test
        @DisplayName("Deve conter 8 valores")
        void shouldHaveEightValues() {
            assertEquals(8, ForumCategory.values().length);
        }

        @Test
        @DisplayName("Deve retornar displayName correto para cada categoria")
        void shouldReturnCorrectDisplayNames() {
            assertEquals("Geral", ForumCategory.GERAL.getDisplayName());
            assertEquals("Recomendações", ForumCategory.RECOMENDACOES.getDisplayName());
            assertEquals("Spoilers", ForumCategory.SPOILERS.getDisplayName());
            assertEquals("Suporte", ForumCategory.SUPORTE.getDisplayName());
            assertEquals("Off-topic", ForumCategory.OFF_TOPIC.getDisplayName());
            assertEquals("Teorias", ForumCategory.TEORIAS.getDisplayName());
            assertEquals("Fanart", ForumCategory.FANART.getDisplayName());
            assertEquals("Notícias", ForumCategory.NOTICIAS.getDisplayName());
        }
    }

    @Nested
    @DisplayName("ReadingListType")
    class ReadingListTypeTests {

        @Test
        @DisplayName("Deve conter 3 valores")
        void shouldHaveThreeValues() {
            assertEquals(3, ReadingListType.values().length);
        }

        @Test
        @DisplayName("Deve retornar displayName correto para cada tipo")
        void shouldReturnCorrectDisplayNames() {
            assertEquals("Lendo", ReadingListType.LENDO.getDisplayName());
            assertEquals("Quero Ler", ReadingListType.QUERO_LER.getDisplayName());
            assertEquals("Concluído", ReadingListType.CONCLUIDO.getDisplayName());
        }
    }

    @Nested
    @DisplayName("NewsCategory")
    class NewsCategoryTests {

        @Test
        @DisplayName("Deve conter 9 valores")
        void shouldHaveNineValues() {
            assertEquals(9, NewsCategory.values().length);
        }

        @Test
        @DisplayName("Deve retornar displayName correto para cada categoria")
        void shouldReturnCorrectDisplayNames() {
            assertEquals("Principais", NewsCategory.PRINCIPAIS.getDisplayName());
            assertEquals("Lançamentos", NewsCategory.LANCAMENTOS.getDisplayName());
            assertEquals("Adaptações", NewsCategory.ADAPTACOES.getDisplayName());
            assertEquals("Indústria", NewsCategory.INDUSTRIA.getDisplayName());
            assertEquals("Entrevistas", NewsCategory.ENTREVISTAS.getDisplayName());
            assertEquals("Eventos", NewsCategory.EVENTOS.getDisplayName());
            assertEquals("Curiosidades", NewsCategory.CURIOSIDADES.getDisplayName());
            assertEquals("Mercado", NewsCategory.MERCADO.getDisplayName());
            assertEquals("Internacional", NewsCategory.INTERNACIONAL.getDisplayName());
        }
    }

    @Nested
    @DisplayName("StoreAvailability")
    class StoreAvailabilityTests {

        @Test
        @DisplayName("Deve conter 3 valores")
        void shouldHaveThreeValues() {
            assertEquals(3, StoreAvailability.values().length);
        }

        @Test
        @DisplayName("Deve conter IN_STOCK, OUT_OF_STOCK, PRE_ORDER")
        void shouldContainExpectedValues() {
            StoreAvailability[] values = StoreAvailability.values();
            assertEquals(StoreAvailability.IN_STOCK, values[0]);
            assertEquals(StoreAvailability.OUT_OF_STOCK, values[1]);
            assertEquals(StoreAvailability.PRE_ORDER, values[2]);
        }
    }

    @Nested
    @DisplayName("NewsAuthor (VO)")
    class NewsAuthorTests {

        @Test
        @DisplayName("Deve criar instância com todos os campos via builder")
        void shouldBuildWithAllFields() {
            NewsAuthor author = NewsAuthor.builder()
                    .id("author-001")
                    .name("Maria Silva")
                    .avatar("https://example.com/avatar.jpg")
                    .role("Editor")
                    .profileLink("https://example.com/profile/maria")
                    .build();

            assertEquals("author-001", author.getId());
            assertEquals("Maria Silva", author.getName());
            assertEquals("https://example.com/avatar.jpg", author.getAvatar());
            assertEquals("Editor", author.getRole());
            assertEquals("https://example.com/profile/maria", author.getProfileLink());
        }

        @Test
        @DisplayName("Deve criar instância vazia com construtor padrão")
        void shouldCreateEmptyInstance() {
            NewsAuthor author = new NewsAuthor();

            assertNull(author.getId());
            assertNull(author.getName());
            assertNull(author.getAvatar());
            assertNull(author.getRole());
            assertNull(author.getProfileLink());
        }
    }

    @Nested
    @DisplayName("NewsReaction (VO)")
    class NewsReactionTests {

        @Test
        @DisplayName("Deve criar instância com todos os campos via builder")
        void shouldBuildWithAllFields() {
            NewsReaction reaction = NewsReaction.builder()
                    .like(42)
                    .excited(15)
                    .sad(3)
                    .surprised(8)
                    .build();

            assertEquals(42, reaction.getLike());
            assertEquals(15, reaction.getExcited());
            assertEquals(3, reaction.getSad());
            assertEquals(8, reaction.getSurprised());
        }

        @Test
        @DisplayName("Deve inicializar com zeros no construtor padrão")
        void shouldDefaultToZeros() {
            NewsReaction reaction = new NewsReaction();

            assertEquals(0, reaction.getLike());
            assertEquals(0, reaction.getExcited());
            assertEquals(0, reaction.getSad());
            assertEquals(0, reaction.getSurprised());
        }
    }
}
