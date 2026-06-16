package com.mangareader.aggregator.scheduling;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.aggregator.application.RecalculateTitleRatingUseCase;
import com.mangareader.aggregator.infrastructure.repository.RatingAggregationDao;

@ExtendWith(MockitoExtension.class)
@DisplayName("TitleRatingReconciliationJob")
class TitleRatingReconciliationJobTest {
    @Mock private RatingAggregationDao ratingAggregationDao;
    @Mock private RecalculateTitleRatingUseCase recalculateTitleRating;
    @InjectMocks private TitleRatingReconciliationJob job;

    @Test
    @DisplayName("Deve recalcular cada título avaliado e retornar a contagem")
    void deveReconciliarTodosOsTitulos() {
        when(ratingAggregationDao.distinctRatedTitleIds()).thenReturn(List.of("t1", "t2", "t3"));

        int count = job.reconcile();

        assertThat(count).isEqualTo(3);
        verify(recalculateTitleRating).execute("t1");
        verify(recalculateTitleRating).execute("t2");
        verify(recalculateTitleRating).execute("t3");
    }
}
