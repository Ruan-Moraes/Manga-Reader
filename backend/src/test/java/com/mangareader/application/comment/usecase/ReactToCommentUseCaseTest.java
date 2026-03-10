package com.mangareader.application.comment.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.comment.port.CommentRepositoryPort;
import com.mangareader.application.comment.usecase.ReactToCommentUseCase.ReactionType;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReactToCommentUseCase")
class ReactToCommentUseCaseTest {

    @Mock
    private CommentRepositoryPort commentRepository;

    @InjectMocks
    private ReactToCommentUseCase reactToCommentUseCase;

    private final String COMMENT_ID = "comment-abc123";

    private Comment buildComment(int likes, int dislikes) {
        return Comment.builder()
                .id(COMMENT_ID)
                .textContent("Comentário")
                .likeCount(likes)
                .dislikeCount(dislikes)
                .build();
    }

    @Nested
    @DisplayName("Reação LIKE")
    class Like {

        @Test
        @DisplayName("Deve incrementar likeCount em 1")
        void deveIncrementarLikeCount() {
            // Arrange
            Comment comment = buildComment(5, 2);

            when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(comment));
            when(commentRepository.save(any(Comment.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            Comment result = reactToCommentUseCase.execute(COMMENT_ID, ReactionType.LIKE);

            // Assert
            assertThat(result.getLikeCount()).isEqualTo(6);
            assertThat(result.getDislikeCount()).isEqualTo(2); // não alterado
        }
    }

    @Nested
    @DisplayName("Reação DISLIKE")
    class Dislike {

        @Test
        @DisplayName("Deve incrementar dislikeCount em 1")
        void deveIncrementarDislikeCount() {
            // Arrange
            Comment comment = buildComment(5, 2);

            when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(comment));
            when(commentRepository.save(any(Comment.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            Comment result = reactToCommentUseCase.execute(COMMENT_ID, ReactionType.DISLIKE);

            // Assert
            assertThat(result.getDislikeCount()).isEqualTo(3);
            assertThat(result.getLikeCount()).isEqualTo(5); // não alterado
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando comentário não existe")
        void deveLancarExcecaoQuandoComentarioNaoExiste() {
            // Arrange
            when(commentRepository.findById("inexistente")).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> reactToCommentUseCase.execute("inexistente", ReactionType.LIKE))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Comment");
        }
    }

    @Nested
    @DisplayName("Persistência")
    class Persistencia {

        @Test
        @DisplayName("Deve salvar comentário após incrementar reação")
        void deveSalvarComentarioAposReacao() {
            // Arrange
            Comment comment = buildComment(0, 0);

            when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(comment));
            when(commentRepository.save(any(Comment.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            reactToCommentUseCase.execute(COMMENT_ID, ReactionType.LIKE);

            // Assert
            ArgumentCaptor<Comment> captor = ArgumentCaptor.forClass(Comment.class);
            verify(commentRepository).save(captor.capture());
            assertThat(captor.getValue().getLikeCount()).isEqualTo(1);
        }
    }
}
