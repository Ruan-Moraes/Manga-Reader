package com.mangareader.application.comment.usecase;

import static org.assertj.core.api.Assertions.assertThat;
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
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.comment.port.CommentRepositoryPort;
import com.mangareader.application.comment.usecase.UpdateCommentUseCase.UpdateCommentInput;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("UpdateCommentUseCase")
class UpdateCommentUseCaseTest {

    @Mock
    private CommentRepositoryPort commentRepository;

    @InjectMocks
    private UpdateCommentUseCase updateCommentUseCase;

    private final UUID USER_ID = UUID.randomUUID();
    private final String COMMENT_ID = "comment-abc123";

    private Comment buildComment() {
        return Comment.builder()
                .id(COMMENT_ID)
                .titleId("title-1")
                .userId(USER_ID.toString())
                .userName("Ruan Silva")
                .textContent("Texto original")
                .wasEdited(false)
                .build();
    }

    @Nested
    @DisplayName("Cenário de sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve atualizar texto do comentário e marcar como editado")
        void deveAtualizarTextoEMarcarComoEditado() {
            // Arrange
            UpdateCommentInput input = new UpdateCommentInput(COMMENT_ID, "Texto atualizado", USER_ID);
            Comment comment = buildComment();

            when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(comment));
            when(commentRepository.save(any(Comment.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            Comment result = updateCommentUseCase.execute(input);

            // Assert
            assertThat(result.getTextContent()).isEqualTo("Texto atualizado");
            assertThat(result.isWasEdited()).isTrue();
        }

        @Test
        @DisplayName("Deve persistir alterações no repositório")
        void devePersistirAlteracoesNoRepositorio() {
            // Arrange
            UpdateCommentInput input = new UpdateCommentInput(COMMENT_ID, "Novo texto", USER_ID);

            when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(buildComment()));
            when(commentRepository.save(any(Comment.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            updateCommentUseCase.execute(input);

            // Assert
            ArgumentCaptor<Comment> captor = ArgumentCaptor.forClass(Comment.class);
            verify(commentRepository).save(captor.capture());
            assertThat(captor.getValue().getTextContent()).isEqualTo("Novo texto");
            assertThat(captor.getValue().isWasEdited()).isTrue();
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando comentário não existe")
        void deveLancarExcecaoQuandoComentarioNaoExiste() {
            // Arrange
            UpdateCommentInput input = new UpdateCommentInput("inexistente", "Texto", USER_ID);

            when(commentRepository.findById("inexistente")).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> updateCommentUseCase.execute(input))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Comment");

            verify(commentRepository, never()).save(any());
        }

        @Test
        @DisplayName("Deve lançar BusinessRuleException quando usuário não é o autor")
        void deveLancarExcecaoQuandoUsuarioNaoEAutor() {
            // Arrange
            UUID outroUsuario = UUID.randomUUID();
            UpdateCommentInput input = new UpdateCommentInput(COMMENT_ID, "Tentativa", outroUsuario);
            Comment comment = buildComment(); // userId = USER_ID, diferente de outroUsuario

            when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(comment));

            // Act & Assert
            assertThatThrownBy(() -> updateCommentUseCase.execute(input))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("próprios comentários")
                    .extracting("statusCode")
                    .isEqualTo(403);

            verify(commentRepository, never()).save(any());
        }
    }
}
