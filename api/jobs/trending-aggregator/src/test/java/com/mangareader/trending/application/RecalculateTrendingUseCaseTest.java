package com.mangareader.trending.application;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.mangareader.trending.application.port.TrendSignalPort;
import com.mangareader.trending.application.port.TrendSnapshotPort;
import com.mangareader.trending.domain.TrendMetrics;
import com.mangareader.trending.domain.TrendScoreCalculator;
import com.mangareader.trending.domain.TrendSnapshot;

class RecalculateTrendingUseCaseTest {
    private static final Instant NOW = Instant.parse("2026-07-11T06:15:00Z");

    @Test
    void readsAdjacentCompleteUtcWindowsAndReplacesDailySnapshots() {
        var signals = new RecordingSignals();
        var snapshots = new RecordingSnapshots();
        var useCase = useCase(signals, snapshots);

        assertThat(useCase.execute()).isEqualTo(1);
        assertThat(signals.ranges).containsExactly(
                new Range(LocalDateTime.parse("2026-07-10T00:00:00"), LocalDateTime.parse("2026-07-11T00:00:00")),
                new Range(LocalDateTime.parse("2026-07-09T00:00:00"), LocalDateTime.parse("2026-07-10T00:00:00")),
                new Range(LocalDateTime.parse("2026-07-04T00:00:00"), LocalDateTime.parse("2026-07-11T00:00:00")),
                new Range(LocalDateTime.parse("2026-06-27T00:00:00"), LocalDateTime.parse("2026-07-04T00:00:00")),
                new Range(LocalDateTime.parse("2026-06-11T00:00:00"), LocalDateTime.parse("2026-07-11T00:00:00")),
                new Range(LocalDateTime.parse("2026-05-12T00:00:00"), LocalDateTime.parse("2026-06-11T00:00:00")));
        assertThat(snapshots.date).isEqualTo(LocalDate.of(2026, 7, 11));
        assertThat(snapshots.saved).singleElement().satisfies(snapshot -> {
            assertThat(snapshot.calculatedAt()).isEqualTo(NOW);
            assertThat(snapshot.scores()).hasSize(3);
        });
    }

    @Test
    void rerunUsesTheSameDeterministicSnapshotId() {
        var signals = new RecordingSignals();
        var snapshots = new RecordingSnapshots();
        var useCase = useCase(signals, snapshots);

        useCase.execute();
        String firstId = snapshots.saved.getFirst().id();
        useCase.execute();

        assertThat(snapshots.saved.getFirst().id()).isEqualTo(firstId).isEqualTo("title-1:2026-07-11");
    }

    private static RecalculateTrendingUseCase useCase(TrendSignalPort signals, TrendSnapshotPort snapshots) {
        return new RecalculateTrendingUseCase(signals, snapshots,
                new TrendScoreCalculator(.45, .25, .15, .10, .05),
                Clock.fixed(NOW, ZoneOffset.UTC));
    }

    private record Range(LocalDateTime from, LocalDateTime to) {}

    private static final class RecordingSignals implements TrendSignalPort {
        private final List<Range> ranges = new ArrayList<>();

        @Override
        public Map<String, TrendMetrics> read(LocalDateTime from, LocalDateTime to) {
            ranges.add(new Range(from, to));
            return Map.of("title-1", new TrendMetrics(30, 4, 2, 3, 1));
        }
    }

    private static final class RecordingSnapshots implements TrendSnapshotPort {
        private LocalDate date;
        private List<TrendSnapshot> saved = List.of();

        @Override
        public boolean hasSnapshots() {
            return !saved.isEmpty();
        }

        @Override
        public void replace(LocalDate snapshotDate, List<TrendSnapshot> snapshots) {
            this.date = snapshotDate;
            this.saved = List.copyOf(snapshots);
        }
    }
}
