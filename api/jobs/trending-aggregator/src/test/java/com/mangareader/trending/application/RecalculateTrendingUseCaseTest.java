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
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

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

    @Test
    void serializesConcurrentRecalculationsToAvoidInterleavedReplacement() throws Exception {
        var signals = new BlockingSignals();
        var useCase = useCase(signals, new RecordingSnapshots());

        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            var first = executor.submit(useCase::execute);
            assertThat(signals.firstEntry.await(2, TimeUnit.SECONDS)).isTrue();

            var second = executor.submit(useCase::execute);
            assertThat(signals.unexpectedConcurrentEntry.await(200, TimeUnit.MILLISECONDS)).isFalse();

            signals.releaseFirst.countDown();
            assertThat(first.get(2, TimeUnit.SECONDS)).isEqualTo(1);
            assertThat(second.get(2, TimeUnit.SECONDS)).isEqualTo(1);
        } finally {
            signals.releaseFirst.countDown();
        }
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

    private static final class BlockingSignals implements TrendSignalPort {
        private final AtomicInteger entries = new AtomicInteger();
        private final CountDownLatch firstEntry = new CountDownLatch(1);
        private final CountDownLatch unexpectedConcurrentEntry = new CountDownLatch(1);
        private final CountDownLatch releaseFirst = new CountDownLatch(1);

        @Override
        public Map<String, TrendMetrics> read(LocalDateTime from, LocalDateTime to) {
            if (entries.incrementAndGet() == 1) {
                firstEntry.countDown();
                try {
                    if (!releaseFirst.await(2, TimeUnit.SECONDS)) {
                        throw new IllegalStateException("Timed out waiting to release the first calculation");
                    }
                } catch (InterruptedException exception) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException(exception);
                }
            } else {
                unexpectedConcurrentEntry.countDown();
            }
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
