package com.mangareader.application.rating.usecase;

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
import com.mangareader.application.rating.usecase.GetRatingAverageUseCase.RatingAverage;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetRatingAverageUseCase")
class GetRatingAverageUseCaseTest {

    @Mock
    private TitleRatingAggregateReadPort aggregateReadPort;

    @InjectMocks
    private GetRatingAverageUseCase getRatingAverageUseCase;

    private static final String TITLE_ID = "title-avg-123";

    @Test
    @DisplayName("Repassa média e contagem do agregado consolidado")
    void repassaAgregado() {
        when(aggregateReadPort.findByTitleId(TITLE_ID))
                .thenReturn(Optional.of(new TitleRatingAggregateView(TITLE_ID, 4.1, 3, 0, 0, 1, 1, 1)));

        RatingAverage result = getRatingAverageUseCase.execute(TITLE_ID);

        assertThat(result.average()).isEqualTo(4.1);
        assertThat(result.count()).isEqualTo(3);
    }

    @Test
    @DisplayName("Retorna 0.0 / 0 quando o título ainda não tem agregado")
    void zeroQuandoSemAgregado() {
        when(aggregateReadPort.findByTitleId(TITLE_ID)).thenReturn(Optional.empty());

        RatingAverage result = getRatingAverageUseCase.execute(TITLE_ID);

        assertThat(result.average()).isEqualTo(0.0);
        assertThat(result.count()).isEqualTo(0);
    }
}
