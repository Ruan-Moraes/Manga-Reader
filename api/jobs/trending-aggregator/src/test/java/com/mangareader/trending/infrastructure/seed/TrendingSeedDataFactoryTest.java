package com.mangareader.trending.infrastructure.seed;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.mangareader.trending.domain.TrendScoreCalculator;
import com.mangareader.trending.domain.TrendWindow;

class TrendingSeedDataFactoryTest {
    private final TrendingSeedDataFactory factory = new TrendingSeedDataFactory(
            new TrendScoreCalculator(.45, .25, .15, .10, .05));

    @Test
    void createsCompleteDeterministicSnapshotsForRealTitleIds() {
        var now = Instant.parse("2026-07-10T03:15:00Z");
        var result = factory.create(List.of("1", "2"), now);

        assertThat(result).hasSize(2).extracting(snapshot -> snapshot.titleId()).containsExactly("1", "2");
        assertThat(result).allSatisfy(snapshot -> {
            assertThat(snapshot.snapshotDate()).isEqualTo(LocalDate.of(2026, 7, 10));
            assertThat(snapshot.scores()).containsKeys(TrendWindow.DAY, TrendWindow.WEEK, TrendWindow.MONTH);
            assertThat(snapshot.scores().values()).allSatisfy(score -> {
                assertThat(score.value()).isPositive();
                assertThat(score.growthPercent()).isPositive();
            });
        });
    }
}
