package com.mangareader.application.rating.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
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
import com.mangareader.application.shared.event.RatingEvent;
import com.mangareader.application.shared.port.EventPublisherPort;
import com.mangareader.domain.rating.entity.MangaRating;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("DeleteRatingUseCase")
class DeleteRatingUseCaseTest {

    @Mock
    private RatingRepositoryPort ratingRepository;

    @Mock
    private EventPublisherPort eventPublisher;

    @InjectMocks
    private DeleteRatingUseCase deleteRatingUseCase;

    private final UUID USER_ID = UUID.randomUUID();
    private final String RATING_ID = "rating-del-123";
    private final String TITLE_ID = "title-xyz";

    private MangaRating buildRating() {
        return MangaRating.builder()
                .id(RATING_ID)
                .titleId(TITLE_ID)
                .userId(USER_ID.toString())
                .userName("Ruan Silva")
                .overallRating(4.0)
                .build();
    }

    @Nested
    @DisplayName("Exclusão com sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve excluir avaliação quando usuário é o autor")
        void deveExcluirAvaliacaoDoAutor() {
            // Arrange
            when(ratingRepository.findById(RATING_ID)).thenReturn(Optional.of(buildRating()));

            // Act
            deleteRatingUseCase.execute(RATING_ID, USER_ID);

            // Assert
            verify(ratingRepository).deleteById(RATING_ID);
        }

        @Test
        @DisplayName("Deve publicar evento 'rating.deleted' após exclusão")
        void devePublicarEventoAposExclusao() {
            // Arrange
            when(ratingRepository.findById(RATING_ID)).thenReturn(Optional.of(buildRating()));

            // Act
            deleteRatingUseCase.execute(RATING_ID, USER_ID);

            // Assert
            ArgumentCaptor<RatingEvent> captor = ArgumentCaptor.forClass(RatingEvent.class);
            verify(eventPublisher).publish(eq("rating.deleted"), captor.capture());
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
            when(ratingRepository.findById(RATING_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> deleteRatingUseCase.execute(RATING_ID, USER_ID))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Rating");
        }

        @Test
        @DisplayName("Deve lançar BusinessRuleException 403 quando usuário não é o autor")
        void deveLancarExcecaoQuandoNaoEAutor() {
            // Arrange
            when(ratingRepository.findById(RATING_ID)).thenReturn(Optional.of(buildRating()));
            UUID outroUsuario = UUID.randomUUID();

            // Act & Assert
            assertThatThrownBy(() -> deleteRatingUseCase.execute(RATING_ID, outroUsuario))
                    .isInstanceOf(BusinessRuleException.class)
                    .satisfies(ex -> assertThat(((BusinessRuleException) ex).getStatusCode()).isEqualTo(403));
        }
    }
}
