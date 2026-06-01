package com.mangareader.application.rating.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.rating.port.RatingRepositoryPort;
import com.mangareader.application.rating.port.RatingRepositoryPort.RatingDistribution;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetRatingDistributionUseCase")
class GetRatingDistributionUseCaseTest {

    @Mock
    private RatingRepositoryPort ratingRepository;

    @InjectMocks
    private GetRatingDistributionUseCase getRatingDistributionUseCase;

    private static final String TITLE_ID = "title-dist-1";

    @Test
    @DisplayName("Repassa a distribuição por estrela vinda da agregação do banco")
    void repassaDistribuicao() {
        when(ratingRepository.distributionByTitleId(TITLE_ID))
                .thenReturn(new RatingDistribution(1, 0, 2, 3, 10));

        RatingDistribution result = getRatingDistributionUseCase.execute(TITLE_ID);

        assertThat(result.star1()).isEqualTo(1);
        assertThat(result.star3()).isEqualTo(2);
        assertThat(result.star5()).isEqualTo(10);
        assertThat(result.total()).isEqualTo(16);
    }

    @Test
    @DisplayName("Retorna distribuição vazia (todos zero) quando não há avaliações")
    void distribuicaoVazia() {
        when(ratingRepository.distributionByTitleId(TITLE_ID))
                .thenReturn(RatingDistribution.empty());

        RatingDistribution result = getRatingDistributionUseCase.execute(TITLE_ID);

        assertThat(result.total()).isZero();
    }
}
