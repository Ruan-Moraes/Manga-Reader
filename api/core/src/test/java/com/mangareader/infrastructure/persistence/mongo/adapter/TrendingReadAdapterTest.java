package com.mangareader.infrastructure.persistence.mongo.adapter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.ArgumentCaptor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;

import com.mangareader.application.trending.port.TrendingReadPort.Ranking;
import com.mangareader.application.trending.port.TrendingReadPort.Window;
import com.mangareader.infrastructure.persistence.mongo.adapter.TrendingReadAdapter.MetricsDocument;
import com.mangareader.infrastructure.persistence.mongo.adapter.TrendingReadAdapter.ScoreDocument;
import com.mangareader.infrastructure.persistence.mongo.adapter.TrendingReadAdapter.SnapshotDocument;

class TrendingReadAdapterTest {
    private final MongoTemplate mongo = mock(MongoTemplate.class);
    private final TrendingReadAdapter adapter = new TrendingReadAdapter(mongo);

    @Test
    void mapsLegacySnapshotsWithoutGrowthAndIgnoresIncompleteDocuments() {
        LocalDate date = LocalDate.of(2026, 7, 11);
        var latest = document("latest", date, completeScore());
        var incomplete = new SnapshotDocument("broken", date, Instant.now(), Map.of());
        when(mongo.findOne(any(Query.class), eq(SnapshotDocument.class), eq("title_trend_daily")))
                .thenReturn(latest);
        when(mongo.find(any(Query.class), eq(SnapshotDocument.class), eq("title_trend_daily")))
                .thenReturn(List.of(latest, incomplete));

        var result = adapter.findLatest(Window.WEEK, Ranking.SCORE, 30);

        assertThat(result).singleElement().satisfies(trend -> {
            assertThat(trend.titleId()).isEqualTo("latest");
            assertThat(trend.growth()).isEqualTo(com.mangareader.application.trending.port.TrendingReadPort.Growth.EMPTY);
        });
    }

    @Test
    void returnsEmptyForInvalidLimitOrMissingSnapshot() {
        assertThat(adapter.findLatest(Window.DAY, Ranking.SCORE, 0)).isEmpty();
        when(mongo.findOne(any(Query.class), eq(SnapshotDocument.class), eq("title_trend_daily")))
                .thenReturn(null);
        assertThat(adapter.findLatest(Window.DAY, Ranking.READS, 10)).isEmpty();
    }

    @ParameterizedTest
    @CsvSource({
            "SCORE, scores.WEEK.value",
            "READS, scores.WEEK.metrics.reads",
            "REVIEWS, scores.WEEK.metrics.reviews",
            "LIBRARY_ADDS, scores.WEEK.metrics.libraryAdds"
    })
    void sortsEveryRankingByItsIndexedField(Ranking ranking, String expectedField) {
        LocalDate date = LocalDate.of(2026, 7, 11);
        var latest = document("latest", date, completeScore());
        when(mongo.findOne(any(Query.class), eq(SnapshotDocument.class), eq("title_trend_daily")))
                .thenReturn(latest);
        when(mongo.find(any(Query.class), eq(SnapshotDocument.class), eq("title_trend_daily")))
                .thenReturn(List.of(latest));

        adapter.findLatest(Window.WEEK, ranking, 150);

        var queryCaptor = ArgumentCaptor.forClass(Query.class);
        verify(mongo).find(queryCaptor.capture(), eq(SnapshotDocument.class), eq("title_trend_daily"));
        assertThat(queryCaptor.getValue().getSortObject()).containsEntry(expectedField, -1);
        assertThat(queryCaptor.getValue().getLimit()).isEqualTo(100);
    }

    private static SnapshotDocument document(String id, LocalDate date, ScoreDocument score) {
        return new SnapshotDocument(id, date, Instant.parse("2026-07-11T00:00:00Z"), Map.of("WEEK", score));
    }

    private static ScoreDocument completeScore() {
        return new ScoreDocument(10, 20, new MetricsDocument(1, 2, 3, 4, 5), null);
    }
}
