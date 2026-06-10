package com.mangareader.application.review.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.manga.port.TitleRatingAggregateReadPort;
import com.mangareader.application.manga.port.TitleRatingAggregateReadPort.TitleRatingAggregateView;
import com.mangareader.application.review.port.ReviewRepositoryPort.ReviewDistribution;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetReviewDistributionUseCase")
class GetRatingDistributionUseCaseTest {

    @Mock
    private TitleRatingAggregateReadPort aggregateReadPort;

    @InjectMocks
    private GetReviewDistributionUseCase getRatingDistributionUseCase;

    private static final String TITLE_ID = "title-dist-1";

    @Test
    @DisplayName("Repassa a distribuição por estrela vinda do agregado consolidado")
    void repassaDistribuicao() {
        when(aggregateReadPort.findByTitleId(TITLE_ID))
                .thenReturn(Optional.of(new TitleRatingAggregateView(TITLE_ID, 4.2, 16, 1, 0, 2, 3, 10)));

        ReviewDistribution result = getRatingDistributionUseCase.execute(TITLE_ID);

        assertThat(result.star1()).isEqualTo(1);
        assertThat(result.star3()).isEqualTo(2);
        assertThat(result.star5()).isEqualTo(10);
        assertThat(result.total()).isEqualTo(16);
    }

    @Test
    @DisplayName("Retorna distribuição vazia (todos zero) quando não há agregado")
    void distribuicaoVazia() {
        when(aggregateReadPort.findByTitleId(TITLE_ID)).thenReturn(Optional.empty());

        ReviewDistribution result = getRatingDistributionUseCase.execute(TITLE_ID);

        assertThat(result.total()).isZero();
    }
}
