package com.mangareader.trending.infrastructure;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.mangareader.trending.domain.TrendScore;
import com.mangareader.trending.domain.TrendSnapshot;
import com.mangareader.trending.domain.TrendWindow;

@Document("title_trend_daily")
public record TrendSnapshotDocument(
        @Id String id,
        String titleId,
        LocalDate snapshotDate,
        Instant calculatedAt,
        Map<TrendWindow, TrendScore> scores) {

    static TrendSnapshotDocument fromDomain(TrendSnapshot snapshot) {
        return new TrendSnapshotDocument(snapshot.id(), snapshot.titleId(), snapshot.snapshotDate(),
                snapshot.calculatedAt(), snapshot.scores());
    }
}
