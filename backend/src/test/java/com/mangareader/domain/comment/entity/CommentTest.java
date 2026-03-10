package com.mangareader.domain.comment.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

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

            assertFalse(comment.isHighlighted());
            assertFalse(comment.isWasEdited());
            assertEquals(0, comment.getLikeCount());
            assertEquals(0, comment.getDislikeCount());
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

            assertEquals("comment-abc", comment.getId());
            assertEquals("title-1", comment.getTitleId());
            assertEquals("parent-xyz", comment.getParentCommentId());
            assertEquals("user-1", comment.getUserId());
            assertEquals("Maria", comment.getUserName());
            assertEquals("https://example.com/photo.jpg", comment.getUserPhoto());
            assertEquals(true, comment.isHighlighted());
            assertEquals(true, comment.isWasEdited());
            assertEquals("Texto do comentário", comment.getTextContent());
            assertEquals("https://example.com/img.png", comment.getImageContent());
            assertEquals(15, comment.getLikeCount());
            assertEquals(3, comment.getDislikeCount());
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

            assertNull(root.getParentCommentId());
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

            assertNotNull(reply.getParentCommentId());
            assertEquals("comment-root", reply.getParentCommentId());
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
            assertEquals(1, comment.getLikeCount());

            comment.setDislikeCount(comment.getDislikeCount() + 1);
            assertEquals(1, comment.getDislikeCount());
        }

        @Test
        @DisplayName("Deve marcar como editado via setter")
        void shouldMarkAsEdited() {
            Comment comment = Comment.builder()
                    .titleId("title-1")
                    .userId("user-1")
                    .textContent("Texto original")
                    .build();

            assertFalse(comment.isWasEdited());

            comment.setWasEdited(true);
            comment.setTextContent("Texto editado");

            assertEquals(true, comment.isWasEdited());
            assertEquals("Texto editado", comment.getTextContent());
        }

        @Test
        @DisplayName("Deve marcar como destacado via setter")
        void shouldMarkAsHighlighted() {
            Comment comment = Comment.builder()
                    .titleId("title-1")
                    .userId("user-1")
                    .textContent("Comentário importante")
                    .build();

            assertFalse(comment.isHighlighted());
            comment.setHighlighted(true);
            assertEquals(true, comment.isHighlighted());
        }
    }

    @Nested
    @DisplayName("Construtor vazio")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Construtor vazio deve manter todos os campos nulos/default")
        void shouldKeepFieldsNullOnNoArgsConstructor() {
            Comment comment = new Comment();

            assertNull(comment.getId());
            assertNull(comment.getTitleId());
            assertNull(comment.getParentCommentId());
            assertNull(comment.getUserId());
            assertNull(comment.getUserName());
            assertNull(comment.getUserPhoto());
            assertNull(comment.getTextContent());
            assertNull(comment.getImageContent());
            assertNull(comment.getCreatedAt());
        }
    }
}
