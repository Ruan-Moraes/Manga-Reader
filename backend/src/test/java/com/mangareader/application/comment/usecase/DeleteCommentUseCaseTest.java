package com.mangareader.application.comment.usecase;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.comment.port.CommentRepositoryPort;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("DeleteCommentUseCase")
class DeleteCommentUseCaseTest {

    @Mock
    private CommentRepositoryPort commentRepository;

    @InjectMocks
    private DeleteCommentUseCase deleteCommentUseCase;

    private final UUID USER_ID = UUID.randomUUID();
    private final String COMMENT_ID = "comment-abc123";

    @Nested
    @DisplayName("Cenário de sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve excluir comentário quando usuário é o autor")
        void deveExcluirComentarioQuandoUsuarioEAutor() {
            // Arrange
            Comment comment = Comment.builder()
                    .id(COMMENT_ID)
                    .userId(USER_ID.toString())
                    .textContent("Comentário a ser excluído")
                    .build();

            when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(comment));

            // Act
            deleteCommentUseCase.execute(COMMENT_ID, USER_ID);

            // Assert
            verify(commentRepository).deleteById(COMMENT_ID);
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
            assertThatThrownBy(() -> deleteCommentUseCase.execute("inexistente", USER_ID))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Comment");

            verify(commentRepository, never()).deleteById(any());
        }

        @Test
        @DisplayName("Deve lançar BusinessRuleException quando usuário não é o autor")
        void deveLancarExcecaoQuandoUsuarioNaoEAutor() {
            // Arrange
            UUID outroUsuario = UUID.randomUUID();
            Comment comment = Comment.builder()
                    .id(COMMENT_ID)
                    .userId(USER_ID.toString())
                    .build();

            when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(comment));

            // Act & Assert
            assertThatThrownBy(() -> deleteCommentUseCase.execute(COMMENT_ID, outroUsuario))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("próprios comentários")
                    .extracting("statusCode")
                    .isEqualTo(403);

            verify(commentRepository, never()).deleteById(any());
        }
    }
}
