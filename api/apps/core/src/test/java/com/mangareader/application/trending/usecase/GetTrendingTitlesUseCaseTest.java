package com.mangareader.application.trending.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.application.trending.port.TrendingReadPort;
import com.mangareader.application.trending.port.TrendingReadPort.Growth;
import com.mangareader.application.trending.port.TrendingReadPort.Metrics;
import com.mangareader.application.trending.port.TrendingReadPort.Ranking;
import com.mangareader.application.trending.port.TrendingReadPort.TrendView;
import com.mangareader.application.trending.port.TrendingReadPort.Window;
import com.mangareader.domain.manga.entity.Title;

class GetTrendingTitlesUseCaseTest {
    private final TrendingReadPort readPort = mock(TrendingReadPort.class);
    private final TitleRepositoryPort titleRepository = mock(TitleRepositoryPort.class);
    private final GetTrendingTitlesUseCase useCase = new GetTrendingTitlesUseCase(readPort, titleRepository);

    @Test
    void loadsTitlesInBatchPreservesRankingOrderAndDropsOrphans() {
        var trends = List.of(trend("title-2"), trend("missing"), trend("title-1"));
        when(readPort.findLatest(Window.WEEK, Ranking.SCORE, 30)).thenReturn(trends);
        when(titleRepository.findByIds(List.of("title-2", "missing", "title-1")))
                .thenReturn(List.of(title("title-1"), title("title-2")));

        var result = useCase.execute(Window.WEEK, Ranking.SCORE, 30);

        assertThat(result).extracting(view -> view.title().getId())
                .containsExactly("title-2", "title-1");
        verify(titleRepository).findByIds(List.of("title-2", "missing", "title-1"));
    }

    @Test
    void rejectsLimitsOutsideThePublicContract() {
        assertThatThrownBy(() -> useCase.execute(Window.WEEK, Ranking.SCORE, 0))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> useCase.execute(Window.WEEK, Ranking.SCORE, 101))
                .isInstanceOf(IllegalArgumentException.class);
    }

    private static TrendView trend(String titleId) {
        return new TrendView(titleId, 10, 20, new Metrics(1, 2, 3, 4, 5), Growth.EMPTY,
                Instant.parse("2026-07-11T00:00:00Z"));
    }

    private static Title title(String id) {
        return Title.builder().id(id).build();
    }
}
