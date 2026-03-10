package com.mangareader.domain.forum.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

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

            assertEquals(0, topic.getViewCount());
            assertEquals(0, topic.getReplyCount());
            assertEquals(0, topic.getLikeCount());
            assertFalse(topic.isPinned());
            assertFalse(topic.isLocked());
            assertFalse(topic.isSolved());
            assertNotNull(topic.getTags());
            assertTrue(topic.getTags().isEmpty());
            assertNotNull(topic.getReplies());
            assertTrue(topic.getReplies().isEmpty());
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

            assertEquals("Anúncio importante", topic.getTitle());
            assertEquals("Conteúdo do anúncio", topic.getContent());
            assertEquals(ForumCategory.NOTICIAS, topic.getCategory());
            assertEquals(2, topic.getTags().size());
            assertEquals(100, topic.getViewCount());
            assertEquals(5, topic.getReplyCount());
            assertEquals(42, topic.getLikeCount());
            assertTrue(topic.isPinned());
            assertTrue(topic.isLocked());
            assertFalse(topic.isSolved());
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

            assertFalse(topic.isPinned());

            topic.setPinned(true);
            assertTrue(topic.isPinned());

            topic.setPinned(false);
            assertFalse(topic.isPinned());
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

            assertFalse(topic.isLocked());
            topic.setLocked(true);
            assertTrue(topic.isLocked());
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

            assertFalse(topic.isSolved());
            topic.setSolved(true);
            assertTrue(topic.isSolved());
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

            assertEquals(1, topic.getReplies().size());
            assertEquals("Concordo!", topic.getReplies().getFirst().getContent());
        }
    }

    @Nested
    @DisplayName("Categorias do fórum")
    class CategoryTests {

        @Test
        @DisplayName("Todas as categorias devem ter displayName")
        void allCategoriesShouldHaveDisplayName() {
            for (ForumCategory cat : ForumCategory.values()) {
                assertNotNull(cat.getDisplayName());
                assertFalse(cat.getDisplayName().isBlank());
            }
        }

        @Test
        @DisplayName("Deve ter 8 categorias disponíveis")
        void shouldHaveExpectedCategoryCount() {
            assertEquals(8, ForumCategory.values().length);
        }

        @Test
        @DisplayName("Categoria GERAL deve ter displayName 'Geral'")
        void geralCategoryShouldHaveCorrectDisplayName() {
            assertEquals("Geral", ForumCategory.GERAL.getDisplayName());
        }
    }

    @Nested
    @DisplayName("Construtor vazio")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Construtor vazio deve manter campos nulos")
        void shouldKeepFieldsNullOnNoArgsConstructor() {
            ForumTopic topic = new ForumTopic();

            assertNull(topic.getId());
            assertNull(topic.getAuthor());
            assertNull(topic.getTitle());
            assertNull(topic.getContent());
            assertNull(topic.getCategory());
            assertNull(topic.getCreatedAt());
            assertNull(topic.getLastActivityAt());
        }
    }
}
