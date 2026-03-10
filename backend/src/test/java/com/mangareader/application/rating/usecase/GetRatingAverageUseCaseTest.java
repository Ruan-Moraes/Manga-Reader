package com.mangareader.application.rating.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.rating.port.RatingRepositoryPort;
import com.mangareader.application.rating.usecase.GetRatingAverageUseCase.RatingAverage;
import com.mangareader.domain.rating.entity.MangaRating;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetRatingAverageUseCase")
class GetRatingAverageUseCaseTest {

    @Mock
    private RatingRepositoryPort ratingRepository;

    @InjectMocks
    private GetRatingAverageUseCase getRatingAverageUseCase;

    private final String TITLE_ID = "title-avg-123";

    @Nested
    @DisplayName("Cálculo de média")
    class CalculoMedia {

        @Test
        @DisplayName("Deve calcular média arredondada para uma casa decimal")
        void deveCalcularMediaArredondada() {
            // Arrange
            List<MangaRating> ratings = List.of(
                    MangaRating.builder().stars(4.0).build(),
                    MangaRating.builder().stars(5.0).build(),
                    MangaRating.builder().stars(3.0).build()
            );
            when(ratingRepository.findByTitleId(TITLE_ID)).thenReturn(ratings);

            // Act
            RatingAverage result = getRatingAverageUseCase.execute(TITLE_ID);

            // Assert
            assertThat(result.average()).isEqualTo(4.0);
            assertThat(result.count()).isEqualTo(3);
        }

        @Test
        @DisplayName("Deve arredondar corretamente valores com múltiplas casas decimais")
        void deveArredondarCorretamente() {
            // Arrange — média de (4.5 + 3.7 + 4.2) / 3 = 4.1333... → 4.1
            List<MangaRating> ratings = List.of(
                    MangaRating.builder().stars(4.5).build(),
                    MangaRating.builder().stars(3.7).build(),
                    MangaRating.builder().stars(4.2).build()
            );
            when(ratingRepository.findByTitleId(TITLE_ID)).thenReturn(ratings);

            // Act
            RatingAverage result = getRatingAverageUseCase.execute(TITLE_ID);

            // Assert
            assertThat(result.average()).isEqualTo(4.1);
            assertThat(result.count()).isEqualTo(3);
        }

        @Test
        @DisplayName("Deve retornar média e contagem com uma única avaliação")
        void deveRetornarMediaComUmaAvaliacao() {
            // Arrange
            List<MangaRating> ratings = List.of(
                    MangaRating.builder().stars(4.5).build()
            );
            when(ratingRepository.findByTitleId(TITLE_ID)).thenReturn(ratings);

            // Act
            RatingAverage result = getRatingAverageUseCase.execute(TITLE_ID);

            // Assert
            assertThat(result.average()).isEqualTo(4.5);
            assertThat(result.count()).isEqualTo(1);
        }
    }

    @Nested
    @DisplayName("Título sem avaliações")
    class SemAvaliacoes {

        @Test
        @DisplayName("Deve retornar média 0.0 e contagem 0 quando não há avaliações")
        void deveRetornarZeroQuandoSemAvaliacoes() {
            // Arrange
            when(ratingRepository.findByTitleId(TITLE_ID)).thenReturn(Collections.emptyList());

            // Act
            RatingAverage result = getRatingAverageUseCase.execute(TITLE_ID);

            // Assert
            assertThat(result.average()).isEqualTo(0.0);
            assertThat(result.count()).isEqualTo(0);
        }
    }
}
