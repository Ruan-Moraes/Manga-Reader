package com.mangareader.domain.forum.entity;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.mangareader.domain.forum.valueobject.ForumCategory;

class ForumTopicTest {

    private static ForumTopic.ForumTopicBuilder baseTopic() {
        return ForumTopic.builder()
                .authorId("author-1")
                .authorName("Ruan")
                .authorPhoto("https://example.com/photo.jpg")
                .title("Tópico de teste")
                .content("Conteúdo")
                .category(ForumCategory.GERAL);
    }

    @Nested
    @DisplayName("Builder")
    class BuilderTests {

        @Test
        @DisplayName("Deve iniciar com valores default corretos")
        void shouldInitializeDefaults() {
            ForumTopic topic = baseTopic().build();

            assertThat(topic.getLanguage()).isEqualTo("pt-BR");
            assertThat(topic.getTags()).isEmpty();
            assertThat(topic.getViewCount()).isZero();
            assertThat(topic.getReplyCount()).isZero();
            assertThat(topic.getUpvotes()).isZero();
            assertThat(topic.getDownvotes()).isZero();
            assertThat(topic.isPinned()).isFalse();
            assertThat(topic.isLocked()).isFalse();
            assertThat(topic.isSolved()).isFalse();
            assertThat(topic.isEdited()).isFalse();
        }

        @Test
        @DisplayName("Deve guardar o autor como snapshot desnormalizado")
        void shouldSnapshotAuthor() {
            ForumTopic topic = baseTopic().build();

            assertThat(topic.getAuthorId()).isEqualTo("author-1");
            assertThat(topic.getAuthorName()).isEqualTo("Ruan");
            assertThat(topic.getAuthorPhoto()).isEqualTo("https://example.com/photo.jpg");
        }

        @Test
        @DisplayName("Deve permitir definir todos os campos via builder")
        void shouldSetAllFields() {
            ForumTopic topic = baseTopic()
                    .id("topic-1")
                    .tags(List.of("manga", "2026"))
                    .viewCount(120)
                    .replyCount(4)
                    .upvotes(10)
                    .downvotes(2)
                    .isPinned(true)
                    .isLocked(true)
                    .isSolved(true)
                    .edited(true)
                    .build();

            assertThat(topic.getId()).isEqualTo("topic-1");
            assertThat(topic.getTags()).containsExactly("manga", "2026");
            assertThat(topic.getViewCount()).isEqualTo(120);
            assertThat(topic.getReplyCount()).isEqualTo(4);
            assertThat(topic.getUpvotes()).isEqualTo(10);
            assertThat(topic.getDownvotes()).isEqualTo(2);
            assertThat(topic.isPinned()).isTrue();
            assertThat(topic.isLocked()).isTrue();
            assertThat(topic.isSolved()).isTrue();
            assertThat(topic.isEdited()).isTrue();
        }
    }

    @Nested
    @DisplayName("Contadores de voto (HasVoteCounters)")
    class VoteCounters {

        @Test
        @DisplayName("Deve suportar incremento de votos via setters")
        void shouldSupportVoteModification() {
            ForumTopic topic = baseTopic().build();

            topic.setUpvotes(topic.getUpvotes() + 1);
            topic.setDownvotes(topic.getDownvotes() + 1);

            assertThat(topic.getUpvotes()).isEqualTo(1);
            assertThat(topic.getDownvotes()).isEqualTo(1);
        }

        @Test
        @DisplayName("Deve manter replyCount desnormalizado mutável")
        void shouldMutateReplyCount() {
            ForumTopic topic = baseTopic().replyCount(5).build();

            topic.setReplyCount(topic.getReplyCount() + 1);

            assertThat(topic.getReplyCount()).isEqualTo(6);
        }
    }

    @Nested
    @DisplayName("Estados de moderação")
    class ModeracaoTests {

        @Test
        @DisplayName("Deve marcar como trancado/resolvido/fixado via setters")
        void shouldToggleModerationFlags() {
            ForumTopic topic = baseTopic().build();

            topic.setLocked(true);
            topic.setSolved(true);
            topic.setPinned(true);

            assertThat(topic.isLocked()).isTrue();
            assertThat(topic.isSolved()).isTrue();
            assertThat(topic.isPinned()).isTrue();
        }
    }
}
