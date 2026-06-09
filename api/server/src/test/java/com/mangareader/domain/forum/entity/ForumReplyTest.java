package com.mangareader.domain.forum.entity;

import static org.assertj.core.api.Assertions.assertThat;

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

            assertThat(reply.getLikes()).isEqualTo(0);
            assertThat(reply.isEdited()).isFalse();
            assertThat(reply.isBestAnswer()).isFalse();
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
                    .edited(true)
                    .isBestAnswer(true)
                    .build();

            assertThat(reply.getTopic()).isEqualTo(topic);
            assertThat(reply.getAuthor()).isEqualTo(author);
            assertThat(reply.getContent()).isEqualTo("Resposta detalhada com a solução");
            assertThat(reply.getLikes()).isEqualTo(10);
            assertThat(reply.isEdited()).isTrue();
            assertThat(reply.isBestAnswer()).isTrue();
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

            assertThat(reply.isBestAnswer()).isFalse();
            reply.setBestAnswer(true);
            assertThat(reply.isBestAnswer()).isTrue();
        }

        @Test
        @DisplayName("Deve marcar como editado ao atualizar conteúdo")
        void shouldMarkAsEditedWhenContentUpdated() {
            ForumReply reply = ForumReply.builder()
                    .topic(createTestTopic())
                    .author(createTestUser("User"))
                    .content("Texto original")
                    .build();

            assertThat(reply.isEdited()).isFalse();
            reply.setContent("Texto corrigido");
            reply.setEdited(true);

            assertThat(reply.getContent()).isEqualTo("Texto corrigido");
            assertThat(reply.isEdited()).isTrue();
        }

        @Test
        @DisplayName("Deve permitir incrementar likes")
        void shouldIncrementLikes() {
            ForumReply reply = ForumReply.builder()
                    .topic(createTestTopic())
                    .author(createTestUser("User"))
                    .content("Ótima resposta")
                    .build();

            assertThat(reply.getLikes()).isEqualTo(0);
            reply.setLikes(reply.getLikes() + 1);
            assertThat(reply.getLikes()).isEqualTo(1);
        }
    }

    @Nested
    @DisplayName("Construtor vazio")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Construtor vazio deve manter campos nulos")
        void shouldKeepFieldsNullOnNoArgsConstructor() {
            ForumReply reply = new ForumReply();

            assertThat(reply.getId()).isNull();
            assertThat(reply.getTopic()).isNull();
            assertThat(reply.getAuthor()).isNull();
            assertThat(reply.getContent()).isNull();
            assertThat(reply.getCreatedAt()).isNull();
        }
    }
}
