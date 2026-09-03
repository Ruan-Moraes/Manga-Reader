package com.mangareader.trending.infrastructure;

import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.LocalDate;
import java.util.EnumMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.mangareader.trending.domain.TrendGrowth;
import com.mangareader.trending.domain.TrendMetrics;
import com.mangareader.trending.domain.TrendScore;
import com.mangareader.trending.domain.TrendSnapshot;
import com.mangareader.trending.domain.TrendWindow;

class TrendSnapshotAdapterTest {
    private final TrendSnapshotRepository repository = mock(TrendSnapshotRepository.class);
    private final TrendSnapshotAdapter adapter = new TrendSnapshotAdapter(repository);

    @Test
    void savesNewSnapshotBeforeRemovingStaleDocuments() {
        LocalDate date = LocalDate.of(2026, 7, 11);
        TrendSnapshot snapshot = snapshot("title-1", date);

        adapter.replace(date, List.of(snapshot));

        var order = inOrder(repository);
        order.verify(repository).saveAll(org.mockito.ArgumentMatchers.<List<TrendSnapshotDocument>>any());
        order.verify(repository).deleteBySnapshotDateAndIdNotIn(date, List.of(snapshot.id()));
    }

    @Test
    void removesTheDateWhenReplacementIsEmpty() {
        LocalDate date = LocalDate.of(2026, 7, 11);

        adapter.replace(date, List.of());

        verify(repository).deleteBySnapshotDate(date);
    }

    private static TrendSnapshot snapshot(String titleId, LocalDate date) {
        var scores = new EnumMap<TrendWindow, TrendScore>(TrendWindow.class);
        for (TrendWindow window : TrendWindow.values()) {
            scores.put(window, new TrendScore(1, 0, TrendMetrics.EMPTY, new TrendGrowth(0, 0, 0, 0, 0)));
        }
        return TrendSnapshot.of(titleId, date, Instant.parse("2026-07-11T00:00:00Z"), scores);
    }
}
