package com.mangareader.trending.infrastructure;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Component;

import com.mangareader.trending.application.port.TrendSnapshotPort;
import com.mangareader.trending.domain.TrendSnapshot;

@Component
public class TrendSnapshotAdapter implements TrendSnapshotPort {
    private final TrendSnapshotRepository repository;

    public TrendSnapshotAdapter(TrendSnapshotRepository repository) {
        this.repository = repository;
    }

    @Override
    public boolean hasSnapshots() {
        return repository.count() > 0;
    }

    @Override
    public void replace(LocalDate snapshotDate, List<TrendSnapshot> snapshots) {
        if (snapshots.isEmpty()) {
            repository.deleteBySnapshotDate(snapshotDate);
            return;
        }

        var documents = snapshots.stream().map(TrendSnapshotDocument::fromDomain).toList();
        repository.saveAll(documents);
        repository.deleteBySnapshotDateAndIdNotIn(snapshotDate,
                documents.stream().map(TrendSnapshotDocument::id).toList());
    }
}
