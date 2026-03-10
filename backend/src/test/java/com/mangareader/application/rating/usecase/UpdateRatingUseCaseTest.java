package com.mangareader.application.rating.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Map;
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
                .stars(3.0)
                .comment("Comentário original")
                .categoryRatings(new java.util.HashMap<>(Map.of("art", 3.0)))
                .build();
    }

    @Nested
    @DisplayName("Atualização parcial (PATCH semântico)")
    class AtualizacaoParcial {

        @Test
        @DisplayName("Deve atualizar apenas stars quando outros campos são null")
        void deveAtualizarApenasStars() {
            // Arrange
            MangaRating existing = buildExistingRating();
            var input = new UpdateRatingInput(RATING_ID, USER_ID, 5.0, null, null);
            when(ratingRepository.findById(RATING_ID)).thenReturn(Optional.of(existing));
            when(ratingRepository.save(any(MangaRating.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            MangaRating result = updateRatingUseCase.execute(input);

            // Assert
            assertThat(result.getStars()).isEqualTo(5.0);
            assertThat(result.getComment()).isEqualTo("Comentário original");
            assertThat(result.getCategoryRatings()).containsEntry("art", 3.0);
        }

        @Test
        @DisplayName("Deve atualizar apenas comment quando outros campos são null")
        void deveAtualizarApenasComment() {
            // Arrange
            MangaRating existing = buildExistingRating();
            var input = new UpdateRatingInput(RATING_ID, USER_ID, null, "Novo comentário", null);
            when(ratingRepository.findById(RATING_ID)).thenReturn(Optional.of(existing));
            when(ratingRepository.save(any(MangaRating.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            MangaRating result = updateRatingUseCase.execute(input);

            // Assert
            assertThat(result.getStars()).isEqualTo(3.0);
            assertThat(result.getComment()).isEqualTo("Novo comentário");
        }

        @Test
        @DisplayName("Deve atualizar categoryRatings quando fornecido")
        void deveAtualizarCategoryRatings() {
            // Arrange
            MangaRating existing = buildExistingRating();
            Map<String, Double> newCategories = Map.of("fun", 5.0, "storyline", 4.5);
            var input = new UpdateRatingInput(RATING_ID, USER_ID, null, null, newCategories);
            when(ratingRepository.findById(RATING_ID)).thenReturn(Optional.of(existing));
            when(ratingRepository.save(any(MangaRating.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            MangaRating result = updateRatingUseCase.execute(input);

            // Assert
            assertThat(result.getCategoryRatings()).containsEntry("fun", 5.0).containsEntry("storyline", 4.5);
        }

        @Test
        @DisplayName("Deve atualizar todos os campos simultaneamente")
        void deveAtualizarTodosCampos() {
            // Arrange
            MangaRating existing = buildExistingRating();
            var input = new UpdateRatingInput(RATING_ID, USER_ID, 4.5, "Atualizado!", Map.of("art", 5.0));
            when(ratingRepository.findById(RATING_ID)).thenReturn(Optional.of(existing));
            when(ratingRepository.save(any(MangaRating.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            MangaRating result = updateRatingUseCase.execute(input);

            // Assert
            assertThat(result.getStars()).isEqualTo(4.5);
            assertThat(result.getComment()).isEqualTo("Atualizado!");
            assertThat(result.getCategoryRatings()).containsEntry("art", 5.0);
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
            var input = new UpdateRatingInput(RATING_ID, USER_ID, 5.0, null, null);
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
            var input = new UpdateRatingInput(RATING_ID, USER_ID, 4.0, null, null);
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
            var input = new UpdateRatingInput(RATING_ID, outroUsuario, 5.0, null, null);
            when(ratingRepository.findById(RATING_ID)).thenReturn(Optional.of(existing));

            // Act & Assert
            assertThatThrownBy(() -> updateRatingUseCase.execute(input))
                    .isInstanceOf(BusinessRuleException.class)
                    .satisfies(ex -> assertThat(((BusinessRuleException) ex).getStatusCode()).isEqualTo(403));
        }
    }
}
