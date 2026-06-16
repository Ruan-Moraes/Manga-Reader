package com.mangareader.domain;

import static org.assertj.core.api.Assertions.assertThat;

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
            assertThat(UserRole.values().length).isEqualTo(3);
        }

        @Test
        @DisplayName("Deve conter ADMIN, MODERATOR, MEMBER")
        void shouldContainExpectedValues() {
            UserRole[] values = UserRole.values();
            assertThat(values[0]).isEqualTo(UserRole.ADMIN);
            assertThat(values[1]).isEqualTo(UserRole.MODERATOR);
            assertThat(values[2]).isEqualTo(UserRole.MEMBER);
        }
    }

    @Nested
    @DisplayName("ForumCategory")
    class ForumCategoryTests {

        @Test
        @DisplayName("Deve conter 8 valores")
        void shouldHaveEightValues() {
            assertThat(ForumCategory.values().length).isEqualTo(8);
        }

        @Test
        @DisplayName("Deve retornar displayName correto para cada categoria")
        void shouldReturnCorrectDisplayNames() {
            assertThat(ForumCategory.GERAL.getDisplayName()).isEqualTo("Geral");
            assertThat(ForumCategory.RECOMENDACOES.getDisplayName()).isEqualTo("Recomendações");
            assertThat(ForumCategory.SPOILERS.getDisplayName()).isEqualTo("Spoilers");
            assertThat(ForumCategory.SUPORTE.getDisplayName()).isEqualTo("Suporte");
            assertThat(ForumCategory.OFF_TOPIC.getDisplayName()).isEqualTo("Off-topic");
            assertThat(ForumCategory.TEORIAS.getDisplayName()).isEqualTo("Teorias");
            assertThat(ForumCategory.FANART.getDisplayName()).isEqualTo("Fanart");
            assertThat(ForumCategory.NOTICIAS.getDisplayName()).isEqualTo("Notícias");
        }
    }

    @Nested
    @DisplayName("ReadingListType")
    class ReadingListTypeTests {

        @Test
        @DisplayName("Deve conter 3 valores")
        void shouldHaveThreeValues() {
            assertThat(ReadingListType.values().length).isEqualTo(3);
        }

        @Test
        @DisplayName("Deve retornar displayName correto para cada tipo")
        void shouldReturnCorrectDisplayNames() {
            assertThat(ReadingListType.LENDO.getDisplayName()).isEqualTo("Lendo");
            assertThat(ReadingListType.QUERO_LER.getDisplayName()).isEqualTo("Quero Ler");
            assertThat(ReadingListType.CONCLUIDO.getDisplayName()).isEqualTo("Concluído");
        }
    }

    @Nested
    @DisplayName("NewsCategory")
    class NewsCategoryTests {

        @Test
        @DisplayName("Deve conter 9 valores")
        void shouldHaveNineValues() {
            assertThat(NewsCategory.values().length).isEqualTo(9);
        }

        @Test
        @DisplayName("Deve retornar displayName correto para cada categoria")
        void shouldReturnCorrectDisplayNames() {
            assertThat(NewsCategory.PRINCIPAIS.getDisplayName()).isEqualTo("Principais");
            assertThat(NewsCategory.LANCAMENTOS.getDisplayName()).isEqualTo("Lançamentos");
            assertThat(NewsCategory.ADAPTACOES.getDisplayName()).isEqualTo("Adaptações");
            assertThat(NewsCategory.INDUSTRIA.getDisplayName()).isEqualTo("Indústria");
            assertThat(NewsCategory.ENTREVISTAS.getDisplayName()).isEqualTo("Entrevistas");
            assertThat(NewsCategory.EVENTOS.getDisplayName()).isEqualTo("Eventos");
            assertThat(NewsCategory.CURIOSIDADES.getDisplayName()).isEqualTo("Curiosidades");
            assertThat(NewsCategory.MERCADO.getDisplayName()).isEqualTo("Mercado");
            assertThat(NewsCategory.INTERNACIONAL.getDisplayName()).isEqualTo("Internacional");
        }
    }

    @Nested
    @DisplayName("StoreAvailability")
    class StoreAvailabilityTests {

        @Test
        @DisplayName("Deve conter 3 valores")
        void shouldHaveThreeValues() {
            assertThat(StoreAvailability.values().length).isEqualTo(3);
        }

        @Test
        @DisplayName("Deve conter IN_STOCK, OUT_OF_STOCK, PRE_ORDER")
        void shouldContainExpectedValues() {
            StoreAvailability[] values = StoreAvailability.values();
            assertThat(values[0]).isEqualTo(StoreAvailability.IN_STOCK);
            assertThat(values[1]).isEqualTo(StoreAvailability.OUT_OF_STOCK);
            assertThat(values[2]).isEqualTo(StoreAvailability.PRE_ORDER);
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

            assertThat(author.getId()).isEqualTo("author-001");
            assertThat(author.getName()).isEqualTo("Maria Silva");
            assertThat(author.getAvatar()).isEqualTo("https://example.com/avatar.jpg");
            assertThat(author.getRole()).isEqualTo("Editor");
            assertThat(author.getProfileLink()).isEqualTo("https://example.com/profile/maria");
        }

        @Test
        @DisplayName("Deve criar instância vazia com construtor padrão")
        void shouldCreateEmptyInstance() {
            NewsAuthor author = new NewsAuthor();

            assertThat(author.getId()).isNull();
            assertThat(author.getName()).isNull();
            assertThat(author.getAvatar()).isNull();
            assertThat(author.getRole()).isNull();
            assertThat(author.getProfileLink()).isNull();
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

            assertThat(reaction.getLike()).isEqualTo(42);
            assertThat(reaction.getExcited()).isEqualTo(15);
            assertThat(reaction.getSad()).isEqualTo(3);
            assertThat(reaction.getSurprised()).isEqualTo(8);
        }

        @Test
        @DisplayName("Deve inicializar com zeros no construtor padrão")
        void shouldDefaultToZeros() {
            NewsReaction reaction = new NewsReaction();

            assertThat(reaction.getLike()).isEqualTo(0);
            assertThat(reaction.getExcited()).isEqualTo(0);
            assertThat(reaction.getSad()).isEqualTo(0);
            assertThat(reaction.getSurprised()).isEqualTo(0);
        }
    }
}
