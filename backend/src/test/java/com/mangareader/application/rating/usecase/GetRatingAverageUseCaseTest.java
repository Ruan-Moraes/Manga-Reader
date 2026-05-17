package com.mangareader.application.rating.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.rating.port.RatingRepositoryPort;
import com.mangareader.application.rating.port.RatingRepositoryPort.RatingAggregate;
import com.mangareader.application.rating.usecase.GetRatingAverageUseCase.RatingAverage;

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
        @DisplayName("Repassa média e contagem da agregação do banco")
        void repassaAgregacao() {
            when(ratingRepository.aggregateByTitleId(TITLE_ID))
                    .thenReturn(new RatingAggregate(4.0, 3));

            RatingAverage result = getRatingAverageUseCase.execute(TITLE_ID);

            assertThat(result.average()).isEqualTo(4.0);
            assertThat(result.count()).isEqualTo(3);
        }

        @Test
        @DisplayName("Arredonda a média da agregação para uma casa decimal")
        void arredondaUmaCasa() {
            when(ratingRepository.aggregateByTitleId(TITLE_ID))
                    .thenReturn(new RatingAggregate(4.133333, 3));

            RatingAverage result = getRatingAverageUseCase.execute(TITLE_ID);

            assertThat(result.average()).isEqualTo(4.1);
            assertThat(result.count()).isEqualTo(3);
        }

        @Test
        @DisplayName("Uma única avaliação")
        void umaAvaliacao() {
            when(ratingRepository.aggregateByTitleId(TITLE_ID))
                    .thenReturn(new RatingAggregate(4.5, 1));

            RatingAverage result = getRatingAverageUseCase.execute(TITLE_ID);

            assertThat(result.average()).isEqualTo(4.5);
            assertThat(result.count()).isEqualTo(1);
        }
    }

    @Nested
    @DisplayName("Título sem avaliações")
    class SemAvaliacoes {

        @Test
        @DisplayName("Retorna 0.0 / 0 quando count da agregação é 0")
        void zeroQuandoSemAvaliacoes() {
            when(ratingRepository.aggregateByTitleId(TITLE_ID))
                    .thenReturn(new RatingAggregate(0.0, 0));

            RatingAverage result = getRatingAverageUseCase.execute(TITLE_ID);

            assertThat(result.average()).isEqualTo(0.0);
            assertThat(result.count()).isEqualTo(0);
        }
    }
}
