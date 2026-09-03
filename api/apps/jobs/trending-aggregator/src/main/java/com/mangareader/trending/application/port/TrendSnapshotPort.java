package com.mangareader.trending.application.port;

import java.time.LocalDate;
import java.util.List;

import com.mangareader.trending.domain.TrendSnapshot;

public interface TrendSnapshotPort {
    boolean hasSnapshots();

    void replace(LocalDate snapshotDate, List<TrendSnapshot> snapshots);
}
