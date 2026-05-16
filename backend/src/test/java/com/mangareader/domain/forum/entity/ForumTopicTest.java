package com.mangareader.domain.forum.entity;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.mangareader.domain.forum.valueobject.ForumCategory;
import com.mangareader.domain.user.entity.User;

class ForumTopicTest {

    private User createTestUser(String name) {
        return User.builder()
                .name(name)
                .email(name.toLowerCase() + "@test.com")
                .passwordHash("hash")
                .build();
    }

    @Nested
    @DisplayName("Builder — valores default")
    class BuilderDefaultTests {

        @Test
        @DisplayName("Deve iniciar com contadores zerados e flags desligadas")
        void shouldInitializeDefaultValues() {
            User author = createTestUser("TestUser");

            ForumTopic topic = ForumTopic.builder()
                    .author(author)
                    .title("Melhor mangá de 2025?")
                    .content("Qual vocês consideram o melhor?")
                    .category(ForumCategory.GERAL)
                    .build();

            assertThat(topic.getViewCount()).isEqualTo(0);
            assertThat(topic.getReplyCount()).isEqualTo(0);
            assertThat(topic.getLikeCount()).isEqualTo(0);
            assertThat(topic.isPinned()).isFalse();
            assertThat(topic.isLocked()).isFalse();
            assertThat(topic.isSolved()).isFalse();
            assertThat(topic.getTags()).isNotNull();
            assertThat(topic.getTags().isEmpty()).isTrue();
            assertThat(topic.getReplies()).isNotNull();
            assertThat(topic.getReplies().isEmpty()).isTrue();
        }
    }

    @Nested
    @DisplayName("Builder — todos os campos")
    class BuilderAllFieldsTests {

        @Test
        @DisplayName("Deve permitir definir todos os campos via builder")
        void shouldSetAllFieldsViaBuilder() {
            User author = createTestUser("Admin");

            ForumTopic topic = ForumTopic.builder()
                    .author(author)
                    .title("Anúncio importante")
                    .content("Conteúdo do anúncio")
                    .category(ForumCategory.NOTICIAS)
                    .tags(List.of("anúncio", "importante"))
                    .viewCount(100)
                    .replyCount(5)
                    .likeCount(42)
                    .isPinned(true)
                    .isLocked(true)
                    .isSolved(false)
                    .build();

            assertThat(topic.getTitle()).isEqualTo("Anúncio importante");
            assertThat(topic.getContent()).isEqualTo("Conteúdo do anúncio");
            assertThat(topic.getCategory()).isEqualTo(ForumCategory.NOTICIAS);
            assertThat(topic.getTags().size()).isEqualTo(2);
            assertThat(topic.getViewCount()).isEqualTo(100);
            assertThat(topic.getReplyCount()).isEqualTo(5);
            assertThat(topic.getLikeCount()).isEqualTo(42);
            assertThat(topic.isPinned()).isTrue();
            assertThat(topic.isLocked()).isTrue();
            assertThat(topic.isSolved()).isFalse();
        }
    }

    @Nested
    @DisplayName("Gestão de tópicos (pin, lock, solve)")
    class TopicManagementTests {

        @Test
        @DisplayName("Deve permitir fixar e desafixar tópico")
        void shouldTogglePinnedState() {
            ForumTopic topic = ForumTopic.builder()
                    .author(createTestUser("Mod"))
                    .title("Regras do fórum")
                    .content("Conteúdo")
                    .category(ForumCategory.GERAL)
                    .build();

            assertThat(topic.isPinned()).isFalse();

            topic.setPinned(true);
            assertThat(topic.isPinned()).isTrue();

            topic.setPinned(false);
            assertThat(topic.isPinned()).isFalse();
        }

        @Test
        @DisplayName("Deve permitir bloquear tópico (impedir respostas)")
        void shouldLockTopic() {
            ForumTopic topic = ForumTopic.builder()
                    .author(createTestUser("Mod"))
                    .title("Tópico encerrado")
                    .content("Conteúdo")
                    .category(ForumCategory.GERAL)
                    .build();

            assertThat(topic.isLocked()).isFalse();
            topic.setLocked(true);
            assertThat(topic.isLocked()).isTrue();
        }

        @Test
        @DisplayName("Deve permitir marcar tópico como resolvido")
        void shouldMarkAsSolved() {
            ForumTopic topic = ForumTopic.builder()
                    .author(createTestUser("User"))
                    .title("Como instalar X?")
                    .content("Preciso de ajuda")
                    .category(ForumCategory.SUPORTE)
                    .build();

            assertThat(topic.isSolved()).isFalse();
            topic.setSolved(true);
            assertThat(topic.isSolved()).isTrue();
        }
    }

    @Nested
    @DisplayName("Replies (respostas)")
    class ReplyTests {

        @Test
        @DisplayName("Deve permitir adicionar respostas à lista")
        void shouldAddRepliesToList() {
            User author = createTestUser("User1");
            ForumTopic topic = ForumTopic.builder()
                    .author(author)
                    .title("Discussão")
                    .content("Vamos debater")
                    .category(ForumCategory.GERAL)
                    .build();

            ForumReply reply = ForumReply.builder()
                    .topic(topic)
                    .author(author)
                    .content("Concordo!")
                    .build();

            topic.getReplies().add(reply);

            assertThat(topic.getReplies().size()).isEqualTo(1);
            assertThat(topic.getReplies().getFirst().getContent()).isEqualTo("Concordo!");
        }
    }

    @Nested
    @DisplayName("Categorias do fórum")
    class CategoryTests {

        @Test
        @DisplayName("Todas as categorias devem ter displayName")
        void allCategoriesShouldHaveDisplayName() {
            for (ForumCategory cat : ForumCategory.values()) {
                assertThat(cat.getDisplayName()).isNotNull();
                assertThat(cat.getDisplayName().isBlank()).isFalse();
            }
        }

        @Test
        @DisplayName("Deve ter 8 categorias disponíveis")
        void shouldHaveExpectedCategoryCount() {
            assertThat(ForumCategory.values().length).isEqualTo(8);
        }

        @Test
        @DisplayName("Categoria GERAL deve ter displayName 'Geral'")
        void geralCategoryShouldHaveCorrectDisplayName() {
            assertThat(ForumCategory.GERAL.getDisplayName()).isEqualTo("Geral");
        }
    }

    @Nested
    @DisplayName("Construtor vazio")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Construtor vazio deve manter campos nulos")
        void shouldKeepFieldsNullOnNoArgsConstructor() {
            ForumTopic topic = new ForumTopic();

            assertThat(topic.getId()).isNull();
            assertThat(topic.getAuthor()).isNull();
            assertThat(topic.getTitle()).isNull();
            assertThat(topic.getContent()).isNull();
            assertThat(topic.getCategory()).isNull();
            assertThat(topic.getCreatedAt()).isNull();
            assertThat(topic.getLastActivityAt()).isNull();
        }
    }
}
