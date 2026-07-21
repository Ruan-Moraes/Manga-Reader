package com.mangareader.trending.infrastructure;

import java.time.LocalDate;
import java.util.Collection;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface TrendSnapshotRepository extends MongoRepository<TrendSnapshotDocument, String> {
    void deleteBySnapshotDate(LocalDate snapshotDate);

    void deleteBySnapshotDateAndIdNotIn(LocalDate snapshotDate, Collection<String> ids);
}
