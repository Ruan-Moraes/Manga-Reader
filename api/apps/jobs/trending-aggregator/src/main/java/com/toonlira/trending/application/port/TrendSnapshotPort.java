package com.toonlira.trending.application.port;

import java.time.LocalDate;
import java.util.List;

import com.toonlira.trending.domain.TrendSnapshot;

public interface TrendSnapshotPort {
    boolean hasSnapshots();

    void replace(LocalDate snapshotDate, List<TrendSnapshot> snapshots);
}
