package com.mangareader.domain.forum.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.mangareader.domain.user.entity.User;

class ForumReplyTest {

    private User createTestUser(String name) {
        return User.builder()
                .name(name)
                .email(name.toLowerCase() + "@test.com")
                .passwordHash("hash")
                .build();
    }

    private ForumTopic createTestTopic() {
        return ForumTopic.builder()
                .author(createTestUser("TopicAuthor"))
                .title("Tópico teste")
                .content("Conteúdo")
                .category(com.mangareader.domain.forum.valueobject.ForumCategory.GERAL)
                .build();
    }

    @Nested
    @DisplayName("Builder — valores default")
    class BuilderDefaultTests {

        @Test
        @DisplayName("Deve iniciar com defaults corretos no builder")
        void shouldInitializeDefaults() {
            ForumReply reply = ForumReply.builder()
                    .topic(createTestTopic())
                    .author(createTestUser("User1"))
                    .content("Minha resposta")
                    .build();

            assertEquals(0, reply.getLikes());
            assertFalse(reply.isEdited());
            assertFalse(reply.isBestAnswer());
        }
    }

    @Nested
    @DisplayName("Builder — todos os campos")
    class BuilderAllFieldsTests {

        @Test
        @DisplayName("Deve permitir definir todos os campos via builder")
        void shouldSetAllFieldsViaBuilder() {
            User author = createTestUser("Expert");
            ForumTopic topic = createTestTopic();

            ForumReply reply = ForumReply.builder()
                    .topic(topic)
                    .author(author)
                    .content("Resposta detalhada com a solução")
                    .likes(10)
                    .isEdited(true)
                    .isBestAnswer(true)
                    .build();

            assertEquals(topic, reply.getTopic());
            assertEquals(author, reply.getAuthor());
            assertEquals("Resposta detalhada com a solução", reply.getContent());
            assertEquals(10, reply.getLikes());
            assertTrue(reply.isEdited());
            assertTrue(reply.isBestAnswer());
        }
    }

    @Nested
    @DisplayName("Mutação via setters")
    class MutationTests {

        @Test
        @DisplayName("Deve marcar resposta como melhor resposta")
        void shouldMarkAsBestAnswer() {
            ForumReply reply = ForumReply.builder()
                    .topic(createTestTopic())
                    .author(createTestUser("Helper"))
                    .content("A solução é X")
                    .build();

            assertFalse(reply.isBestAnswer());
            reply.setBestAnswer(true);
            assertTrue(reply.isBestAnswer());
        }

        @Test
        @DisplayName("Deve marcar como editado ao atualizar conteúdo")
        void shouldMarkAsEditedWhenContentUpdated() {
            ForumReply reply = ForumReply.builder()
                    .topic(createTestTopic())
                    .author(createTestUser("User"))
                    .content("Texto original")
                    .build();

            assertFalse(reply.isEdited());
            reply.setContent("Texto corrigido");
            reply.setEdited(true);

            assertEquals("Texto corrigido", reply.getContent());
            assertTrue(reply.isEdited());
        }

        @Test
        @DisplayName("Deve permitir incrementar likes")
        void shouldIncrementLikes() {
            ForumReply reply = ForumReply.builder()
                    .topic(createTestTopic())
                    .author(createTestUser("User"))
                    .content("Ótima resposta")
                    .build();

            assertEquals(0, reply.getLikes());
            reply.setLikes(reply.getLikes() + 1);
            assertEquals(1, reply.getLikes());
        }
    }

    @Nested
    @DisplayName("Construtor vazio")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Construtor vazio deve manter campos nulos")
        void shouldKeepFieldsNullOnNoArgsConstructor() {
            ForumReply reply = new ForumReply();

            assertNull(reply.getId());
            assertNull(reply.getTopic());
            assertNull(reply.getAuthor());
            assertNull(reply.getContent());
            assertNull(reply.getCreatedAt());
        }
    }
}
