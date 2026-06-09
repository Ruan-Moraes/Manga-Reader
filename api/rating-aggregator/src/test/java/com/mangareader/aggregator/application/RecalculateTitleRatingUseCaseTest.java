package com.mangareader.aggregator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.aggregator.domain.TitleRatingAggregate;
import com.mangareader.aggregator.infrastructure.repository.RatingAggregationDao;
import com.mangareader.aggregator.infrastructure.repository.RatingAggregationDao.RatingStats;
import com.mangareader.aggregator.infrastructure.repository.TitleRatingAggregateRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("RecalculateTitleRatingUseCase")
class RecalculateTitleRatingUseCaseTest {
    @Mock private RatingAggregationDao ratingAggregationDao;
    @Mock private TitleRatingAggregateRepository aggregateRepository;
    @InjectMocks private RecalculateTitleRatingUseCase useCase;

    @Test
    @DisplayName("Deve persistir média (1 casa), contagem e distribuição quando há avaliações")
    void devePersistirAgregadoComAvaliacoes() {
        when(ratingAggregationDao.aggregate("t1"))
                .thenReturn(new RatingStats(4.266, 7, 0, 1, 1, 2, 3));
        when(aggregateRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        useCase.execute("t1");

        ArgumentCaptor<TitleRatingAggregate> captor = ArgumentCaptor.forClass(TitleRatingAggregate.class);
        org.mockito.Mockito.verify(aggregateRepository).save(captor.capture());

        TitleRatingAggregate saved = captor.getValue();
        assertThat(saved.getTitleId()).isEqualTo("t1");
        assertThat(saved.getRatingAverage()).isEqualTo(4.3);
        assertThat(saved.getTotalRatings()).isEqualTo(7);
        assertThat(saved.getStar4()).isEqualTo(2);
        assertThat(saved.getStar5()).isEqualTo(3);
        assertThat(saved.getUpdatedAt()).isNotNull();
    }

    @Test
    @DisplayName("Deve gravar agregado zerado quando não há avaliações")
    void deveZerarSemAvaliacoes() {
        when(ratingAggregationDao.aggregate("t2")).thenReturn(RatingStats.empty());
        when(aggregateRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        useCase.execute("t2");

        ArgumentCaptor<TitleRatingAggregate> captor = ArgumentCaptor.forClass(TitleRatingAggregate.class);
        org.mockito.Mockito.verify(aggregateRepository).save(captor.capture());

        TitleRatingAggregate saved = captor.getValue();
        assertThat(saved.getRatingAverage()).isZero();
        assertThat(saved.getTotalRatings()).isZero();
    }
}
