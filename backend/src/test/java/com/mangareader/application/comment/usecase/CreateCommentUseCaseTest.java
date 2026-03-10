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
import com.mangareader.application.comment.usecase.CreateCommentUseCase.CreateCommentInput;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.valueobject.UserRole;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("CreateCommentUseCase")
class CreateCommentUseCaseTest {

    @Mock
    private CommentRepositoryPort commentRepository;

    @Mock
    private UserRepositoryPort userRepository;

    @InjectMocks
    private CreateCommentUseCase createCommentUseCase;

    private final UUID USER_ID = UUID.randomUUID();
    private final String TITLE_ID = "title-abc123";

    private User buildUser() {
        return User.builder()
                .id(USER_ID)
                .name("Ruan Silva")
                .email("ruan@email.com")
                .passwordHash("hash")
                .photoUrl("https://example.com/photo.jpg")
                .role(UserRole.MEMBER)
                .build();
    }

    @Nested
    @DisplayName("Comentário raiz (sem parentCommentId)")
    class ComentarioRaiz {

        @Test
        @DisplayName("Deve criar comentário raiz com dados do usuário")
        void deveCriarComentarioRaizComDadosDoUsuario() {
            // Arrange
            CreateCommentInput input = new CreateCommentInput(
                    TITLE_ID, "Ótimo mangá!", null, null, USER_ID
            );
            User user = buildUser();

            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(commentRepository.save(any(Comment.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            Comment result = createCommentUseCase.execute(input);

            // Assert
            assertThat(result.getTitleId()).isEqualTo(TITLE_ID);
            assertThat(result.getTextContent()).isEqualTo("Ótimo mangá!");
            assertThat(result.getUserId()).isEqualTo(USER_ID.toString());
            assertThat(result.getUserName()).isEqualTo("Ruan Silva");
            assertThat(result.getUserPhoto()).isEqualTo("https://example.com/photo.jpg");
            assertThat(result.getParentCommentId()).isNull();
        }

        @Test
        @DisplayName("Deve inicializar contadores e flags com valores padrão")
        void deveInicializarContadoresEFlags() {
            // Arrange
            CreateCommentInput input = new CreateCommentInput(
                    TITLE_ID, "Texto", null, null, USER_ID
            );

            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));
            when(commentRepository.save(any(Comment.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            Comment result = createCommentUseCase.execute(input);

            // Assert
            assertThat(result.getIsHighlighted()).isFalse();
            assertThat(result.getWasEdited()).isFalse();
            assertThat(result.getLikeCount()).isZero();
            assertThat(result.getDislikeCount()).isZero();
        }
    }

    @Nested
    @DisplayName("Resposta (com parentCommentId)")
    class Resposta {

        @Test
        @DisplayName("Deve criar resposta quando comentário pai existe")
        void deveCriarRespostaQuandoComentarioPaiExiste() {
            // Arrange
            String parentId = "parent-comment-id";
            CreateCommentInput input = new CreateCommentInput(
                    TITLE_ID, "Concordo!", null, parentId, USER_ID
            );
            Comment parentComment = Comment.builder().id(parentId).build();

            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));
            when(commentRepository.findById(parentId)).thenReturn(Optional.of(parentComment));
            when(commentRepository.save(any(Comment.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            Comment result = createCommentUseCase.execute(input);

            // Assert
            assertThat(result.getParentCommentId()).isEqualTo(parentId);
            verify(commentRepository).findById(parentId);
        }

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando comentário pai não existe")
        void deveLancarExcecaoQuandoComentarioPaiNaoExiste() {
            // Arrange
            CreateCommentInput input = new CreateCommentInput(
                    TITLE_ID, "Resposta", null, "pai-inexistente", USER_ID
            );

            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));
            when(commentRepository.findById("pai-inexistente")).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> createCommentUseCase.execute(input))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Comment");

            verify(commentRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando usuário não existe")
        void deveLancarExcecaoQuandoUsuarioNaoExiste() {
            // Arrange
            CreateCommentInput input = new CreateCommentInput(
                    TITLE_ID, "Texto", null, null, USER_ID
            );

            when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> createCommentUseCase.execute(input))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");

            verify(commentRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Conteúdo com imagem")
    class ConteudoComImagem {

        @Test
        @DisplayName("Deve criar comentário com texto e imagem")
        void deveCriarComentarioComTextoEImagem() {
            // Arrange
            CreateCommentInput input = new CreateCommentInput(
                    TITLE_ID, "Veja esta cena!", "https://example.com/img.png", null, USER_ID
            );

            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));
            when(commentRepository.save(any(Comment.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            Comment result = createCommentUseCase.execute(input);

            // Assert
            assertThat(result.getTextContent()).isEqualTo("Veja esta cena!");
            assertThat(result.getImageContent()).isEqualTo("https://example.com/img.png");
        }
    }
}
