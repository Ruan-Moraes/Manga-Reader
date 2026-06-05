package com.mangareader.application.rating.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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

import com.mangareader.application.rating.port.RatingRepositoryPort;
import com.mangareader.application.rating.usecase.UpdateRatingUseCase.UpdateRatingInput;
import com.mangareader.application.shared.event.RatingEvent;
import com.mangareader.application.shared.port.EventPublisherPort;
import com.mangareader.domain.rating.entity.MangaRating;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("UpdateRatingUseCase")
class UpdateRatingUseCaseTest {

    @Mock
    private RatingRepositoryPort ratingRepository;

    @Mock
    private EventPublisherPort eventPublisher;

    @InjectMocks
    private UpdateRatingUseCase updateRatingUseCase;

    private final UUID USER_ID = UUID.randomUUID();
    private final String RATING_ID = "rating-123";
    private final String TITLE_ID = "title-abc";

    private MangaRating buildExistingRating() {
        return MangaRating.builder()
                .id(RATING_ID)
                .titleId(TITLE_ID)
                .userId(USER_ID.toString())
                .userName("Ruan Silva")
                .funRating(3.0)
                .artRating(3.0)
                .storylineRating(3.0)
                .charactersRating(3.0)
                .originalityRating(3.0)
                .pacingRating(3.0)
                .overallRating(3.0)
                .comment("Comentário original")
                .build();
    }

    @Nested
    @DisplayName("Atualização parcial (PATCH semântico)")
    class AtualizacaoParcial {

        @Test
        @DisplayName("Deve atualizar apenas funRating quando outros campos são null")
        void deveAtualizarApenasFunRating() {
            // Arrange
            MangaRating existing = buildExistingRating();
            var input = new UpdateRatingInput(RATING_ID, USER_ID, 5.0, null, null, null, null, null, null);
            when(ratingRepository.findById(RATING_ID)).thenReturn(Optional.of(existing));
            when(ratingRepository.save(any(MangaRating.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            MangaRating result = updateRatingUseCase.execute(input);

            // Assert
            assertThat(result.getFunRating()).isEqualTo(5.0);
            assertThat(result.getArtRating()).isEqualTo(3.0);
            assertThat(result.getComment()).isEqualTo("Comentário original");
            // overallRating recalculado: (5+3+3+3+3+3)/6 = 3.3
            assertThat(result.getOverallRating()).isEqualTo(3.3);
        }

        @Test
        @DisplayName("Deve atualizar apenas comment quando outros campos são null")
        void deveAtualizarApenasComment() {
            // Arrange
            MangaRating existing = buildExistingRating();
            var input = new UpdateRatingInput(RATING_ID, USER_ID, null, null, null, null, null, null, "Novo comentário");
            when(ratingRepository.findById(RATING_ID)).thenReturn(Optional.of(existing));
            when(ratingRepository.save(any(MangaRating.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            MangaRating result = updateRatingUseCase.execute(input);

            // Assert
            assertThat(result.getFunRating()).isEqualTo(3.0);
            assertThat(result.getComment()).isEqualTo("Novo comentário");
            assertThat(result.getOverallRating()).isEqualTo(3.0);
        }

        @Test
        @DisplayName("Deve atualizar múltiplas categorias simultaneamente")
        void deveAtualizarMultiplasCategorias() {
            // Arrange
            MangaRating existing = buildExistingRating();
            var input = new UpdateRatingInput(RATING_ID, USER_ID, null, 5.0, null, null, 4.5, null, null);
            when(ratingRepository.findById(RATING_ID)).thenReturn(Optional.of(existing));
            when(ratingRepository.save(any(MangaRating.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            MangaRating result = updateRatingUseCase.execute(input);

            // Assert
            assertThat(result.getArtRating()).isEqualTo(5.0);
            assertThat(result.getOriginalityRating()).isEqualTo(4.5);
            assertThat(result.getFunRating()).isEqualTo(3.0);
            // overallRating recalculado: (3+5+3+3+4.5+3)/6 = 3.6
            assertThat(result.getOverallRating()).isEqualTo(3.6);
        }

        @Test
        @DisplayName("Deve atualizar todos os campos simultaneamente")
        void deveAtualizarTodosCampos() {
            // Arrange
            MangaRating existing = buildExistingRating();
            var input = new UpdateRatingInput(RATING_ID, USER_ID, 5.0, 5.0, 4.0, 4.5, 4.0, 4.5, "Atualizado!");
            when(ratingRepository.findById(RATING_ID)).thenReturn(Optional.of(existing));
            when(ratingRepository.save(any(MangaRating.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            MangaRating result = updateRatingUseCase.execute(input);

            // Assert
            assertThat(result.getFunRating()).isEqualTo(5.0);
            assertThat(result.getArtRating()).isEqualTo(5.0);
            assertThat(result.getStorylineRating()).isEqualTo(4.0);
            assertThat(result.getCharactersRating()).isEqualTo(4.5);
            assertThat(result.getOriginalityRating()).isEqualTo(4.0);
            assertThat(result.getPacingRating()).isEqualTo(4.5);
            assertThat(result.getComment()).isEqualTo("Atualizado!");
            // (5+5+4+4.5+4+4.5)/6 = 4.5
            assertThat(result.getOverallRating()).isEqualTo(4.5);
        }
    }

    @Nested
    @DisplayName("Evento de domínio")
    class Evento {

        @Test
        @DisplayName("Deve publicar evento 'rating.updated' com titleId e userId corretos")
        void devePublicarEventoRatingUpdated() {
            // Arrange
            MangaRating existing = buildExistingRating();
            var input = new UpdateRatingInput(RATING_ID, USER_ID, 5.0, null, null, null, null, null, null);
            when(ratingRepository.findById(RATING_ID)).thenReturn(Optional.of(existing));
            when(ratingRepository.save(any(MangaRating.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            updateRatingUseCase.execute(input);

            // Assert
            ArgumentCaptor<RatingEvent> captor = ArgumentCaptor.forClass(RatingEvent.class);
            verify(eventPublisher).publish(eq("rating.updated"), captor.capture());
            assertThat(captor.getValue().titleId()).isEqualTo(TITLE_ID);
            assertThat(captor.getValue().userId()).isEqualTo(USER_ID.toString());
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando avaliação não existe")
        void deveLancarExcecaoQuandoAvaliacaoNaoExiste() {
            // Arrange
            var input = new UpdateRatingInput(RATING_ID, USER_ID, 4.0, null, null, null, null, null, null);
            when(ratingRepository.findById(RATING_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> updateRatingUseCase.execute(input))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Rating");
        }

        @Test
        @DisplayName("Deve lançar BusinessRuleException 403 quando usuário não é o autor")
        void deveLancarExcecaoQuandoNaoEAutor() {
            // Arrange
            MangaRating existing = buildExistingRating();
            UUID outroUsuario = UUID.randomUUID();
            var input = new UpdateRatingInput(RATING_ID, outroUsuario, 5.0, null, null, null, null, null, null);
            when(ratingRepository.findById(RATING_ID)).thenReturn(Optional.of(existing));

            // Act & Assert
            assertThatThrownBy(() -> updateRatingUseCase.execute(input))
                    .isInstanceOf(BusinessRuleException.class)
                    .satisfies(ex -> assertThat(((BusinessRuleException) ex).getStatusCode()).isEqualTo(403));
        }
    }
}
