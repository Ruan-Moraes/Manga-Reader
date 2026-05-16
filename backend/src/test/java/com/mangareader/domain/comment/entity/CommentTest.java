package com.mangareader.domain.comment.entity;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class CommentTest {

    @Nested
    @DisplayName("Builder")
    class BuilderTests {

        @Test
        @DisplayName("Deve iniciar com valores default corretos no builder")
        void shouldInitializeDefaultValuesWhenUsingBuilder() {
            Comment comment = Comment.builder()
                    .titleId("title-1")
                    .userId("user-1")
                    .userName("João")
                    .textContent("Ótimo capítulo!")
                    .build();

            assertThat(comment.isHighlighted()).isFalse();
            assertThat(comment.isWasEdited()).isFalse();
            assertThat(comment.getLikeCount()).isEqualTo(0);
            assertThat(comment.getDislikeCount()).isEqualTo(0);
        }

        @Test
        @DisplayName("Deve permitir definir todos os campos via builder")
        void shouldSetAllFieldsViaBuilder() {
            Comment comment = Comment.builder()
                    .id("comment-abc")
                    .titleId("title-1")
                    .parentCommentId("parent-xyz")
                    .userId("user-1")
                    .userName("Maria")
                    .userPhoto("https://example.com/photo.jpg")
                    .isHighlighted(true)
                    .wasEdited(true)
                    .textContent("Texto do comentário")
                    .imageContent("https://example.com/img.png")
                    .likeCount(15)
                    .dislikeCount(3)
                    .build();

            assertThat(comment.getId()).isEqualTo("comment-abc");
            assertThat(comment.getTitleId()).isEqualTo("title-1");
            assertThat(comment.getParentCommentId()).isEqualTo("parent-xyz");
            assertThat(comment.getUserId()).isEqualTo("user-1");
            assertThat(comment.getUserName()).isEqualTo("Maria");
            assertThat(comment.getUserPhoto()).isEqualTo("https://example.com/photo.jpg");
            assertThat(comment.isHighlighted()).isTrue();
            assertThat(comment.isWasEdited()).isTrue();
            assertThat(comment.getTextContent()).isEqualTo("Texto do comentário");
            assertThat(comment.getImageContent()).isEqualTo("https://example.com/img.png");
            assertThat(comment.getLikeCount()).isEqualTo(15);
            assertThat(comment.getDislikeCount()).isEqualTo(3);
        }
    }

    @Nested
    @DisplayName("Comentário raiz vs resposta")
    class ThreadingTests {

        @Test
        @DisplayName("Comentário raiz deve ter parentCommentId nulo")
        void rootCommentShouldHaveNullParentId() {
            Comment root = Comment.builder()
                    .titleId("title-1")
                    .userId("user-1")
                    .textContent("Comentário raiz")
                    .build();

            assertThat(root.getParentCommentId()).isNull();
        }

        @Test
        @DisplayName("Resposta deve ter parentCommentId preenchido")
        void replyShouldHaveParentId() {
            Comment reply = Comment.builder()
                    .titleId("title-1")
                    .userId("user-2")
                    .parentCommentId("comment-root")
                    .textContent("Concordo!")
                    .build();

            assertThat(reply.getParentCommentId()).isNotNull();
            assertThat(reply.getParentCommentId()).isEqualTo("comment-root");
        }
    }

    @Nested
    @DisplayName("Mutação via setters")
    class MutationTests {

        @Test
        @DisplayName("Deve suportar incremento de likes/dislikes via setters")
        void shouldSupportLikeDislikeModification() {
            Comment comment = Comment.builder()
                    .titleId("title-1")
                    .userId("user-1")
                    .textContent("Bom!")
                    .build();

            comment.setLikeCount(comment.getLikeCount() + 1);
            assertThat(comment.getLikeCount()).isEqualTo(1);

            comment.setDislikeCount(comment.getDislikeCount() + 1);
            assertThat(comment.getDislikeCount()).isEqualTo(1);
        }

        @Test
        @DisplayName("Deve marcar como editado via setter")
        void shouldMarkAsEdited() {
            Comment comment = Comment.builder()
                    .titleId("title-1")
                    .userId("user-1")
                    .textContent("Texto original")
                    .build();

            assertThat(comment.isWasEdited()).isFalse();

            comment.setWasEdited(true);
            comment.setTextContent("Texto editado");

            assertThat(comment.isWasEdited()).isTrue();
            assertThat(comment.getTextContent()).isEqualTo("Texto editado");
        }

        @Test
        @DisplayName("Deve marcar como destacado via setter")
        void shouldMarkAsHighlighted() {
            Comment comment = Comment.builder()
                    .titleId("title-1")
                    .userId("user-1")
                    .textContent("Comentário importante")
                    .build();

            assertThat(comment.isHighlighted()).isFalse();
            comment.setHighlighted(true);
            assertThat(comment.isHighlighted()).isTrue();
        }
    }

    @Nested
    @DisplayName("Construtor vazio")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Construtor vazio deve manter todos os campos nulos/default")
        void shouldKeepFieldsNullOnNoArgsConstructor() {
            Comment comment = new Comment();

            assertThat(comment.getId()).isNull();
            assertThat(comment.getTitleId()).isNull();
            assertThat(comment.getParentCommentId()).isNull();
            assertThat(comment.getUserId()).isNull();
            assertThat(comment.getUserName()).isNull();
            assertThat(comment.getUserPhoto()).isNull();
            assertThat(comment.getTextContent()).isNull();
            assertThat(comment.getImageContent()).isNull();
            assertThat(comment.getCreatedAt()).isNull();
        }
    }
}
