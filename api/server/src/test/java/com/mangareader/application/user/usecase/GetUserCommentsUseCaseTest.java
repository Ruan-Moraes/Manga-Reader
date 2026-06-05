package com.mangareader.application.user.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.mangareader.application.comment.port.CommentRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.valueobject.VisibilitySetting;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetUserCommentsUseCase")
class GetUserCommentsUseCaseTest {

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private CommentRepositoryPort commentRepository;

    @InjectMocks
    private GetUserCommentsUseCase getUserCommentsUseCase;

    private final UUID USER_ID = UUID.randomUUID();
    private final Pageable PAGEABLE = PageRequest.of(0, 10);

    private User buildUser(VisibilitySetting commentVis) {
        return User.builder()
                .id(USER_ID)
                .name("Ruan Silva")
                .email("ruan@email.com")
                .passwordHash("hash")
                .commentVisibility(commentVis)
                .build();
    }

    @Nested
    @DisplayName("Dono do perfil")
    class Dono {

        @Test
        @DisplayName("Deve retornar comentários quando é o dono, mesmo com visibilidade PRIVATE")
        void deveRetornarComentariosQuandoDono() {
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser(VisibilitySetting.PRIVATE)));

            Comment comment = Comment.builder().id("c1").titleId("t1").textContent("Ótimo!").build();
            when(commentRepository.findByUserId(eq(USER_ID.toString()), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(comment)));

            Page<Comment> result = getUserCommentsUseCase.execute(USER_ID, USER_ID, PAGEABLE);

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().getFirst().getTextContent()).isEqualTo("Ótimo!");
        }
    }

    @Nested
    @DisplayName("Visitante")
    class Visitante {

        @Test
        @DisplayName("Deve retornar comentários quando visibilidade é PUBLIC")
        void deveRetornarComentariosQuandoPublic() {
            UUID viewerId = UUID.randomUUID();
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser(VisibilitySetting.PUBLIC)));

            Comment comment = Comment.builder().id("c1").titleId("t1").textContent("Bom!").build();
            when(commentRepository.findByUserId(eq(USER_ID.toString()), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(comment)));

            Page<Comment> result = getUserCommentsUseCase.execute(USER_ID, viewerId, PAGEABLE);

            assertThat(result.getContent()).hasSize(1);
        }

        @Test
        @DisplayName("Deve retornar página vazia quando visibilidade é PRIVATE")
        void deveRetornarVazioQuandoPrivate() {
            UUID viewerId = UUID.randomUUID();
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser(VisibilitySetting.PRIVATE)));

            Page<Comment> result = getUserCommentsUseCase.execute(USER_ID, viewerId, PAGEABLE);

            assertThat(result.getContent()).isEmpty();
            verify(commentRepository, never()).findByUserId(any(), any(Pageable.class));
        }

        @Test
        @DisplayName("Deve retornar página vazia quando visibilidade é DO_NOT_TRACK")
        void deveRetornarVazioQuandoDoNotTrack() {
            UUID viewerId = UUID.randomUUID();
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser(VisibilitySetting.DO_NOT_TRACK)));

            Page<Comment> result = getUserCommentsUseCase.execute(USER_ID, viewerId, PAGEABLE);

            assertThat(result.getContent()).isEmpty();
        }

        @Test
        @DisplayName("Deve retornar página vazia quando viewer é null e visibilidade é PRIVATE")
        void deveRetornarVazioQuandoViewerNull() {
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser(VisibilitySetting.PRIVATE)));

            Page<Comment> result = getUserCommentsUseCase.execute(USER_ID, null, PAGEABLE);

            assertThat(result.getContent()).isEmpty();
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando usuário não existe")
        void deveLancarExcecaoQuandoUsuarioNaoExiste() {
            when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> getUserCommentsUseCase.execute(USER_ID, null, PAGEABLE))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");
        }
    }
}
