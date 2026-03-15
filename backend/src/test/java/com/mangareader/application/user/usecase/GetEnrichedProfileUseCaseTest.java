package com.mangareader.application.user.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
import org.springframework.data.domain.Pageable;

import com.mangareader.application.comment.port.CommentRepositoryPort;
import com.mangareader.application.library.port.LibraryRepositoryPort;
import com.mangareader.application.rating.port.RatingRepositoryPort;
import com.mangareader.application.user.port.RecommendationRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.application.user.port.ViewHistoryRepositoryPort;
import com.mangareader.application.user.usecase.GetEnrichedProfileUseCase.EnrichedProfile;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.domain.library.valueobject.ReadingListType;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.entity.ViewHistory;
import com.mangareader.domain.user.valueobject.UserRole;
import com.mangareader.domain.user.valueobject.VisibilitySetting;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetEnrichedProfileUseCase")
class GetEnrichedProfileUseCaseTest {

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private CommentRepositoryPort commentRepository;

    @Mock
    private RatingRepositoryPort ratingRepository;

    @Mock
    private LibraryRepositoryPort libraryRepository;

    @Mock
    private RecommendationRepositoryPort recommendationRepository;

    @Mock
    private ViewHistoryRepositoryPort viewHistoryRepository;

    @InjectMocks
    private GetEnrichedProfileUseCase getEnrichedProfileUseCase;

    private final UUID USER_ID = UUID.randomUUID();
    private final UUID VIEWER_ID = UUID.randomUUID();

    private User buildUser(VisibilitySetting commentVis, VisibilitySetting historyVis) {
        return User.builder()
                .id(USER_ID)
                .name("Ruan Silva")
                .email("ruan@email.com")
                .passwordHash("hash")
                .role(UserRole.MEMBER)
                .commentVisibility(commentVis)
                .viewHistoryVisibility(historyVis)
                .build();
    }

    private void stubStats() {
        when(commentRepository.countByUserId(USER_ID.toString())).thenReturn(5L);
        when(ratingRepository.countByUserId(USER_ID.toString())).thenReturn(3L);
        when(libraryRepository.countByUserIdAndList(eq(USER_ID), any(ReadingListType.class))).thenReturn(2L);
        when(recommendationRepository.findByUserIdOrderByPosition(USER_ID)).thenReturn(List.of());
    }

    @Nested
    @DisplayName("Dono do perfil")
    class DonoDoPerfi {

        @Test
        @DisplayName("Deve retornar tudo (comentários + histórico) quando é o dono")
        void deveRetornarTudoQuandoEhDono() {
            User user = buildUser(VisibilitySetting.PRIVATE, VisibilitySetting.PRIVATE);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            stubStats();

            Comment comment = Comment.builder().id("c1").titleId("t1").textContent("Ótimo!").build();
            when(commentRepository.findByUserId(eq(USER_ID.toString()), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(comment)));

            ViewHistory vh = ViewHistory.builder().titleId("t1").titleName("One Piece").build();
            when(viewHistoryRepository.findByUserIdOrderByViewedAtDesc(eq(USER_ID.toString()), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(vh)));

            EnrichedProfile result = getEnrichedProfileUseCase.execute(USER_ID, USER_ID);

            assertThat(result.isOwner()).isTrue();
            assertThat(result.recentComments()).isNotNull().hasSize(1);
            assertThat(result.recentHistory()).isNotNull().hasSize(1);
        }
    }

    @Nested
    @DisplayName("Visitante")
    class Visitante {

        @Test
        @DisplayName("Deve retornar comentários quando visibilidade é PUBLIC")
        void deveRetornarComentariosQuandoPublic() {
            User user = buildUser(VisibilitySetting.PUBLIC, VisibilitySetting.PUBLIC);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            stubStats();

            Comment comment = Comment.builder().id("c1").titleId("t1").textContent("Bom!").build();
            when(commentRepository.findByUserId(eq(USER_ID.toString()), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(comment)));
            when(viewHistoryRepository.findByUserIdOrderByViewedAtDesc(eq(USER_ID.toString()), any(Pageable.class)))
                    .thenReturn(Page.empty());

            EnrichedProfile result = getEnrichedProfileUseCase.execute(USER_ID, VIEWER_ID);

            assertThat(result.isOwner()).isFalse();
            assertThat(result.recentComments()).isNotNull().hasSize(1);
        }

        @Test
        @DisplayName("Deve retornar null para comentários quando visibilidade é PRIVATE")
        void deveRetornarNullComentariosQuandoPrivate() {
            User user = buildUser(VisibilitySetting.PRIVATE, VisibilitySetting.PUBLIC);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            stubStats();
            when(viewHistoryRepository.findByUserIdOrderByViewedAtDesc(eq(USER_ID.toString()), any(Pageable.class)))
                    .thenReturn(Page.empty());

            EnrichedProfile result = getEnrichedProfileUseCase.execute(USER_ID, VIEWER_ID);

            assertThat(result.recentComments()).isNull();
        }

        @Test
        @DisplayName("Deve retornar null para histórico quando visibilidade é DO_NOT_TRACK")
        void deveRetornarNullHistoricoQuandoDoNotTrack() {
            User user = buildUser(VisibilitySetting.PUBLIC, VisibilitySetting.DO_NOT_TRACK);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            stubStats();

            Comment comment = Comment.builder().id("c1").titleId("t1").textContent("Ok").build();
            when(commentRepository.findByUserId(eq(USER_ID.toString()), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(comment)));

            EnrichedProfile result = getEnrichedProfileUseCase.execute(USER_ID, VIEWER_ID);

            assertThat(result.recentHistory()).isNull();
        }

        @Test
        @DisplayName("Deve retornar null para histórico quando visibilidade é PRIVATE")
        void deveRetornarNullHistoricoQuandoPrivate() {
            User user = buildUser(VisibilitySetting.PUBLIC, VisibilitySetting.PRIVATE);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            stubStats();

            when(commentRepository.findByUserId(eq(USER_ID.toString()), any(Pageable.class)))
                    .thenReturn(Page.empty());

            EnrichedProfile result = getEnrichedProfileUseCase.execute(USER_ID, VIEWER_ID);

            assertThat(result.recentHistory()).isNull();
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando usuário não existe")
        void deveLancarExcecaoQuandoUsuarioNaoExiste() {
            UUID unknownId = UUID.randomUUID();
            when(userRepository.findById(unknownId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> getEnrichedProfileUseCase.execute(unknownId, VIEWER_ID))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");
        }
    }

    @Nested
    @DisplayName("Estatísticas")
    class Estatisticas {

        @Test
        @DisplayName("Deve calcular estatísticas corretamente")
        void deveCalcularEstatisticasCorretamente() {
            User user = buildUser(VisibilitySetting.PUBLIC, VisibilitySetting.PUBLIC);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

            when(commentRepository.countByUserId(USER_ID.toString())).thenReturn(10L);
            when(ratingRepository.countByUserId(USER_ID.toString())).thenReturn(5L);
            when(libraryRepository.countByUserIdAndList(USER_ID, ReadingListType.LENDO)).thenReturn(3L);
            when(libraryRepository.countByUserIdAndList(USER_ID, ReadingListType.QUERO_LER)).thenReturn(7L);
            when(libraryRepository.countByUserIdAndList(USER_ID, ReadingListType.CONCLUIDO)).thenReturn(2L);
            when(recommendationRepository.findByUserIdOrderByPosition(USER_ID)).thenReturn(List.of());
            when(commentRepository.findByUserId(eq(USER_ID.toString()), any(Pageable.class)))
                    .thenReturn(Page.empty());
            when(viewHistoryRepository.findByUserIdOrderByViewedAtDesc(eq(USER_ID.toString()), any(Pageable.class)))
                    .thenReturn(Page.empty());

            EnrichedProfile result = getEnrichedProfileUseCase.execute(USER_ID, USER_ID);

            assertThat(result.stats().commentsCount()).isEqualTo(10L);
            assertThat(result.stats().ratingsCount()).isEqualTo(5L);
            assertThat(result.stats().lendo()).isEqualTo(3L);
            assertThat(result.stats().queroLer()).isEqualTo(7L);
            assertThat(result.stats().concluido()).isEqualTo(2L);
            assertThat(result.stats().libraryTotal()).isEqualTo(12L);
        }
    }
}
